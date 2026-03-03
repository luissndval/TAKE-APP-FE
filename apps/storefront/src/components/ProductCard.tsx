"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/lib/api";
import { useCartStore } from "@/store/cart";

interface ProductCardProps {
  product: Product;
  tenantSlug: string;
}

export function ProductCard({ product, tenantSlug }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const { addItem, setTenant } = useCartStore();

  function handleAdd() {
    setTenant(tenantSlug);
    addItem({
      productId: product.id,
      productName: product.name,
      unitPrice: parseFloat(product.price),
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      {product.image_url && (
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
            {product.description}
          </p>
        )}
        <p className="text-brand-600 font-bold mt-1">
          ${parseFloat(product.price).toLocaleString("es-AR")}
        </p>
      </div>
      <button
        onClick={handleAdd}
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xl transition-colors ${
          added
            ? "bg-green-500"
            : "bg-brand-500 hover:bg-brand-600 active:scale-95"
        }`}
        aria-label={`Agregar ${product.name}`}
      >
        {added ? "✓" : "+"}
      </button>
    </div>
  );
}
