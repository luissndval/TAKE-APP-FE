'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ChefHat, Clock, Package, User, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import api from '@/lib/api';
import { Order, OrderStatus } from '@/types/orders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/hooks/useAuth';

const KITCHEN_STATUSES = [OrderStatus.CONFIRMED, OrderStatus.PREPARING];

const statusConfig: Record<string, { label: string; color: string; bg: string; next: OrderStatus | null; action: string }> = {
  [OrderStatus.PENDING]: {
    label: 'Nuevo',
    color: '#9ca3af',
    bg: '#f3f4f6',
    next: OrderStatus.CONFIRMED,
    action: 'Confirmar',
  },
  [OrderStatus.CONFIRMED]: {
    label: 'Confirmado',
    color: '#3b82f6',
    bg: '#dbeafe',
    next: OrderStatus.PREPARING,
    action: 'Preparar',
  },
  [OrderStatus.PREPARING]: {
    label: 'Preparando',
    color: '#f59e0b',
    bg: '#fef3c7',
    next: OrderStatus.READY,
    action: 'Listo',
  },
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function minutesAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function OrderCard({ order, onAdvance }: { order: Order; onAdvance: (id: string, status: OrderStatus) => void }) {
  const cfg = statusConfig[order.status];
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const mins = mounted ? minutesAgo(order.created_at) : 0;
  const isUrgent = mounted && mins > 15 && order.status !== OrderStatus.PREPARING;

  return (
    <div
      className={`rounded-2xl border-2 p-5 flex flex-col gap-4 transition-all ${
        isUrgent ? 'border-red-400 shadow-lg shadow-red-100' : 'border-gray-200'
      }`}
      style={{ backgroundColor: '#fff' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ color: cfg.color, backgroundColor: cfg.bg }}
            >
              {cfg.label}
            </span>
            {isUrgent && (
              <span className="text-xs font-bold text-red-500 animate-pulse">¡URGENTE!</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Clock size={13} />
            <span>{formatTime(order.created_at)}</span>
            <span className="text-gray-400">·</span>
            <span className={mins > 15 ? 'text-red-500 font-semibold' : ''}>{mins} min</span>
          </div>
        </div>
        <div className="text-right">
          <Badge variant="outline" className="text-xs">
            {order.order_type === 'delivery' ? '🛵 Delivery' : '🥡 Takeaway'}
          </Badge>
        </div>
      </div>

      {/* Cliente */}
      <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
        <User size={14} className="text-gray-400" />
        <span className="font-medium">{order.customer_name}</span>
        {order.customer_phone && (
          <span className="text-gray-400 ml-auto">{order.customer_phone}</span>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <span className="text-lg font-bold text-gray-800 w-6 text-center leading-tight">
              {item.quantity}×
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{item.product_name}</p>
              {item.notes && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-0.5 mt-0.5">
                  {item.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Acción */}
      {cfg.next && (
        <Button
          className="w-full mt-auto font-semibold"
          style={{ backgroundColor: cfg.color, color: '#fff' }}
          onClick={() => onAdvance(order.id, cfg.next!)}
        >
          <Package size={14} className="mr-2" />
          {cfg.action}
        </Button>
      )}
    </div>
  );
}

export default function KitchenPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevCountRef = useRef(0);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['kitchen-orders'],
    queryFn: async () => {
      const params = new URLSearchParams();
      KITCHEN_STATUSES.forEach((s) => params.append('status', s));
      const { data } = await api.get(`/api/v1/backoffice/orders/?${params.toString()}`);
      return data.items ?? data;
    },
    refetchInterval: 10000,
  });

  const advanceMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch(`/api/v1/backoffice/orders/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] }),
  });

  // WebSocket para actualizaciones en tiempo real
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const host = apiUrl ? apiUrl.replace(/^https?:\/\//, '') : window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/api/v1/backoffice/orders/live?token=${token}`);

    ws.onmessage = (event) => {
      const { event: eventName } = JSON.parse(event.data);
      if (eventName === 'new_order' || eventName === 'order_status_changed') {
        queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      }
    };

    return () => ws.close();
  }, [queryClient]);

  // Alerta de sonido cuando llegan nuevos pedidos confirmados
  useEffect(() => {
    const pending = orders.filter((o) => o.status === OrderStatus.CONFIRMED);
    if (soundEnabled && pending.length > prevCountRef.current) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } catch {
        // AudioContext no disponible
      }
    }
    prevCountRef.current = pending.length;
  }, [orders, soundEnabled]);

  const byStatus = KITCHEN_STATUSES.map((s) => ({
    status: s,
    orders: orders.filter((o) => o.status === s),
  }));

  const columns = [
    { status: OrderStatus.CONFIRMED, label: 'Confirmados', accent: '#3b82f6' },
    { status: OrderStatus.PREPARING, label: 'En preparación', accent: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <ChefHat size={24} className="text-amber-400" />
          <div>
            <h1 className="text-lg font-bold leading-none">Vista Cocina</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {user?.full_name ?? 'Cocina'} · Actualización automática
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>
              {orders.length} pedido{orders.length !== 1 ? 's' : ''} activo
              {orders.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            className="text-gray-400 hover:text-white transition-colors"
            title={soundEnabled ? 'Silenciar alertas' : 'Activar alertas'}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
      </header>

      {/* Columns */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Cargando pedidos...
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 gap-px bg-gray-800 overflow-hidden">
          {columns.map((col) => {
            const colOrders = byStatus.find((b) => b.status === col.status)?.orders ?? [];
            return (
              <div key={col.status} className="bg-gray-900 flex flex-col overflow-hidden">
                {/* Column header */}
                <div
                  className="flex items-center justify-between px-5 py-3 border-b border-gray-800"
                >
                  <span className="font-semibold text-sm" style={{ color: col.accent }}>
                    {col.label}
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ color: col.accent, backgroundColor: col.accent + '22' }}
                  >
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {colOrders.length === 0 ? (
                    <div className="text-center text-gray-600 text-sm py-8">Sin pedidos</div>
                  ) : (
                    colOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onAdvance={(id, status) => advanceMutation.mutate({ id, status })}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
