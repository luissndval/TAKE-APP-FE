"use client";

import { useEffect, useRef, useState } from "react";

export type OrderTrackingStatus =
  | "pending"
  | "awaiting_transfer"
  | "confirmed"
  | "preparing"
  | "ready"
  | "dispatched"
  | "delivered"
  | "failed";

export interface DriverInfo {
  name: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  etaMinutes: number | null;
  trackingUrl: string | null;
}

interface UseOrderTrackingResult {
  orderStatus: OrderTrackingStatus | null;
  driver: DriverInfo;
  isConnected: boolean;
  deliveredAt: string | null;
}

const INITIAL_DRIVER: DriverInfo = {
  name: null,
  phone: null,
  lat: null,
  lng: null,
  etaMinutes: null,
  trackingUrl: null,
};

export function useOrderTracking(
  orderId: string | null,
  initialStatus: OrderTrackingStatus | null = null
): UseOrderTrackingResult {
  const [orderStatus, setOrderStatus] = useState<OrderTrackingStatus | null>(initialStatus);
  const [driver, setDriver] = useState<DriverInfo>(INITIAL_DRIVER);
  const [isConnected, setIsConnected] = useState(false);
  const [deliveredAt, setDeliveredAt] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const wsUrl = API_BASE.replace(/^http/, "ws") + `/ws/orders/${orderId}/track`;

    let closed = false;

    function connect() {
      if (closed) return;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as { event: string; data: Record<string, unknown> };

          if (msg.event === "order_status") {
            const status = msg.data.status as OrderTrackingStatus;
            setOrderStatus(status);
          } else if (msg.event === "driver_assigned") {
            setDriver((prev) => ({
              ...prev,
              name: (msg.data.name as string) ?? prev.name,
              phone: (msg.data.phone as string) ?? prev.phone,
              trackingUrl: (msg.data.tracking_url as string) ?? prev.trackingUrl,
            }));
          } else if (msg.event === "driver_location") {
            setDriver((prev) => ({
              ...prev,
              lat: (msg.data.lat as number) ?? prev.lat,
              lng: (msg.data.lng as number) ?? prev.lng,
              etaMinutes: (msg.data.eta_minutes as number) ?? prev.etaMinutes,
            }));
          } else if (msg.event === "delivered") {
            setOrderStatus("delivered");
            setDeliveredAt((msg.data.delivered_at as string) ?? null);
          }
        } catch {
          // mensajes malformados se ignoran
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (!closed) {
          // Reconexión automática a los 3 segundos
          reconnectTimer.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      closed = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [orderId]);

  return { orderStatus, driver, isConnected, deliveredAt };
}
