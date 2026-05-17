"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecipes } from "@/lib/hooks/useRecipes";
import type { MealType } from "@/types";

interface RecipeSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (recipeId: string, recipeName: string, caloriesPerServing?: number) => void;
  selectedDate: string;
  mealType: MealType;
}

const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Merienda",
};

export function RecipeSelectorModal({
  open,
  onOpenChange,
  onSelect,
  selectedDate,
  mealType,
}: RecipeSelectorModalProps) {
  const { data: recipes, isLoading } = useRecipes();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecipes = recipes?.filter((recipe) => {
    const nameMatch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || descMatch;
  });

  const handleSelect = (recipe: { id: string; name: string; recipe_ingredients?: unknown[] }) => {
    // Calculate calories per serving
    let caloriesPerServing = 0;
    if (recipe.recipe_ingredients && Array.isArray(recipe.recipe_ingredients)) {
      const totalCalories = (recipe.recipe_ingredients as Array<{
        food?: { calories_per_100g?: number };
        quantity_grams?: number;
      }>).reduce((sum, ri) => {
        const ratio = (ri.quantity_grams || 0) / 100;
        return sum + (ri.food?.calories_per_100g || 0) * ratio;
      }, 0);
      // We'll need servings from the recipe, but for now pass total
      caloriesPerServing = Math.round(totalCalories);
    }

    onSelect(recipe.id, recipe.name, caloriesPerServing || undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Seleccionar receta</DialogTitle>
          <DialogDescription>
            {mealTypeLabels[mealType]} - {new Date(selectedDate).toLocaleDateString("es-ES")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Input
            placeholder="Buscar recetas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 rounded-lg border p-3">
                  <Skeleton className="h-16 w-16 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRecipes?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No se encontraron recetas
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredRecipes?.map((recipe) => {
                // Calculate calories per serving
                let caloriesPerServing = 0;
                if (recipe.recipe_ingredients && Array.isArray(recipe.recipe_ingredients)) {
                  const totalCalories = (recipe.recipe_ingredients as Array<{
                    food?: { calories_per_100g?: number };
                    quantity_grams?: number;
                  }>).reduce((sum, ri) => {
                    const ratio = (ri.quantity_grams || 0) / 100;
                    return sum + (ri.food?.calories_per_100g || 0) * ratio;
                  }, 0);
                  caloriesPerServing = recipe.servings > 0 
                    ? Math.round(totalCalories / recipe.servings) 
                    : Math.round(totalCalories);
                }

                return (
                  <button
                    key={recipe.id}
                    onClick={() => handleSelect(recipe)}
                    className="flex gap-3 rounded-lg border p-3 text-left hover:bg-accent transition-colors"
                  >
                    {recipe.image_url ? (
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={recipe.image_url}
                          alt={recipe.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                        <span className="text-2xl">🍽️</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{recipe.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {recipe.servings} {recipe.servings === 1 ? "porción" : "porciones"}
                      </p>
                      {caloriesPerServing > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {caloriesPerServing} kcal/porción
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
