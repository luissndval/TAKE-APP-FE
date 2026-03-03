import React from "react";
import {
  Clock,
  CheckCircle,
  ChefHat,
  Package,
  Truck,
  CircleCheck,
  XCircle,
  Banknote,
} from "lucide-react";

export type OrderStatus =
  | "pending"
  | "awaiting_transfer"
  | "confirmed"
  | "preparing"
  | "ready"
  | "dispatched"
  | "delivered"
  | "failed";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  }
> = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    color: "#9ca3af",
    bgColor: "#f3f4f6",
  },
  awaiting_transfer: {
    label: "Esp. Transferencia",
    icon: Banknote,
    color: "#d97706",
    bgColor: "#fef3c7",
  },
  confirmed: {
    label: "Confirmado",
    icon: CheckCircle,
    color: "#3b82f6",
    bgColor: "#dbeafe",
  },
  preparing: {
    label: "En Preparación",
    icon: ChefHat,
    color: "#f59e0b",
    bgColor: "#fef3c7",
  },
  ready: {
    label: "Listo",
    icon: Package,
    color: "#10b981",
    bgColor: "#d1fae5",
  },
  dispatched: {
    label: "Despachado",
    icon: Truck,
    color: "#059669",
    bgColor: "#a7f3d0",
  },
  delivered: {
    label: "Entregado",
    icon: CircleCheck,
    color: "#22c55e",
    bgColor: "#bbf7d0",
  },
  failed: {
    label: "Cancelado",
    icon: XCircle,
    color: "#ef4444",
    bgColor: "#fee2e2",
  },
};

export function OrderStatusBadge({
  status,
  showIcon = true,
  size = "md",
}: OrderStatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
      }}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      <span>{config.label}</span>
    </span>
  );
}
