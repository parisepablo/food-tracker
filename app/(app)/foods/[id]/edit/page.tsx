"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { FoodForm } from "@/components/foods/FoodForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Food } from "@/types";

export default function EditFoodPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const foodId = params.id as string;

  // Fetch food
  const { data: food, isLoading } = useQuery({
    queryKey: ["food", foodId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: member } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .single();

      if (!member) throw new Error("No household");

      const { data: food } = await supabase
        .from("foods")
        .select("*")
        .eq("id", foodId)
        .eq("household_id", member.household_id)
        .single();

      if (!food) throw new Error("Food not found");
      return food;
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Omit<Food, "id" | "created_at" | "household_id" | "barcode">) => {
      const { error } = await supabase
        .from("foods")
        .update(data)
        .eq("id", foodId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food", foodId] });
      queryClient.invalidateQueries({ queryKey: ["household-foods"] });
      router.push("/foods");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!food) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No se encontró el alimento o no tienes permiso para editarlo.
          </AlertDescription>
        </Alert>
        <Link href="/foods">
          <Button>Volver al catálogo</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/foods">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar alimento</h1>
          <p className="text-muted-foreground">
            Modifica los datos del alimento
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Los cambios se guardarán inmediatamente.
        </AlertDescription>
      </Alert>

      <FoodForm
        initialData={food}
        onSubmit={async (data) => {
          await updateMutation.mutateAsync(data);
        }}
        isLoading={updateMutation.isPending}
        submitLabel="Guardar cambios"
        showOpenFoodFacts={false}
      />
    </div>
  );
}
