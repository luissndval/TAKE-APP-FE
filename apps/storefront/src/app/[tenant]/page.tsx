"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ShoppingCart, Plus, X, Check, History, Receipt, ChevronRight } from "lucide-react";
import { fetchMenu, type Product, type Combo, type ProductVariant, apiClient, type OrderPublicOut } from "@/lib/api";
import { useCartStore } from "@/store/cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CartPanel } from "@/components/CartPanel";
import { ProductSkeleton, CategorySkeleton, Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { STATUS_CONFIG } from "@/lib/status-config";

interface PageProps {
  params: { tenant: string };
}

function formatPrice(price: string | number) {
  return parseFloat(String(price)).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
  });
}

// ── Loading Component ────────────────────────────────────────────────────────

function MenuSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fake header */}
      <div className="h-[64px] bg-gray-200 animate-pulse" />

      {/* Category Skeleton */}
      <CategorySkeleton />

      {/* Product Skeleton Section */}
      <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-6">
        {[1, 2].map((section) => (
          <div key={section}>
            <Skeleton className="h-5 w-32 mb-3" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function MenuPage({ params }: PageProps) {
  const { tenant } = params;
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyPhone, setHistoryPhone] = useState("");
  const [orderHistory, setOrderHistory] = useState<OrderPublicOut[]>([]);
  const [isSearchingHistory, setIsSearchingHistory] = useState(false);
  
  const [variantModal, setVariantModal] = useState<{ product: Product } | null>(null);
  const [comboModal, setComboModal] = useState<{ combo: Combo } | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const { addItem, itemCount, total, setTenant } = useCartStore();
  const count = itemCount();
  const cartTotal = total();

  const handleSearchHistory = async () => {
    if (!historyPhone || historyPhone.length < 8) return;
    setIsSearchingHistory(true);
    try {
      const { data } = await apiClient.get(`/orders/history/${historyPhone}`, {
        params: { tenant_slug: tenant }
      });
      setOrderHistory(data);
    } catch (error) {
      console.error("History fetch failed", error);
    } finally {
      setIsSearchingHistory(false);
    }
  };

  const { data: menu, isLoading, isError } = useQuery({
    queryKey: ["menu", tenant],
    queryFn: () => {
      setTenant(tenant);
      return fetchMenu(tenant);
    },
  });

  const primaryColor = menu?.primary_color ?? "#f97316";

  // Aplicar theming en :root para que llegue a todos los elementos,
  // incluyendo portals de Radix UI (Sheet, Dialog) que renderizan fuera de .tenant-wrapper
  useEffect(() => {
    if (!menu) return;
    const root = document.documentElement;
    root.style.setProperty("--tenant-primary", menu.primary_color ?? "#f97316");
    root.style.setProperty("--tenant-secondary", menu.secondary_color ?? "#2d2d2d");
    if (menu.font_family) root.style.setProperty("--font-sans", menu.font_family);
  }, [menu]);

  if (isLoading) return <MenuSkeleton />;

  if (isError || !menu) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500 text-lg">Negocio no encontrado</p>
      </div>
    );
  }

  const activeCategories = menu.categories.filter((c) =>
    c.is_active && c.products.some((p) => p.is_available)
  );

  const filteredCategories =
    selectedCategory === "all"
      ? activeCategories
      : activeCategories.filter((c) => c.id === selectedCategory);

  function handleAddToCart(product: Product, selectedOptions: Record<string, string[]>) {
    // Validar stock antes de agregar
    if (product.stock_type !== 'unlimited' && product.stock_quantity <= 0) {
      return;
    }

    const basePrice = parseFloat(String(product.price));
    
    // Calcular delta de opciones
    let optionsDelta = 0;
    const selectionSnapshot: any[] = [];

    product.option_groups.forEach(group => {
      const selectedIds = selectedOptions[group.id] || [];
      const groupOptions = group.options.filter(o => selectedIds.includes(o.id));
      
      groupOptions.forEach(opt => {
        optionsDelta += parseFloat(String(opt.price_delta));
        selectionSnapshot.push({
          group_name: group.name,
          option_name: opt.name,
          price_delta: opt.price_delta
        });
      });
    });

    const unitPrice = basePrice + optionsDelta;
    
    // Crear un ID único para el carrito basado en el producto + opciones elegidas
    const optionsHash = Object.values(selectedOptions).flat().sort().join('-');
    const cartItemId = optionsHash ? `${product.id}-${optionsHash}` : product.id;
    
    addItem({ 
      productId: cartItemId, 
      productName: product.name, 
      unitPrice, 
      quantity: 1,
      // @ts-ignore
      selectedOptions: selectionSnapshot 
    });
    
    setVariantModal(null);

    // Feedback visual: botón verde por 800ms
    setRecentlyAddedId(product.id);
    setTimeout(() => setRecentlyAddedId((prev) => (prev === product.id ? null : prev)), 1200);
  }

  function handleProductClick(product: Product) {
    if (!product.is_available) return;
    if (product.stock_type !== 'unlimited' && product.stock_quantity <= 0) return;

    if (product.option_groups.length > 0) {
      setVariantModal({ product });
    } else {
      handleAddToCart(product, {});
    }
  }

  function handleComboClick(combo: Combo) {
    if (!combo.is_available || isPaused) return;
    if (combo.items.length > 0) {
      setComboModal({ combo });
    } else {
      handleAddComboToCart(combo, {});
    }
  }

  function handleAddComboToCart(combo: Combo, selections: Record<string, string>) {
    addItem({
      productId: combo.id,
      productName: combo.name,
      unitPrice: parseFloat(String(combo.price)),
      quantity: 1,
      // @ts-ignore
      selectedOptions: Object.entries(selections).map(([itemId, productId]) => ({
        group_name: itemId,
        option_name: productId,
        price_delta: 0,
      })),
    });
    setComboModal(null);
    setRecentlyAddedId(combo.id);
    setTimeout(() => setRecentlyAddedId((prev) => (prev === combo.id ? null : prev)), 1200);
  }

  const isPaused = !menu.accepting_orders;
  const isClosedBySchedule = menu.accepting_orders && !menu.is_open;
  const isClosed = !menu.is_open;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header sticky */}
      <header
        className={`sticky top-0 z-20 text-white bg-[var(--tenant-primary)] transition-all ${isClosed ? 'opacity-90 grayscale-[0.5]' : ''}`}
      >
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {menu.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={menu.logo_url}
                alt={menu.tenant_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
              />
            )}
            <div>
              <h1 className="text-lg font-bold leading-tight">{menu.tenant_name}</h1>
              {isClosed && (
                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  {isClosedBySchedule ? "Fuera de horario" : "Cerrado temporalmente"}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="Mis pedidos"
            >
              <History size={22} />
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              disabled={isClosed}
              className={`relative p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors ${isClosed ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Ver carrito"
            >
              <ShoppingCart size={22} />
              {count > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center text-[var(--tenant-primary)]"
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Banner de Pausa / Fuera de Horario */}
      {isClosed && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-3 text-center">
          <p className="text-sm font-bold text-red-800">
            {isClosedBySchedule
              ? "Estamos fuera de nuestro horario de atención. ¡Volvemos pronto!"
              : menu.paused_reason || "No estamos recibiendo pedidos en este momento."}
          </p>
        </div>
      )}

      {/* Barra de categorías sticky */}
      <div className="sticky top-[64px] z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-md mx-auto px-4">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === "all"
                  ? "bg-[var(--tenant-primary)] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
            {activeCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? "bg-[var(--tenant-primary)] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Productos por categoría */}
      <main className="max-w-md mx-auto px-4 pb-28 space-y-8 pt-4">
        {filteredCategories.map((category) => (
          <section key={category.id}>
            <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-[var(--tenant-primary)] rounded-full" />
              {category.name}
            </h2>
            
            <div className="space-y-4">
              {/* Renderizar Combos Primero */}
              {category.combos.map((combo) => {
                const justAdded = recentlyAddedId === combo.id;
                return (
                  <div
                    key={combo.id}
                    onClick={() => handleComboClick(combo)}
                    className="flex flex-col bg-white rounded-2xl border-2 border-orange-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <div className="flex gap-3 p-3">
                      {combo.image_url && (
                        <img src={combo.image_url} alt={combo.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-orange-500 text-[9px] h-4 uppercase">Combo</Badge>
                          <h3 className="font-black text-gray-900 text-sm truncate">{combo.name}</h3>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{combo.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-black text-base text-gray-900">${formatPrice(combo.price)}</span>
                          <button
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition-all ${
                              justAdded ? "bg-green-500 scale-110" : "bg-orange-500"
                            }`}
                          >
                            {justAdded ? <Check size={18} /> : <Plus size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Renderizar Productos */}
              {category.products.map((product) => {
                const justAdded = recentlyAddedId === product.id;
                const isOutOfStock = product.stock_type !== 'unlimited' && product.stock_quantity <= 0;
                const isDisabled = !product.is_available || isOutOfStock || isPaused;

                return (
                  <div
                    key={product.id}
                    onClick={() => !isDisabled && handleProductClick(product)}
                    className={`flex gap-3 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm ${
                      !isDisabled
                        ? "cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
                        : "opacity-70 grayscale-[0.3]"
                    }`}
                  >
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0 py-1">
                      <h3 className="font-bold text-gray-900 text-sm">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-black text-base text-gray-900">
                          ${formatPrice(product.price)}
                        </span>
                        
                        {isOutOfStock ? (
                          <span className="text-[9px] font-black text-red-500 uppercase bg-red-50 px-2 py-1 rounded tracking-tighter">Agotado</span>
                        ) : product.is_available ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isPaused) handleProductClick(product);
                            }}
                            disabled={isPaused}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition-all ${
                              justAdded ? "bg-green-500 scale-110" : "bg-[var(--tenant-primary)]"
                            } ${isPaused ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {justAdded ? <Check size={18} /> : <Plus size={18} />}
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold text-gray-400 uppercase">No disp.</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      {/* FAB flotante del carrito */}
      {count > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-30">
          <button
            onClick={() => setIsCartOpen(true)}
            className="text-white font-semibold py-4 px-6 rounded-2xl shadow-lg flex items-center gap-3 transition-all hover:scale-105 active:scale-95 bg-[var(--tenant-primary)]"
          >
            <ShoppingCart size={20} />
            <span>Ver pedido</span>
            <span
              className="bg-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold text-[var(--tenant-primary)]"
            >
              {count}
            </span>
            <span className="text-white/80 text-sm ml-1">${formatPrice(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Sheet del carrito */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="bottom" className="h-[80vh] p-0 gap-0">
          <SheetHeader className="px-4 pt-4 pb-0">
            <SheetTitle>Tu Pedido</SheetTitle>
          </SheetHeader>
          <CartPanel
            tenantSlug={tenant}
            onClose={() => setIsCartOpen(false)}
            primaryColor={primaryColor}
          />
        </SheetContent>
      </Sheet>

      {/* Sheet de Historial */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent side="bottom" className="h-[80vh] p-0 gap-0 overflow-hidden flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2 border-b">
            <SheetTitle className="flex items-center gap-2">
              <History size={20} className="text-orange-500" /> Mis Pedidos
            </SheetTitle>
          </SheetHeader>
          
          <div className="p-4 bg-gray-50/50 border-b">
            <div className="flex gap-2">
              <Input 
                placeholder="Ingresá tu teléfono" 
                value={historyPhone}
                onChange={(e) => setHistoryPhone(e.target.value)}
                type="tel"
                className="rounded-xl"
              />
              <Button
                onClick={handleSearchHistory}
                disabled={isSearchingHistory || historyPhone.length < 8}
                className="rounded-xl text-white bg-[var(--tenant-primary)]"
              >
                {isSearchingHistory ? "..." : "Buscar"}
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-medium">Mostrando los últimos 10 pedidos.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {orderHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <Receipt size={40} className="text-gray-200" />
                <p className="text-sm text-gray-500 font-medium">
                  {historyPhone ? "No encontramos pedidos con ese número." : "Buscá tus pedidos para ver el estado en vivo."}
                </p>
              </div>
            ) : (
              orderHistory.map((order) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.failed;
                const Icon = cfg.Icon;
                return (
                  <Link 
                    key={order.id} 
                    href={`/order/${order.id}?tenant=${tenant}`}
                    className="block group active:scale-[0.98] transition-all"
                  >
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-[var(--tenant-primary)]/30 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold">
                          {format(new Date(order.created_at), "dd MMM, HH:mm", { locale: es })}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center`}>
                            <Icon size={18} className={cfg.textColor} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{cfg.badge}</p>
                            <p className="text-xs text-gray-500">${parseFloat(String(order.total_amount)).toLocaleString('es-AR')}</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-[var(--tenant-primary)] group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal de opciones */}
      {variantModal && (
        <ProductOptionsModal 
          product={variantModal.product} 
          onClose={() => setVariantModal(null)} 
          onAdd={(options) => handleAddToCart(variantModal.product, options)}
        />
      )}

      {/* Modal de Combos */}
      {comboModal && (
        <ComboOptionsModal 
          combo={comboModal.combo}
          allProducts={menu.categories.flatMap(c => c.products)}
          onClose={() => setComboModal(null)}
          onAdd={(selections) => handleAddComboToCart(comboModal.combo, selections)}
        />
      )}
    </div>
  );
}

// ── Combo Options Modal ────────────────────────────────────────────────────

function ComboOptionsModal({ combo, allProducts, onClose, onAdd }: { combo: any, allProducts: any[], onClose: () => void, onAdd: (opts: any) => void }) {
  const [selections, setSelections] = useState<Record<string, string>>({});

  const isReady = combo.items.every((item: any) => !item.is_required || selections[item.id]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b flex items-start justify-between sticky top-0 bg-white z-10">
          <div className="flex-1">
            <h3 className="font-black text-xl text-gray-900 leading-tight">{combo.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{combo.description}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {combo.items.map((comboItem: any) => {
            const allowedIds = comboItem.product_ids || [];
            const availableProducts = allProducts.filter(p => allowedIds.includes(p.id));
            
            return (
              <div key={comboItem.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-gray-800 flex items-center gap-2 uppercase tracking-tight">
                    {comboItem.name}
                    {comboItem.is_required && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Obligatorio</span>}
                  </h4>
                </div>

                <div className="space-y-2">
                  {availableProducts.map(p => {
                    const isSelected = selections[comboItem.id] === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelections({...selections, [comboItem.id]: p.id})}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                          isSelected ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <span className={`text-sm font-bold ${isSelected ? 'text-orange-900' : 'text-gray-600'}`}>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t bg-white pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <Button
            onClick={() => onAdd(selections)}
            disabled={!isReady}
            className="w-full h-14 rounded-2xl text-base font-black gap-2 transition-all active:scale-95 bg-orange-500 text-white hover:bg-orange-600"
          >
            <span>Añadir Combo</span>
            <span className="opacity-30">•</span>
            <span>${parseFloat(String(combo.price)).toLocaleString('es-AR')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Product Options Modal ──────────────────────────────────────────────────

function ProductOptionsModal({ product, onClose, onAdd }: { product: Product, onClose: () => void, onAdd: (opts: any) => void }) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  
  // Inicializar selecciones obligatorias con la primera opción si es max=1
  useEffect(() => {
    const initial: Record<string, string[]> = {};
    product.option_groups.forEach(group => {
      if (group.is_required && group.max_options === 1 && group.options.length > 0) {
        initial[group.id] = [group.options[0].id];
      }
    });
    setSelections(initial);
  }, [product]);

  const toggleOption = (groupId: string, optionId: string, max: number) => {
    setSelections(prev => {
      const current = prev[groupId] || [];
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter(id => id !== optionId) };
      }
      
      if (max === 1) {
        return { ...prev, [groupId]: [optionId] };
      }
      
      if (current.length < max) {
        return { ...prev, [groupId]: [...current, optionId] };
      }
      
      return prev;
    });
  };

  const calculateTotal = () => {
    let total = parseFloat(String(product.price));
    product.option_groups.forEach(group => {
      const selectedIds = selections[group.id] || [];
      group.options.forEach(opt => {
        if (selectedIds.includes(opt.id)) {
          total += parseFloat(String(opt.price_delta));
        }
      });
    });
    return total;
  };

  const isReady = product.option_groups.every(group => {
    const count = (selections[group.id] || []).length;
    return count >= group.min_options;
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b flex items-start justify-between sticky top-0 bg-white z-10">
          <div className="flex-1">
            <h3 className="font-black text-xl text-gray-900 leading-tight">{product.name}</h3>
            {product.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>}
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {product.option_groups.map(group => (
            <div key={group.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    {group.name}
                    {group.is_required && <span className="text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Obligatorio</span>}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    {group.max_options === 1 ? 'Seleccioná 1 opción' : `Seleccioná hasta ${group.max_options}`}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {group.options.map(opt => {
                  const isSelected = (selections[group.id] || []).includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleOption(group.id, opt.id, group.max_options)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                        isSelected ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary)]/5 ring-1 ring-[var(--tenant-primary)]' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-[var(--tenant-primary)] bg-[var(--tenant-primary)]' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <span className={`text-sm font-bold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{opt.name}</span>
                      </div>
                      {parseFloat(String(opt.price_delta)) > 0 && (
                        <span className="text-sm font-black text-gray-900">+ ${parseFloat(String(opt.price_delta)).toLocaleString('es-AR')}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t bg-white pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <Button
            onClick={() => onAdd(selections)}
            disabled={!isReady}
            className="w-full h-14 rounded-2xl text-base font-black gap-2 transition-all active:scale-95 bg-[var(--tenant-primary)] text-white"
          >
            <span>Agregar</span>
            <span className="opacity-30">•</span>
            <span>${calculateTotal().toLocaleString('es-AR')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
