"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalProgressBar } from "./GoalProgressBar";
import type { Macros, NutritionGoal } from "@/types";

interface MemberSummaryCardProps {
  memberName: string;
  weeklyMacros: Macros;
  dailyAverage: Macros;
  goal?: NutritionGoal;
}

export function MemberSummaryCard({
  memberName,
  weeklyMacros,
  dailyAverage,
  goal,
}: MemberSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{memberName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Calorías semanales</p>
            <p className="text-2xl font-bold">{Math.round(weeklyMacros.calories)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Promedio diario</p>
            <p className="text-2xl font-bold">{Math.round(dailyAverage.calories)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <GoalProgressBar
            label="Proteínas"
            value={dailyAverage.protein}
            total={dailyAverage.calories}
            caloriesPerGram={4}
            goal={goal?.protein_goal || undefined}
            color="bg-blue-500"
          />
          <GoalProgressBar
            label="Carbohidratos"
            value={dailyAverage.carbs}
            total={dailyAverage.calories}
            caloriesPerGram={4}
            goal={goal?.carbs_goal || undefined}
            color="bg-yellow-500"
          />
          <GoalProgressBar
            label="Grasas"
            value={dailyAverage.fat}
            total={dailyAverage.calories}
            caloriesPerGram={9}
            goal={goal?.fat_goal || undefined}
            color="bg-red-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}
