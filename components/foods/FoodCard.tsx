"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Package, Check, X } from "lucide-react";
import type { Food } from "@/types";

interface FoodCardProps {
  food: Food;
  stockGrams: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateStock: (foodId: string, quantityGrams: number) => void;
  isUsedInRecipes?: boolean;
  isUpdatingStock?: boolean;
}

export function FoodCard({
  food,
  stockGrams,
  onEdit,
  onDelete,
  onUpdateStock,
  isUsedInRecipes = false,
  isUpdatingStock = false,
}: FoodCardProps) {
  const [isEditingStock, setIsEditingStock] = useState(false);
  const [stockValue, setStockValue] = useState(stockGrams.toString());

  const handleSaveStock = () => {
    const value = Number(stockValue);
    if (!isNaN(value) && value >= 0) {
      onUpdateStock(food.id, value);
      setIsEditingStock(false);
    }
  };

  const handleCancelStock = () => {
    setStockValue(stockGrams.toString());
    setIsEditingStock(false);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {food.image_url && (
            <img
              src={food.image_url}
              alt={food.name}
              className="h-16 w-16 rounded-md object-cover"
            />
          )}
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold">{food.name}</h3>
            {food.brand && (
              <p className="text-sm text-muted-foreground">{food.brand}</p>
            )}
            <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
              <div>
                <span className="text-muted-foreground">Calorías</span>
                <p className="font-medium">{Math.round(food.calories_per_100g)} kcal</p>
              </div>
              <div>
                <span className="text-muted-foreground">Proteínas</span>
                <p className="font-medium">{Math.round(food.protein_per_100g)}g</p>
              </div>
              <div>
                <span className="text-muted-foreground">Carbs</span>
                <p className="font-medium">{Math.round(food.carbs_per_100g)}g</p>
              </div>
              <div>
                <span className="text-muted-foreground">Grasas</span>
                <p className="font-medium">{Math.round(food.fat_per_100g)}g</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Package className="h-3 w-3 text-muted-foreground" />
              {isEditingStock ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    value={stockValue}
                    onChange={(e) => setStockValue(e.target.value)}
                    className="h-7 w-20 text-xs"
                    autoFocus
                  />
                  <span className="text-xs text-muted-foreground">g</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleSaveStock}
                    disabled={isUpdatingStock}
                  >
                    <Check className="h-3 w-3 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleCancelStock}
                    disabled={isUpdatingStock}
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    Stock: {Math.round(stockGrams)}g
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsEditingStock(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-muted/50 p-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(food.id)}
        >
          <Pencil className="mr-1 h-3 w-3" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(food.id)}
          disabled={isUsedInRecipes}
          className={isUsedInRecipes ? "text-muted-foreground" : "text-destructive"}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          {isUsedInRecipes ? "En uso" : "Eliminar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
