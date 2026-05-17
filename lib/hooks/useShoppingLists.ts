"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ShoppingList, ShoppingListWithItems } from "@/types";

export function useShoppingLists() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["shopping-lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shopping_lists")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data as ShoppingList[];
    },
  });
}

export function useShoppingList(listId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["shopping-list", listId],
    queryFn: async () => {
      const { data: list, error: listError } = await supabase
        .from("shopping_lists")
        .select("*")
        .eq("id", listId)
        .single();

      if (listError) throw listError;

      const { data: items, error: itemsError } = await supabase
        .from("shopping_list_items")
        .select("*, food:food_id(*)")
        .eq("shopping_list_id", listId)
        .order("created_at", { ascending: true });

      if (itemsError) throw itemsError;

      return {
        ...list,
        items: items || [],
      } as ShoppingListWithItems;
    },
    enabled: !!listId,
  });
}
