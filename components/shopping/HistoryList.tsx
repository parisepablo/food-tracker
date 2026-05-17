"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ShoppingListItem } from "@/types";

const categoryLabels: Record<string, string> = {
  red_meat: "Carne roja",
  chicken: "Pollo",
  fish: "Pescado",
  vegetarian: "Vegetariano",
  pasta: "Pastas",
  other: "Otros",
};

export function HistoryList() {
  const supabase = createClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: ["shopping-history"],
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
        .from("shopping_lists")
        .select(`
          *,
          items:shopping_list_items(*)
        `)
        .eq("household_id", memberData.household_id)
        .eq("is_archived", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No hay listas archivadas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((list) => {
        const totalItems = list.items?.length || 0;
        const checkedItems = list.items?.filter((i: ShoppingListItem) => i.is_checked).length || 0;
        const isExpanded = expandedId === list.id;

        return (
          <Card key={list.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{list.name}</CardTitle>
                  <CardDescription>
                    {new Date(list.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{checkedItems} / {totalItems} items</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedId(isExpanded ? null : list.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {isExpanded && list.items && list.items.length > 0 && (
              <CardContent>
                <div className="space-y-3">
                  {(list.items as ShoppingListItem[]).map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded ${
                        item.is_checked ? "bg-muted/50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-4 w-4 rounded border ${
                            item.is_checked
                              ? "bg-primary border-primary"
                              : "border-input"
                          }`}
                        />
                        <span className={item.is_checked ? "line-through text-muted-foreground" : ""}>
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.quantity_grams && (
                          <span className="text-sm text-muted-foreground">
                            {item.quantity_grams}g
                          </span>
                        )}
                        {item.category && (
                          <span className="text-xs text-muted-foreground">
                            {categoryLabels[item.category] || item.category}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
