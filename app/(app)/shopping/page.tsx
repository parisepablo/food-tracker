"use client";

import Link from "next/link";
import { ShoppingList } from "@/components/shopping/ShoppingList";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

export default function ShoppingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lista de compras</h1>
          <p className="text-muted-foreground">
            Gestioná tus listas de compras e items
          </p>
        </div>
        <Link href="/shopping/history">
          <Button variant="outline">
            <History className="mr-2 h-4 w-4" />
            Historial
          </Button>
        </Link>
      </div>

      <ShoppingList />
    </div>
  );
}
