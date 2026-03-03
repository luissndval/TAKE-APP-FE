"use client";

import { useAuthStore } from "@/hooks/useAuth";
import StoreStatusToggle from "./StoreStatusToggle";

export default function Header() {
  const user = useAuthStore((state) => state.user);

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "OP";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-8">
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-semibold text-gray-800">Panel de Control</h1>
        {!user?.platform_role && <StoreStatusToggle />}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
          <p className="text-xs text-gray-500">
            {user?.platform_role ? "Administrador" : "Operador"}
          </p>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-bold"
          style={{ backgroundColor: "var(--backoffice-primary)" }}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
