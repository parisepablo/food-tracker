"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DailyMacroSummaryProps {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
}

export function DailyMacroSummary({
  date,
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  mealCount,
}: DailyMacroSummaryProps) {
  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString("es-ES", { weekday: "long" });
  const dayDate = dateObj.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg capitalize">{dayName}</CardTitle>
        <p className="text-sm text-muted-foreground">{dayDate}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-lg bg-primary/10 p-3 text-center">
            <div className="text-2xl font-bold text-primary">{Math.round(totalCalories)}</div>
            <div className="text-xs text-muted-foreground">kcal</div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center">
            <div className="text-2xl font-bold">{Math.round(totalProtein)}g</div>
            <div className="text-xs text-muted-foreground">proteína</div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center">
            <div className="text-2xl font-bold">{Math.round(totalCarbs)}g</div>
            <div className="text-xs text-muted-foreground">carbohidratos</div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center">
            <div className="text-2xl font-bold">{Math.round(totalFat)}g</div>
            <div className="text-xs text-muted-foreground">grasas</div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center col-span-2 sm:col-span-1">
            <div className="text-2xl font-bold">{mealCount}</div>
            <div className="text-xs text-muted-foreground">comidas</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
