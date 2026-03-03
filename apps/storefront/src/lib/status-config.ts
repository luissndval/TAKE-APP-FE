import {
  Banknote,
  ChefHat,
  CheckCircle,
  CircleCheck,
  Clock,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import type { ElementType } from "react";

export type StatusConfig = {
  label: string;
  badge: string;
  bg: string;
  textColor: string;
  border: string;
  Icon: ElementType;
};

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    label: "Procesando tu pago...",
    badge: "Procesando",
    bg: "bg-yellow-50",
    textColor: "text-yellow-800",
    border: "border-yellow-200",
    Icon: Clock,
  },
  awaiting_transfer: {
    label: "Esperando confirmación de transferencia",
    badge: "Esperando transferencia",
    bg: "bg-orange-50",
    textColor: "text-orange-800",
    border: "border-orange-200",
    Icon: Banknote,
  },
  confirmed: {
    label: "¡Pedido confirmado! Estamos preparándolo",
    badge: "Confirmado",
    bg: "bg-blue-50",
    textColor: "text-blue-800",
    border: "border-blue-200",
    Icon: CheckCircle,
  },
  preparing: {
    label: "Tu pedido está en preparación",
    badge: "En preparación",
    bg: "bg-purple-50",
    textColor: "text-purple-800",
    border: "border-purple-200",
    Icon: ChefHat,
  },
  ready: {
    label: "¡Tu pedido está listo para retirar!",
    badge: "Listo",
    bg: "bg-green-50",
    textColor: "text-green-800",
    border: "border-green-200",
    Icon: Package,
  },
  dispatched: {
    label: "Tu pedido está en camino",
    badge: "En camino",
    bg: "bg-green-50",
    textColor: "text-green-800",
    border: "border-green-200",
    Icon: Truck,
  },
  delivered: {
    label: "¡Pedido entregado! Gracias por tu compra",
    badge: "Entregado",
    bg: "bg-green-50",
    textColor: "text-green-800",
    border: "border-green-200",
    Icon: CircleCheck,
  },
  failed: {
    label: "Hubo un problema con tu pedido",
    badge: "Falló",
    bg: "bg-red-50",
    textColor: "text-red-800",
    border: "border-red-200",
    Icon: XCircle,
  },
};
