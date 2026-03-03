"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "motion/react";
import {
  AlertCircle,
  Banknote,
  Check,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  MapPin,
  Wallet,
} from "lucide-react";
import { fetchTenantPublic } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useOrderPolling } from "@/hooks/useOrderPolling";
import { useCartStore } from "@/store/cart";
import { TransferFlow } from "@/components/TransferFlow";
import { STATUS_CONFIG } from "@/lib/status-config";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
    >
      {copied ? (
        <>
          <Check size={13} className="text-green-500" />
          <span className="text-green-600">Copiado</span>
        </>
      ) : (
        <>
          <Copy size={13} />
          {label}
        </>
      )}
    </button>
  );
}

function OrderContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = params.id as string;
  const tenant = searchParams.get("tenant");

  const { clearCart, clearPendingCart, restorePendingCart } = useCartStore();
  const { order, error } = useOrderPolling(orderId);

  const { data: tenantData } = useQuery({
    queryKey: ["tenant-public", tenant],
    queryFn: () => fetchTenantPublic(tenant!),
    enabled: !!tenant,
    staleTime: 5 * 60 * 1000,
  });

  const primaryColor = tenantData?.primary_color ?? "#f97316";

  // Handle cart on first order load
  const cartHandledRef = useRef(false);
  useEffect(() => {
    if (order && !cartHandledRef.current) {
      cartHandledRef.current = true;
      if (order.status === "failed") {
        restorePendingCart();
      } else {
        clearCart();
        clearPendingCart();
      }
    }
  }, [order]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Pedido no encontrado</h1>
          <p className="text-sm text-gray-500">
            No pudimos cargar los datos de tu pedido.
          </p>
          <Button variant="outline" className="w-full" asChild>
            <Link href={tenant ? `/${tenant}` : "/"}>Volver al menú</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Fake header */}
        <div className="bg-white border-b border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full skeleton-shimmer" />
          <div className="h-4 w-32 rounded-md skeleton-shimmer" />
        </div>
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
          {/* Status badge skeleton */}
          <div className="rounded-2xl border border-gray-100 p-5 space-y-3 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full skeleton-shimmer flex-shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3 w-24 rounded skeleton-shimmer" />
                <div className="h-3 w-16 rounded skeleton-shimmer" />
              </div>
            </div>
            <div className="h-4 w-3/4 rounded skeleton-shimmer" />
          </div>
          {/* Payment badge skeleton */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 h-12 skeleton-shimmer" />
          {/* Items skeleton */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <div className="h-4 w-24 rounded skeleton-shimmer" />
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-40 rounded skeleton-shimmer" />
                <div className="h-4 w-16 rounded skeleton-shimmer" />
              </div>
            ))}
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <div className="h-5 w-12 rounded skeleton-shimmer" />
              <div className="h-6 w-20 rounded skeleton-shimmer" />
            </div>
          </div>
          {/* Button skeleton */}
          <div className="h-12 rounded-xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.failed;
  const { Icon } = statusCfg;

  const isTransferPending =
    order.payment_method === "transfer" && order.status === "awaiting_transfer";
  const showEstimated =
    order.status === "confirmed" || order.status === "preparing";

  const handleRetry = () => {
    restorePendingCart();
    router.push(tenant ? `/${tenant}/checkout` : "/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          {tenantData?.logo_url && (
            <img
              src={tenantData.logo_url}
              alt={tenantData.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <span className="font-semibold text-gray-800">
            {tenantData?.name ?? "Tu pedido"}
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Status badge */}
        <motion.div
          key={order.status}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-5 space-y-2 ${statusCfg.bg} ${statusCfg.border}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <Icon size={20} className={statusCfg.textColor} />
            </div>
            <div className="flex-1">
              <p className={`text-xs font-semibold uppercase tracking-wide ${statusCfg.textColor}`}>
                {statusCfg.badge}
              </p>
              <p className="text-xs text-gray-400">
                #{orderId.slice(0, 8).toUpperCase()}
              </p>
            </div>
            {/* Live polling indicator */}
            {!["delivered", "failed"].includes(order.status) && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-gray-400 hidden sm:inline">En vivo</span>
              </div>
            )}
          </div>
          <p className={`text-sm font-medium ${statusCfg.textColor}`}>
            {statusCfg.label}
          </p>
        </motion.div>

        {/* Tiempo estimado */}
        {showEstimated && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-center">
            <p className="text-sm font-medium text-blue-800">
              ⏱ Tiempo estimado:{" "}
              {order.order_type === "delivery" ? "30-40 minutos" : "15-20 minutos"}
            </p>
          </div>
        )}

        {/* Flujo de transferencia (datos + upload + validación) */}
        {isTransferPending && (
          <TransferFlow
            orderId={orderId}
            order={order}
            primaryColor={primaryColor}
            tenant={tenant}
          />
        )}

        {/* Badge método de pago (cuando no hay datos de transferencia visibles) */}
        {!isTransferPending && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            {order.payment_method === "mercadopago" && order.status !== "pending" && (
              <div className="flex items-center gap-2 text-sm">
                <CreditCard size={16} className="text-blue-500" />
                <span className="font-medium text-gray-700">Pagado con MercadoPago</span>
                <span className="ml-auto">✅</span>
              </div>
            )}
            {order.payment_method === "mercadopago" && order.status === "pending" && (
              <div className="flex items-center gap-2 text-sm">
                <CreditCard size={16} className="text-blue-500" />
                <span className="font-medium text-gray-700">MercadoPago</span>
                <Clock size={14} className="text-yellow-500 ml-auto animate-pulse" />
              </div>
            )}
            {order.payment_method === "transfer" && order.status !== "awaiting_transfer" && (
              <div className="flex items-center gap-2 text-sm">
                <Banknote size={16} className="text-blue-500" />
                <span className="font-medium text-gray-700">Transferencia confirmada</span>
                <span className="ml-auto">✅</span>
              </div>
            )}
            {order.payment_method === "cash" && (
              <div className="flex items-center gap-2 text-sm">
                <Wallet size={16} className="text-green-500" />
                <span className="font-medium text-gray-700">
                  Pago en efectivo al retirar 💵
                </span>
              </div>
            )}
          </div>
        )}

        {/* Resumen del pedido */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">Tu pedido</h2>
          <ul className="space-y-2">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.quantity}× {item.product_name}
                </span>
                <span className="font-medium text-gray-900">
                  ${parseFloat(String(item.subtotal)).toLocaleString("es-AR")}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-2">
            {(order.delivery_fee || order.discount_amount) ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal productos</span>
                <span className="text-gray-700">
                  ${(
                    parseFloat(String(order.total_amount))
                    + (order.discount_amount ? parseFloat(String(order.discount_amount)) : 0)
                    - (order.delivery_fee ?? 0)
                  ).toLocaleString("es-AR")}
                </span>
              </div>
            ) : null}
            {order.discount_amount && parseFloat(String(order.discount_amount)) > 0 ? (
              <div className="flex justify-between text-sm font-medium text-red-600">
                <span>Descuento aplicado</span>
                <span>-${parseFloat(String(order.discount_amount)).toLocaleString("es-AR")}</span>
              </div>
            ) : null}
            {order.delivery_fee ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Envío (Cabify)</span>
                <span className="text-gray-700">
                  ${order.delivery_fee.toLocaleString("es-AR")}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between items-center pt-1 border-t border-gray-100">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-bold text-xl" style={{ color: primaryColor }}>
                ${parseFloat(String(order.total_amount)).toLocaleString("es-AR")}
              </span>
            </div>
          </div>
        </div>

        {/* Tracking de Cabify — aparece desde que se crea el delivery_job */}
        {order.order_type === "delivery" && order.delivery_job &&
          !["delivered", "cancelled", "failed"].includes(order.delivery_job.status) && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
            {/* Título según estado */}
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <MapPin size={16} className="text-green-500" />
              {order.delivery_job.status === "picked_up"
                ? "Tu pedido está en camino 🛵"
                : order.delivery_job.status === "assigned"
                ? "Conductor asignado"
                : "Coordinando el envío..."}
            </div>

            {/* ETA si disponible */}
            {order.delivery_job.estimated_delivery_sec && (
              <p className="text-xs text-gray-500">
                Tiempo estimado de entrega:{" "}
                <span className="font-medium text-gray-700">
                  ~{Math.round(order.delivery_job.estimated_delivery_sec / 60)} min
                </span>
              </p>
            )}

            {/* Info del conductor */}
            {order.delivery_job.driver_name && (
              <p className="text-sm text-gray-500">
                🧑‍✈️ {order.delivery_job.driver_name}
                {order.delivery_job.driver_vehicle_name && (
                  <span className="text-gray-400"> · {order.delivery_job.driver_vehicle_name}</span>
                )}
                {order.delivery_job.driver_vehicle_plate && (
                  <span className="text-gray-400"> · {order.delivery_job.driver_vehicle_plate}</span>
                )}
              </p>
            )}

            {/* Link de tracking */}
            {order.delivery_job.tracking_url ? (
              <a
                href={order.delivery_job.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Ver seguimiento en tiempo real
                <ExternalLink size={13} />
              </a>
            ) : (
              <p className="text-xs text-gray-400 italic">
                El link de seguimiento estará disponible cuando un conductor sea asignado.
              </p>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="space-y-3 pb-6">
          {order.status === "failed" && order.payment_method === "mercadopago" && (
            <Button
              onClick={handleRetry}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold h-12 rounded-xl"
            >
              Reintentar pago
            </Button>
          )}
          <Button variant="outline" className="w-full h-12 rounded-xl" asChild>
            <Link href={tenant ? `/${tenant}` : "/"}>
              {order.status === "failed" ? "Hacer un nuevo pedido" : "Volver al menú"}
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full skeleton-shimmer" />
        <div className="h-4 w-32 rounded-md skeleton-shimmer" />
      </div>
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div className="rounded-2xl border border-gray-100 p-5 space-y-3 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full skeleton-shimmer flex-shrink-0" />
            <div className="space-y-1.5">
              <div className="h-3 w-24 rounded skeleton-shimmer" />
              <div className="h-3 w-16 rounded skeleton-shimmer" />
            </div>
          </div>
          <div className="h-4 w-3/4 rounded skeleton-shimmer" />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 h-12 skeleton-shimmer" />
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="h-4 w-24 rounded skeleton-shimmer" />
          {[1, 2].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-40 rounded skeleton-shimmer" />
              <div className="h-4 w-16 rounded skeleton-shimmer" />
            </div>
          ))}
          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <div className="h-5 w-12 rounded skeleton-shimmer" />
            <div className="h-6 w-20 rounded skeleton-shimmer" />
          </div>
        </div>
        <div className="h-12 rounded-xl skeleton-shimmer" />
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<OrderSkeleton />}>
      <OrderContent />
    </Suspense>
  );
}
