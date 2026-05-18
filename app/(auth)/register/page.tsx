import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { signup } from "@/lib/utils/auth-actions";

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string; redirect?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
          <CardDescription>
            Ingresa tus datos para crear tu cuenta
          </CardDescription>
        </CardHeader>
        <form action={signup}>
          <CardContent className="space-y-4">
            {searchParams.error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {searchParams.error}
              </div>
            )}
            {searchParams.message && (
              <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600">
                {searchParams.message}
              </div>
            )}
            <input type="hidden" name="redirect" value={searchParams.redirect || ""} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full">
              Crear cuenta
            </Button>
            <p className="text-sm text-muted-foreground">
              ¿Ya tenés una cuenta?{" "}
              <Link
                href={`/login${searchParams.redirect ? `?redirect=${encodeURIComponent(searchParams.redirect)}` : ""}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                Iniciar sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
