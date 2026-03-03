'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Category } from '@/types/menu';
import CategoryList from '@/components/menu/CategoryList';
import { Button } from '@/components/ui/button';

export default function MenuPage() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['backoffice-menu'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/backoffice/menu');
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.patch(
        `/api/v1/backoffice/menu/products/${productId}/availability`
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['backoffice-menu'] }),
  });

  const toggleCategoryMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data } = await api.patch(
        `/api/v1/backoffice/menu/categories/${id}`,
        { is_active }
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['backoffice-menu'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Menú</h2>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/menu/categories/new">
              <Plus size={14} />
              Categoría
            </Link>
          </Button>
          <Button
            size="sm"
            className="text-white gap-1.5"
            style={{ backgroundColor: "var(--backoffice-primary)" }}
            asChild
          >
            <Link href="/menu/products/new">
              <Plus size={14} />
              Producto
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-gray-500">
          Cargando menú...
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center text-sm text-gray-500">
          No hay categorías. Creá una para empezar.
        </div>
      ) : (
        <CategoryList
          categories={categories}
          onToggleProduct={(productId) => toggleMutation.mutate(productId)}
          onToggleCategory={(id, is_active) => toggleCategoryMutation.mutate({ id, is_active })}
        />
      )}
    </div>
  );
}
