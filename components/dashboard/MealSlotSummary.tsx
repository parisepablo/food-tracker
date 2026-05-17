"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { RecipeWithIngredients, MealType } from "@/types";
import { calcRecipeMacros, roundMacros } from "@/lib/utils/nutrition";

interface MealSlotSummaryProps {
  mealType: MealType;
  recipe: RecipeWithIngredients;
}

const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Merienda",
};

export function MealSlotSummary({ mealType, recipe }: MealSlotSummaryProps) {
  const macros = roundMacros(calcRecipeMacros(recipe));

  return (
    <div className="flex gap-4 rounded-lg border p-4">
      {recipe.image_url ? (
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
          <Image
            src={recipe.image_url}
            alt={recipe.name}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md bg-muted">
          <span className="text-2xl">🍽️</span>
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">{recipe.name}</h4>
            <p className="text-sm text-muted-foreground">
              {recipe.servings} {recipe.servings === 1 ? "porción" : "porciones"}
            </p>
          </div>
          <Badge variant="secondary">{mealTypeLabels[mealType]}</Badge>
        </div>
        <div className="mt-2 flex gap-3 text-sm text-muted-foreground">
          <span>{macros.calories} kcal</span>
          <span>P: {macros.protein}g</span>
          <span>C: {macros.carbs}g</span>
          <span>G: {macros.fat}g</span>
        </div>
      </div>
    </div>
  );
}
