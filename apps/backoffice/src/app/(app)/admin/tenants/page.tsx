'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Building2, Users, ShoppingBag, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  created_at: string;
  users_count: number;
  orders_count: number;
}

export default function TenantsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/superadmin/tenants');
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/v1/superadmin/tenants/${id}/toggle-active`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tenants'] }),
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500 mt-1">{tenants.length} negocios registrados</p>
        </div>
        <Button
          onClick={() => router.push('/admin/tenants/new')}
          style={{ backgroundColor: '#6366f1', color: '#fff' }}
        >
          <Plus size={16} className="mr-2" />
          Nuevo tenant
        </Button>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Cargando...</div>
      ) : (
        <div className="space-y-3">
          {tenants.map((tenant) => (
            <Card
              key={tenant.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
            >
              <CardContent className="flex items-center gap-6 py-4">
                {/* Logo / Avatar */}
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  {tenant.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tenant.logo_url} alt={tenant.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <Building2 size={20} className="text-indigo-500" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate">{tenant.name}</p>
                    <Badge
                      variant={tenant.is_active ? 'default' : 'secondary'}
                      className="text-xs flex-shrink-0"
                    >
                      {tenant.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="font-mono">/{tenant.slug}</span>
                    {tenant.custom_domain && (
                      <span className="flex items-center gap-1">
                        {tenant.custom_domain_verified ? (
                          <CheckCircle size={10} className="text-green-500" />
                        ) : (
                          <XCircle size={10} className="text-gray-400" />
                        )}
                        {tenant.custom_domain}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-gray-400" />
                    <span>{tenant.users_count}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag size={14} className="text-gray-400" />
                    <span>{tenant.orders_count}</span>
                  </div>
                </div>

                {/* Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMutation.mutate(tenant.id);
                  }}
                  className={tenant.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : ''}
                >
                  {tenant.is_active ? 'Desactivar' : 'Activar'}
                </Button>
              </CardContent>
            </Card>
          ))}
          {tenants.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Building2 size={40} className="mx-auto mb-3 opacity-30" />
              <p>No hay tenants registrados</p>
              <Button
                className="mt-4"
                onClick={() => router.push('/admin/tenants/new')}
                style={{ backgroundColor: '#6366f1', color: '#fff' }}
              >
                <Plus size={14} className="mr-2" />
                Crear el primero
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
