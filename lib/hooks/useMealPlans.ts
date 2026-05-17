"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { MealPlan, MealPlanWithEntries } from "@/types";

export function useMealPlans() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["meal-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .order("week_start", { ascending: false });

      if (error) throw error;

      return data as MealPlan[];
    },
  });
}

export function useMealPlan(mealPlanId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["meal-plan", mealPlanId],
    queryFn: async () => {
      const { data: mealPlan, error: mealPlanError } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("id", mealPlanId)
        .single();

      if (mealPlanError) throw mealPlanError;

      const { data: entries, error: entriesError } = await supabase
        .from("meal_plan_entries")
        .select("*, recipe:recipe_id(*)")
        .eq("meal_plan_id", mealPlanId);

      if (entriesError) throw entriesError;

      return {
        ...mealPlan,
        entries: entries || [],
      } as MealPlanWithEntries;
    },
    enabled: !!mealPlanId,
  });
}
