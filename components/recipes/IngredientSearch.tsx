"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";

import { Skeleton } from "@/components/ui/skeleton";
import type { Food } from "@/types";

interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
}

interface OpenFoodFactsResponse {
  products?: OpenFoodFactsProduct[];
}

interface IngredientSearchProps {
  onSelect: (food: Partial<Food>) => void;
}

export function IngredientSearch({ onSelect }: IngredientSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OpenFoodFactsProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const searchFoods = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
          searchQuery
        )}&json=1&page_size=10`
      );
      const data: OpenFoodFactsResponse = await response.json();
      setResults(data.products || []);
      setShowDropdown(true);
    } catch (error) {
      console.error("Error searching foods:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchFoods(value);
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handleSelect = (product: OpenFoodFactsProduct) => {
    const food: Partial<Food> = {
      barcode: product.code || null,
      name: product.product_name || "Sin nombre",
      brand: product.brands || null,
      calories_per_100g: product.nutriments?.["energy-kcal_100g"] || 0,
      protein_per_100g: product.nutriments?.proteins_100g || 0,
      carbs_per_100g: product.nutriments?.carbohydrates_100g || 0,
      fat_per_100g: product.nutriments?.fat_100g || 0,
      image_url: product.image_url || null,
    };

    onSelect(food);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar ingrediente..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setShowDropdown(true)}
          className="flex-1"
        />
        {isLoading && <Skeleton className="h-10 w-10" />}
      </div>

      {showDropdown && (results.length > 0 || isLoading) && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="py-1">
              {results.map((product) => (
                <button
                  key={product.code}
                  onClick={() => handleSelect(product)}
                  className="w-full px-4 py-2 text-left hover:bg-accent"
                >
                  <div className="font-medium">
                    {product.product_name || "Sin nombre"}
                  </div>
                  {product.brands && (
                    <div className="text-sm text-muted-foreground">
                      {product.brands}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showDropdown && !isLoading && results.length === 0 && query && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-4 text-center shadow-md">
          No se encontraron resultados
        </div>
      )}
    </div>
  );
}
