"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { CategoryGroup } from "./CategoryGroup";
import { AddItemModal } from "./AddItemModal";
import { GenerateBanner } from "./GenerateBanner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Archive } from "lucide-react";
import type { ShoppingListItem, IngredientCategoryType } from "@/types";

export function ShoppingList() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch active shopping list
  const { data: shoppingList, isLoading } = useQuery({
    queryKey: ["active-shopping-list"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: memberData } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .single();

      if (!memberData) throw new Error("No household");

      const { data, error } = await supabase
        .from("shopping_lists")
        .select(`
          *,
          items:shopping_list_items(*)
        `)
        .eq("household_id", memberData.household_id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false })
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Check for confirmed meal plan
  const { data: hasConfirmedPlan } = useQuery({
    queryKey: ["has-confirmed-meal-plan"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: memberData } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .single();

      if (!memberData) return false;

      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      const weekStart = monday.toISOString().split("T")[0];

      const { data } = await supabase
        .from("meal_plans")
        .select("id")
        .eq("household_id", memberData.household_id)
        .eq("week_start", weekStart)
        .single();

      return !!data;
    },
  });

  // Toggle item checked
  const toggleItemMutation = useMutation({
    mutationFn: async ({ id, isChecked }: { id: string; isChecked: boolean }) => {
      const { error } = await supabase
        .from("shopping_list_items")
        .update({ is_checked: isChecked })
        .eq("id", id);

      if (error) throw error;
    },
    onMutate: async ({ id, isChecked }) => {
      await queryClient.cancelQueries({ queryKey: ["active-shopping-list"] });
      const previous = queryClient.getQueryData(["active-shopping-list"]);
      queryClient.setQueryData(["active-shopping-list"], (old: typeof previous) => {
        if (!old) return old;
        return {
          ...old,
          items: (old as { items: ShoppingListItem[] }).items.map((item: ShoppingListItem) =>
            item.id === id ? { ...item, is_checked: isChecked } : item
          ),
        };
      });
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["active-shopping-list"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["active-shopping-list"] });
    },
  });

  // Delete item
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shopping_list_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["active-shopping-list"] });
    },
  });

  // Clear checked items
  const clearCheckedMutation = useMutation({
    mutationFn: async () => {
      if (!shoppingList) return;
      const { error } = await supabase
        .from("shopping_list_items")
        .delete()
        .eq("shopping_list_id", shoppingList.id)
        .eq("is_checked", true);

      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["active-shopping-list"] });
    },
  });

  // Archive list
  const archiveListMutation = useMutation({
    mutationFn: async () => {
      if (!shoppingList) return;
      const { error } = await supabase
        .from("shopping_lists")
        .update({ is_archived: true })
        .eq("id", shoppingList.id);

      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["active-shopping-list"] });
    },
  });

  // Generate shopping list
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/shopping/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overwrite: false }),
      });

      if (response.status === 409) {
        const data = await response.json();
        if (data.exists) {
          const confirmed = window.confirm(
            "Ya existe una lista de compras para este plan. ¿Querés reemplazarla?"
          );
          if (!confirmed) return null;

          return fetch("/api/shopping/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ overwrite: true }),
          }).then((r) => r.json());
        }
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-shopping-list"] });
    },
  });

  // Group items by category
  const itemsByCategory = shoppingList?.items?.reduce(
    (acc, item) => {
      const category = (item.category as IngredientCategoryType) || "other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<IngredientCategoryType, ShoppingListItem[]>
  );

  const categoryOrder: IngredientCategoryType[] = [
    "red_meat",
    "chicken",
    "fish",
    "vegetarian",
    "pasta",
    "other",
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const checkedCount = shoppingList?.items?.filter((i) => i.is_checked).length || 0;
  const totalCount = shoppingList?.items?.length || 0;

  return (
    <div className="space-y-6">
      <GenerateBanner
        hasConfirmedPlan={!!hasConfirmedPlan}
        onGenerate={() => generateMutation.mutate()}
        isGenerating={generateMutation.isPending}
      />

      {!shoppingList ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No tenés una lista de compras activa
          </p>
          {hasConfirmedPlan && (
            <Button
              onClick={() => generateMutation.mutate()}
              className="mt-4"
              disabled={generateMutation.isPending}
            >
              Generar lista
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Lista de compras</h2>
              <p className="text-sm text-muted-foreground">
                {checkedCount} de {totalCount} items comprados
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => clearCheckedMutation.mutate()}
                disabled={checkedCount === 0}
                title="Limpiar lista"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => archiveListMutation.mutate()}
                title="Archivar lista"
              >
                <Archive className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                onClick={() => setModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {categoryOrder.map((category) => {
              const items = itemsByCategory?.[category] || [];
              if (items.length === 0) return null;
              return (
                <CategoryGroup
                  key={category}
                  category={category}
                  items={items}
                  onToggle={(id, isChecked) =>
                    toggleItemMutation.mutate({ id, isChecked })
                  }
                  onDelete={(id) => deleteItemMutation.mutate(id)}
                />
              );
            })}
          </div>

          <AddItemModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            shoppingListId={shoppingList.id}
            onItemAdded={() => queryClient.invalidateQueries({ queryKey: ["active-shopping-list"] })}
          />
        </>
      )}
    </div>
  );
}
