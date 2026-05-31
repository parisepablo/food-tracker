"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { logout } from "@/lib/utils/auth-actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { Settings, LogOut, ChevronDown } from "lucide-react";

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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/60 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="hidden text-base font-semibold text-foreground lg:block">{householdName}</h2>
          <Separator orientation="vertical" className="hidden h-4 bg-border/50 lg:block" />
          <span className="text-sm text-muted-foreground">
            Food Tracker
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              className="flex items-center gap-2.5 h-10 px-2.5 rounded-xl hover:bg-accent"
              onClick={() => setOpen(!open)}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-primary/20">
                  {getInitials(displayName)}
                </div>
              )}
              <span className="hidden sm:inline-block text-sm font-medium max-w-[140px] truncate">
                {displayName}
              </span>
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
            </Button>
            {open && (
              <div className="absolute right-0 mt-2 w-60 rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-card p-1.5 z-50 animate-fade-in">
                <div className="px-3 py-2.5">
                  <p className="text-sm font-semibold">{displayName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{userEmail}</p>
                </div>
                <Separator className="bg-border/50" />
                <Link
                  href="/settings/household"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors mt-1"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Configuración del hogar
                </Link>
                <form action={logout} className="mt-0.5">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-destructive rounded-lg hover:bg-destructive/10 transition-colors text-left"
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
