"use client";

import { useHousehold } from "@/lib/hooks/useHousehold";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MealType } from "@/types";

const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Merienda",
};

const allMealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function HouseholdSettingsPage() {
  const { data: householdData, isLoading } = useHousehold();
  const supabase = createClient();
  const queryClient = useQueryClient();

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
      </div>
    </div>
  );
}
