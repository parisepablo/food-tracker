"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MealType } from "@/types";

interface DayColumnProps {
  date: Date;
  activeMealTypes: MealType[];
  onAddMeal?: (date: Date, mealType: MealType) => void;
  onRemoveMeal?: (entryId: string) => void;
}

const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Merienda",
};

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function DayColumn({ date, activeMealTypes, onAddMeal }: DayColumnProps) {
  const dayName = dayNames[date.getDay()];
  const dayNumber = date.getDate();
  const monthName = monthNames[date.getMonth()];

  const isToday = new Date().toDateString() === date.toDateString();

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
          activeMealTypes.map((mealType) => (
            <div
              key={mealType}
              className="rounded-md border border-dashed border-muted-foreground/25 p-2"
            >
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                {mealTypeLabels[mealType]}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-full justify-start py-1 text-xs"
                onClick={() => onAddMeal?.(date, mealType)}
              >
                + Agregar
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
