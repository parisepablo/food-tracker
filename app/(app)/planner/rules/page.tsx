"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";
import type { RuleType } from "@/types";

const categoryLabels: Record<string, string> = {
  red_meat: "Carne roja",
  chicken: "Pollo",
  fish: "Pescado",
  vegetarian: "Vegetariano",
  pasta: "Pasta",
  other: "Otro",
};

const dayLabels: Record<string, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

const allDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const allCategories = ["red_meat", "chicken", "fish", "vegetarian", "pasta", "other"];

interface Rule {
  id: string;
  household_id: string;
  rule_type: RuleType;
  rule_config: Record<string, unknown>;
  created_at: string;
}

export default function RulesPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [newRuleType, setNewRuleType] = useState<RuleType | "">("");

  // Form states
  const [proteinCategory, setProteinCategory] = useState("red_meat");
  const [proteinMax, setProteinMax] = useState(1);
  const [varietyDays, setVarietyDays] = useState(4);
  const [distCategory, setDistCategory] = useState("chicken");
  const [distDays, setDistDays] = useState<string[]>(["wednesday", "friday"]);

  const { data: rules, isLoading } = useQuery({
    queryKey: ["meal-plan-rules"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: memberData } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .single();

      if (!memberData) throw new Error("No household");

      const { data, error } = await supabase
        .from("meal_plan_rules")
        .select("*")
        .eq("household_id", memberData.household_id);

      if (error) throw error;
      return data as Rule[];
    },
  });

  const addRuleMutation = useMutation({
    mutationFn: async (rule: { rule_type: RuleType; rule_config: Record<string, unknown> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: memberData } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .single();

      if (!memberData) throw new Error("No household");

      const { error } = await supabase
        .from("meal_plan_rules")
        .insert({
          household_id: memberData.household_id,
          rule_type: rule.rule_type,
          rule_config: rule.rule_config as import("@/types/supabase").Json,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-plan-rules"] });
      setNewRuleType("");
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase
        .from("meal_plan_rules")
        .delete()
        .eq("id", ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-plan-rules"] });
    },
  });

  const handleAddRule = () => {
    if (!newRuleType) return;

    let ruleConfig: Record<string, unknown> = {};

    switch (newRuleType) {
      case "protein_frequency":
        ruleConfig = { category: proteinCategory, max_per_week: proteinMax };
        break;
      case "variety":
        ruleConfig = { min_days_between: varietyDays };
        break;
      case "distribution":
        ruleConfig = { category: distCategory, allowed_days: distDays };
        break;
    }

    addRuleMutation.mutate({ rule_type: newRuleType, rule_config: ruleConfig });
  };

  const handleDayToggle = (day: string) => {
    setDistDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const getRuleDescription = (rule: Rule) => {
    switch (rule.rule_type) {
      case "protein_frequency": {
        const config = rule.rule_config as { category: string; max_per_week: number };
        return `${categoryLabels[config.category] || config.category} → máximo ${config.max_per_week} vez${config.max_per_week > 1 ? "es" : ""} por semana`;
      }
      case "variety": {
        const config = rule.rule_config as { min_days_between: number };
        return `No repetir la misma receta en ${config.min_days_between} días`;
      }
      case "distribution": {
        const config = rule.rule_config as { category: string; allowed_days: string[] };
        const days = config.allowed_days.map((d) => dayLabels[d] || d).join(", ");
        return `${categoryLabels[config.category] || config.category} → solo los ${days}`;
      }
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reglas del planificador</h1>
        <p className="text-muted-foreground">
          Configura las reglas para la generación inteligente de planes
        </p>
      </div>

      {/* Existing rules */}
      <Card>
        <CardHeader>
          <CardTitle>Reglas activas</CardTitle>
          <CardDescription>
            {rules?.length || 0} regla{rules?.length !== 1 ? "s" : ""} configurada{rules?.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules?.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No hay reglas configuradas. Agrega una nueva regla abajo.
            </p>
          ) : (
            <div className="space-y-3">
              {rules?.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <Badge variant="secondary" className="mb-1">
                      {rule.rule_type === "protein_frequency"
                        ? "Frecuencia de proteínas"
                        : rule.rule_type === "variety"
                        ? "Variedad"
                        : "Distribución"}
                    </Badge>
                    <p className="text-sm">{getRuleDescription(rule)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRuleMutation.mutate(rule.id)}
                    disabled={deleteRuleMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add new rule */}
      <Card>
        <CardHeader>
          <CardTitle>Agregar nueva regla</CardTitle>
          <CardDescription>
            Selecciona el tipo de regla y configura los parámetros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tipo de regla</Label>
            <Select
              value={newRuleType}
              onValueChange={(value) => setNewRuleType(value as RuleType)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="protein_frequency">Frecuencia de proteínas</SelectItem>
                <SelectItem value="variety">Variedad</SelectItem>
                <SelectItem value="distribution">Distribución</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newRuleType === "protein_frequency" && (
            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <Label>Categoría de ingrediente</Label>
                <Select value={proteinCategory} onValueChange={setProteinCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Máximo por semana</Label>
                <Input
                  type="number"
                  min="1"
                  value={proteinMax}
                  onChange={(e) => setProteinMax(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {newRuleType === "variety" && (
            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <Label>Días mínimos entre repeticiones</Label>
                <Input
                  type="number"
                  min="1"
                  value={varietyDays}
                  onChange={(e) => setVarietyDays(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {newRuleType === "distribution" && (
            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <Label>Categoría de ingrediente</Label>
                <Select value={distCategory} onValueChange={setDistCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Días permitidos</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {allDays.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day}`}
                        checked={distDays.includes(day)}
                        onCheckedChange={() => handleDayToggle(day)}
                      />
                      <Label htmlFor={`day-${day}`} className="text-sm">
                        {dayLabels[day]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {newRuleType && (
            <Button
              onClick={handleAddRule}
              disabled={addRuleMutation.isPending || distDays.length === 0}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar regla
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
