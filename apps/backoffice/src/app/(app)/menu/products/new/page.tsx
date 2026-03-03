'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Category } from '@/types/menu';
import ProductForm, { ProductFormValues } from '@/components/menu/ProductForm';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['backoffice-menu'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/backoffice/menu');
      return data;
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
    setError(null);
    try {
      const { data: product } = await api.post('/api/v1/backoffice/menu/products', {
        name: values.name,
        description: values.description || null,
        price: values.price,
        image_url: values.image_url || null,
        is_available: values.is_available,
        category_id: values.category_id,
      });

      for (const variant of values.variants) {
        await api.post(
          `/api/v1/backoffice/menu/products/${product.id}/variants`,
          variant
        );
      }

      queryClient.invalidateQueries({ queryKey: ['backoffice-menu'] });
      router.push('/menu');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear el producto');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/menu" className="text-sm text-indigo-600 hover:underline">
          ← Volver al menú
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Nuevo producto</h2>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <ProductForm categories={categories} onSubmit={onSubmit} />
      </div>
    </div>
  );
}
