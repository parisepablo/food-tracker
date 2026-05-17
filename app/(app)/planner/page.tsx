"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WeeklyCalendar } from "@/components/planner/WeeklyCalendar";
import { AIPlanAdjuster } from "@/components/planner/AIPlanAdjuster";
import { ChevronLeft, ChevronRight, AlertTriangle, Check, Sparkles, Settings } from "lucide-react";
import { usePlanDraftStore } from "@/lib/hooks/useStore";
import { createClient } from "@/lib/supabase/client";
import type { MealType } from "@/types";

export default function PlannerPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [dismissedConflicts, setDismissedConflicts] = useState<string[]>([]);

  const {
    weekStart,
    entries,
    conflicts,
    aiMessage,
    isDirty,
    setWeekStart,
    loadFromAPI,
    clearDraft,
    setAIMessage,
  } = usePlanDraftStore();

  // Initialize weekStart to current Monday
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Load existing plan for the week on mount or week change
  useEffect(() => {
    const loadPlan = async () => {
      const weekStartStr = currentWeekStart.toISOString().split("T")[0];
      setWeekStart(weekStartStr);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: memberData } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", user.id)
          .single();

        if (!memberData) return;

        const { data: mealPlan } = await supabase
          .from("meal_plans")
          .select("*, meal_plan_entries(*)")
          .eq("household_id", memberData.household_id)
          .eq("week_start", weekStartStr)
          .single();

        if (mealPlan?.meal_plan_entries) {
          const formattedEntries = mealPlan.meal_plan_entries.map((entry: {
            id: string;
            date: string;
            meal_type: string;
            recipe_id: string;
            recipes?: { name: string; image_url?: string | null; recipe_ingredients?: unknown[] };
          }) => {
            let caloriesPerServing = 0;
            if (entry.recipes?.recipe_ingredients && Array.isArray(entry.recipes.recipe_ingredients)) {
              const totalCalories = (entry.recipes.recipe_ingredients as Array<{
                food?: { calories_per_100g?: number };
                quantity_grams?: number;
              }>).reduce((sum, ri) => {
                const ratio = (ri.quantity_grams || 0) / 100;
                return sum + (ri.food?.calories_per_100g || 0) * ratio;
              }, 0);
              caloriesPerServing = Math.round(totalCalories);
            }

            return {
              id: entry.id,
              date: entry.date,
              meal_type: entry.meal_type as MealType,
              recipe_id: entry.recipe_id,
              recipe_name: entry.recipes?.name || "Receta desconocida",
              calories_per_serving: caloriesPerServing || undefined,
              image_url: entry.recipes?.image_url || null,
            };
          });

          loadFromAPI({
            week_start: weekStartStr,
            entries: formattedEntries,
            conflicts: [],
          });
        }
      } catch (error) {
        console.error("Error loading plan:", error);
      }
    };

    loadPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekStart]);

  const handlePreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setDismissedConflicts([]);
    setAIMessage(null);

    try {
      const weekStartStr = currentWeekStart.toISOString().split("T")[0];
      const response = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_start: weekStartStr }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to generate meal plan:", error);
        return;
      }

      const result = await response.json();
      loadFromAPI(result);
    } catch (error) {
      console.error("Error generating meal plan:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmPlan = async () => {
    setIsConfirming(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!weekStart) {
        console.error("No week start set");
        return;
      }

      const { data: memberData } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .single();

      if (!memberData) return;

      // Create or update meal plan
      const { data: mealPlan, error: planError } = await supabase
        .from("meal_plans")
        .upsert(
          {
            household_id: memberData.household_id,
            week_start: weekStart,
          },
          { onConflict: "household_id,week_start" }
        )
        .select()
        .single();

      if (planError || !mealPlan) {
        console.error("Error creating meal plan:", planError);
        return;
      }

      // Delete existing entries
      await supabase
        .from("meal_plan_entries")
        .delete()
        .eq("meal_plan_id", mealPlan.id);

      // Insert new entries
      if (entries.length > 0) {
        const entriesToInsert = entries.map((e) => ({
          meal_plan_id: mealPlan.id,
          recipe_id: e.recipe_id,
          date: e.date,
          meal_type: e.meal_type,
          user_id: user.id,
        }));

        await supabase.from("meal_plan_entries").insert(entriesToInsert);
      }

      clearDraft();
      router.refresh();
    } catch (error) {
      console.error("Error confirming plan:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const formatWeekRange = () => {
    const endOfWeek = new Date(currentWeekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const startStr = currentWeekStart.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
    const endStr = endOfWeek.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });

    return `${startStr} - ${endStr}`;
  };

  const visibleConflicts = conflicts.filter(
    (c) => !dismissedConflicts.includes(`${c.date}-${c.meal_type}`)
  );

  const dismissConflict = (date: string, mealType: string) => {
    setDismissedConflicts((prev) => [...prev, `${date}-${mealType}`]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planificador de comidas</h1>
          <p className="text-muted-foreground">Planifica tus comidas para la semana</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGeneratePlan}
            disabled={isGenerating}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isGenerating ? "Generando..." : "Generar plan"}
          </Button>
          <Button
            onClick={handleConfirmPlan}
            disabled={isConfirming || entries.length === 0}
          >
            <Check className="mr-2 h-4 w-4" />
            {isConfirming ? "Guardando..." : "Confirmar plan"}
          </Button>
        </div>
      </div>

      {/* Conflict alerts */}
      {visibleConflicts.length > 0 && (
        <div className="space-y-2">
          {visibleConflicts.map((conflict, index) => (
            <Alert key={index} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Conflicto en el plan</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {new Date(conflict.date).toLocaleDateString("es-ES")} - {conflict.reason}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissConflict(conflict.date, conflict.meal_type)}
                >
                  Descartar
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* AI message */}
      {aiMessage && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Ajuste de IA</AlertTitle>
          <AlertDescription>{aiMessage}</AlertDescription>
        </Alert>
      )}

      {/* Dirty indicator */}
      {isDirty && (
        <Alert>
          <AlertDescription>
            Tienes cambios sin guardar. Haz clic en &quot;Confirmar plan&quot; para guardar.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plan semanal</CardTitle>
              <CardDescription>{formatWeekRange()}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Link href="/planner/rules">
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <WeeklyCalendar weekStart={currentWeekStart} />
        </CardContent>
      </Card>

      <AIPlanAdjuster />
    </div>
  );
}
