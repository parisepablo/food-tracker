"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { RecipeWithIngredients } from "@/types";

export function useRecipes() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("recipes")
        .select(`
          *,
          recipe_ingredients(
            *,
            food:food_id(*)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch categories separately
      const recipeIds = data?.map(r => r.id) || [];
      if (recipeIds.length > 0) {
        const { data: ingredientsData } = await supabase
          .from("recipe_ingredients")
          .select(`
            id,
            food:food_id(
              id,
              ingredient_categories(*)
            )
          `)
          .in("recipe_id", recipeIds);

        // Merge categories into data
        data?.forEach(recipe => {
          recipe.recipe_ingredients?.forEach((ri: { id: string; category?: unknown }) => {
            const ingredientWithCategory = ingredientsData?.find(
              i => i.id === ri.id
            );
            if (ingredientWithCategory?.food?.ingredient_categories?.[0]) {
              ri.category = ingredientWithCategory.food.ingredient_categories[0];
            } else {
              ri.category = null;
            }
          });
        });
      }

      return data as unknown as RecipeWithIngredients[];
    },
  });
}

export function useRecipe(recipeId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: async () => {
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .select(`
          *,
          recipe_ingredients(
            *,
            food:food_id(*)
          )
        `)
        .eq("id", recipeId)
        .single();

      if (recipeError) throw recipeError;

      // Fetch categories for ingredients
      if (recipe?.recipe_ingredients?.length > 0) {
        const foodIds = recipe.recipe_ingredients.map((ri: { food_id: string }) => ri.food_id);
        const { data: categoriesData } = await supabase
          .from("ingredient_categories")
          .select("*")
          .in("food_id", foodIds);

        // Merge categories
        recipe.recipe_ingredients.forEach((ri: { food_id: string; category?: unknown }) => {
          const category = categoriesData?.find(c => c.food_id === ri.food_id);
          ri.category = category || null;
        });
      }

      return recipe as unknown as RecipeWithIngredients;
    },
    enabled: !!recipeId,
  });
}
