"use client";

import Link from "next/link";
import { HistoryList } from "@/components/shopping/HistoryList";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ShoppingHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/shopping">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Historial de compras</h1>
          <p className="text-muted-foreground">
            Listas de compras archivadas
          </p>
        </div>
      </div>

      <HistoryList />
    </div>
  );
}
