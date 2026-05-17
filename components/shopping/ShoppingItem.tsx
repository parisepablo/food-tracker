"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { ShoppingListItem } from "@/types";

interface ShoppingItemProps {
  item: ShoppingListItem;
  onToggle: (id: string, isChecked: boolean) => void;
  onDelete: (id: string) => void;
}

const categoryLabels: Record<string, string> = {
  red_meat: "Carne roja",
  chicken: "Pollo",
  fish: "Pescado",
  vegetarian: "Vegetariano",
  pasta: "Pastas",
  other: "Otros",
};

export function ShoppingItem({ item, onToggle, onDelete }: ShoppingItemProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 ${
        item.is_checked ? "bg-muted/50 opacity-60" : "bg-background"
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <Checkbox
          checked={item.is_checked}
          onCheckedChange={(checked) => onToggle(item.id, checked as boolean)}
        />
        <div className="flex-1">
          <p className={`font-medium ${item.is_checked ? "line-through" : ""}`}>
            {item.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {item.quantity_grams && (
              <span className="text-sm text-muted-foreground">
                {item.quantity_grams}g
              </span>
            )}
            <Badge variant={item.is_manual ? "secondary" : "outline"} className="text-xs">
              {item.is_manual ? "Manual" : "Auto"}
            </Badge>
            {item.category && (
              <Badge variant="outline" className="text-xs">
                {categoryLabels[item.category] || item.category}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(item.id)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
