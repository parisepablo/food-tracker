"use client";

import { useState } from "react";
import { useHousehold } from "@/lib/hooks/useHousehold";
import { DayColumn } from "./DayColumn";
import { RecipeSelectorModal } from "./RecipeSelectorModal";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlanDraftStore } from "@/lib/hooks/useStore";
import type { MealType } from "@/types";

interface WeeklyCalendarProps {
  weekStart: Date;
}

const allMealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export function WeeklyCalendar({ weekStart }: WeeklyCalendarProps) {
  const { data: householdData, isLoading } = useHousehold();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; mealType: MealType } | null>(null);

  const { entries, addEntry, removeEntry } = usePlanDraftStore();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-96 w-full" />
        ))}
      </div>
    );
  }

  const activeMealTypes = (householdData?.household.active_meal_types as MealType[]) || allMealTypes;

  // Generate 7 days starting from weekStart (Monday)
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date.toISOString().split("T")[0];
  });

  const handleAssign = (date: string, mealType: MealType) => {
    setSelectedSlot({ date, mealType });
    setModalOpen(true);
  };

  const handleSelectRecipe = (recipeId: string, recipeName: string, caloriesPerServing?: number) => {
    if (selectedSlot) {
      addEntry({
        date: selectedSlot.date,
        meal_type: selectedSlot.mealType,
        recipe_id: recipeId,
        recipe_name: recipeName,
        calories_per_serving: caloriesPerServing,
      });
    }
  };

  const handleRemove = (date: string, mealType: MealType) => {
    removeEntry(date, mealType);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-7">
        {days.map((date) => (
          <DayColumn
            key={date}
            date={date}
            activeMealTypes={activeMealTypes}
            entries={entries}
            onAssign={handleAssign}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {selectedSlot && (
        <RecipeSelectorModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSelect={handleSelectRecipe}
          selectedDate={selectedSlot.date}
          mealType={selectedSlot.mealType}
        />
      )}
    </>
  );
}
