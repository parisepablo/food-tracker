"use client";

import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FoodForm } from "@/components/foods/FoodForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Food } from "@/types";

export default function NewFoodPage() {
  const router = useRouter();
  const supabase = createClient();

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Food, "id" | "created_at" | "household_id" | "barcode">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: member } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .single();

      if (!member) throw new Error("No household");

      const { error } = await supabase.from("foods").insert({
        ...data,
        household_id: member.household_id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      router.push("/foods");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/foods">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nuevo alimento</h1>
          <p className="text-muted-foreground">
            Agrega un nuevo alimento a tu catálogo
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Busca en Open Food Facts para pre-completar los datos, o ingrésalos manualmente.
          Todos los valores son editables antes de guardar.
        </AlertDescription>
      </Alert>

      <FoodForm
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data);
        }}
        isLoading={createMutation.isPending}
        submitLabel="Crear alimento"
      />
    </div>
  );
}
