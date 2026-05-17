import type { Tables } from "./supabase";

// Re-export types from Supabase
export type Household = Tables<"households">;
export type HouseholdMember = Tables<"household_members">;
export type Food = Tables<"foods">;
export type Recipe = Tables<"recipes">;
export type RecipeIngredient = Tables<"recipe_ingredients">;
export type MealPlan = Tables<"meal_plans">;
export type MealPlanEntry = Tables<"meal_plan_entries">;
export type ShoppingList = Tables<"shopping_lists">;
export type ShoppingListItem = Tables<"shopping_list_items">;
export type MealPlanRule = Tables<"meal_plan_rules">;
export type IngredientCategory = Tables<"ingredient_categories">;

// Extended types with relations
export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: (RecipeIngredient & { food: Food; category: IngredientCategory | null })[];
};

export type MealPlanWithEntries = MealPlan & {
  entries: (MealPlanEntry & { recipe: Recipe })[];
};

export type ShoppingListWithItems = ShoppingList & {
  items: (ShoppingListItem & { food?: Food })[];
};

export type HouseholdWithMembers = Household & {
  members: (HouseholdMember & { user: { id: string; email: string } })[];
};

// Enums
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type HouseholdRole = "admin" | "member";
export type IngredientCategoryType = "red_meat" | "chicken" | "fish" | "vegetarian" | "pasta" | "other";
export type RuleType = "protein_frequency" | "variety" | "distribution";

// Extended RecipeIngredient with category
export interface RecipeIngredientWithFood extends RecipeIngredient {
  food: Food;
  category: IngredientCategory | null;
}

// Extended Recipe with all relations
export interface RecipeFull extends Recipe {
  recipe_ingredients: RecipeIngredientWithFood[];
}
