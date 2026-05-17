import Link from "next/link";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NewRecipePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nueva receta</h1>
          <p className="text-muted-foreground">Crea una nueva receta para tu hogar</p>
        </div>
        <Link href="/recipes">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <RecipeForm />
        </CardContent>
      </Card>
    </div>
  );
}
