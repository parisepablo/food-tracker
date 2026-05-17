"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FoodCard } from "@/components/foods/FoodCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Search, AlertTriangle } from "lucide-react";
import type { Food } from "@/types";

export default function FoodsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch foods
  const { data: foods, isLoading } = useQuery({
    queryKey: ["household-foods"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: member } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .single();

      if (!member) throw new Error("No household");

      const { data: foods } = await supabase
        .from("foods")
        .select("*")
        .eq("household_id", member.household_id)
        .order("name");

      return foods || [];
    },
  });

  // Fetch recipe usage for foods
  const { data: recipeUsage } = useQuery({
    queryKey: ["foods-recipe-usage"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Map();

      const { data: member } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .single();

      if (!member) return new Map();

      const { data: ingredients } = await supabase
        .from("recipe_ingredients")
        .select("food_id")
        .in("food_id", foods?.map(f => f.id) || []);

      const usageMap = new Map<string, boolean>();
      ingredients?.forEach((ing) => {
        usageMap.set(ing.food_id, true);
      });

      return usageMap;
    },
    enabled: !!foods,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (foodId: string) => {
      const { error } = await supabase
        .from("foods")
        .delete()
        .eq("id", foodId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-foods"] });
      queryClient.invalidateQueries({ queryKey: ["foods-recipe-usage"] });
    },
  });

  // Handle delete with confirmation
  const handleDelete = async (foodId: string) => {
    const isUsed = recipeUsage?.get(foodId);
    
    if (isUsed) {
      alert("Este alimento está siendo usado en una o más recetas y no puede ser eliminado.");
      return;
    }

    if (confirm("¿Estás seguro de que quieres eliminar este alimento?")) {
      await deleteMutation.mutateAsync(foodId);
    }
  };

  // Handle edit
  const handleEdit = (foodId: string) => {
    router.push(`/foods/${foodId}/edit`);
  };

  // Filter foods by search query
  const filteredFoods = foods?.filter((food) => {
    const query = searchQuery.toLowerCase();
    return (
      food.name.toLowerCase().includes(query) ||
      (food.brand && food.brand.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de alimentos</h1>
          <p className="text-muted-foreground">
            Gestiona los alimentos de tu hogar
          </p>
        </div>
        <Link href="/foods/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo alimento
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o marca..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : filteredFoods?.length === 0 ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {searchQuery
              ? "No se encontraron alimentos que coincidan con tu búsqueda."
              : "No tienes alimentos en tu catálogo. Agrega el primero para comenzar a crear recetas."}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFoods?.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isUsedInRecipes={recipeUsage?.get(food.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
