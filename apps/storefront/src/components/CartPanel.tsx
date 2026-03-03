"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";

interface CartPanelProps {
  tenantSlug: string;
  onClose: () => void;
  primaryColor?: string;
}

export function CartPanel({ tenantSlug, onClose, primaryColor = "#f97316" }: CartPanelProps) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, total } = useCartStore();
  const cartTotal = total();
  const [removingId, setRemovingId] = useState<string | null>(null);

  function handleRemove(productId: string) {
    setRemovingId(productId);
    setTimeout(() => {
      removeItem(productId);
      setRemovingId(null);
    }, 400);
  }

  function handleCheckout() {
    onClose();
    router.push(`/${tenantSlug}/checkout`);
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Lista de items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {items.length === 0 ? (
          <p className="text-gray-400 text-center py-12 text-sm">
            Tu carrito está vacío
          </p>
        ) : (
          items.map((item) => {
            const isRemoving = removingId === item.productId;
            return (
              <div
                key={item.productId}
                className={`flex items-center gap-3 transition-all duration-300 ease-in-out ${
                  isRemoving
                    ? "opacity-0 translate-x-4 scale-95"
                    : "opacity-100 translate-x-0 scale-100"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{item.productName}</p>
                  <p className="text-sm font-bold text-gray-700 mt-0.5">
                    ${(item.unitPrice * item.quantity).toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                    aria-label="Disminuir cantidad"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                    aria-label="Aumentar cantidad"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => handleRemove(item.productId)}
                    disabled={isRemoving}
                    className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors ml-1 disabled:pointer-events-none"
                    aria-label="Eliminar item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer con total y botón */}
      {items.length > 0 && (
        <div className="border-t border-gray-100 p-4 space-y-3 bg-white">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Subtotal</span>
            <span className="font-bold text-lg text-gray-900">
              ${cartTotal.toLocaleString("es-AR")}
            </span>
          </div>
          <Button
            onClick={handleCheckout}
            className="w-full text-white font-semibold h-12 text-base rounded-xl bg-[var(--tenant-primary)] hover:opacity-90"
          >
            Ir al Checkout →
          </Button>
        </div>
      )}
    </div>
  );
}
