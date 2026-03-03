'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import Link from 'next/link';

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  position: z.coerce.number().int().min(0),
});

type FormValues = z.infer<typeof schema>;

export default function NewCategoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { position: 0 },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await api.post('/api/v1/backoffice/menu/categories', values);
      queryClient.invalidateQueries({ queryKey: ['backoffice-menu'] });
      router.push('/menu');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear la categoría');
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/menu" className="text-sm text-indigo-600 hover:underline">
          ← Volver al menú
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Nueva categoría</h2>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              {...register('name')}
              placeholder="ej: Hamburguesas"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Posición (orden en el menú)
            </label>
            <input
              {...register('position')}
              type="number"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/menu"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
