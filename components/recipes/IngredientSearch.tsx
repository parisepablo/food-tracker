"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import type { Food } from "@/types";

interface IngredientSearchProps {
  onSelect: (food: Food) => void;
}

export function IngredientSearch({ onSelect }: IngredientSearchProps) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const searchFoods = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      return [];
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: member } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .single();

    if (!member) return [];

    const { data: foods } = await supabase
      .from("foods")
      .select("*")
      .eq("household_id", member.household_id)
      .ilike("name", `%${searchQuery}%`)
      .limit(10);

    return foods || [];
  }, []);

  // Search query
  const { data: results, isLoading } = useQuery({
    queryKey: ["ingredient-search", query],
    queryFn: () => searchFoods(query),
    enabled: query.length > 0 && showDropdown,
    staleTime: 1000 * 60, // 1 minute
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(true);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      // Trigger refetch by updating query
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handleSelect = (food: Food) => {
    onSelect(food);
    setQuery("");
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar ingrediente en tu catálogo..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setShowDropdown(true)}
          className="flex-1"
        />
        {isLoading && <Skeleton className="h-10 w-10" />}
      </div>

      {showDropdown && (results && results.length > 0 || isLoading) && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="py-1">
              {results?.map((food) => (
                <button
                  key={food.id}
                  onClick={() => handleSelect(food)}
                  className="w-full px-4 py-2 text-left hover:bg-accent"
                >
                  <div className="font-medium">{food.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {food.brand || "Sin marca"} • {Math.round(food.calories_per_100g)} kcal/100g
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showDropdown && !isLoading && (!results || results.length === 0) && query && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-4 text-center shadow-md">
          <p className="text-sm text-muted-foreground mb-3">
            No encontramos este alimento en tu catálogo.
          </p>
          <a href="/foods/new" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Agregar nuevo alimento
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
