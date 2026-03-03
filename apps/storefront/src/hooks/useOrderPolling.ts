"use client";

import { useState, useEffect } from "react";
import { fetchOrder, type OrderPublicOut } from "@/lib/api";

const TERMINAL_STATUSES = ["delivered", "failed"];

export function useOrderPolling(orderId: string | null, intervalMs = 5000) {
  const [order, setOrder] = useState<OrderPublicOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const data = await fetchOrder(orderId!);
        if (!cancelled) {
          setOrder(data);
          setError(null);
          if (!TERMINAL_STATUSES.includes(data.status)) {
            timeoutId = setTimeout(poll, intervalMs);
          }
        }
      } catch {
        if (!cancelled) {
          setError("Error al obtener el estado del pedido");
          timeoutId = setTimeout(poll, intervalMs * 2);
        }
      }
    }

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [orderId, intervalMs]);

  return { order, error };
}
