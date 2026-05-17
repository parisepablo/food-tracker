"use client";

import { useState } from "react";
import { MealSlotSummary } from "./MealSlotSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { roundMacros, calcDayMacros } from "@/lib/utils/nutrition";
import type { RecipeWithIngredients, MealType } from "@/types";

interface DailyBreakdownProps {
  entriesByDate: Record<string, Array<{
    meal_type: MealType;
    recipes: RecipeWithIngredients;
  }>>;
  activeMealTypes: MealType[];
}

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Merienda",
};

export function DailyBreakdown({ entriesByDate, activeMealTypes }: DailyBreakdownProps) {
  const dates = Object.keys(entriesByDate);
  const [selectedDate, setSelectedDate] = useState(dates[0]);

  if (dates.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No hay comidas planificadas
        </CardContent>
      </Card>
    );
  }

  const selectedEntries = entriesByDate[selectedDate] || [];
  const dateObj = new Date(selectedDate);
  const dayName = dayNames[dateObj.getDay()];

  // Calculate daily macros
  const dailyMacros = roundMacros(calcDayMacros(selectedEntries.map(e => ({ recipe: e.recipes }))));

  // Group by meal type
  const entriesByMealType = selectedEntries.reduce(
    (acc, entry) => {
      if (!acc[entry.meal_type]) acc[entry.meal_type] = [];
      acc[entry.meal_type].push(entry);
      return acc;
    },
    {} as Record<MealType, Array<{ meal_type: MealType; recipes: RecipeWithIngredients }>>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Desglose diario</CardTitle>
          <div className="flex gap-1 overflow-x-auto">
            {dates.map((date) => {
              const d = new Date(date);
              const shortDay = dayNames[d.getDay()].slice(0, 3);
              const dayNum = d.getDate();

              return (
                <Button
                  key={date}
                  variant={selectedDate === date ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDate(date)}
                  className="shrink-0"
                >
                  {shortDay} {dayNum}
                </Button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <h4 className="font-medium mb-2">{dayName}</h4>
          <div className="flex gap-4 text-sm">
            <span>{dailyMacros.calories} kcal</span>
            <span>P: {dailyMacros.protein}g</span>
            <span>C: {dailyMacros.carbs}g</span>
            <span>G: {dailyMacros.fat}g</span>
          </div>
        </div>

        <div className="space-y-3">
          {activeMealTypes.map((mealType) => {
            const mealEntries = entriesByMealType[mealType] || [];

            if (mealEntries.length === 0) return null;

            return (
              <div key={mealType}>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {mealTypeLabels[mealType]}
                </h4>
                <div className="space-y-2">
                  {mealEntries.map((entry, idx) => (
                    <MealSlotSummary
                      key={idx}
                      mealType={mealType}
                      recipe={entry.recipes}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
