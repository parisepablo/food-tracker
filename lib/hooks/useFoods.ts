"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Food } from "@/types";

export function useFoods() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["foods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .order("name");

      if (error) throw error;

      return data as Food[];
    },
  });
}

export function useFood(foodId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["food", foodId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .eq("id", foodId)
        .single();

      if (error) throw error;

      return data as Food;
    },
    enabled: !!foodId,
  });
}

export function useSearchFoods(searchQuery: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["foods", "search", searchQuery],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .ilike("name", `%${searchQuery}%`)
        .limit(20);

      if (error) throw error;

      return data as Food[];
    },
    enabled: searchQuery.length >= 2,
  });
}
