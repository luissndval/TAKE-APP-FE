"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart";

interface CartDrawerProps {
  tenantSlug: string;
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ tenantSlug, open, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, total } = useCartStore();

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">Tu pedido</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Cerrar carrito"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Tu carrito está vacío
            </p>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.productName}</p>
                  <p className="text-brand-600 text-sm font-semibold">
                    ${(item.unitPrice * item.quantity).toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t space-y-3">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${total().toLocaleString("es-AR")}</span>
            </div>
            <Link
              href={`/${tenantSlug}/checkout`}
              onClick={onClose}
              className="block w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl text-center transition-colors"
            >
              Confirmar pedido →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
