import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { MealType } from "@/types";

const allMealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const dayOfWeekMap: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

interface RecipeWithIngredients {
  id: string;
  name: string;
  household_id: string;
  recipe_ingredients?: Array<{
    food_id: string;
    quantity_grams: number;
    food?: {
      id: string;
      name: string;
      ingredient_categories?: Array<{
        category: string;
      }>;
    };
  }>;
}

interface Rule {
  id: string;
  rule_type: string;
  rule_config: Record<string, unknown>;
}

interface GeneratedEntry {
  date: string;
  meal_type: MealType;
  recipe_id: string;
  recipe_name: string;
}

interface Conflict {
  date: string;
  meal_type: string;
  reason: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's household
    const { data: memberData, error: memberError } = await supabase
      .from("household_members")
      .select("household_id, households(active_meal_types)")
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberData) {
      return NextResponse.json(
        { error: "No household found" },
        { status: 400 }
      );
    }

    const householdId = memberData.household_id;
    const activeMealTypes = (memberData.households?.active_meal_types as MealType[]) || allMealTypes;

    // Get request body
    const body = await request.json();
    const { week_start } = body;

    if (!week_start) {
      return NextResponse.json(
        { error: "week_start is required" },
        { status: 400 }
      );
    }

    // Fetch all recipes for the household with ingredients and categories
    const { data: recipes, error: recipesError } = await supabase
      .from("recipes")
      .select(`
        *,
        recipe_ingredients(
          *,
          food:food_id(
            id,
            name,
            ingredient_categories(*)
          )
        )
      `)
      .eq("household_id", householdId);

    if (recipesError) {
      return NextResponse.json(
        { error: "Failed to fetch recipes" },
        { status: 500 }
      );
    }

    if (!recipes || recipes.length === 0) {
      return NextResponse.json(
        { error: "No recipes available" },
        { status: 400 }
      );
    }

    // Fetch all active meal_plan_rules
    const { data: rules, error: rulesError } = await supabase
      .from("meal_plan_rules")
      .select("*")
      .eq("household_id", householdId);

    if (rulesError) {
      return NextResponse.json(
        { error: "Failed to fetch rules" },
        { status: 500 }
      );
    }

    // Fetch meal_plan_entries from the last 30 days for variety rule
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: recentEntries, error: entriesError } = await supabase
      .from("meal_plan_entries")
      .select("recipe_id, date")
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

    if (entriesError) {
      return NextResponse.json(
        { error: "Failed to fetch recent entries" },
        { status: 500 }
      );
    }

    // Parse rules
    const proteinRules = (rules || []).filter((r) => r.rule_type === "protein_frequency") as unknown as Array<Rule & { rule_config: { category: string; max_per_week: number } }>;
    const varietyRules = (rules || []).filter((r) => r.rule_type === "variety") as unknown as Array<Rule & { rule_config: { min_days_between: number } }>;
    const distributionRules = (rules || []).filter((r) => r.rule_type === "distribution") as unknown as Array<Rule & { rule_config: { category: string; allowed_days: string[] } }>;

    const varietyMinDays = varietyRules.length > 0
      ? Math.max(...varietyRules.map((r) => r.rule_config.min_days_between))
      : 0;

    // Generate entries for each day and meal type
    const entries: GeneratedEntry[] = [];
    const conflicts: Conflict[] = [];
    const weekStartDate = new Date(week_start);
    const categoryUsageCount: Record<string, number> = {};

    for (let day = 0; day < 7; day++) {
      const date = new Date(weekStartDate);
      date.setDate(date.getDate() + day);
      const dateStr = date.toISOString().split("T")[0];
      const dayName = dayOfWeekMap[date.getDay()];

      // Only generate for active meal types
      for (const mealType of activeMealTypes) {
        // Filter valid candidates
        const validCandidates = (recipes as RecipeWithIngredients[]).filter((recipe) => {
          // Variety rule: check if recipe was used in the last N days
          if (varietyMinDays > 0 && recentEntries) {
            const cutoffDate = new Date(date);
            cutoffDate.setDate(cutoffDate.getDate() - varietyMinDays);
            const cutoffStr = cutoffDate.toISOString().split("T")[0];

            const recentUse = recentEntries.some(
              (e) => e.recipe_id === recipe.id && e.date >= cutoffStr
            );
            if (recentUse) return false;
          }

          // Distribution rules: check if recipe's categories are allowed on this day
          if (distributionRules.length > 0) {
            const recipeCategories = getRecipeCategories(recipe);
            if (recipeCategories.length > 0) {
              const hasRestrictedCategory = recipeCategories.some((cat) => {
                const distRule = distributionRules.find((r) => r.rule_config.category === cat);
                if (distRule) {
                  return !distRule.rule_config.allowed_days.includes(dayName);
                }
                return false;
              });
              if (hasRestrictedCategory) return false;
            }
          }

          return true;
        });

        // Protein frequency rule: check category limits
        const finalCandidates = validCandidates.filter((recipe) => {
          const recipeCategories = getRecipeCategories(recipe);
          for (const cat of recipeCategories) {
            const proteinRule = proteinRules.find((r) => r.rule_config.category === cat);
            if (proteinRule) {
              const currentCount = categoryUsageCount[cat] || 0;
              if (currentCount >= proteinRule.rule_config.max_per_week) {
                return false;
              }
            }
          }
          return true;
        });

        if (finalCandidates.length === 0) {
          // Log conflict
          let reason = "No hay recetas válidas disponibles";
          if (varietyMinDays > 0) {
            reason = `No hay recetas que no se hayan usado en los últimos ${varietyMinDays} días`;
          } else if (distributionRules.length > 0) {
            reason = "No hay recetas permitidas para este día según las reglas de distribución";
          }
          conflicts.push({
            date: dateStr,
            meal_type: mealType,
            reason,
          });
        } else {
          // Select randomly
          const selectedRecipe = finalCandidates[Math.floor(Math.random() * finalCandidates.length)];

          // Update category usage count
          const recipeCategories = getRecipeCategories(selectedRecipe);
          for (const cat of recipeCategories) {
            categoryUsageCount[cat] = (categoryUsageCount[cat] || 0) + 1;
          }

          entries.push({
            date: dateStr,
            meal_type: mealType,
            recipe_id: selectedRecipe.id,
            recipe_name: selectedRecipe.name,
          });
        }
      }
    }

    return NextResponse.json({
      week_start,
      entries,
      conflicts,
    });
  } catch (error) {
    console.error("Error generating meal plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getRecipeCategories(recipe: RecipeWithIngredients): string[] {
  const categories = new Set<string>();
  recipe.recipe_ingredients?.forEach((ri) => {
    ri.food?.ingredient_categories?.forEach((cat) => {
      categories.add(cat.category);
    });
  });
  return Array.from(categories);
}
