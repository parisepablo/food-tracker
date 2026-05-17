"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OpenFoodFactsSearch } from "@/components/foods/OpenFoodFactsSearch";
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

interface FoodFormValues {
  name: string;
  brand: string;
  calories_per_100g: string;
  protein_per_100g: string;
  carbs_per_100g: string;
  fat_per_100g: string;
  image_url: string;
}

interface FoodFormProps {
  initialData?: Partial<Food>;
  onSubmit: (data: Omit<Food, "id" | "created_at" | "household_id">) => Promise<void>;
  isLoading?: boolean;
  showOpenFoodFacts?: boolean;
  submitLabel?: string;
}

export function FoodForm({
  initialData,
  onSubmit,
  isLoading = false,
  showOpenFoodFacts = true,
  submitLabel = "Guardar",
}: FoodFormProps) {
  const [values, setValues] = useState<FoodFormValues>({
    name: initialData?.name || "",
    brand: initialData?.brand || "",
    calories_per_100g: initialData?.calories_per_100g?.toString() || "",
    protein_per_100g: initialData?.protein_per_100g?.toString() || "",
    carbs_per_100g: initialData?.carbs_per_100g?.toString() || "",
    fat_per_100g: initialData?.fat_per_100g?.toString() || "",
    image_url: initialData?.image_url || "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FoodFormValues, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FoodFormValues, string>> = {};

    if (!values.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!values.calories_per_100g) {
      newErrors.calories_per_100g = "Las calorías son requeridas";
    } else if (isNaN(Number(values.calories_per_100g)) || Number(values.calories_per_100g) < 0) {
      newErrors.calories_per_100g = "Valor inválido";
    }

    if (!values.protein_per_100g) {
      newErrors.protein_per_100g = "Las proteínas son requeridas";
    } else if (isNaN(Number(values.protein_per_100g)) || Number(values.protein_per_100g) < 0) {
      newErrors.protein_per_100g = "Valor inválido";
    }

    if (!values.carbs_per_100g) {
      newErrors.carbs_per_100g = "Los carbohidratos son requeridos";
    } else if (isNaN(Number(values.carbs_per_100g)) || Number(values.carbs_per_100g) < 0) {
      newErrors.carbs_per_100g = "Valor inválido";
    }

    if (!values.fat_per_100g) {
      newErrors.fat_per_100g = "Las grasas son requeridas";
    } else if (isNaN(Number(values.fat_per_100g)) || Number(values.fat_per_100g) < 0) {
      newErrors.fat_per_100g = "Valor inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    await onSubmit({
      name: values.name.trim(),
      brand: values.brand.trim() || null,
      calories_per_100g: Number(values.calories_per_100g),
      protein_per_100g: Number(values.protein_per_100g),
      carbs_per_100g: Number(values.carbs_per_100g),
      fat_per_100g: Number(values.fat_per_100g),
      image_url: values.image_url.trim() || null,
    });
  };

  const handleOpenFoodFactsSelect = (product: OpenFoodFactsProduct) => {
    setValues({
      name: product.product_name || "",
      brand: product.brands || "",
      calories_per_100g: product.nutriments?.["energy-kcal_100g"]?.toString() || "",
      protein_per_100g: product.nutriments?.proteins_100g?.toString() || "",
      carbs_per_100g: product.nutriments?.carbohydrates_100g?.toString() || "",
      fat_per_100g: product.nutriments?.fat_100g?.toString() || "",
      image_url: product.image_url || "",
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información del alimento</CardTitle>
          <CardDescription>
            Ingresa los datos nutricionales por cada 100g del alimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showOpenFoodFacts && (
            <div className="space-y-2">
              <Label>Buscar en Open Food Facts (opcional)</Label>
              <OpenFoodFactsSearch onSelect={handleOpenFoodFactsSelect} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              placeholder="Ej: Arroz blanco"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Marca</Label>
            <Input
              id="brand"
              value={values.brand}
              onChange={(e) => setValues({ ...values, brand: e.target.value })}
              placeholder="Ej: Hacendado"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="calories">Calorías por 100g (kcal) *</Label>
              <Input
                id="calories"
                type="number"
                step="0.1"
                min="0"
                value={values.calories_per_100g}
                onChange={(e) => setValues({ ...values, calories_per_100g: e.target.value })}
                placeholder="0"
              />
              {errors.calories_per_100g && (
                <p className="text-sm text-destructive">{errors.calories_per_100g}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="protein">Proteínas por 100g (g) *</Label>
              <Input
                id="protein"
                type="number"
                step="0.1"
                min="0"
                value={values.protein_per_100g}
                onChange={(e) => setValues({ ...values, protein_per_100g: e.target.value })}
                placeholder="0"
              />
              {errors.protein_per_100g && (
                <p className="text-sm text-destructive">{errors.protein_per_100g}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="carbs">Carbohidratos por 100g (g) *</Label>
              <Input
                id="carbs"
                type="number"
                step="0.1"
                min="0"
                value={values.carbs_per_100g}
                onChange={(e) => setValues({ ...values, carbs_per_100g: e.target.value })}
                placeholder="0"
              />
              {errors.carbs_per_100g && (
                <p className="text-sm text-destructive">{errors.carbs_per_100g}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fat">Grasas por 100g (g) *</Label>
              <Input
                id="fat"
                type="number"
                step="0.1"
                min="0"
                value={values.fat_per_100g}
                onChange={(e) => setValues({ ...values, fat_per_100g: e.target.value })}
                placeholder="0"
              />
              {errors.fat_per_100g && (
                <p className="text-sm text-destructive">{errors.fat_per_100g}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">URL de la imagen</Label>
            <Input
              id="image_url"
              value={values.image_url}
              onChange={(e) => setValues({ ...values, image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Guardando..." : submitLabel}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
