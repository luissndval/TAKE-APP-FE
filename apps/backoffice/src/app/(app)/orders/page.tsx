"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Order, OrderStatus, OrderType } from "@/types/orders";
import OrderTable from "@/components/orders/OrderTable";
import { useOrdersSocket } from "@/hooks/useOrdersSocket";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  awaiting_transfer: "Esp. Transferencia",
  confirmed: "Confirmado",
  preparing: "En Preparación",
  ready: "Listo",
  dispatched: "Despachado",
  delivered: "Entregado",
  failed: "Cancelado",
};

const PAGE_SIZE = 50;

interface PaginatedOrders {
  items: Order[];
  total: number;
  skip: number;
  limit: number;
}

export default function OrdersPage() {
  useOrdersSocket();
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery<PaginatedOrders>({
    queryKey: ["orders", statusFilter, typeFilter, phoneFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("order_type", typeFilter);
      if (phoneFilter) params.set("phone", phoneFilter);
      params.set("skip", String(page * PAGE_SIZE));
      params.set("limit", String(PAGE_SIZE));
      const { data } = await api.get(`/api/v1/backoffice/orders?${params}`);
      return data;
    },
  });

  const orders = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Pedidos</h2>
        <Badge variant="outline" className="text-sm font-medium">
          {total} resultados
        </Badge>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={phoneFilter}
            onChange={(e) => handleFilterChange(setPhoneFilter)(e.target.value)}
            placeholder="Buscar por teléfono..."
            className="pl-8 w-52"
          />
        </div>

        <Select value={statusFilter || "all"} onValueChange={(v) => handleFilterChange(setStatusFilter)(v === "all" ? "" : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.values(OrderStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s] ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter || "all"} onValueChange={(v) => handleFilterChange(setTypeFilter)(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value={OrderType.DELIVERY}>Delivery</SelectItem>
            <SelectItem value={OrderType.TAKEAWAY}>Take away</SelectItem>
          </SelectContent>
        </Select>

        {(statusFilter || typeFilter || phoneFilter) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter("");
              setTypeFilter("");
              setPhoneFilter("");
              setPage(0);
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-gray-500">
          Cargando pedidos...
        </div>
      ) : (
        <>
          <OrderTable orders={orders} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-500">
                Página {page + 1} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                >
                  <ChevronLeft size={16} />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page + 1 >= totalPages}
                >
                  Siguiente
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
