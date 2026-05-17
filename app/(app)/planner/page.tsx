"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeeklyCalendar } from "@/components/planner/WeeklyCalendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MealType } from "@/types";

export default function PlannerPage() {
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    const sunday = new Date(today.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  });

  const handlePreviousWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    setWeekStart(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    setWeekStart(newWeekStart);
  };

  const handleAddMeal = (date: Date, mealType: MealType) => {
    console.log("Add meal:", { date, mealType });
    // TODO: Implement add meal functionality
  };

  const handleGenerateWeek = async () => {
    try {
      const weekStartStr = weekStart.toISOString().split("T")[0];
      const response = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_start: weekStartStr }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to generate meal plan:", error);
        return;
      }

      const result = await response.json();
      console.log("Meal plan generated:", result);
      // TODO: Refresh meal plan data
    } catch (error) {
      console.error("Error generating meal plan:", error);
    }
  };

  const formatWeekRange = () => {
    const endOfWeek = new Date(weekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    const startStr = weekStart.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
    const endStr = endOfWeek.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
    
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planificador de comidas</h1>
          <p className="text-muted-foreground">Planifica tus comidas para la semana</p>
        </div>
        <Button onClick={handleGenerateWeek}>Generar semana</Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plan semanal</CardTitle>
              <CardDescription>{formatWeekRange()}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <WeeklyCalendar
            weekStart={weekStart}
            onAddMeal={handleAddMeal}
          />
        </CardContent>
      </Card>
    </div>
  );
}
