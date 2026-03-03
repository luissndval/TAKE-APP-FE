"use client";

import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, DollarSign, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import api from "@/lib/api";
import { useOrdersSocket } from "@/hooks/useOrdersSocket";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StatusBadge from "@/components/orders/StatusBadge";
import { OrderStatus } from "@/types/orders";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface OrderStatusMetric {
  status: string;
  count: number;
}

interface TopProduct {
  name: string;
  quantity: number;
}

interface DashboardMetrics {
  orders_by_status: OrderStatusMetric[];
  total_revenue: number;
  top_products: TopProduct[];
  recent_orders_count: number;
  active_orders_count: number;
  completed_orders_count: number;
  average_ticket: number;
  conversion_rate: number;
}

interface DailySale {
  date: string;
  orders_count: number;
  revenue: number;
}

interface SalesAnalytics {
  daily_sales: DailySale[];
  total_period_revenue: number;
  total_period_orders: number;
}

const metricConfig = [
  {
    key: "active",
    title: "Pedidos Activos",
    icon: ShoppingBag,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    key: "revenue",
    title: "Ingresos hoy",
    icon: DollarSign,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    key: "delivered",
    title: "Entregados",
    icon: TrendingUp,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    key: "avg_ticket",
    title: "Ticket Promedio",
    icon: Clock,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
];

export default function DashboardPage() {
  useOrdersSocket();

  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/backoffice/dashboard");
      return data;
    },
    refetchInterval: 60_000,
  });

  const { data: salesData } = useQuery<SalesAnalytics>({
    queryKey: ["sales-analytics"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/backoffice/dashboard/sales");
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Cargando métricas...
      </div>
    );
  }

  const metricValues: Record<string, string | number> = {
    active: metrics?.active_orders_count ?? 0,
    revenue: `$${(metrics?.total_revenue ?? 0).toLocaleString("es-AR")}`,
    delivered: metrics?.completed_orders_count ?? 0,
    avg_ticket: `$${(metrics?.average_ticket ?? 0).toLocaleString("es-AR")}`,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricConfig.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    {metric.title}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${metric.bg}`}>
                    <Icon size={16} className={metric.color} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">
                  {metricValues[metric.key]}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-600">
              Ingresos por día (Últ. 30 días)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData?.daily_sales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => format(new Date(val), "dd/MM", { locale: es })}
                  fontSize={10}
                />
                <YAxis fontSize={10} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  labelFormatter={(val) => format(new Date(val), "eeee dd 'de' MMMM", { locale: es })}
                  formatter={(val) => [`$${parseFloat(val as string).toLocaleString('es-AR')}`, "Ingresos"]}
                />
                <Bar dataKey="revenue" fill="var(--backoffice-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-600">
              Volumen de pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData?.daily_sales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => format(new Date(val), "dd/MM", { locale: es })}
                  fontSize={10}
                />
                <YAxis fontSize={10} />
                <Tooltip 
                  labelFormatter={(val) => format(new Date(val), "eeee dd 'de' MMMM", { locale: es })}
                  formatter={(val) => [val, "Pedidos"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders_count" 
                  stroke="var(--backoffice-primary)" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "var(--backoffice-primary)" }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pedidos por estado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-600">
              Pedidos por estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.orders_by_status.map((s) => (
                <div
                  key={s.status}
                  className="flex items-center justify-between"
                >
                  <StatusBadge status={s.status as OrderStatus} size="sm" />
                  <span className="font-semibold text-gray-900">
                    {s.count}
                  </span>
                </div>
              ))}
              {!metrics?.orders_by_status.length && (
                <p className="text-sm text-gray-400">Sin pedidos hoy.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top productos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-600">
              Productos más pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {metrics?.top_products.map((p, i) => (
                <li
                  key={p.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-400 w-5">
                      {i + 1}.
                    </span>
                    <span className="text-gray-700">{p.name}</span>
                  </span>
                  <span className="font-semibold text-gray-900">
                    {p.quantity} uds
                  </span>
                </li>
              ))}
              {!metrics?.top_products.length && (
                <p className="text-sm text-gray-400">Sin datos hoy.</p>
              )}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
