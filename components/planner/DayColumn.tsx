"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MealSlot } from "./MealSlot";
import type { MealType } from "@/types";

interface DayColumnProps {
  date: string;
  activeMealTypes: MealType[];
  entries: Array<{
    date: string;
    meal_type: MealType;
    recipe_id: string;
    recipe_name: string;
    calories_per_serving?: number;
    image_url?: string | null;
  }>;
  onAssign: (date: string, mealType: MealType) => void;
  onRemove: (date: string, mealType: MealType) => void;
}

const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function DayColumn({ date, activeMealTypes, entries, onAssign, onRemove }: DayColumnProps) {
  const dateObj = new Date(date);
  // Adjust for Monday start (getDay returns 0 for Sunday)
  const dayIndex = (dateObj.getDay() + 6) % 7;
  const dayName = dayNames[dayIndex];
  const dayNumber = dateObj.getDate();
  const monthName = monthNames[dateObj.getMonth()];

  const isToday = new Date().toDateString() === dateObj.toDateString();

  const getEntryForMealType = (mealType: MealType) => {
    return entries.find((e) => e.date === date && e.meal_type === mealType);
  };

  return (
    <Card className={`h-full ${isToday ? "border-primary" : ""}`}>
      <CardHeader className="p-3">
        <CardTitle className="text-center text-sm">
          <div className="text-muted-foreground">{dayName}</div>
          <div className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>
            {dayNumber}
          </div>
          <div className="text-xs text-muted-foreground">{monthName}</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0">
        {activeMealTypes.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            No hay comidas activas
          </p>
        ) : (
          activeMealTypes.map((mealType) => {
            const entry = getEntryForMealType(mealType);
            return (
              <MealSlot
                key={mealType}
                date={date}
                mealType={mealType}
                recipeName={entry?.recipe_name}
                caloriesPerServing={entry?.calories_per_serving}
                imageUrl={entry?.image_url}
                onAssign={() => onAssign(date, mealType)}
                onRemove={() => onRemove(date, mealType)}
                compact
              />
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
