"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IngredientSearch } from "./IngredientSearch";
import { IngredientRow } from "./IngredientRow";
import { MacroSummary } from "./MacroSummary";
import { recipeSchema, type RecipeInput } from "@/lib/validators";
import type { Food, IngredientCategoryType, RecipeFull } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface RecipeFormProps {
  recipe?: RecipeFull;
  onSuccess?: () => void;
}

interface IngredientState {
  food: Food;
  quantity: number;
  category: IngredientCategoryType | null;
}

export function RecipeForm({ recipe, onSuccess }: RecipeFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEditing = !!recipe;

  const [name, setName] = useState(recipe?.name || "");
  const [description, setDescription] = useState(recipe?.description || "");
  const [servings, setServings] = useState(recipe?.servings || 4);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [ingredients, setIngredients] = useState<IngredientState[]>(
    recipe?.recipe_ingredients?.map((ri) => ({
      food: ri.food,
      quantity: ri.quantity_grams,
      category: (ri.category?.category as IngredientCategoryType) || null,
    })) || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateTotals = useCallback(() => {
    return ingredients.reduce(
      (acc, ingredient) => {
        const ratio = ingredient.quantity / 100;
        return {
          calories: acc.calories + ingredient.food.calories_per_100g * ratio,
          protein: acc.protein + ingredient.food.protein_per_100g * ratio,
          carbs: acc.carbs + ingredient.food.carbs_per_100g * ratio,
          fat: acc.fat + ingredient.food.fat_per_100g * ratio,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [ingredients]);

  const handleAddIngredient = async (foodData: Partial<Food>) => {
    // Check if food already exists in database
    let food: Food | null = null;

    if (foodData.barcode) {
      const { data } = await supabase
        .from("foods")
        .select("*")
        .eq("barcode", foodData.barcode)
        .single();
      food = data;
    }

    if (!food && foodData.name) {
      let query = supabase
        .from("foods")
        .select("*")
        .eq("name", foodData.name);
      
      if (foodData.brand) {
        query = query.eq("brand", foodData.brand);
      } else {
        query = query.is("brand", null);
      }
      
      const { data } = await query.single();
      food = data;
    }

    if (!food) {
      // Create new food - get household_id first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberData } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .single();

      if (!memberData) return;

      const { data, error } = await supabase
        .from("foods")
        .insert({
          barcode: foodData.barcode ?? null,
          name: foodData.name || "Sin nombre",
          brand: foodData.brand ?? null,
          calories_per_100g: foodData.calories_per_100g || 0,
          protein_per_100g: foodData.protein_per_100g || 0,
          carbs_per_100g: foodData.carbs_per_100g || 0,
          fat_per_100g: foodData.fat_per_100g || 0,
          image_url: foodData.image_url ?? null,
          household_id: memberData.household_id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating food:", error);
        return;
      }
      food = data;
    }

    // Check if ingredient already added
    const exists = ingredients.some((i) => i.food.id === food!.id);
    if (exists) {
      setErrors({ ...errors, ingredient: "Este ingrediente ya está agregado" });
      setTimeout(() => {
        setErrors((prev) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { ingredient, ...rest } = prev;
          return rest;
        });
      }, 3000);
      return;
    }

    setIngredients([...ingredients, { food, quantity: 100, category: null }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newIngredients = [...ingredients];
    newIngredients[index].quantity = quantity;
    setIngredients(newIngredients);
  };

  const handleCategoryChange = (index: number, category: IngredientCategoryType | null) => {
    const newIngredients = [...ingredients];
    newIngredients[index].category = category;
    setIngredients(newIngredients);
  };

  const handleImageUpload = async (): Promise<string | null> => {
    if (!imageFile) return recipe?.image_url || null;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `recipes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("recipe-images")
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("recipe-images").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validate
    const formData: RecipeInput = {
      name,
      description: description || null,
      servings,
      image_url: recipe?.image_url || null,
      ingredients: ingredients.map((i) => ({
        food_id: i.food.id,
        quantity_grams: i.quantity,
        category: i.category,
      })),
    };

    const result = recipeSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((error) => {
        const path = error.path.join(".");
        fieldErrors[path] = error.message;
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Upload image if changed
      const imageUrl = await handleImageUpload();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrors({ submit: "Usuario no autenticado" });
        setIsSubmitting(false);
        return;
      }

      // Get user's household
      const { data: memberData } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .single();

      if (!memberData) {
        setErrors({ submit: "No se encontró un hogar" });
        setIsSubmitting(false);
        return;
      }

      let recipeId: string;

      if (isEditing && recipe) {
        // Update recipe
        const { error: updateError } = await supabase
          .from("recipes")
          .update({
            name,
            description: description || null,
            servings,
            image_url: imageUrl,
          })
          .eq("id", recipe.id);

        if (updateError) throw updateError;

        // Delete old ingredients and categories
        await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipe.id);

        recipeId = recipe.id;
      } else {
        // Create recipe
        const { data: newRecipe, error: createError } = await supabase
          .from("recipes")
          .insert({
            name,
            description: description || null,
            servings,
            image_url: imageUrl,
            household_id: memberData.household_id,
            created_by: user.id,
          })
          .select()
          .single();

        if (createError) throw createError;
        recipeId = newRecipe.id;
      }

      // Insert ingredients
      for (const ingredient of ingredients) {
        const { error: ingredientError } = await supabase
          .from("recipe_ingredients")
          .insert({
            recipe_id: recipeId,
            food_id: ingredient.food.id,
            quantity_grams: ingredient.quantity,
          });

        if (ingredientError) throw ingredientError;

        // Insert category if set
        if (ingredient.category) {
          // Check if category already exists
          const { data: existingCategory } = await supabase
            .from("ingredient_categories")
            .select("id")
            .eq("food_id", ingredient.food.id)
            .eq("category", ingredient.category)
            .single();

          if (!existingCategory) {
            await supabase.from("ingredient_categories").insert({
              food_id: ingredient.food.id,
              category: ingredient.category,
            });
          }
        }
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/recipes/${recipeId}`);
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      setErrors({ submit: "Error al guardar la receta" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = calculateTotals();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información general</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre de la receta *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Pollo al curry"
              className="mt-1"
            />
            {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe la receta..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="servings">Porciones *</Label>
            <Input
              id="servings"
              type="number"
              min="1"
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="mt-1"
            />
            {errors.servings && (
              <p className="mt-1 text-sm text-destructive">{errors.servings}</p>
            )}
          </div>

          <div>
            <Label htmlFor="image">Imagen</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
            {recipe?.image_url && !imageFile && (
              <p className="mt-1 text-sm text-muted-foreground">
                Imagen actual se mantendrá
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingredientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <IngredientSearch onSelect={handleAddIngredient} />
          {errors.ingredient && (
            <p className="text-sm text-destructive">{errors.ingredient}</p>
          )}

          {ingredients.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Agrega ingredientes usando el buscador de arriba
            </p>
          ) : (
            <div className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <IngredientRow
                  key={ingredient.food.id}
                  food={ingredient.food}
                  quantity={ingredient.quantity}
                  category={ingredient.category}
                  onQuantityChange={(qty) => handleQuantityChange(index, qty)}
                  onCategoryChange={(cat) => handleCategoryChange(index, cat)}
                  onRemove={() => handleRemoveIngredient(index)}
                />
              ))}
            </div>
          )}
          {errors["ingredients"] && (
            <p className="text-sm text-destructive">{errors["ingredients"]}</p>
          )}
        </CardContent>
      </Card>

      {ingredients.length > 0 && (
        <MacroSummary
          totalCalories={totals.calories}
          totalProtein={totals.protein}
          totalCarbs={totals.carbs}
          totalFat={totals.fat}
          servings={servings}
        />
      )}

      {errors.submit && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {errors.submit}
        </div>
      )}

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting || ingredients.length === 0}
          className="flex-1"
        >
          {isSubmitting
            ? "Guardando..."
            : isEditing
            ? "Actualizar receta"
            : "Crear receta"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
