'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Package } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Plan {
  id: string;
  name: string;
  price: number;
  max_products: number;
  max_orders_per_month: number;
  features: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

interface PlanForm {
  name: string;
  price: string;
  max_products: string;
  max_orders_per_month: string;
}

const defaultForm: PlanForm = {
  name: '',
  price: '',
  max_products: '-1',
  max_orders_per_month: '-1',
};

function formatLimit(v: number) {
  return v === -1 ? 'Ilimitado' : v.toLocaleString();
}

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PlanForm>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/superadmin/plans');
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: object) =>
      editId
        ? api.patch(`/api/v1/superadmin/plans/${editId}`, payload)
        : api.post('/api/v1/superadmin/plans', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      setShowForm(false);
      setForm(defaultForm);
      setEditId(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/api/v1/superadmin/plans/${id}`, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-plans'] }),
  });

  function handleEdit(plan: Plan) {
    setEditId(plan.id);
    setForm({
      name: plan.name,
      price: String(plan.price),
      max_products: String(plan.max_products),
      max_orders_per_month: String(plan.max_orders_per_month),
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate({
      name: form.name,
      price: parseFloat(form.price),
      max_products: parseInt(form.max_products),
      max_orders_per_month: parseInt(form.max_orders_per_month),
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planes</h1>
          <p className="text-sm text-gray-500 mt-1">{plans.length} planes configurados</p>
        </div>
        <Button
          onClick={() => { setShowForm(true); setEditId(null); setForm(defaultForm); }}
          style={{ backgroundColor: '#6366f1', color: '#fff' }}
        >
          <Plus size={16} className="mr-2" />
          Nuevo plan
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <Card className="border-indigo-200">
          <CardHeader>
            <CardTitle className="text-base">{editId ? 'Editar plan' : 'Nuevo plan'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Nombre</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Ej: Starter, Pro, Enterprise"
                />
              </div>
              <div className="space-y-1">
                <Label>Precio (ARS/mes)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Máx. productos (-1 = ilimitado)</Label>
                <Input
                  type="number"
                  value={form.max_products}
                  onChange={(e) => setForm({ ...form, max_products: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Máx. pedidos/mes (-1 = ilimitado)</Label>
                <Input
                  type="number"
                  value={form.max_orders_per_month}
                  onChange={(e) => setForm({ ...form, max_orders_per_month: e.target.value })}
                />
              </div>
              <div className="col-span-2 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowForm(false); setEditId(null); }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  style={{ backgroundColor: '#6366f1', color: '#fff' }}
                >
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de planes */}
      {isLoading ? (
        <div className="text-gray-400">Cargando...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={18} className="text-indigo-500" />
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                  </div>
                  <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                    {plan.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-3xl font-bold text-gray-900">
                  ${plan.price.toLocaleString('es-AR')}
                  <span className="text-sm font-normal text-gray-500">/mes</span>
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-green-500" />
                    <span>{formatLimit(plan.max_products)} productos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-green-500" />
                    <span>{formatLimit(plan.max_orders_per_month)} pedidos/mes</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(plan)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleMutation.mutate({ id: plan.id, is_active: !plan.is_active })}
                  >
                    {plan.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
