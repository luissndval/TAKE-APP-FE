'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserPlus, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TenantRole } from '@/types/auth';

interface TeamUser {
  id: string;
  email: string;
  full_name: string;
  tenant_role: TenantRole;
  is_active: boolean;
  created_at: string;
}

interface NewUserForm {
  email: string;
  password: string;
  full_name: string;
  tenant_role: TenantRole;
}

const roleOptions: { value: TenantRole; label: string }[] = [
  { value: 'owner', label: 'Propietario' },
  { value: 'manager', label: 'Gerente' },
  { value: 'cashier', label: 'Cajero' },
  { value: 'kitchen', label: 'Cocina' },
];

const defaultForm: NewUserForm = {
  email: '',
  password: '',
  full_name: '',
  tenant_role: 'cashier',
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewUserForm>(defaultForm);
  const [error, setError] = useState('');

  const { data: users = [], isLoading } = useQuery<TeamUser[]>({
    queryKey: ['team-users'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/backoffice/users');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: NewUserForm) => api.post('/api/v1/backoffice/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-users'] });
      setShowForm(false);
      setForm(defaultForm);
      setError('');
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? 'Error al crear el usuario.');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (userId: string) =>
      api.patch(`/api/v1/backoffice/users/${userId}/toggle-active`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-users'] }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipo</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} integrantes</p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          style={{ backgroundColor: 'var(--backoffice-primary)', color: '#fff' }}
        >
          <Plus size={16} className="mr-2" />
          Agregar usuario
        </Button>
      </div>

      {/* Formulario nuevo usuario */}
      {showForm && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus size={16} className="text-blue-500" />
              Nuevo integrante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nombre completo</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Rol</Label>
                <Select
                  value={form.tenant_role}
                  onValueChange={(v) => setForm({ ...form, tenant_role: v as TenantRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Contraseña temporal</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              {error && (
                <div className="col-span-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                  {error}
                </div>
              )}
              <div className="col-span-2 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  style={{ backgroundColor: 'var(--backoffice-primary)', color: '#fff' }}
                >
                  {createMutation.isPending ? 'Creando...' : 'Crear usuario'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabla de usuarios */}
      {isLoading ? (
        <div className="text-gray-400">Cargando...</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Nombre', 'Email', 'Rol', 'Estado', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
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
                      <Badge variant="outline" className="text-xs capitalize">
                        {roleOptions.find((r) => r.value === u.tenant_role)?.label ?? u.tenant_role}
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
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleMutation.mutate(u.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title={u.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {u.is_active ? <ToggleRight size={20} className="text-blue-500" /> : <ToggleLeft size={20} />}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-10">
                      No hay usuarios en tu equipo
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
