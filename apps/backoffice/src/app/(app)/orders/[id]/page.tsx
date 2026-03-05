"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useState } from "react";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  Wallet,
  Truck,
  ExternalLink,
  FileText,
  ZoomIn,
  X,
  Calculator,
} from "lucide-react";
import api from "@/lib/api";
import { Order, OrderStatus, OrderType, type DeliveryJob, type TransferPaymentInfo } from "@/types/orders";
import StatusBadge from "@/components/orders/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EstimateResult {
  parcel_id: string;
  fee_amount: number | null;
  fee_currency: string | null;
  eta_to_pickup_sec: number | null;
  eta_to_delivery_sec: number | null;
  delivery_job_id: string;
}

function formatSeconds(secs: number | null): string {
  if (secs == null) return "—";
  const mins = Math.round(secs / 60);
  return `${mins} min`;
}

function formatPrice(amount: number | null, currency: string | null): string {
  if (amount == null) return "—";
  const major = amount / 100;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency || "ARS",
    minimumFractionDigits: 0,
  }).format(major);
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

const TRANSFER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  awaiting_payment:  { label: "Sin confirmar",       color: "bg-gray-100 text-gray-700" },
  payment_declared:  { label: "Pago declarado",       color: "bg-blue-100 text-blue-700" },
  voucher_uploaded:  { label: "Comprobante enviado",  color: "bg-blue-100 text-blue-700" },
  under_review:      { label: "En revisión",          color: "bg-yellow-100 text-yellow-700" },
  confirmed:         { label: "Confirmado",           color: "bg-green-100 text-green-700" },
  rejected:          { label: "Rechazado",            color: "bg-red-100 text-red-700" },
};

function VoucherCard({ tp }: { tp: TransferPaymentInfo }) {
  const [lightbox, setLightbox] = useState(false);
  const statusCfg = TRANSFER_STATUS_CONFIG[tp.status] ?? { label: tp.status, color: "bg-gray-100 text-gray-700" };
  const voucherFullUrl = tp.voucher_url ? `${API_BASE}${tp.voucher_url}` : null;
  const isPdf = tp.voucher_url?.endsWith(".pdf");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote size={18} className="text-gray-500" />
            Comprobante de transferencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Estado</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>

          {/* Declarado en */}
          {tp.declared_at && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Declarado</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(tp.declared_at).toLocaleString("es-AR")}
              </span>
            </div>
          )}

          {/* Número de operación */}
          {tp.operation_number && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">N.º operación</span>
              <span className="text-sm font-mono font-medium text-gray-900">{tp.operation_number}</span>
            </div>
          )}

          {/* Motivo de rechazo */}
          {tp.rejection_reason && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              <p className="text-xs text-red-600 font-medium">Motivo de rechazo</p>
              <p className="text-sm text-red-800 mt-0.5">{tp.rejection_reason}</p>
            </div>
          )}

          {/* Comprobante */}
          {voucherFullUrl ? (
            isPdf ? (
              <a
                href={voucherFullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-200">
                  <FileText size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Ver comprobante PDF</p>
                  <p className="text-xs text-blue-500 flex items-center gap-1">
                    <ExternalLink size={11} /> Abre en nueva pestaña
                  </p>
                </div>
              </a>
            ) : (
              <button
                onClick={() => setLightbox(true)}
                className="group relative w-full rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={voucherFullUrl}
                  alt="Comprobante de transferencia"
                  className="w-full max-h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                </div>
              </button>
            )
          ) : (
            <p className="text-sm text-gray-400 italic">Sin comprobante adjunto</p>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      {lightbox && voucherFullUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/60"
            onClick={() => setLightbox(false)}
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={voucherFullUrl}
            alt="Comprobante de transferencia"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

const DriverMap = dynamic(() => import("@/components/DriverMap"), { ssr: false });

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "failed"],
  awaiting_transfer: ["failed"],
  confirmed: ["preparing", "failed"],
  preparing: ["ready", "failed"],
  ready: ["dispatched", "delivered", "failed"],
  dispatched: ["delivered", "failed"],
  delivered: [],
  failed: [],
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmar pedido",
  preparing: "Comenzar preparación",
  ready: "Listo para entregar",
  dispatched: "Despachar",
  delivered: "Marcar como entregado",
  failed: "Cancelar pedido",
};

const PAYMENT_METHOD_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  mercadopago: { label: "MercadoPago", icon: CreditCard },
  transfer: { label: "Transferencia", icon: Banknote },
  cash: { label: "Efectivo", icon: Wallet },
};

const DELIVERY_JOB_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-gray-100 text-gray-700" },
  assigned: { label: "Repartidor asignado", color: "bg-blue-100 text-blue-700" },
  picked_up: { label: "Recogido", color: "bg-orange-100 text-orange-700" },
  delivered: { label: "Entregado", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
  failed: { label: "Fallido", color: "bg-red-100 text-red-700" },
};

const PROVIDER_LABELS: Record<string, string> = {
  uber: "Uber Flash",
  cabify: "Cabify",
  manual: "Manual",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/backoffice/orders/${id}`);
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { data } = await api.patch(
        `/api/v1/backoffice/orders/${id}/status`,
        { status: newStatus }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });

  const confirmTransferMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch(
        `/api/v1/backoffice/orders/${id}/confirm-transfer`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/api/v1/backoffice/orders/${id}/dispatch`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
    },
  });

  const cancelDispatchMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/v1/backoffice/orders/${id}/cancel-dispatch`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Cargando pedido...
      </div>
    );
  }

  if (!order) {
    return <div className="text-red-500">Pedido no encontrado.</div>;
  }

  const nextStatuses = VALID_TRANSITIONS[order.status] ?? [];
  const primaryStatuses = nextStatuses.filter((s) => s !== "failed");
  const isFailed = nextStatuses.includes("failed");
  const isAwaitingTransfer = order.status === OrderStatus.AWAITING_TRANSFER;
  const isDelivery = order.order_type === OrderType.DELIVERY;

  const paymentInfo = order.payment_method
    ? PAYMENT_METHOD_LABELS[order.payment_method]
    : null;

  const deliveryJob: DeliveryJob | null = order.delivery_job ?? null;
  const jobStatusInfo = deliveryJob
    ? DELIVERY_JOB_STATUS_LABELS[deliveryJob.status] ?? { label: deliveryJob.status, color: "bg-gray-100 text-gray-600" }
    : null;

  const canDispatch =
    isDelivery &&
    order.status === OrderStatus.READY &&
    (!deliveryJob || deliveryJob.status === "cancelled" || deliveryJob.status === "failed");

  const canCancelDispatch =
    isDelivery &&
    deliveryJob &&
    deliveryJob.status === "pending";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/orders")}
          className="gap-1.5"
        >
          <ArrowLeft size={16} />
          Volver a pedidos
        </Button>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-bold text-gray-900">
            Pedido #{order.id.slice(0, 8).toUpperCase()}
          </h2>
          <StatusBadge status={order.status as OrderStatus} size="lg" />
          {paymentInfo && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              <paymentInfo.icon size={14} />
              {paymentInfo.label}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Info del cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <User size={15} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Nombre</p>
                <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={15} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Teléfono</p>
                <p className="text-sm font-medium text-gray-900">{order.customer_phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={15} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Tipo</p>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {order.order_type === OrderType.DELIVERY ? "🛵 Delivery" : "🏃 Retiro"}
                </p>
              </div>
            </div>
            {order.customer_address && (
              <div className="flex items-start gap-3">
                <MapPin size={15} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Dirección</p>
                  <p className="text-sm font-medium text-gray-900">{order.customer_address}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Clock size={15} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Fecha y hora</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(order.created_at).toLocaleString("es-AR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {/* Ítems del pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Ítems del pedido</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.quantity}× {item.product_name}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-gray-400 italic">{item.notes}</p>
                    )}
                  </div>
                  <p className="font-medium text-gray-900">
                    ${(item.unit_price * item.quantity).toLocaleString("es-AR")}
                  </p>
                </div>
              ))}
              <div className="pt-3 flex justify-end">
                <p className="text-base font-bold text-gray-900">
                  Total: ${order.total_amount.toLocaleString("es-AR")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Comprobante de transferencia */}
          {order.payment_method === "transfer" && order.transfer_payment && (
            <VoucherCard tp={order.transfer_payment} />
          )}

          {/* Sección logística (solo delivery) */}
          {isDelivery && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck size={18} className="text-gray-500" />
                  Logística
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deliveryJob ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Proveedor</span>
                      <span className="text-sm font-medium text-gray-900">
                        {PROVIDER_LABELS[deliveryJob.provider] ?? deliveryJob.provider}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Estado del viaje</span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${jobStatusInfo?.color}`}
                      >
                        {jobStatusInfo?.label}
                      </span>
                    </div>
                    {deliveryJob.driver_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Repartidor</span>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{deliveryJob.driver_name}</p>
                          {deliveryJob.driver_phone && (
                            <a
                              href={`tel:${deliveryJob.driver_phone}`}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {deliveryJob.driver_phone}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    {deliveryJob.estimated_delivery_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">ETA</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(deliveryJob.estimated_delivery_at).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                    {deliveryJob.tracking_url && (
                      <a
                        href={deliveryJob.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                      >
                        <ExternalLink size={12} />
                        Ver tracking del proveedor
                      </a>
                    )}
                    {/* Mapa del repartidor */}
                    {deliveryJob.driver_lat && deliveryJob.driver_lng && (
                      <div className="rounded-lg overflow-hidden border border-gray-100 mt-2">
                        <DriverMap lat={deliveryJob.driver_lat} lng={deliveryJob.driver_lng} />
                      </div>
                    )}
                    {/* Botón cancelar viaje */}
                    {canCancelDispatch && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => cancelDispatchMutation.mutate()}
                        disabled={cancelDispatchMutation.isPending}
                      >
                        {cancelDispatchMutation.isPending ? "Cancelando..." : "Cancelar viaje"}
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Sin viaje asignado.</p>
                )}

                {/* Botón despachar */}
                {canDispatch && (
                  <Button
                    size="sm"
                    className="w-full text-white font-medium"
                    style={{ backgroundColor: "var(--backoffice-primary)" }}
                    onClick={() => dispatchMutation.mutate()}
                    disabled={dispatchMutation.isPending}
                  >
                    {dispatchMutation.isPending ? "Despachando..." : "🛵 Despachar ahora"}
                  </Button>
                )}
                {dispatchMutation.isError && (
                  <p className="text-xs text-red-600">Error al despachar el pedido.</p>
                )}
                {cancelDispatchMutation.isError && (
                  <p className="text-xs text-red-600">Error al cancelar el viaje.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Acciones de estado */}
          {(nextStatuses.length > 0 || isAwaitingTransfer) && (
            <Card>
              <CardHeader>
                <CardTitle>Cambiar estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isAwaitingTransfer && (
                  <Button
                    onClick={() => confirmTransferMutation.mutate()}
                    disabled={confirmTransferMutation.isPending}
                    className="w-full text-white font-medium bg-green-600 hover:bg-green-700"
                  >
                    {confirmTransferMutation.isPending
                      ? "Confirmando..."
                      : "✓ Confirmar pago recibido"}
                  </Button>
                )}

                {primaryStatuses.map((s) => (
                  <Button
                    key={s}
                    onClick={() => mutation.mutate(s)}
                    disabled={mutation.isPending}
                    className="w-full text-white font-medium"
                    style={{ backgroundColor: "var(--backoffice-primary)" }}
                  >
                    {STATUS_LABELS[s] ?? s}
                  </Button>
                ))}

                {isFailed && (
                  <Button
                    variant="destructive"
                    onClick={() => mutation.mutate("failed")}
                    disabled={mutation.isPending}
                    className="w-full"
                  >
                    Cancelar pedido
                  </Button>
                )}
                {(mutation.isError || confirmTransferMutation.isError) && (
                  <p className="text-sm text-red-600">
                    Error al cambiar el estado.
                  </p>
                )}
                {(mutation.isSuccess || confirmTransferMutation.isSuccess) && (
                  <p className="text-sm text-green-600">
                    Estado actualizado correctamente.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {nextStatuses.length === 0 && !isAwaitingTransfer && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Este pedido está en un estado final y no admite más cambios.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
