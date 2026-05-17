"use client";

import { useHousehold } from "@/lib/hooks/useHousehold";
import { DayColumn } from "./DayColumn";
import { Skeleton } from "@/components/ui/skeleton";
import type { MealType } from "@/types";

interface WeeklyCalendarProps {
  weekStart: Date;
  onAddMeal?: (date: Date, mealType: MealType) => void;
  onRemoveMeal?: (entryId: string) => void;
}

const allMealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export function WeeklyCalendar({ weekStart, onAddMeal, onRemoveMeal }: WeeklyCalendarProps) {
  const { data: householdData, isLoading } = useHousehold();

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

  // Generate 7 days starting from weekStart
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  return (
    <div className="grid gap-4 md:grid-cols-7">
      {days.map((date) => (
        <DayColumn
          key={date.toISOString()}
          date={date}
          activeMealTypes={activeMealTypes}
          onAddMeal={onAddMeal}
          onRemoveMeal={onRemoveMeal}
        />
      ))}
    </div>
  );
}
