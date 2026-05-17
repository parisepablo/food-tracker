import type { Food, RecipeWithIngredients } from "@/types";

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Calculate macros for a single ingredient given quantity in grams
 */
export function calcIngredientMacros(food: Food, quantityGrams: number): Macros {
  const ratio = quantityGrams / 100;

  return {
    calories: (food.calories_per_100g || 0) * ratio,
    protein: (food.protein_per_100g || 0) * ratio,
    carbs: (food.carbs_per_100g || 0) * ratio,
    fat: (food.fat_per_100g || 0) * ratio,
  };
}

/**
 * Calculate macros for a full recipe (sum of all ingredients) per serving
 */
export function calcRecipeMacros(recipe: RecipeWithIngredients): Macros {
  const totalMacros = recipe.recipe_ingredients?.reduce(
    (acc, ingredient) => {
      const ingredientMacros = calcIngredientMacros(
        ingredient.food,
        ingredient.quantity_grams
      );

      return {
        calories: acc.calories + ingredientMacros.calories,
        protein: acc.protein + ingredientMacros.protein,
        carbs: acc.carbs + ingredientMacros.carbs,
        fat: acc.fat + ingredientMacros.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const servings = recipe.servings || 1;

  return {
    calories: totalMacros.calories / servings,
    protein: totalMacros.protein / servings,
    carbs: totalMacros.carbs / servings,
    fat: totalMacros.fat / servings,
  };
}

/**
 * Calculate macros for a single meal plan entry
 */
export function calcEntryMacros(entry: {
  recipe?: RecipeWithIngredients;
}): Macros {
  if (!entry.recipe) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  return calcRecipeMacros(entry.recipe);
}

/**
 * Calculate macros for a full day (sum of all meal slots)
 */
export function calcDayMacros(entries: Array<{
  recipe?: RecipeWithIngredients;
}>): Macros {
  return entries.reduce(
    (acc, entry) => {
      const entryMacros = calcEntryMacros(entry);

      return {
        calories: acc.calories + entryMacros.calories,
        protein: acc.protein + entryMacros.protein,
        carbs: acc.carbs + entryMacros.carbs,
        fat: acc.fat + entryMacros.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/**
 * Calculate macros for a full week
 */
export function calcWeekMacros(entries: Array<{
  recipe?: RecipeWithIngredients;
}>): Macros {
  return calcDayMacros(entries);
}

/**
 * Calculate macro percentages from total calories
 * Protein and carbs: 4 cal/g, Fat: 9 cal/g
 */
export function calcMacroPercentages(macros: Macros): {
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
} {
  const totalCalories = macros.calories || 1; // Avoid division by zero

  return {
    proteinPercent: ((macros.protein * 4) / totalCalories) * 100,
    carbsPercent: ((macros.carbs * 4) / totalCalories) * 100,
    fatPercent: ((macros.fat * 9) / totalCalories) * 100,
  };
}

/**
 * Round macros to 1 decimal place
 */
export function roundMacros(macros: Macros): Macros {
  return {
    calories: Math.round(macros.calories),
    protein: Math.round(macros.protein * 10) / 10,
    carbs: Math.round(macros.carbs * 10) / 10,
    fat: Math.round(macros.fat * 10) / 10,
  };
}
