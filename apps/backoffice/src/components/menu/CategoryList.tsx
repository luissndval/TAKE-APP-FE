'use client';

import { Category } from '@/types/menu';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Props {
  categories: Category[];
  onToggleProduct: (productId: string) => void;
  onToggleCategory?: (categoryId: string, isActive: boolean) => void;
}

export default function CategoryList({ categories, onToggleProduct, onToggleCategory }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <Card key={cat.id} className={!cat.is_active ? 'opacity-60 grayscale' : ''}>
          <CardHeader className="p-0">
            <div className="flex items-center justify-between px-5 py-4">
              <button
                onClick={() => toggle(cat.id)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                {expanded[cat.id] ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                <span className={`font-semibold ${cat.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                  {cat.name} {!cat.is_active && '(Inactiva)'}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {cat.products.length} productos
                </Badge>
              </button>
              
              <div className="flex items-center gap-3 ml-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Activa</span>
                <Switch 
                  checked={cat.is_active}
                  onCheckedChange={(checked) => onToggleCategory?.(cat.id, checked)}
                />
              </div>
            </div>
          </CardHeader>

          {expanded[cat.id] && (
            <CardContent className="p-0 border-t border-gray-100">
              {cat.products.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400">
                  Sin productos en esta categoría.
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {cat.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          ${product.price.toLocaleString('es-AR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={product.is_available}
                          onCheckedChange={() => onToggleProduct(product.id)}
                          aria-label={product.is_available ? 'Disponible' : 'No disponible'}
                        />
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/menu/products/${product.id}`}>Editar</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
