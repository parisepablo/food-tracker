"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Food, IngredientCategoryType } from "@/types";

interface IngredientRowProps {
  food: Food;
  quantity: number;
  category: IngredientCategoryType | null;
  onQuantityChange: (quantity: number) => void;
  onCategoryChange: (category: IngredientCategoryType | null) => void;
  onRemove: () => void;
}

const categoryLabels: Record<IngredientCategoryType, string> = {
  red_meat: "Carne roja",
  chicken: "Pollo",
  fish: "Pescado",
  vegetarian: "Vegetariano",
  pasta: "Pasta",
  other: "Otro",
};

const categoryOptions: IngredientCategoryType[] = [
  "red_meat",
  "chicken",
  "fish",
  "vegetarian",
  "pasta",
  "other",
];

export function IngredientRow({
  food,
  quantity,
  category,
  onQuantityChange,
  onCategoryChange,
  onRemove,
}: IngredientRowProps) {
  // Calculate macros based on quantity
  const ratio = quantity / 100;
  const calories = Math.round((food.calories_per_100g || 0) * ratio);
  const protein = Math.round((food.protein_per_100g || 0) * ratio * 10) / 10;
  const carbs = Math.round((food.carbs_per_100g || 0) * ratio * 10) / 10;
  const fat = Math.round((food.fat_per_100g || 0) * ratio * 10) / 10;

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h4 className="font-medium">{food.name}</h4>
          {food.brand && (
            <p className="text-sm text-muted-foreground">{food.brand}</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
        >
          Eliminar
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`quantity-${food.id}`}>Cantidad (gramos)</Label>
          <Input
            id={`quantity-${food.id}`}
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
            className="mt-1"
          />
        </div>

        <div>
          <Label>Categoría</Label>
          <select
            value={category || ""}
            onChange={(e) =>
              onCategoryChange((e.target.value as IngredientCategoryType) || null)
            }
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Sin categoría</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {categoryLabels[cat]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
        <span>{calories} kcal</span>
        <span>P: {protein}g</span>
        <span>C: {carbs}g</span>
        <span>G: {fat}g</span>
      </div>
    </div>
  );
}
