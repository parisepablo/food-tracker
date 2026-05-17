"use client";

import { useState } from "react";
import Link from "next/link";
import { useRecipes } from "@/lib/hooks/useRecipes";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function RecipesPage() {
  const { data: recipes, isLoading, error } = useRecipes();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecipes = recipes?.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Recetas</h1>
            <p className="text-muted-foreground">Gestiona tu colección de recetas</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-destructive">
              Error al cargar las recetas. Por favor, intenta de nuevo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recetas</h1>
          <p className="text-muted-foreground">Gestiona tu colección de recetas</p>
        </div>
        <Link href="/recipes/new">
          <Button>Nueva receta</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Buscar recetas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="p-0">
                <Skeleton className="h-48 w-full rounded-t-lg" />
              </CardHeader>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
                <div className="mt-4 flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredRecipes?.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            {searchQuery ? (
              <>
                <p className="text-muted-foreground">
                  No se encontraron recetas que coincidan con &ldquo;{searchQuery}&rdquo;
                </p>
                <Button
                  variant="link"
                  onClick={() => setSearchQuery("")}
                  className="mt-2"
                >
                  Limpiar búsqueda
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  No tienes recetas aún. ¡Crea tu primera receta!
                </p>
                <Link href="/recipes/new">
                  <Button className="mt-4">Crear receta</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes?.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
