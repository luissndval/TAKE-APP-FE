import { OrderStatus } from "@/types/orders";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

export default function StatusBadge({
  status,
  size = "md",
}: {
  status: OrderStatus;
  size?: "sm" | "md" | "lg";
}) {
  return <OrderStatusBadge status={status} size={size} />;
}
