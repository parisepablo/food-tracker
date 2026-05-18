"use client";

import { useState, useEffect } from "react";
import { useHousehold } from "@/lib/hooks/useHousehold";
import { useUser } from "@/lib/hooks/useUser";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus, X, Mail } from "lucide-react";
import type { MealType, NutritionGoal, HouseholdInvitation } from "@/types";

const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Merienda",
};

const allMealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function HouseholdSettingsPage() {
  const { data: householdData, isLoading } = useHousehold();
  const { user: userData, loading: userLoading } = useUser();
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Household name state
  const [householdName, setHouseholdName] = useState("");

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  // Nutrition goals state
  const [goals, setGoals] = useState({
    calories_goal: "",
    protein_goal: "",
    carbs_goal: "",
    fat_goal: "",
  });

  // Sync household name when data loads
  useEffect(() => {
    if (householdData?.household?.name) {
      setHouseholdName(householdData.household.name);
    }
  }, [householdData?.household?.name]);

  // Save household name mutation
  const updateHouseholdNameMutation = useMutation({
    mutationFn: async () => {
      if (!householdData?.household?.id) throw new Error("No household");

      const { error } = await supabase
        .from("households")
        .update({ name: householdName })
        .eq("id", householdData.household.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household"] });
    },
  });

  const updateMealTypesMutation = useMutation({
    mutationFn: async (mealTypes: MealType[]) => {
      if (!householdData?.household?.id) throw new Error("No household");

      const { error } = await supabase
        .from("households")
        .update({ active_meal_types: mealTypes })
        .eq("id", householdData.household.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household"] });
    },
  });

  const activeMealTypes = (householdData?.household?.active_meal_types as MealType[]) || allMealTypes;

  // Fetch household members
  const { data: members } = useQuery({
    queryKey: ["household-members"],
    queryFn: async () => {
      if (!householdData?.household?.id) return [];

      const { data, error } = await supabase
        .from("household_members")
        .select("id, user_id, role, joined_at")
        .eq("household_id", householdData.household.id);

      if (error) return [];

      // Fetch emails for each member
      const membersWithEmails = await Promise.all(
        (data || []).map(async (member) => {
          const { data: userData } = await supabase.auth.admin.getUserById(member.user_id);
          return {
            ...member,
            email: userData?.user?.email || "Usuario desconocido",
          };
        })
      );

      return membersWithEmails;
    },
    enabled: !!householdData?.household?.id,
  });

  // Fetch invitations
  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ["household-invitations"],
    queryFn: async () => {
      const response = await fetch("/api/household/invite");
      if (!response.ok) return [];
      const data = await response.json();
      return (data.invitations || []) as HouseholdInvitation[];
    },
    enabled: !!householdData?.household?.id,
  });

  // Send invitation mutation
  const sendInviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/household/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar la invitación");
      }

      return data;
    },
    onSuccess: () => {
      setInviteEmail("");
      setInviteError("");
      setInviteSuccess("Invitación enviada correctamente");
      queryClient.invalidateQueries({ queryKey: ["household-invitations"] });
      setTimeout(() => setInviteSuccess(""), 3000);
    },
    onError: (error: Error) => {
      setInviteError(error.message);
      setInviteSuccess("");
    },
  });

  // Cancel invitation mutation
  const cancelInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await fetch(`/api/household/invite?id=${invitationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al cancelar la invitación");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-invitations"] });
    },
  });

  const handleSendInvite = () => {
    setInviteError("");
    setInviteSuccess("");
    sendInviteMutation.mutate(inviteEmail);
  };

  // Fetch current user's nutrition goals
  const { data: userGoals } = useQuery({
    queryKey: ["user-nutrition-goals", userData?.id],
    queryFn: async () => {
      if (!userData?.id || !householdData?.household?.id) return null;

      const { data, error } = await supabase
        .from("nutrition_goals")
        .select("*")
        .eq("user_id", userData.id)
        .eq("household_id", householdData.household.id)
        .single();

      if (error) return null;
      return data as NutritionGoal;
    },
    enabled: !!userData?.id && !!householdData?.household?.id && !userLoading,
  });

  // Sync nutrition goals when data loads
  useEffect(() => {
    if (userGoals) {
      setGoals({
        calories_goal: userGoals.calories_goal?.toString() || "",
        protein_goal: userGoals.protein_goal?.toString() || "",
        carbs_goal: userGoals.carbs_goal?.toString() || "",
        fat_goal: userGoals.fat_goal?.toString() || "",
      });
    }
  }, [userGoals]);

  // Save nutrition goals
  const saveGoalsMutation = useMutation({
    mutationFn: async () => {
      if (!userData?.id || !householdData?.household?.id) throw new Error("Missing user or household");

      const goalsData = {
        household_id: householdData.household.id,
        user_id: userData.id,
        calories_goal: goals.calories_goal ? Number(goals.calories_goal) : null,
        protein_goal: goals.protein_goal ? Number(goals.protein_goal) : null,
        carbs_goal: goals.carbs_goal ? Number(goals.carbs_goal) : null,
        fat_goal: goals.fat_goal ? Number(goals.fat_goal) : null,
      };

      if (userGoals) {
        const { error } = await supabase
          .from("nutrition_goals")
          .update(goalsData)
          .eq("id", userGoals.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("nutrition_goals")
          .insert(goalsData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-nutrition-goals"] });
    },
  });

  const handleSaveGoals = () => {
    saveGoalsMutation.mutate();
  };

  const handleMealTypeChange = (mealType: MealType, checked: boolean) => {
    let newMealTypes: MealType[];

    if (checked) {
      newMealTypes = [...activeMealTypes, mealType];
    } else {
      if (activeMealTypes.length <= 1) {
        return;
      }
      newMealTypes = activeMealTypes.filter((t) => t !== mealType);
    }

    updateMealTypesMutation.mutate(newMealTypes);
  };

  if (isLoading || userLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración del hogar</h1>
          <p className="text-muted-foreground">Administra los miembros y preferencias de tu hogar</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Información del hogar</CardTitle>
              <CardDescription>Actualiza los detalles de tu hogar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Button className="w-full" disabled>Guardar cambios</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comidas activas</CardTitle>
              <CardDescription>Selecciona qué tipos de comidas quieres planificar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6">
                {allMealTypes.map((mealType) => (
                  <div key={mealType} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Objetivos nutricionales</CardTitle>
            <CardDescription>Configurá tus objetivos diarios de calorías y macros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
            <Skeleton className="h-10 w-40 mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración del hogar</h1>
        <p className="text-muted-foreground">Administra los miembros y preferencias de tu hogar</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del hogar</CardTitle>
            <CardDescription>Actualiza los detalles de tu hogar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="householdName">Nombre del hogar</Label>
              <Input
                id="householdName"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Mi hogar"
                className="mt-1"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => updateHouseholdNameMutation.mutate()}
              disabled={updateHouseholdNameMutation.isPending}
            >
              {updateHouseholdNameMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comidas activas</CardTitle>
            <CardDescription>
              Selecciona qué tipos de comidas quieres planificar. Debe haber al menos una activa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              {allMealTypes.map((mealType) => {
                const isChecked = activeMealTypes.includes(mealType);
                const isDisabled = isChecked && activeMealTypes.length === 1;

                return (
                  <div key={mealType} className="flex items-center space-x-2">
                    <Checkbox
                      id={`meal-type-${mealType}`}
                      checked={isChecked}
                      disabled={isDisabled || updateMealTypesMutation.isPending}
                      onCheckedChange={(checked) =>
                        handleMealTypeChange(mealType, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`meal-type-${mealType}`}
                      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isDisabled ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      {mealTypeLabels[mealType]}
                    </Label>
                  </div>
                );
              })}
            </div>
            {updateMealTypesMutation.isPending && (
              <p className="mt-4 text-sm text-muted-foreground">Guardando...</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Objetivos nutricionales</CardTitle>
            <CardDescription>
              Configurá tus objetivos diarios de calorías y macros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="calories">Calorías diarias (kcal)</Label>
                <Input
                  id="calories"
                  type="number"
                  min="0"
                  value={goals.calories_goal}
                  onChange={(e) => setGoals({ ...goals, calories_goal: e.target.value })}
                  placeholder="Ej: 2000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="protein">Proteínas (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  min="0"
                  value={goals.protein_goal}
                  onChange={(e) => setGoals({ ...goals, protein_goal: e.target.value })}
                  placeholder="Ej: 150"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="carbs">Carbohidratos (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  min="0"
                  value={goals.carbs_goal}
                  onChange={(e) => setGoals({ ...goals, carbs_goal: e.target.value })}
                  placeholder="Ej: 200"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="fat">Grasas (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  min="0"
                  value={goals.fat_goal}
                  onChange={(e) => setGoals({ ...goals, fat_goal: e.target.value })}
                  placeholder="Ej: 70"
                  className="mt-1"
                />
              </div>
            </div>
            <Button
              onClick={handleSaveGoals}
              disabled={saveGoalsMutation.isPending}
              className="w-full sm:w-auto"
            >
              {saveGoalsMutation.isPending ? "Guardando..." : "Guardar objetivos"}
            </Button>
          </CardContent>
        </Card>

        {/* Members and Invitations Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Miembros del hogar</CardTitle>
            <CardDescription>
              Gestiona los miembros de tu hogar e invita a nuevos usuarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Members */}
            <div>
              <h3 className="text-sm font-medium mb-3">Miembros actuales</h3>
              <div className="space-y-2">
                {members?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{member.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.role === "admin" ? "Administrador" : "Miembro"} · Se unió el{" "}
                          {new Date(member.joined_at).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                      {member.role === "admin" ? "Admin" : "Miembro"}
                    </Badge>
                  </div>
                ))}
                {(!members || members.length === 0) && (
                  <p className="text-sm text-muted-foreground py-2">No hay miembros</p>
                )}
              </div>
            </div>

            {/* Invite Form - Only for admins */}
            {householdData?.role === "admin" && (
              <div>
                <h3 className="text-sm font-medium mb-3">Invitar nuevo miembro</h3>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendInvite}
                    disabled={sendInviteMutation.isPending || !inviteEmail}
                  >
                    {sendInviteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Enviar invitación
                  </Button>
                </div>
                {inviteError && (
                  <p className="text-sm text-destructive mt-2">{inviteError}</p>
                )}
                {inviteSuccess && (
                  <p className="text-sm text-green-600 mt-2">{inviteSuccess}</p>
                )}
              </div>
            )}

            {/* Pending Invitations */}
            {invitations && invitations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Invitaciones pendientes</h3>
                <div className="space-y-2">
                  {invitations
                    .filter((inv) => inv.status === "pending")
                    .map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{invitation.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Enviada el {new Date(invitation.created_at).toLocaleDateString("es-AR")} · Expira el{" "}
                              {new Date(invitation.expires_at).toLocaleDateString("es-AR")}
                            </p>
                          </div>
                        </div>
                        {householdData?.role === "admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => cancelInviteMutation.mutate(invitation.id)}
                            disabled={cancelInviteMutation.isPending}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {invitationsLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando invitaciones...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
