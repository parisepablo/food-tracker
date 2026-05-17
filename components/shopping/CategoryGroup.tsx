"use client";

import { ShoppingItem } from "./ShoppingItem";
import type { ShoppingListItem } from "@/types";

interface CategoryGroupProps {
  category: string | null;
  items: ShoppingListItem[];
  onToggle: (id: string, isChecked: boolean) => void;
  onDelete: (id: string) => void;
}

const categoryLabels: Record<string, string> = {
  red_meat: "Carnes rojas",
  chicken: "Pollo",
  fish: "Pescado",
  vegetarian: "Vegetariano",
  pasta: "Pastas",
  other: "Otros",
};

export function CategoryGroup({
  category,
  items,
  onToggle,
  onDelete,
}: CategoryGroupProps) {
  // Separate checked and unchecked items
  const uncheckedItems = items.filter((i) => !i.is_checked);
  const checkedItems = items.filter((i) => i.is_checked);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">
        {category ? categoryLabels[category] || category : "Sin categoría"}
      </h3>
      <div className="space-y-2">
        {uncheckedItems.map((item) => (
          <ShoppingItem
            key={item.id}
            item={item}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
        {checkedItems.length > 0 && (
          <>
            <div className="border-t pt-2">
              <p className="text-sm text-muted-foreground mb-2">
                Comprados ({checkedItems.length})
              </p>
              {checkedItems.map((item) => (
                <ShoppingItem
                  key={item.id}
                  item={item}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
