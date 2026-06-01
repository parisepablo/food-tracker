"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WeeklyCalendar } from "@/components/planner/WeeklyCalendar";
import { AIPlanAdjuster } from "@/components/planner/AIPlanAdjuster";
import { ChevronLeft, ChevronRight, AlertTriangle, Check, Sparkles, Settings, ChefHat, ListPlus } from "lucide-react";
import { usePlanDraftStore } from "@/lib/hooks/useStore";
import { createClient } from "@/lib/supabase/client";
import type { MealType } from "@/types";

const allMealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

interface ValidationError {
  type: "error" | "warning";
  title: string;
  message: string;
  action?: { label: string; href: string };
}

export default function PlannerPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [dismissedConflicts, setDismissedConflicts] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<ValidationError | null>(null);

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
    setValidationError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setValidationError({ type: "error", title: "No autenticado", message: "Debes iniciar sesión para generar un plan." });
        setIsGenerating(false);
        return;
      }

      // Get household
      const { data: memberData } = await supabase
        .from("household_members")
        .select("household_id, households(active_meal_types)")
        .eq("user_id", user.id)
        .single();

      if (!memberData) {
        setValidationError({ type: "error", title: "Sin hogar", message: "No se encontró un hogar asociado a tu cuenta." });
        setIsGenerating(false);
        return;
      }

      const householdId = memberData.household_id;
      const activeMealTypes = (memberData.households?.active_meal_types as MealType[]) || allMealTypes;
      const totalSlots = activeMealTypes.length * 7;

      // 1. Fetch recipes
      const { data: recipes, error: recipesError } = await supabase
        .from("recipes")
        .select(`
          id,
          name,
          recipe_ingredients(
            food:food_id(
              id,
              ingredient_categories(category)
            )
          )
        `)
        .eq("household_id", householdId);

      if (recipesError) {
        setValidationError({ type: "error", title: "Error", message: "No se pudieron cargar las recetas. Intentá de nuevo." });
        setIsGenerating(false);
        return;
      }

      // Validation: No recipes at all
      if (!recipes || recipes.length === 0) {
        setValidationError({
          type: "error",
          title: "No hay recetas",
          message: "Necesitás crear al menos una receta antes de generar un plan de comidas.",
          action: { label: "Crear receta", href: "/recipes/new" },
        });
        setIsGenerating(false);
        return;
      }

      // Build recipe category map
      const recipeCategories: Record<string, string[]> = {};
      recipes.forEach((recipe: unknown) => {
        const r = recipe as {
          id: string;
          recipe_ingredients?: Array<{
            food?: { ingredient_categories?: Array<{ category: string }> };
          }>;
        };
        const cats = new Set<string>();
        r.recipe_ingredients?.forEach((ri) => {
          ri.food?.ingredient_categories?.forEach((ic) => {
            cats.add(ic.category);
          });
        });
        recipeCategories[r.id] = Array.from(cats);
      });

      // 2. Fetch rules
      const { data: rules } = await supabase
        .from("meal_plan_rules")
        .select("rule_type, rule_config")
        .eq("household_id", householdId);

      // 3. Validation: Not enough recipes for the week
      if (recipes.length < totalSlots) {
        setValidationError({
          type: "warning",
          title: "Pocas recetas",
          message: `Tenés ${recipes.length} receta${recipes.length === 1 ? "" : "s"} pero necesitás al menos ${totalSlots} para llenar la semana (${activeMealTypes.length} comidas × 7 días). Se generarán conflictos donde no haya recetas disponibles.`,
          action: { label: "Agregar recetas", href: "/recipes/new" },
        });
      }

      // 4. Validation: Protein frequency rules
      const proteinRules = (rules || []).filter((r: unknown) => (r as { rule_type: string }).rule_type === "protein_frequency");
      for (const rule of proteinRules) {
        const config = (rule as unknown as { rule_config: { category: string; max_per_week: number } }).rule_config;
        const matchingRecipes = recipes.filter((r: unknown) => {
          const id = (r as { id: string }).id;
          return recipeCategories[id]?.includes(config.category);
        });
        if (matchingRecipes.length === 0) {
          setValidationError({
            type: "error",
            title: "Regla imposible de cumplir",
            message: `Tenés una regla de frecuencia para "${config.category}" pero no hay ninguna receta con esa categoría. El plan no se puede generar.`,
            action: { label: "Editar reglas", href: "/planner/rules" },
          });
          setIsGenerating(false);
          return;
        }
      }

      // 5. Validation: Distribution rules
      const distributionRules = (rules || []).filter((r: unknown) => (r as { rule_type: string }).rule_type === "distribution");
      for (const rule of distributionRules) {
        const config = (rule as unknown as { rule_config: { category: string; allowed_days: string[] } }).rule_config;
        const matchingRecipes = recipes.filter((r: unknown) => {
          const id = (r as { id: string }).id;
          return recipeCategories[id]?.includes(config.category);
        });
        if (matchingRecipes.length === 0) {
          setValidationError({
            type: "error",
            title: "Regla imposible de cumplir",
            message: `Tenés una regla de distribución para "${config.category}" pero no hay ninguna receta con esa categoría. El plan no se puede generar.`,
            action: { label: "Editar reglas", href: "/planner/rules" },
          });
          setIsGenerating(false);
          return;
        }
        if (config.allowed_days.length === 0) {
          setValidationError({
            type: "error",
            title: "Regla inválida",
            message: `Tenés una regla de distribución para "${config.category}" pero no seleccionaste ningún día permitido. El plan no se puede generar.`,
            action: { label: "Editar reglas", href: "/planner/rules" },
          });
          setIsGenerating(false);
          return;
        }
      }

      // 6. Validation: Variety rule
      const varietyRules = (rules || []).filter((r: unknown) => (r as { rule_type: string }).rule_type === "variety");
      if (varietyRules.length > 0) {
        const maxMinDays = Math.max(...varietyRules.map((r: unknown) => (r as unknown as { rule_config: { min_days_between: number } }).rule_config.min_days_between));
        // If variety requires no repetition for X days, we need enough unique recipes
        // Rough check: if recipes < slots, variety will definitely fail for some slots
        if (recipes.length < totalSlots) {
          setValidationError({
            type: "warning",
            title: "Variedad insuficiente",
            message: `La regla de variedad requiere ${maxMinDays} días entre repeticiones, pero tenés menos recetas (${recipes.length}) que espacios semanales (${totalSlots}). Algunas comidas podrían repetirse o generar conflictos.`,
            action: { label: "Agregar recetas", href: "/recipes/new" },
          });
        }
      }

      // If we have a validation warning (not error), let the user decide — but we proceed with the API call anyway and show the warning
      // Actually, for simplicity, let's proceed with the API call. The validation errors above stop execution, warnings don't.

      const weekStartStr = currentWeekStart.toISOString().split("T")[0];
      const response = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_start: weekStartStr }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to generate meal plan:", error);
        setValidationError({ type: "error", title: "Error al generar", message: error.error || "No se pudo generar el plan. Intentá de nuevo." });
        setIsGenerating(false);
        return;
      }

      const result = await response.json();
      loadFromAPI(result);
    } catch (error) {
      console.error("Error generating meal plan:", error);
      setValidationError({ type: "error", title: "Error inesperado", message: "Ocurrió un error al generar el plan. Intentá de nuevo más tarde." });
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

      {/* Validation errors */}
      {validationError && (
        <Alert variant={validationError.type === "error" ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{validationError.title}</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>{validationError.message}</span>
            {validationError.action && (
              <Link href={validationError.action.href}>
                <Button size="sm" variant="outline" className="w-fit">
                  {validationError.type === "error" ? <ChefHat className="mr-2 h-4 w-4" /> : <ListPlus className="mr-2 h-4 w-4" />}
                  {validationError.action.label}
                </Button>
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}

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
