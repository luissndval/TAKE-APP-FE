import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

interface PendingCart {
  items: CartItem[];
  tenantSlug: string | null;
  savedAt: number; // timestamp ms
}

const CART_TTL_MS = 30 * 60 * 1000; // 30 minutos

interface CartState {
  tenantSlug: string | null;
  items: CartItem[];
  pendingCart: PendingCart | null;

  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setTenant: (slug: string) => void;
  total: () => number;
  itemCount: () => number;

  /** Guarda el carrito actual como pendiente y limpia el activo (para MP). */
  saveCartForMp: () => void;
  /** Restaura el carrito pendiente si no expiró. Retorna true si se restauró. */
  restorePendingCart: () => boolean;
  /** Limpia el carrito pendiente (pago confirmado o expirado). */
  clearPendingCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      tenantSlug: null,
      items: [],
      pendingCart: null,

      setTenant: (slug) => set({ tenantSlug: slug }),

      addItem: (newItem) => {
        const existing = get().items.find(
          (i) => i.productId === newItem.productId
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === newItem.productId
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, newItem] });
        }
      },

      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [], tenantSlug: null }),

      total: () =>
        get().items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        ),

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      saveCartForMp: () => {
        const { items, tenantSlug } = get();
        set({
          pendingCart: { items, tenantSlug, savedAt: Date.now() },
          items: [],
          tenantSlug: null,
        });
      },

      restorePendingCart: () => {
        const { pendingCart } = get();
        if (!pendingCart) return false;
        const expired = Date.now() - pendingCart.savedAt > CART_TTL_MS;
        if (expired) {
          set({ pendingCart: null });
          return false;
        }
        set({
          items: pendingCart.items,
          tenantSlug: pendingCart.tenantSlug,
          pendingCart: null,
        });
        return true;
      },

      clearPendingCart: () => set({ pendingCart: null }),
    }),
    { name: "takeapp-cart" }
  )
);
