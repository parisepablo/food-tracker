"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { MemberSummaryCard } from "@/components/dashboard/MemberSummaryCard";
import { DailyBreakdown } from "@/components/dashboard/DailyBreakdown";
import { WeeklyMacroChart } from "@/components/dashboard/WeeklyMacroChart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ChefHat } from "lucide-react";
import { calcDayMacros, roundMacros } from "@/lib/utils/nutrition";
import type { MealType, RecipeWithIngredients, NutritionGoal } from "@/types";

export default function DashboardPage() {
  const supabase = createClient();

  // Fetch household and members
  const { data: householdData, isLoading: householdLoading } = useQuery({
    queryKey: ["household-with-members"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: memberData } = await supabase
        .from("household_members")
        .select("household_id, households(active_meal_types)")
        .eq("user_id", user.id)
        .single();

      if (!memberData) throw new Error("No household");

      const { data: members } = await supabase
        .from("household_members")
        .select("user_id")
        .eq("household_id", memberData.household_id);

      const memberIds = (members || []).map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", memberIds.length > 0 ? memberIds : [user.id]);

      const profileMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        profileMap[p.id] = p.display_name || `Usuario ${p.id.slice(0, 8)}`;
      });

      return {
        householdId: memberData.household_id,
        activeMealTypes: (memberData.households?.active_meal_types as MealType[]) || ["breakfast", "lunch", "dinner", "snack"],
        members: members || [],
        profileMap,
      };
    },
  });

  // Fetch nutrition goals for all members
  const { data: goals } = useQuery({
    queryKey: ["nutrition-goals", householdData?.householdId],
    queryFn: async () => {
      if (!householdData?.householdId) return [];

      const { data, error } = await supabase
        .from("nutrition_goals")
        .select("*")
        .eq("household_id", householdData.householdId);

      if (error) throw error;
      return data as NutritionGoal[];
    },
    enabled: !!householdData?.householdId,
  });

  // Fetch meal plan entries for current week
  const { data: mealPlanData } = useQuery({
    queryKey: ["current-meal-plan", householdData?.householdId],
    queryFn: async () => {
      if (!householdData?.householdId) return null;

      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      const weekStart = monday.toISOString().split("T")[0];

      const { data: mealPlan } = await supabase
        .from("meal_plans")
        .select("id")
        .eq("household_id", householdData.householdId)
        .eq("week_start", weekStart)
        .single();

      if (!mealPlan) return null;

      const { data: entries } = await supabase
        .from("meal_plan_entries")
        .select(`
          *,
          recipes(
            *,
            recipe_ingredients(
              *,
              food:food_id(*)
            )
          )
        `)
        .eq("meal_plan_id", mealPlan.id);

      return entries;
    },
    enabled: !!householdData?.householdId,
  });

  if (householdLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Group entries by user and date
  const entriesByUser: Record<string, Array<{
    meal_type: MealType;
    recipes: RecipeWithIngredients;
    date: string;
  }>> = {};

  const entriesByDate: Record<string, Array<{
    meal_type: MealType;
    recipes: RecipeWithIngredients;
  }>> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mealPlanData?.forEach((entry: any) => {
    const userId = entry.user_id;
    const date = entry.date;

    if (!entriesByUser[userId]) entriesByUser[userId] = [];
    if (!entriesByDate[date]) entriesByDate[date] = [];

    entriesByUser[userId].push({
      meal_type: entry.meal_type as MealType,
      recipes: entry.recipes as RecipeWithIngredients,
      date,
    });

    entriesByDate[date].push({
      meal_type: entry.meal_type as MealType,
      recipes: entry.recipes as RecipeWithIngredients,
    });
  });

  // Calculate macros per user
  const userMacros = Object.entries(entriesByUser).map(([userId, entries]) => {
    const weekMacros = calcDayMacros(entries.map(e => ({ recipe: e.recipes })));
    const dailyAverage = {
      calories: weekMacros.calories / 7,
      protein: weekMacros.protein / 7,
      carbs: weekMacros.carbs / 7,
      fat: weekMacros.fat / 7,
    };

    const goal = goals?.find((g) => g.user_id === userId);

    return {
      userId,
      memberName: householdData?.profileMap?.[userId] || `Usuario ${userId.slice(0, 8)}`,
      weekMacros: roundMacros(weekMacros),
      dailyAverage: roundMacros(dailyAverage),
      goal,
    };
  });

  const hasPlan = mealPlanData && mealPlanData.length > 0;
  const activeTypes = householdData?.activeMealTypes || ["breakfast", "lunch", "dinner", "snack"];

  // Calculate daily macros for chart
  const dailyMacrosForChart = Object.entries(entriesByDate).reduce(
    (acc, [date, entries]) => {
      acc[date] = roundMacros(calcDayMacros(entries.map(e => ({ recipe: e.recipes }))));
      return acc;
    },
    {} as Record<string, ReturnType<typeof roundMacros>>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard nutricional</h1>
        <p className="text-muted-foreground">
          Resumen de tu planificación semanal
        </p>
      </div>

      {!hasPlan ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No hay plan confirmado</AlertTitle>
          <AlertDescription className="mt-2">
            No tenés un plan de comidas confirmado para esta semana.
            <Link href="/planner">
              <Button size="sm" className="mt-2">
                <ChefHat className="mr-2 h-4 w-4" />
                Ir al planificador
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Section 1: Weekly Overview */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Resumen semanal</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userMacros.map((user) => (
                <MemberSummaryCard
                  key={user.userId}
                  memberName={user.memberName}
                  weeklyMacros={user.weekMacros}
                  dailyAverage={user.dailyAverage}
                  goal={user.goal || undefined}
                />
              ))}
            </div>
          </div>

          {/* Section 2: Daily Breakdown */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Desglose diario</h2>
            <DailyBreakdown
              entriesByDate={entriesByDate}
              activeMealTypes={activeTypes}
            />
          </div>

          {/* Section 3: Weekly Macro Chart */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Gráfico semanal</h2>
            <WeeklyMacroChart dailyMacros={dailyMacrosForChart} />
          </div>
        </>
      )}
    </div>
  );
}
