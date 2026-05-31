"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Calendar,
  ChefHat,
  ShoppingCart,
  Settings,
  UtensilsCrossed,
} from "lucide-react";

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

function NavItem({
  href,
  icon: Icon,
  children,
  isActive,
}: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      {children}
      {isActive && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
      )}
    </Link>
  );
}

function SidebarContent() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex h-16 items-center px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <ChefHat className="h-5 w-5" />
          </div>
          <span className="text-gradient">Food Tracker</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto px-3 py-2">
        <nav className="grid gap-1">
          {navigation.map((item) => (
            <NavItem
              key={item.name}
              href={item.href}
              icon={item.icon}
              isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            >
              {item.name}
            </NavItem>
          ))}
        </nav>
      </div>
      <div className="border-t border-border/50 px-3 py-3">
        <nav className="grid gap-1">
          {settingsNavigation.map((item) => (
            <NavItem
              key={item.name}
              href={item.href}
              icon={item.icon}
              isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            >
              {item.name}
            </NavItem>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r border-border/50 bg-background/50 backdrop-blur-xl lg:flex">
      <SidebarContent />
    </aside>
  );
}
