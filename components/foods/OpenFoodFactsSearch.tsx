"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

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

interface OpenFoodFactsSearchProps {
  onSelect: (product: OpenFoodFactsProduct) => void;
}

export function OpenFoodFactsSearch({ onSelect }: OpenFoodFactsSearchProps) {
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
      const data = await response.json();
      setResults(data.products || []);
      setShowDropdown(true);
    } catch (error) {
      console.error("Error searching Open Food Facts:", error);
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
    onSelect(product);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <Input
        placeholder="Buscar en Open Food Facts para pre-completar"
        value={query}
        onChange={handleInputChange}
        onFocus={() => query && setShowDropdown(true)}
        className="w-full"
      />

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
