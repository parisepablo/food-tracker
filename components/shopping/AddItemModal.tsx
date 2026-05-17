"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { IngredientCategoryType } from "@/types";

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shoppingListId: string;
  onItemAdded: () => void;
}

interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
}

interface OpenFoodFactsResponse {
  products?: OpenFoodFactsProduct[];
}

const categoryOptions: { value: IngredientCategoryType; label: string }[] = [
  { value: "red_meat", label: "Carnes rojas" },
  { value: "chicken", label: "Pollo" },
  { value: "fish", label: "Pescado" },
  { value: "vegetarian", label: "Vegetariano" },
  { value: "pasta", label: "Pastas" },
  { value: "other", label: "Otros" },
];

export function AddItemModal({
  open,
  onOpenChange,
  shoppingListId,
  onItemAdded,
}: AddItemModalProps) {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OpenFoodFactsProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OpenFoodFactsProduct | null>(null);
  const [customName, setCustomName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState<IngredientCategoryType>("other");
  const [isAdding, setIsAdding] = useState(false);

  const searchFoods = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
          query
        )}&json=1&page_size=5`
      );
      const data: OpenFoodFactsResponse = await response.json();
      setSearchResults(data.products || []);
    } catch (error) {
      console.error("Error searching foods:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedProduct(null);
    setCustomName(value);

    // Debounce search
    setTimeout(() => {
      searchFoods(value);
    }, 300);
  };

  const handleSelectProduct = (product: OpenFoodFactsProduct) => {
    setSelectedProduct(product);
    setCustomName(product.product_name || "");
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleAddItem = async () => {
    const name = selectedProduct?.product_name || customName;
    if (!name.trim()) return;

    setIsAdding(true);

    try {
      // If selected from Open Food Facts, check if food exists
      let foodId: string | null = null;

      if (selectedProduct?.code) {
        const { data: existingFood } = await supabase
          .from("foods")
          .select("id")
          .eq("barcode", selectedProduct.code)
          .single();

        foodId = existingFood?.id || null;
      }

      // Insert shopping list item
      const { error } = await supabase.from("shopping_list_items").insert({
        shopping_list_id: shoppingListId,
        food_id: foodId,
        name: name,
        quantity_grams: quantity ? Number(quantity) : null,
        category: category,
        is_checked: false,
        is_manual: true,
      });

      if (error) throw error;

      onItemAdded();
      handleClose();
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedProduct(null);
    setCustomName("");
    setQuantity("");
    setCategory("other");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar item manual</DialogTitle>
          <DialogDescription>
            Busca un producto o ingresá un nombre manualmente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Buscar producto (Open Food Facts)</Label>
            <Input
              placeholder="Ej: leche, arroz, pollo..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="mt-1"
            />
          </div>

          {isSearching && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-auto rounded-md border">
              {searchResults.map((product) => (
                <button
                  key={product.code}
                  onClick={() => handleSelectProduct(product)}
                  className={`w-full p-3 text-left hover:bg-accent ${
                    selectedProduct?.code === product.code ? "bg-accent" : ""
                  }`}
                >
                  <div className="font-medium">{product.product_name || "Sin nombre"}</div>
                  {product.brands && (
                    <div className="text-sm text-muted-foreground">{product.brands}</div>
                  )}
                </button>
              ))}
            </div>
          )}

          <div>
            <Label>Nombre del item</Label>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="O ingresá un nombre manualmente"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="quantity">Cantidad (gramos, opcional)</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Categoría</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IngredientCategoryType)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isAdding}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddItem}
            disabled={isAdding || !customName.trim()}
          >
            {isAdding ? "Agregando..." : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
