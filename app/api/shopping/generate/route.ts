import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface IngredientAggregation {
  food_id: string;
  name: string;
  total_quantity_grams: number;
  category: string | null;
  image_url?: string | null;
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
      .select("household_id")
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberData) {
      return NextResponse.json(
        { error: "No household found" },
        { status: 400 }
      );
    }

    const householdId = memberData.household_id;

    // Get request body
    const body = await request.json();
    const { meal_plan_id, overwrite } = body;

    // Check if shopping list already exists for this meal plan
    if (meal_plan_id) {
      const { data: existingList } = await supabase
        .from("shopping_lists")
        .select("id, name")
        .eq("meal_plan_id", meal_plan_id)
        .eq("is_archived", false)
        .single();

      if (existingList && !overwrite) {
        return NextResponse.json(
          {
            exists: true,
            existing_list_id: existingList.id,
            existing_list_name: existingList.name,
          },
          { status: 409 }
        );
      }

      // Delete existing list if overwrite is true
      if (existingList && overwrite) {
        await supabase
          .from("shopping_list_items")
          .delete()
          .eq("shopping_list_id", existingList.id);
        await supabase
          .from("shopping_lists")
          .delete()
          .eq("id", existingList.id);
      }
    }

    // Fetch confirmed meal plan for current week or specified meal_plan_id
    let mealPlanId = meal_plan_id;

    if (!mealPlanId) {
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      const weekStart = monday.toISOString().split("T")[0];

      const { data: currentMealPlan } = await supabase
        .from("meal_plans")
        .select("id")
        .eq("household_id", householdId)
        .eq("week_start", weekStart)
        .single();

      mealPlanId = currentMealPlan?.id;
    }

    if (!mealPlanId) {
      return NextResponse.json(
        { error: "No meal plan found for current week" },
        { status: 404 }
      );
    }

    // Fetch meal plan entries with recipes and ingredients
    const { data: entries, error: entriesError } = await supabase
      .from("meal_plan_entries")
      .select(`
        *,
        recipes(
          *,
          recipe_ingredients(
            *,
            food:food_id(
              *,
              ingredient_categories(*)
            )
          )
        )
      `)
      .eq("meal_plan_id", mealPlanId);

    if (entriesError) {
      return NextResponse.json(
        { error: "Failed to fetch meal plan entries" },
        { status: 500 }
      );
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: "No entries in meal plan" },
        { status: 400 }
      );
    }

    // Aggregate ingredients
    const ingredientMap = new Map<string, IngredientAggregation>();

    entries.forEach((entry) => {
      const recipe = entry.recipes;
      if (!recipe?.recipe_ingredients) return;

      recipe.recipe_ingredients.forEach((ri) => {
        const food = ri.food;
        if (!food) return;

        // Get category for this food
        const category = food.ingredient_categories?.[0]?.category || null;

        if (ingredientMap.has(food.id)) {
          const existing = ingredientMap.get(food.id)!;
          existing.total_quantity_grams += ri.quantity_grams;
        } else {
          ingredientMap.set(food.id, {
            food_id: food.id,
            name: food.name,
            total_quantity_grams: ri.quantity_grams,
            category,
            image_url: food.image_url,
          });
        }
      });
    });

    // Fetch pantry data for the household
    const { data: pantryItems } = await supabase
      .from("pantry")
      .select("food_id, quantity_grams")
      .eq("household_id", householdId);

    const pantryMap = new Map<string, number>();
    pantryItems?.forEach((item) => {
      pantryMap.set(item.food_id, item.quantity_grams);
    });

    // Calculate net quantities and filter items
    const itemsToInsert: Array<{
      shopping_list_id: string;
      food_id: string;
      name: string;
      quantity_grams: number;
      category: string | null;
      is_checked: boolean;
      is_manual: boolean;
      quantity_in_stock_grams: number;
      total_quantity_needed_grams: number;
    }> = [];

    for (const [foodId, ingredient] of ingredientMap.entries()) {
      const pantryQuantity = pantryMap.get(foodId) || 0;
      const netQuantity = ingredient.total_quantity_grams - pantryQuantity;

      // Only add item if net quantity > 0 (household needs more than they have)
      if (netQuantity > 0) {
        itemsToInsert.push({
          shopping_list_id: "", // Will be set after shopping list creation
          food_id: foodId,
          name: ingredient.name,
          quantity_grams: Math.round(netQuantity),
          category: ingredient.category,
          is_checked: false,
          is_manual: false,
          quantity_in_stock_grams: Math.round(pantryQuantity),
          total_quantity_needed_grams: Math.round(ingredient.total_quantity_grams),
        });
      }
    }

    // Create shopping list
    const weekStart = new Date().toISOString().split("T")[0];
    const { data: shoppingList, error: listError } = await supabase
      .from("shopping_lists")
      .insert({
        household_id: householdId,
        meal_plan_id: mealPlanId,
        name: `Lista de compras - ${weekStart}`,
        is_archived: false,
      })
      .select()
      .single();

    if (listError) {
      return NextResponse.json(
        { error: "Failed to create shopping list" },
        { status: 500 }
      );
    }

    // Set shopping_list_id for all items
    const finalItems = itemsToInsert.map((item) => ({
      ...item,
      shopping_list_id: shoppingList.id,
    }));

    // Insert shopping list items
    if (finalItems.length > 0) {
      const { error: itemsError } = await supabase
        .from("shopping_list_items")
        .insert(finalItems);

      if (itemsError) {
        return NextResponse.json(
          { error: "Failed to create shopping list items" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      shopping_list_id: shoppingList.id,
      items_count: finalItems.length,
      items_skipped: ingredientMap.size - finalItems.length,
    });
  } catch (error) {
    console.error("Error generating shopping list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
