"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface GenerateBannerProps {
  hasConfirmedPlan: boolean;
  onGenerate: () => void;
  isGenerating?: boolean;
}

export function GenerateBanner({
  hasConfirmedPlan,
  onGenerate,
  isGenerating = false,
}: GenerateBannerProps) {
  if (!hasConfirmedPlan) return null;

  return (
    <Alert className="bg-primary/10 border-primary/50">
      <Sparkles className="h-5 w-5 text-primary" />
      <AlertTitle className="text-primary">Tenés un plan semanal confirmado</AlertTitle>
      <AlertDescription className="flex items-center gap-2 mt-2">
        <span>¿Querés generar la lista de compras automáticamente?</span>
        <Button
          size="sm"
          onClick={onGenerate}
          disabled={isGenerating}
          className="shrink-0"
        >
          {isGenerating ? "Generando..." : "Generar lista"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
