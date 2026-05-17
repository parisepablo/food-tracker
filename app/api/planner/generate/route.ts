import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { MealType } from "@/types";

const allMealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

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

    // Get available recipes for the household
    const { data: recipes, error: recipesError } = await supabase
      .from("recipes")
      .select("*")
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

    // Create or get meal plan for the week
    const { data: mealPlan, error: planError } = await supabase
      .from("meal_plans")
      .upsert(
        { household_id: householdId, week_start },
        { onConflict: "household_id,week_start" }
      )
      .select()
      .single();

    if (planError || !mealPlan) {
      return NextResponse.json(
        { error: "Failed to create meal plan" },
        { status: 500 }
      );
    }

    // Delete existing entries for this meal plan
    await supabase
      .from("meal_plan_entries")
      .delete()
      .eq("meal_plan_id", mealPlan.id);

    // Generate entries only for active meal types
    const entries = [];
    const weekStartDate = new Date(week_start);

    for (let day = 0; day < 7; day++) {
      const date = new Date(weekStartDate);
      date.setDate(date.getDate() + day);
      const dateStr = date.toISOString().split("T")[0];

      // Only generate slots for active meal types
      for (const mealType of activeMealTypes) {
        // Simple random assignment algorithm
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];

        entries.push({
          meal_plan_id: mealPlan.id,
          recipe_id: randomRecipe.id,
          date: dateStr,
          meal_type: mealType,
          user_id: user.id,
        });
      }
    }

    // Insert all entries
    const { error: insertError } = await supabase
      .from("meal_plan_entries")
      .insert(entries);

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create meal plan entries" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mealPlanId: mealPlan.id,
      entriesCreated: entries.length,
      activeMealTypes,
    });
  } catch (error) {
    console.error("Error generating meal plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
