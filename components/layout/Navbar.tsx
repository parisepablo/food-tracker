"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { logout } from "@/lib/utils/auth-actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { Settings, LogOut } from "lucide-react";

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface NavbarProps {
  userEmail: string;
  householdName: string;
}

export function Navbar({ userEmail, householdName }: NavbarProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["navbar-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
  });

  const displayName = profile?.display_name || userEmail;
  const avatarUrl = profile?.avatar_url;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6 lg:px-8">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{householdName}</h2>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground hidden sm:inline-block">
            Food Tracker
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2"
              onClick={() => setOpen(!open)}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  {getInitials(displayName)}
                </div>
              )}
              <span className="hidden sm:inline-block text-sm font-medium max-w-[140px] truncate">
                {displayName}
              </span>
            </Button>
            {open && (
              <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover shadow-lg p-1 z-50">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
                <Separator />
                <Link
                  href="/settings/household"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Configuración del hogar
                </Link>
                <Separator />
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive rounded-sm hover:bg-destructive/10 transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
