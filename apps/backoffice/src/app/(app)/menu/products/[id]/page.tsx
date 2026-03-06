'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Category } from '@/types/menu';
import ProductForm, { ProductFormValues } from '@/components/menu/ProductForm';
import Link from 'next/link';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['backoffice-menu'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/backoffice/menu');
      return data;
    },
  });

  const product = categories.flatMap((c) => c.products).find((p) => p.id === id);
  const categoryId = categories.find((c) =>
    c.products.some((p) => p.id === id)
  )?.id;

  const onSubmit = async (values: ProductFormValues) => {
    setError(null);
    try {
      await api.patch(`/api/v1/backoffice/menu/products/${id}`, {
        name: values.name,
        description: values.description || null,
        price: values.price,
        image_url: values.image_url || null,
        is_available: values.is_available,
        category_id: values.category_id,
      });
      queryClient.invalidateQueries({ queryKey: ['backoffice-menu'] });
      router.push('/menu');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al actualizar el producto');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Cargando producto...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <Link href="/menu" className="text-sm text-indigo-600 hover:underline">
          ← Volver al menú
        </Link>
        <p className="text-red-500">Producto no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/menu" className="text-sm text-indigo-600 hover:underline">
          ← Volver al menú
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Editar: {product.name}</h2>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <ProductForm
          categories={categories}
          defaultValues={{
            name: product.name,
            description: product.description ?? '',
            price: product.price,
            image_url: product.image_url ?? '',
            is_available: product.is_available,
            category_id: categoryId ?? '',
          }}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
