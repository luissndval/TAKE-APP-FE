"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Settings,
  LogOut,
  Users,
  Building2,
  BarChart3,
  ChefHat,
  CreditCard,
  Palette,
  Globe,
  Truck,
  Bell,
  Clock,
  Ticket,
  KeyRound,
  Mail,
} from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";
import { isPlatformUser, hasMinRole } from "@/types/auth";

const tenantNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, minRole: null },
  { name: "Pedidos", href: "/orders", icon: ShoppingBag, minRole: null },
  { name: "Cocina", href: "/kitchen", icon: ChefHat, minRole: null },
  { name: "Menú", href: "/menu", icon: UtensilsCrossed, minRole: "manager" as const },
  { name: "Horarios", href: "/settings/schedule", icon: Clock, minRole: "manager" as const },
  { name: "Cupones", href: "/menu/coupons", icon: Ticket, minRole: "manager" as const },
  { name: "Usuarios", href: "/users", icon: Users, minRole: "owner" as const },
  { name: "Configuración", href: "/settings", icon: Settings, minRole: "manager" as const },
  { name: "Pagos", href: "/settings/payments", icon: CreditCard, minRole: "owner" as const, indent: true },
  { name: "Apariencia", href: "/settings/appearance", icon: Palette, minRole: "owner" as const, indent: true },
  { name: "Dominio", href: "/settings/domain", icon: Globe, minRole: "owner" as const, indent: true },
  { name: "Logística", href: "/settings/logistics", icon: Truck, minRole: "owner" as const, indent: true },
  { name: "Integraciones", href: "/settings/integrations", icon: KeyRound, minRole: "owner" as const, indent: true },
  { name: "Notificaciones", href: "/settings/notifications", icon: Bell, minRole: "owner" as const, indent: true },
];

const platformNavigation = [
  { name: "Tenants", href: "/admin/tenants", icon: Building2 },
  { name: "Planes", href: "/admin/plans", icon: CreditCard },
  { name: "Estadísticas", href: "/admin/stats", icon: BarChart3 },
  { name: "Email", href: "/admin/settings/email", icon: Mail },
];

const roleLabel: Record<string, string> = {
  owner: "Propietario",
  manager: "Gerente",
  cashier: "Cajero",
  kitchen: "Cocina",
  superadmin: "Superadmin",
  support: "Soporte",
  finance: "Finanzas",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "??";

  const isAdmin = isPlatformUser(user);
  const nav = isAdmin
    ? platformNavigation
    : tenantNavigation.filter((item) =>
        item.minRole === null || hasMinRole(user, item.minRole)
      );

  const currentRole =
    user?.platform_role ?? user?.tenant_role ?? null;

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-100">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: isAdmin ? "#6366f1" : "var(--backoffice-primary)" }}
        >
          <UtensilsCrossed size={16} className="text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-gray-900">TakeApp</span>
          <p className="text-xs text-gray-400 leading-none">
            {isAdmin ? "Admin" : "Backoffice"}
          </p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map((item) => {
          const isActive =
            item.href === "/settings"
              ? pathname === "/settings"
              : pathname.startsWith(item.href);
          const accentColor = isAdmin ? "#6366f1" : "var(--backoffice-primary)";
          const isIndented = "indent" in item && item.indent;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isIndented ? "ml-4 text-xs" : ""
              } ${isActive ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
              style={isActive ? { backgroundColor: accentColor } : {}}
            >
              <item.icon className={`mr-3 ${isIndented ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer con usuario */}
      <div className="border-t border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: isAdmin ? "#6366f1" : "var(--backoffice-primary)" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.full_name ?? "Usuario"}
            </p>
            <p className="text-xs text-gray-500">
              {currentRole ? roleLabel[currentRole] ?? currentRole : ""}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
