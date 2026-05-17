"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MacroSummaryProps {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  servings: number;
}

export function MacroSummary({
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  servings,
}: MacroSummaryProps) {
  const perServing = {
    calories: servings > 0 ? Math.round(totalCalories / servings) : 0,
    protein: servings > 0 ? Math.round((totalProtein / servings) * 10) / 10 : 0,
    carbs: servings > 0 ? Math.round((totalCarbs / servings) * 10) / 10 : 0,
    fat: servings > 0 ? Math.round((totalFat / servings) * 10) / 10 : 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resumen de macros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Total</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-muted p-2">
                <div className="text-2xl font-bold">{Math.round(totalCalories)}</div>
                <div className="text-xs text-muted-foreground">kcal</div>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <div className="text-2xl font-bold">{Math.round(totalProtein * 10) / 10}g</div>
                <div className="text-xs text-muted-foreground">proteína</div>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <div className="text-2xl font-bold">{Math.round(totalCarbs * 10) / 10}g</div>
                <div className="text-xs text-muted-foreground">carbohidratos</div>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <div className="text-2xl font-bold">{Math.round(totalFat * 10) / 10}g</div>
                <div className="text-xs text-muted-foreground">grasas</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Por porción ({servings} {servings === 1 ? "porción" : "porciones"})
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-primary/10 p-2">
                <div className="text-2xl font-bold text-primary">{perServing.calories}</div>
                <div className="text-xs text-muted-foreground">kcal</div>
              </div>
              <div className="rounded-lg bg-primary/10 p-2">
                <div className="text-2xl font-bold text-primary">{perServing.protein}g</div>
                <div className="text-xs text-muted-foreground">proteína</div>
              </div>
              <div className="rounded-lg bg-primary/10 p-2">
                <div className="text-2xl font-bold text-primary">{perServing.carbs}g</div>
                <div className="text-xs text-muted-foreground">carbohidratos</div>
              </div>
              <div className="rounded-lg bg-primary/10 p-2">
                <div className="text-2xl font-bold text-primary">{perServing.fat}g</div>
                <div className="text-xs text-muted-foreground">grasas</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
