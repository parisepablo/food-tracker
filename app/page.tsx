import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChefHat, Utensils, Calendar, ShoppingCart } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-subtle">
      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-3xl text-center animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <ChefHat className="h-4 w-4" />
            Planificá tus comidas
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            Food <span className="text-gradient">Tracker</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl max-w-2xl mx-auto">
            Planificá comidas, controlá la nutrición y gestioná los alimentos de tu hogar de forma inteligente y colaborativa.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base shadow-glow">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                Crear cuenta
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid max-w-5xl gap-6 sm:grid-cols-3 px-4 animate-fade-in [animation-delay:0.2s]">
          <div className="glass rounded-2xl p-6 text-left transition-all hover:border-primary/30">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">Plan semanal</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Organizá las comidas de la semana para todo el hogar con un calendario intuitivo.
            </p>
          </div>
          <div className="glass rounded-2xl p-6 text-left transition-all hover:border-primary/30">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Utensils className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">Recetas con macros</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Guardá recetas con sus ingredientes y calculá automáticamente calorías y macros.
            </p>
          </div>
          <div className="glass rounded-2xl p-6 text-left transition-all hover:border-primary/30">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">Lista de compras</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Generá la lista de compras automáticamente a partir del plan de comidas.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Food Tracker — Planificá mejor, comé mejor.
      </footer>
    </div>
  );
}
