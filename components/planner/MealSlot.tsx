"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import type { MealType } from "@/types";

interface MealSlotProps {
  date: string;
  mealType: MealType;
  recipeName?: string;
  caloriesPerServing?: number;
  imageUrl?: string | null;
  onAssign: () => void;
  onRemove: () => void;
  compact?: boolean;
}

const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Merienda",
};

export function MealSlot({
  mealType,
  recipeName,
  caloriesPerServing,
  imageUrl,
  onAssign,
  onRemove,
  compact = false,
}: MealSlotProps) {
  if (compact) {
    return recipeName ? (
      <div className="group relative rounded-md bg-primary/5 p-2">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
        <div className="text-xs font-medium line-clamp-2">{recipeName}</div>
        {caloriesPerServing && (
          <div className="mt-1 text-[10px] text-muted-foreground">
            {caloriesPerServing} kcal
          </div>
        )}
      </div>
    ) : (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto w-full justify-start py-2 text-xs text-muted-foreground"
        onClick={onAssign}
      >
        <Plus className="mr-1 h-3 w-3" />
        {mealTypeLabels[mealType]}
      </Button>
    );
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-medium">{mealTypeLabels[mealType]}</h4>
        {recipeName && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {recipeName ? (
        <div className="space-y-2">
          {imageUrl && (
            <div className="relative h-24 w-full overflow-hidden rounded-md">
              <Image
                src={imageUrl}
                alt={recipeName}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <p className="font-medium">{recipeName}</p>
            {caloriesPerServing && (
              <Badge variant="secondary" className="mt-1">
                {caloriesPerServing} kcal/porción
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onAssign}
          >
            Cambiar receta
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onAssign}
        >
          <Plus className="mr-1 h-4 w-4" />
          Asignar receta
        </Button>
      )}
    </div>
  );
}
