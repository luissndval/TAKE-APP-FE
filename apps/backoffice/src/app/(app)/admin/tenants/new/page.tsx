'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Building2 } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FormState {
  name: string;
  slug: string;
  logo_url: string;
  owner_email: string;
  owner_password: string;
  owner_full_name: string;
}

export default function NewTenantPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: '',
    slug: '',
    logo_url: '',
    owner_email: '',
    owner_password: '',
    owner_full_name: '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: FormState) =>
      api.post('/api/v1/superadmin/tenants', {
        ...data,
        logo_url: data.logo_url || null,
      }),
    onSuccess: (res) => {
      router.push(`/admin/tenants/${res.data.id}`);
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? 'Error al crear el tenant.');
    },
  });

  function field(k: keyof FormState) {
    return {
      value: form[k],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [k]: e.target.value });
        if (k === 'name' && !form.slug) {
          setForm((prev) => ({
            ...prev,
            name: e.target.value,
            slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          }));
        }
      },
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    mutation.mutate(form);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo tenant</h1>
          <p className="text-sm text-gray-500 mt-0.5">Crear negocio + usuario owner</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 size={16} className="text-indigo-500" />
              Datos del negocio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Nombre del negocio</Label>
              <Input {...field('name')} required placeholder="Ej: La Pizzería de Juan" />
            </div>
            <div className="space-y-1">
              <Label>Slug (URL)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 shrink-0">takeapp.com/</span>
                <Input {...field('slug')} required placeholder="la-pizzeria-de-juan" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>URL del logo (opcional)</Label>
              <Input {...field('logo_url')} placeholder="https://..." type="url" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usuario Owner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Nombre completo</Label>
              <Input {...field('owner_full_name')} required placeholder="Juan Pérez" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input {...field('owner_email')} required type="email" placeholder="juan@lapizzeria.com" />
            </div>
            <div className="space-y-1">
              <Label>Contraseña temporal</Label>
              <Input {...field('owner_password')} required type="password" minLength={6} />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            style={{ backgroundColor: '#6366f1', color: '#fff' }}
          >
            {mutation.isPending ? 'Creando...' : 'Crear tenant'}
          </Button>
        </div>
      </form>
    </div>
  );
}
