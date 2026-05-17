"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecipeWithIngredients } from "@/types";

interface RecipeCardProps {
  recipe: RecipeWithIngredients;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  // Calculate total macros
  const totals = recipe.recipe_ingredients?.reduce(
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

  const caloriesPerServing = recipe.servings > 0 ? Math.round(totals.calories / recipe.servings) : 0;

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            {recipe.image_url ? (
              <Image
                src={recipe.image_url}
                alt={recipe.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                  <path d="M7 2v20" />
                  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                </svg>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="line-clamp-1 text-lg">{recipe.name}</CardTitle>
          <CardDescription className="mt-1 line-clamp-2">
            {recipe.description || "Sin descripción"}
          </CardDescription>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {recipe.servings} {recipe.servings === 1 ? "porción" : "porciones"}
            </Badge>
            <Badge variant="outline">{caloriesPerServing} kcal/porción</Badge>
          </div>
          <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
            <span>P: {Math.round(totals.protein / recipe.servings)}g</span>
            <span>C: {Math.round(totals.carbs / recipe.servings)}g</span>
            <span>G: {Math.round(totals.fat / recipe.servings)}g</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
