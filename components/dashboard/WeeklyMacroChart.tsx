"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Macros } from "@/types";

interface DailyData {
  day: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface WeeklyMacroChartProps {
  dailyMacros: Record<string, Macros>;
}

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function WeeklyMacroChart({ dailyMacros }: WeeklyMacroChartProps) {
  // Convert to chart data
  const data: DailyData[] = Object.entries(dailyMacros).map(([date, macros]) => {
    const dateObj = new Date(date);
    const dayName = dayNames[dateObj.getDay()];
    const shortDay = dayName.slice(0, 3);

    return {
      day: shortDay,
      date,
      calories: Math.round(macros.calories),
      protein: Math.round(macros.protein * 4), // Convert to calories
      carbs: Math.round(macros.carbs * 4),
      fat: Math.round(macros.fat * 9),
    };
  });

  // Sort by date
  data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Macros semanales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis label={{ value: "Calorías", angle: -90, position: "insideLeft" }} />
              <Tooltip
                formatter={(value, name) => {
                  const labels: Record<string, string> = {
                    protein: "Proteínas",
                    carbs: "Carbohidratos",
                    fat: "Grasas",
                    calories: "Calorías",
                  };
                  return [`${value} kcal`, labels[name as string] || name];
                }}
              />
              <Legend />
              <Bar dataKey="protein" name="Proteínas" fill="#3b82f6" stackId="a" />
              <Bar dataKey="carbs" name="Carbohidratos" fill="#eab308" stackId="a" />
              <Bar dataKey="fat" name="Grasas" fill="#ef4444" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
