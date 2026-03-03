'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, Users, ShoppingBag, DollarSign } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GlobalStats {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  total_orders: number;
  total_revenue: number;
}

const metrics = [
  {
    key: 'total_tenants' as const,
    label: 'Tenants totales',
    sub: (s: GlobalStats) => `${s.active_tenants} activos`,
    icon: Building2,
    color: '#6366f1',
  },
  {
    key: 'total_users' as const,
    label: 'Usuarios de tenants',
    sub: () => 'Con acceso al backoffice',
    icon: Users,
    color: '#3b82f6',
  },
  {
    key: 'total_orders' as const,
    label: 'Pedidos totales',
    sub: () => 'En toda la plataforma',
    icon: ShoppingBag,
    color: '#f59e0b',
  },
  {
    key: 'total_revenue' as const,
    label: 'Revenue total',
    sub: () => 'Pedidos entregados',
    icon: DollarSign,
    color: '#10b981',
    format: (v: number) => `$${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
  },
];

export default function StatsPage() {
  const { data, isLoading } = useQuery<GlobalStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/superadmin/stats');
      return data;
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas globales</h1>
        <p className="text-sm text-gray-500 mt-1">Métricas de toda la plataforma</p>
      </div>

      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {metrics.map((m) => {
          const value = data?.[m.key] ?? 0;
          const formatted = m.format ? m.format(Number(value)) : value.toLocaleString();
          return (
            <Card key={m.key}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{m.label}</CardTitle>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: m.color + '18' }}
                >
                  <m.icon size={16} style={{ color: m.color }} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-8 w-20 animate-pulse bg-gray-100 rounded" />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-gray-900">{formatted}</p>
                    <p className="text-xs text-gray-500 mt-1">{m.sub(data!)}</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
