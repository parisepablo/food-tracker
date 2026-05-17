"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useRecipe } from "@/lib/hooks/useRecipes";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { MacroSummary } from "@/components/recipes/MacroSummary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const categoryLabels: Record<string, string> = {
  red_meat: "Carne roja",
  chicken: "Pollo",
  fish: "Pescado",
  vegetarian: "Vegetariano",
  pasta: "Pasta",
  other: "Otro",
};

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: recipe, isLoading, error } = useRecipe(recipeId);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      router.push("/recipes");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Error</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-destructive">
              No se pudo cargar la receta. Es posible que no exista.
            </p>
            <Link href="/recipes">
              <Button className="mx-auto mt-4 block">Volver a recetas</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate totals
  const totals =
    recipe.recipe_ingredients?.reduce(
      (acc, ingredient) => {
        const ratio = ingredient.quantity_grams / 100;
        return {
          calories: acc.calories + (ingredient.food?.calories_per_100g || 0) * ratio,
          protein: acc.protein + (ingredient.food?.protein_per_100g || 0) * ratio,
          carbs: acc.carbs + (ingredient.food?.carbs_per_100g || 0) * ratio,
          fat: acc.fat + (ingredient.food?.fat_per_100g || 0) * ratio,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Editar receta</h1>
            <p className="text-muted-foreground">Modifica los detalles de la receta</p>
          </div>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
        <RecipeForm
          recipe={recipe}
          onSuccess={() => {
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{recipe.name}</h1>
          <p className="text-muted-foreground">
            {recipe.servings} {recipe.servings === 1 ? "porción" : "porciones"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Editar
          </Button>
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive">Eliminar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Eliminar receta?</DialogTitle>
                <DialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente la
                  receta &ldquo;{recipe.name}&rdquo;.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleteMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {recipe.image_url && (
        <div className="relative h-64 w-full overflow-hidden rounded-lg">
          <Image
            src={recipe.image_url}
            alt={recipe.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      {recipe.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{recipe.description}</p>
          </CardContent>
        </Card>
      )}

      <MacroSummary
        totalCalories={totals.calories}
        totalProtein={totals.protein}
        totalCarbs={totals.carbs}
        totalFat={totals.fat}
        servings={recipe.servings}
      />

      <Card>
        <CardHeader>
          <CardTitle>Ingredientes</CardTitle>
          <CardDescription>
            {recipe.recipe_ingredients?.length || 0} ingredientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recipe.recipe_ingredients?.map((ingredient) => {
              const ratio = ingredient.quantity_grams / 100;
              const calories = Math.round(
                (ingredient.food?.calories_per_100g || 0) * ratio
              );
              const protein = Math.round(
                (ingredient.food?.protein_per_100g || 0) * ratio * 10
              ) / 10;
              const carbs = Math.round(
                (ingredient.food?.carbs_per_100g || 0) * ratio * 10
              ) / 10;
              const fat = Math.round(
                (ingredient.food?.fat_per_100g || 0) * ratio * 10
              ) / 10;

              return (
                <div
                  key={ingredient.id}
                  className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{ingredient.food?.name}</span>
                      {ingredient.category && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {categoryLabels[ingredient.category.category] ||
                            ingredient.category.category}
                        </span>
                      )}
                    </div>
                    {ingredient.food?.brand && (
                      <p className="text-sm text-muted-foreground">
                        {ingredient.food.brand}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {ingredient.quantity_grams}g
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <div>{calories} kcal</div>
                    <div className="text-muted-foreground">
                      P: {protein}g · C: {carbs}g · G: {fat}g
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
