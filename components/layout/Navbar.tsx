"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { logout } from "@/lib/utils/auth-actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Calendar,
  ChefHat,
  ShoppingCart,
  Settings,
  Menu,
  UtensilsCrossed,
  LogOut,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Planner", href: "/planner", icon: Calendar },
  { name: "Recetas", href: "/recipes", icon: ChefHat },
  { name: "Alimentos", href: "/foods", icon: UtensilsCrossed },
  { name: "Compras", href: "/shopping", icon: ShoppingCart },
];

const settingsNavigation = [
  { name: "Configuración", href: "/settings/household", icon: Settings },
];

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/60 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-1 items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-3">
          <h2 className="hidden text-base font-semibold text-foreground lg:block">{householdName}</h2>
          <Separator orientation="vertical" className="hidden h-4 bg-border/50 lg:block" />
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Food Tracker</Link>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Desktop profile dropdown */}
          <div className="relative hidden lg:block" ref={profileRef}>
            <Button
              variant="ghost"
              className="flex items-center gap-2.5 h-10 px-2.5 rounded-xl hover:bg-accent"
              onClick={() => setProfileOpen(!profileOpen)}
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
              <span className="text-sm font-medium max-w-[140px] truncate">
                {displayName}
              </span>
            </Button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-card p-1.5 z-50 animate-fade-in">
                <div className="px-3 py-2.5">
                  <p className="text-sm font-semibold">{displayName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{userEmail}</p>
                </div>
                <Separator className="bg-border/50" />
                <Link
                  href="/settings/household"
                  onClick={() => setProfileOpen(false)}
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

          {/* Mobile hamburger button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>

          {/* Mobile drawer rendered via portal so it escapes the sticky header stacking context */}
          {mobileOpen && typeof window !== "undefined" && createPortal(
            <div className="fixed inset-0 z-[100] flex lg:hidden">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/80 transition-opacity"
                onClick={() => setMobileOpen(false)}
              />
              {/* Panel */}
              <div className="relative ml-auto flex h-full w-[280px] max-w-[85vw] flex-col bg-[#0f1525] shadow-2xl">
                {/* Close button */}
                <button
                  onClick={() => setMobileOpen(false)}
                  className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Cerrar</span>
                </button>

                {/* Profile header */}
                <div className="border-b border-white/10 p-5 pt-12">
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-[#f5b041]/30"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-[#f5b041]/15 flex items-center justify-center text-sm font-bold text-[#f5b041] ring-2 ring-[#f5b041]/30">
                        {getInitials(displayName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{displayName}</p>
                      <p className="text-xs text-white/50 truncate">{userEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto p-3">
                  <nav className="grid gap-1">
                    {navigation.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                            active
                              ? "bg-[#f5b041]/10 text-[#f5b041]"
                              : "text-white/60 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-4 w-4",
                              active ? "text-[#f5b041]" : "text-white/50 group-hover:text-white"
                            )}
                          />
                          {item.name}
                          {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#f5b041]" />}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Bottom section */}
                <div className="border-t border-white/10 p-3">
                  <nav className="grid gap-1">
                    {settingsNavigation.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                            active
                              ? "bg-[#f5b041]/10 text-[#f5b041]"
                              : "text-white/60 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-4 w-4",
                              active ? "text-[#f5b041]" : "text-white/50 group-hover:text-white"
                            )}
                          />
                          {item.name}
                          {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#f5b041]" />}
                        </Link>
                      );
                    })}
                  </nav>
                  <form action={logout} className="mt-2">
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 rounded-xl hover:bg-red-500/10 transition-colors text-left font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
    </header>
  );
}
