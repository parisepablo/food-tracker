"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";
import { usePlanDraftStore } from "@/lib/hooks/useStore";
import { useRecipes } from "@/lib/hooks/useRecipes";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function AIPlanAdjuster() {
  const [instruction, setInstruction] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const { data: recipes } = useRecipes();
  const { weekStart, entries, conflicts, loadFromAPI, setAIMessage } = usePlanDraftStore();
  const supabase = createClient();

  const { data: rules } = useQuery({
    queryKey: ["meal-plan-rules"],
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
        .from("meal_plan_rules")
        .select("*")
        .eq("household_id", memberData.household_id);

      if (error) throw error;
      return data;
    },
    enabled: !!weekStart,
  });

  const handleAdjust = async () => {
    if (!instruction.trim() || !weekStart || entries.length === 0) return;

    setIsAdjusting(true);

    try {
      const currentPlan = {
        week_start: weekStart,
        entries: entries.map((e) => ({
          date: e.date,
          meal_type: e.meal_type,
          recipe_id: e.recipe_id,
          recipe_name: e.recipe_name,
        })),
        conflicts,
      };

      const response = await fetch("/api/planner/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          currentPlan,
          recipes: recipes?.map((r) => ({ id: r.id, name: r.name })) || [],
          rules,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to adjust plan:", error);
        return;
      }

      const result = await response.json();
      loadFromAPI(result);

      if (result.message) {
        setAIMessage(result.message);
      }

      setInstruction("");
    } catch (error) {
      console.error("Error adjusting plan:", error);
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-medium">Ajustar plan con IA</h3>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Ej: Haz que el miércoles tenga menos calorías..."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdjust()}
            disabled={isAdjusting || entries.length === 0}
            className="flex-1"
          />
          <Button
            onClick={handleAdjust}
            disabled={isAdjusting || !instruction.trim() || entries.length === 0}
          >
            {isAdjusting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ajustando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Ajustar
              </>
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Describe cómo quieres modificar el plan. La IA ajustará las recetas respetando tus reglas.
        </p>
      </CardContent>
    </Card>
  );
}
