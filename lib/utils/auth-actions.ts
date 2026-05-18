"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const redirectTo = formData.get("redirect") as string;

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/", "layout");
  redirect(redirectTo || "/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string;

  // Sign up the user
  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo
        ? `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${redirectTo}`
        : undefined,
    },
  });

  if (authError) {
    redirect("/register?error=" + encodeURIComponent(authError.message));
  }

  // Household will be created automatically by database trigger when user confirms email
  const message = redirectTo
    ? "Revisá tu email para confirmar tu cuenta. Después de confirmar, serás redirigido para aceptar la invitación."
    : "Revisá tu email para confirmar tu cuenta";

  redirect(`/login?message=${encodeURIComponent(message)}`);
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
