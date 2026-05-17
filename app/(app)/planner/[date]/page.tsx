"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePlanDraftStore } from "@/lib/hooks/useStore";
import { DailyMacroSummary } from "@/components/planner/DailyMacroSummary";
import { MealSlot } from "@/components/planner/MealSlot";
import { RecipeSelectorModal } from "@/components/planner/RecipeSelectorModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import type { MealType } from "@/types";

const allMealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function DayDetailPage() {
  const params = useParams();
  const date = params.date as string;
  const { entries, addEntry, removeEntry } = usePlanDraftStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("breakfast");

  const dayEntries = entries.filter((e) => e.date === date);

  // Calculate daily macros
  const totals = dayEntries.reduce(
    (acc, entry) => ({
      calories: acc.calories + (entry.calories_per_serving || 0),
      protein: acc.protein + (entry.protein_per_serving || 0),
      carbs: acc.carbs + (entry.carbs_per_serving || 0),
      fat: acc.fat + (entry.fat_per_serving || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleAssign = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setModalOpen(true);
  };

  const handleSelectRecipe = (recipeId: string, recipeName: string, caloriesPerServing?: number) => {
    addEntry({
      date,
      meal_type: selectedMealType,
      recipe_id: recipeId,
      recipe_name: recipeName,
      calories_per_serving: caloriesPerServing,
    });
  };

  const handleRemove = (mealType: MealType) => {
    removeEntry(date, mealType);
  };

  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString("es-ES", { weekday: "long" });
  const dayDate = dateObj.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/planner">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold capitalize">{dayName}</h1>
          <p className="text-muted-foreground">{dayDate}</p>
        </div>
      </div>

      <DailyMacroSummary
        date={date}
        totalCalories={totals.calories}
        totalProtein={totals.protein}
        totalCarbs={totals.carbs}
        totalFat={totals.fat}
        mealCount={dayEntries.length}
      />

      <Card>
        <CardHeader>
          <CardTitle>Comidas del día</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {allMealTypes.map((mealType) => {
            const entry = dayEntries.find((e) => e.meal_type === mealType);
            return (
              <MealSlot
                key={mealType}
                date={date}
                mealType={mealType}
                recipeName={entry?.recipe_name}
                caloriesPerServing={entry?.calories_per_serving}
                imageUrl={entry?.image_url}
                onAssign={() => handleAssign(mealType)}
                onRemove={() => handleRemove(mealType)}
              />
            );
          })}
        </CardContent>
      </Card>

      <RecipeSelectorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSelect={handleSelectRecipe}
        selectedDate={date}
        mealType={selectedMealType}
      />
    </div>
  );
}
