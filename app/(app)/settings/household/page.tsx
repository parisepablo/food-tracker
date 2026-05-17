"use client";

import { useState } from "react";
import { useHousehold } from "@/lib/hooks/useHousehold";
import { useUser } from "@/lib/hooks/useUser";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MealType, NutritionGoal } from "@/types";

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

  // Nutrition goals state
  const [goals, setGoals] = useState({
    calories_goal: "",
    protein_goal: "",
    carbs_goal: "",
    fat_goal: "",
  });

  const updateMealTypesMutation = useMutation({
    mutationFn: async (mealTypes: MealType[]) => {
      if (!householdData?.household.id) throw new Error("No household");
      
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

  const activeMealTypes = (householdData?.household.active_meal_types as MealType[]) || allMealTypes;

  // Fetch current user's nutrition goals
  const { data: userGoals } = useQuery({
    queryKey: ["user-nutrition-goals", userData?.id],
    queryFn: async () => {
      if (!userData?.id || !householdData?.household.id) return null;

      const { data, error } = await supabase
        .from("nutrition_goals")
        .select("*")
        .eq("user_id", userData.id)
        .eq("household_id", householdData.household.id)
        .single();

      if (error) return null;
      return data as NutritionGoal;
    },
    enabled: !!userData?.id && !!householdData?.household.id && !userLoading,
  });

  // Save nutrition goals
  const saveGoalsMutation = useMutation({
    mutationFn: async () => {
      if (!userData?.id || !householdData?.household.id) throw new Error("Missing user or household");

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
      // Add meal type
      newMealTypes = [...activeMealTypes, mealType];
    } else {
      // Remove meal type, but prevent removing the last one
      if (activeMealTypes.length <= 1) {
        return; // Prevent unchecking the last active meal type
      }
      newMealTypes = activeMealTypes.filter((t) => t !== mealType);
    }
    
    updateMealTypesMutation.mutate(newMealTypes);
  };

  if (isLoading) {
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
              <Skeleton className="h-10 w-full" />
              <Button className="w-full" disabled>Guardar cambios</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Miembros</CardTitle>
              <CardDescription>Administra los miembros del hogar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
              <Button variant="outline" className="w-full" disabled>Invitar miembro</Button>
            </CardContent>
          </Card>
        </div>
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
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Button className="w-full">Guardar cambios</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Miembros</CardTitle>
            <CardDescription>Administra los miembros del hogar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
            <Button variant="outline" className="w-full">Invitar miembro</Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
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
      </div>
    </div>
  );
}
