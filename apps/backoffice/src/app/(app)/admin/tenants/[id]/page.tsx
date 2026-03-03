'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Users,
  Globe,
  CheckCircle,
  XCircle,
  ShoppingBag,
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface TenantUser {
  id: string;
  email: string;
  full_name: string;
  tenant_role: string;
  is_active: boolean;
  created_at: string;
}

const roleLabel: Record<string, string> = {
  owner: 'Propietario',
  manager: 'Gerente',
  cashier: 'Cajero',
  kitchen: 'Cocina',
};

type Tab = 'info' | 'users';

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('info');
  const [domainInput, setDomainInput] = useState('');

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ['admin-tenant', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/superadmin/tenants/${id}`);
      return data;
    },
  });

  const { data: users = [] } = useQuery<TenantUser[]>({
    queryKey: ['admin-tenant-users', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/superadmin/tenants/${id}/users`);
      return data;
    },
    enabled: tab === 'users',
  });

  const toggleMutation = useMutation({
    mutationFn: () => api.patch(`/api/v1/superadmin/tenants/${id}/toggle-active`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tenant', id] }),
  });

  const domainMutation = useMutation({
    mutationFn: (custom_domain: string) =>
      api.patch(`/api/v1/superadmin/tenants/${id}/domain/verify`, { custom_domain }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tenant', id] }),
  });

  if (isLoading || !tenant) {
    return <div className="text-gray-400">Cargando...</div>;
  }

  const tabs: { key: Tab; label: string; icon: typeof Building2 }[] = [
    { key: 'info', label: 'Información', icon: Building2 },
    { key: 'users', label: `Usuarios (${tenant.users_count})`, icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 mt-1">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
            <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
              {tenant.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            <span className="font-mono">/{tenant.slug}</span>
            <span className="flex items-center gap-1">
              <Users size={13} />
              {tenant.users_count} usuarios
            </span>
            <span className="flex items-center gap-1">
              <ShoppingBag size={13} />
              {tenant.orders_count} pedidos
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => toggleMutation.mutate()}
          className={tenant.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : ''}
        >
          {tenant.is_active ? 'Desactivar' : 'Activar'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {tab === 'info' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dominio personalizado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenant.custom_domain ? (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Globe size={16} className="text-gray-400" />
                  <span className="text-sm font-medium">{tenant.custom_domain}</span>
                  {tenant.custom_domain_verified ? (
                    <CheckCircle size={14} className="text-green-500 ml-auto" />
                  ) : (
                    <XCircle size={14} className="text-gray-400 ml-auto" />
                  )}
                  <span className="text-xs text-gray-500">
                    {tenant.custom_domain_verified ? 'Verificado' : 'Pendiente'}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Sin dominio personalizado</p>
              )}
              <div className="flex gap-2">
                <Input
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="micafe.com"
                  className="flex-1"
                />
                <Button
                  onClick={() => domainMutation.mutate(domainInput)}
                  disabled={!domainInput || domainMutation.isPending}
                  style={{ backgroundColor: '#6366f1', color: '#fff' }}
                >
                  Verificar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos del negocio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label className="text-xs text-gray-400">Nombre</Label>
                <p className="font-medium text-gray-900">{tenant.name}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-400">Slug</Label>
                <p className="font-mono text-gray-700">{tenant.slug}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-400">Creado</Label>
                <p className="text-gray-700">
                  {new Date(tenant.created_at).toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Users */}
      {tab === 'users' && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Nombre', 'Email', 'Rol', 'Estado'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {roleLabel[u.tenant_role] ?? u.tenant_role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium ${
                          u.is_active ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-8">
                      Sin usuarios
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
