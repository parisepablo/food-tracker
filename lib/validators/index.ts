import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    householdName: z.string().min(1, "Household name is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Household schemas
export const householdSchema = z.object({
  name: z.string().min(1, "Household name is required"),
});

// Food schemas
export const foodSchema = z.object({
  barcode: z.string().nullable().optional(),
  name: z.string().min(1, "Food name is required"),
  brand: z.string().nullable().optional(),
  calories_per_100g: z.number().min(0),
  protein_per_100g: z.number().min(0),
  carbs_per_100g: z.number().min(0),
  fat_per_100g: z.number().min(0),
  image_url: z.string().nullable().optional(),
});

// Recipe schemas
export const ingredientCategorySchema = z.enum([
  "red_meat",
  "chicken", 
  "fish",
  "vegetarian",
  "pasta",
  "other"
]);

export const recipeIngredientSchema = z.object({
  food_id: z.string().uuid(),
  quantity_grams: z.number().min(0),
  category: ingredientCategorySchema.nullable().optional(),
});

export const recipeSchema = z.object({
  name: z.string().min(1, "El nombre de la receta es obligatorio"),
  description: z.string().nullable().optional(),
  servings: z.number().min(1, "Las porciones deben ser al menos 1"),
  image_url: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  ingredients: z.array(recipeIngredientSchema).min(1, "Se requiere al menos un ingrediente"),
});

// Meal plan schemas
export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const mealPlanEntrySchema = z.object({
  recipe_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  meal_type: mealTypeSchema,
});

export const mealPlanSchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

// Shopping list schemas
export const shoppingListItemSchema = z.object({
  food_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1, "Item name is required"),
  quantity_grams: z.number().nullable().optional(),
  category: z.string().nullable().optional(),
  is_manual: z.boolean().default(false),
});

export const shoppingListSchema = z.object({
  name: z.string().min(1, "List name is required"),
  meal_plan_id: z.string().uuid().nullable().optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type HouseholdInput = z.infer<typeof householdSchema>;
export type FoodInput = z.infer<typeof foodSchema>;
export type RecipeInput = z.infer<typeof recipeSchema>;
export type RecipeIngredientInput = z.infer<typeof recipeIngredientSchema>;
export type IngredientCategoryInput = z.infer<typeof ingredientCategorySchema>;
export type MealPlanInput = z.infer<typeof mealPlanSchema>;
export type MealPlanEntryInput = z.infer<typeof mealPlanEntrySchema>;
export type ShoppingListInput = z.infer<typeof shoppingListSchema>;
export type ShoppingListItemInput = z.infer<typeof shoppingListItemSchema>;
