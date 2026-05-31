"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Home } from "lucide-react";
import Link from "next/link";

export function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const token = searchParams.get("token");
  const didSubmit = useRef(false);

  const [status, setStatus] = useState<"checking" | "ready" | "loading" | "success" | "error">("checking");
  const [message, setMessage] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de invitación no proporcionado");
      return;
    }

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNeedsLogin(true);
      }
      setStatus("ready");
    };

    checkAuth();
  }, [token, supabase]);

  const handleAccept = async () => {
    if (didSubmit.current) return;
    didSubmit.current = true;
    setStatus("loading");

    try {
      const response = await fetch("/api/household/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "Te has unido al hogar correctamente");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setStatus("error");
        setMessage(data.error || "Error al aceptar la invitación");
        didSubmit.current = false; // Allow retry on error
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexión. Intenta nuevamente.");
      didSubmit.current = false;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Invitación al hogar</CardTitle>
          <CardDescription>
            {status === "ready" && !needsLogin
              ? "Te han invitado a unirte a un hogar"
              : "Acepta la invitación para unirte al hogar"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === "checking" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Verificando invitación...</p>
            </div>
          )}

          {status === "ready" && (
            <div className="flex flex-col items-center gap-4">
              <Home className="h-12 w-12 text-primary" />
              {needsLogin ? (
                <>
                  <p className="text-lg font-medium">Debes iniciar sesión para aceptar la invitación</p>
                  <div className="flex flex-col gap-2 w-full">
                    <Link href={`/register?redirect=/invite/accept?token=${token}`}>
                      <Button className="w-full">Crear cuenta</Button>
                    </Link>
                    <Link href={`/login?redirect=/invite/accept?token=${token}`}>
                      <Button variant="outline" className="w-full">Iniciar sesión</Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">¿Querés unirte a este hogar?</p>
                  <Button onClick={handleAccept} className="w-full">
                    Aceptar invitación
                  </Button>
                </>
              )}
            </div>
          )}

          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Procesando invitación...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <p className="text-lg font-medium">{message}</p>
              <p className="text-sm text-muted-foreground">
                Redirigiendo al dashboard...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg font-medium text-destructive">{message}</p>
              <Link href="/dashboard">
                <Button variant="outline">Ir al dashboard</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
