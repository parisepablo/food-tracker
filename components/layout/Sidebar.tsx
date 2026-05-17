"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Calendar,
  ChefHat,
  ShoppingCart,
  Settings,
  Menu,
  UtensilsCrossed,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Planner", href: "/planner", icon: Calendar },
  { name: "Recetas", href: "/recipes", icon: ChefHat },
  { name: "Alimentos", href: "/foods", icon: UtensilsCrossed },
  { name: "Lista de compras", href: "/shopping", icon: ShoppingCart },
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
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
        isActive
          ? "bg-muted text-primary"
          : "text-muted-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

function SidebarContent() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <ChefHat className="h-6 w-6" />
          <span>Food Tracker</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
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
      <div className="border-t py-4">
        <nav className="grid gap-1 px-2">
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
    <>
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed left-4 top-4 z-40 lg:hidden"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-background lg:block">
        <SidebarContent />
      </aside>
    </>
  );
}
