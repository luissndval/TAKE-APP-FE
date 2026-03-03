"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Loader2, MapPin, User, Phone, CreditCard, Banknote, Wallet, Mail, Ticket, Tag } from "lucide-react";
import {
  createOrder,
  createPaymentPreference,
  fetchTenantPublic,
  apiClient,
  type PaymentMethod,
} from "@/lib/api";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { useCartStore } from "@/store/cart";
import { useDeliveryQuote } from "@/hooks/useDeliveryQuote";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

const checkoutSchema = z
  .object({
    customer_name: z.string().min(2, "Ingresá tu nombre"),
    customer_phone: z.string().min(8, "Ingresá un teléfono válido"),
    customer_email: z.string().email("Ingresá un email válido").optional().or(z.literal("")),
    order_type: z.enum(["takeaway", "delivery"]),
    customer_address: z.string().optional(),
    payment_method: z.enum(["mercadopago", "transfer", "cash"]),
    coupon_code: z.string().optional(),
  })
  .refine(
    (data) =>
      data.order_type !== "delivery" ||
      (data.customer_address && data.customer_address.length > 5),
    {
      message: "Ingresá tu dirección de entrega",
      path: ["customer_address"],
    }
  );

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface PageProps {
  params: { tenant: string };
}

const PAYMENT_OPTIONS: {
  value: PaymentMethod;
  label: string;
  icon: React.ElementType;
}[] = [
    { value: "mercadopago", label: "MercadoPago", icon: CreditCard },
    { value: "transfer", label: "Transferencia bancaria", icon: Banknote },
    { value: "cash", label: "Efectivo", icon: Wallet },
  ];

export default function CheckoutPage({ params }: PageProps) {
  const { tenant } = params;
  const router = useRouter();
  const { items, total, saveCartForMp, clearCart } = useCartStore();
  const [error, setError] = useState<string | null>(null);
  const [overlayMethod, setOverlayMethod] = useState<"cash" | "transfer" | "mercadopago" | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount_amount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const cartTotal = total();

  const {
    mutate: consultarCotizacion,
    isPending: quoteLoading,
    data: quote,
    reset: resetQuote,
  } = useDeliveryQuote();

  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      setCouponError(null);
      const { data } = await apiClient.post("/orders/validate-coupon", null, {
        params: { tenant_slug: tenant, code, amount: cartTotal }
      });
      return data;
    },
    onSuccess: (data) => {
      setAppliedCoupon({
        id: data.id,
        code: data.code,
        discount_amount: parseFloat(data.discount_amount)
      });
    },
    onError: (err: any) => {
      setCouponError(err.response?.data?.detail || "Cupón inválido");
      setAppliedCoupon(null);
    }
  });

  const { data: tenantData } = useQuery({
    queryKey: ["tenant-public", tenant],
    queryFn: () => fetchTenantPublic(tenant),
    staleTime: 5 * 60 * 1000,
  });

  const primaryColor = tenantData?.primary_color ?? "#f97316";

  // Aplicar theming en :root para cubrir portals de Radix UI
  useEffect(() => {
    if (!tenantData?.primary_color) return;
    const root = document.documentElement;
    root.style.setProperty("--tenant-primary", tenantData.primary_color);
    root.style.setProperty("--tenant-secondary", tenantData.secondary_color ?? "#2d2d2d");
    if (tenantData.font_family) root.style.setProperty("--font-sans", tenantData.font_family);
  }, [tenantData]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema) as any,
    defaultValues: { order_type: "takeaway", payment_method: "mercadopago" },
  });

  const orderType = watch("order_type");
  const paymentMethod = watch("payment_method");
  const watchedAddress = watch("customer_address");

  // Determine enabled methods from tenant config
  const enabledMethods = PAYMENT_OPTIONS.filter((opt) => {
    const pm = tenantData?.payment_methods;
    if (!pm) return opt.value === "mercadopago";
    return pm[opt.value];
  });

  // For delivery, hide cash
  const availableMethods =
    orderType === "delivery"
      ? enabledMethods.filter((m) => m.value !== "cash")
      : enabledMethods;

  // Auto-select correct default when tenant data loads
  useEffect(() => {
    if (!tenantData) return;
    const pm = tenantData.payment_methods;
    const first = PAYMENT_OPTIONS.find((opt) =>
      pm ? pm[opt.value] : opt.value === "mercadopago"
    );
    if (first) setValue("payment_method", first.value);
  }, [tenantData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset to non-cash when switching to delivery
  useEffect(() => {
    if (orderType === "delivery" && paymentMethod === "cash") {
      const pm = tenantData?.payment_methods;
      const first = PAYMENT_OPTIONS.find(
        (opt) =>
          opt.value !== "cash" && (pm ? pm[opt.value] : opt.value === "mercadopago")
      );
      if (first) setValue("payment_method", first.value);
    }
  }, [orderType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset delivery quote when address changes
  const prevAddressRef = useRef(watchedAddress);
  useEffect(() => {
    if (watchedAddress !== prevAddressRef.current) {
      prevAddressRef.current = watchedAddress;
      resetQuote();
    }
  }, [watchedAddress, resetQuote]);

  // Also reset quote when switching away from delivery
  useEffect(() => {
    if (orderType !== "delivery") {
      resetQuote();
    }
  }, [orderType, resetQuote]);

  const mutation = useMutation({
    mutationFn: async (formData: CheckoutFormData) => {
      setError(null);
      setOverlayMethod(formData.payment_method);

      const order = await createOrder({
        tenant_slug: tenant,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || undefined,
        customer_address: formData.customer_address,
        order_type: formData.order_type,
        payment_method: formData.payment_method,
        coupon_code: appliedCoupon?.code,
        delivery_fee_estimate:
          formData.order_type === "delivery" ? (quote?.fee_amount ?? null) : null,
        items: items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          notes: item.notes,
        })),
      });

      if (formData.payment_method === "mercadopago") {
        saveCartForMp();
        const preference = await createPaymentPreference(order.id);
        const isSandbox = process.env.NEXT_PUBLIC_API_URL?.includes("localhost");
        window.location.href = isSandbox
          ? preference.sandbox_init_point
          : preference.init_point;
      } else {
        router.push(`/order/${order.id}?tenant=${tenant}`);
      }
    },
    onError: (err: unknown) => {
      setOverlayMethod(null);
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(
        axiosErr?.response?.data?.detail ??
        axiosErr?.message ??
        "Ocurrió un error. Intentá de nuevo."
      );
    },
  });

  useEffect(() => {
    if (items.length === 0) {
      router.replace(`/${tenant}`);
    }
  }, [items.length, tenant]); // eslint-disable-line react-hooks/exhaustive-deps

  if (items.length === 0) {
    return null;
  }

  const ctaLabel = () => {
    switch (paymentMethod) {
      case "mercadopago":
        return "Pagar con MercadoPago →";
      case "transfer":
        return "Confirmar y transferir →";
      case "cash":
        return "Confirmar pedido →";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay de procesamiento — contextual por método de pago */}
      {overlayMethod && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
          style={{ backgroundColor: "rgba(245,243,239,0.97)" }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-white shadow-sm">
            {overlayMethod === "cash" ? "💵" : overlayMethod === "transfer" ? "🏦" : "💳"}
          </div>
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          <div className="text-center px-8">
            <p className="text-gray-800 font-semibold text-lg">
              {overlayMethod === "cash"
                ? "Registrando tu pedido..."
                : overlayMethod === "transfer"
                  ? "Generando datos para tu transferencia..."
                  : "Conectando con MercadoPago..."}
            </p>
            <p className="text-gray-400 text-sm mt-1">Aguardá un momento...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className="sticky top-0 z-20 text-white bg-[var(--tenant-primary)]"
      >
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">Checkout</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Tipo de pedido */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-3">Tipo de pedido</h2>
          <Controller
            control={control}
            name="order_type"
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid grid-cols-2 gap-3"
              >
                {(["takeaway", "delivery"] as const).map((type) => (
                  <Label
                    key={type}
                    htmlFor={type}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 cursor-pointer text-sm font-medium transition-colors ${orderType === type
                      ? "bg-[var(--tenant-primary)] border-[var(--tenant-primary)] text-white"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                  >
                    <RadioGroupItem value={type} id={type} className="sr-only" />
                    {type === "takeaway" ? "🏃 Retiro" : "🛵 Delivery"}
                  </Label>
                ))}
              </RadioGroup>
            )}
          />
        </div>

        {/* Datos del cliente */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-800">Tus datos</h2>

          <div className="space-y-1.5">
            <Label
              htmlFor="customer_name"
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <User size={14} className="text-gray-400" />
              Nombre y apellido
            </Label>
            <Input
              id="customer_name"
              {...register("customer_name")}
              placeholder="Juan Pérez"
              className={errors.customer_name ? "border-red-400" : ""}
            />
            {errors.customer_name && (
              <p className="text-red-500 text-xs">{errors.customer_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="customer_phone"
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <Phone size={14} className="text-gray-400" />
              Teléfono
            </Label>
            <Input
              id="customer_phone"
              {...register("customer_phone")}
              type="tel"
              placeholder="1155667788"
              className={errors.customer_phone ? "border-red-400" : ""}
            />
            {errors.customer_phone && (
              <p className="text-red-500 text-xs">{errors.customer_phone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="customer_email"
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <Mail size={14} className="text-gray-400" />
              Email (opcional)
            </Label>
            <Input
              id="customer_email"
              {...register("customer_email")}
              type="email"
              placeholder="tu@email.com"
              className={errors.customer_email ? "border-red-400" : ""}
            />
            {errors.customer_email && (
              <p className="text-red-500 text-xs">{errors.customer_email.message}</p>
            )}
            <p className="text-[10px] text-gray-400 italic">Para recibir el estado de tu pedido.</p>
          </div>

          {orderType === "delivery" && (
            <div className="space-y-1.5">
              <Label
                htmlFor="customer_address"
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <MapPin size={14} className="text-gray-400" />
                Dirección de entrega
              </Label>
              <Controller
                control={control}
                name="customer_address"
                render={({ field }) => (
                  <AddressAutocomplete
                    apiKey={tenantData?.google_maps_api_key ?? ""}
                    defaultValue={field.value}
                    onAddressSelect={(data: any) => {
                      field.onChange(data.formatted_address);
                    }}
                    className={errors.customer_address ? "border-red-400" : ""}
                  />
                )}
              />
              {errors.customer_address && (
                <p className="text-red-500 text-xs">
                  {errors.customer_address.message}
                </p>
              )}

              {/* Botón de cotización — solo si Cabify disponible y dirección >= 10 chars */}
              {watchedAddress &&
                watchedAddress.length >= 10 &&
                !quote?.fee_amount && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={quoteLoading}
                    onClick={() =>
                      consultarCotizacion({ tenantSlug: tenant, address: watchedAddress })
                    }
                    className="w-full mt-1"
                  >
                    {quoteLoading ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Consultando costo de envío...
                      </>
                    ) : (
                      "Consultar cotización de envío →"
                    )}
                  </Button>
                )}

              {/* Cotización exitosa */}
              {quote?.available && quote.fee_amount && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Envío vía Cabify:{" "}
                    <strong>
                      ~${quote.fee_amount.toLocaleString("es-AR")}{" "}
                      {quote.fee_currency}
                    </strong>
                    {quote.eta_delivery_sec && (
                      <span className="text-gray-500 ml-1">
                        · entrega en ~{Math.round(quote.eta_delivery_sec / 60)} min
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Error de cotización — mostrar sólo si ya se intentó */}
              {quote?.available && !quote.fee_amount && !quoteLoading && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  No pudimos calcular el costo de envío. Revisá la dirección e intentá de nuevo.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Método de pago */}
        {!tenantData ? (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
            <div className="h-4 w-32 rounded skeleton-shimmer" />
            <div className="h-12 rounded-xl skeleton-shimmer" />
            <div className="h-12 rounded-xl skeleton-shimmer" />
            <div className="h-12 rounded-xl skeleton-shimmer" />
          </div>
        ) : availableMethods.length > 1 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-3">Método de pago</h2>
            <Controller
              control={control}
              name="payment_method"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="space-y-2"
                >
                  {availableMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = field.value === method.value;
                    return (
                      <Label
                        key={method.value}
                        htmlFor={`pm-${method.value}`}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${isSelected
                          ? "bg-[var(--tenant-primary)] border-[var(--tenant-primary)] text-white"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                      >
                        <RadioGroupItem
                          value={method.value}
                          id={`pm-${method.value}`}
                          className="sr-only"
                        />
                        <Icon size={20} />
                        <span className="text-sm font-medium">{method.label}</span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              )}
            />
          </div>
        )}

        {/* Banner informativo para transferencia */}
        {paymentMethod === "transfer" && tenantData?.payment_methods && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 space-y-1">
            <p className="font-semibold">Datos para transferir</p>
            {tenantData.payment_methods.transfer_holder_name && (
              <p>Titular: {tenantData.payment_methods.transfer_holder_name}</p>
            )}
            {tenantData.payment_methods.transfer_cbu && (
              <p>CBU: {tenantData.payment_methods.transfer_cbu}</p>
            )}
            {tenantData.payment_methods.transfer_alias && (
              <p>Alias: {tenantData.payment_methods.transfer_alias}</p>
            )}
            <p className="text-xs text-blue-600 mt-1">
              Al confirmar, recibirás la página con los datos completos para copiar.
            </p>
          </div>
        )}

        {/* Banner informativo para efectivo */}
        {paymentMethod === "cash" && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
            💵 Pagás en efectivo al retirar tu pedido.
          </div>
        )}

        {/* Cupón de descuento */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Ticket size={18} className="text-orange-500" />
            Cupón de descuento
          </h2>

          <div className="flex gap-2">
            <Input
              placeholder="CÓDIGO"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="font-mono uppercase"
              disabled={!!appliedCoupon}
            />
            {appliedCoupon ? (
              <Button
                variant="outline"
                onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                className="text-red-500 border-red-100 hover:bg-red-50"
              >
                Quitar
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => validateCouponMutation.mutate(couponCode)}
                disabled={!couponCode || validateCouponMutation.isPending}
              >
                {validateCouponMutation.isPending ? "..." : "Aplicar"}
              </Button>
            )}
          </div>

          {couponError && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <Tag size={12} /> {couponError}
            </p>
          )}
          {appliedCoupon && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-medium">
              <Tag size={12} /> ¡Cupón {appliedCoupon.code} aplicado!
            </p>
          )}
        </div>

        {/* Resumen del pedido */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-3">Tu pedido</h2>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.quantity}× {item.productName}
                </span>
                <span className="font-medium text-gray-900">
                  ${(item.unitPrice * item.quantity).toLocaleString("es-AR")}
                </span>
              </li>
            ))}
          </ul>

          <div className="border-t border-gray-100 mt-3 pt-3 space-y-2">
            {appliedCoupon && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal productos</span>
                  <span className="text-gray-700">${cartTotal.toLocaleString("es-AR")}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-red-600">
                  <span>Descuento ({appliedCoupon.code})</span>
                  <span>-${appliedCoupon.discount_amount.toLocaleString("es-AR")}</span>
                </div>
              </>
            )}

            {orderType === "delivery" && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Envío estimado</span>
                {quote?.fee_amount ? (
                  <span className="font-medium text-gray-700">
                    ~${quote.fee_amount.toLocaleString("es-AR")}
                  </span>
                ) : (
                  <span className="text-gray-400 italic text-xs">A calcular</span>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-1 border-t border-gray-100">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-bold text-xl text-[var(--tenant-primary)]">
                ${(
                  cartTotal -
                  (appliedCoupon?.discount_amount || 0) +
                  (orderType === "delivery" ? (quote?.fee_amount ?? 0) : 0)
                ).toLocaleString("es-AR")}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Aviso de cotización obligatoria */}
        {orderType === "delivery" && quote?.available && !quote.fee_amount && !quoteLoading && (
          <p className="text-xs text-center text-red-600">
            Necesitás cotizar el envío antes de confirmar el pedido.
          </p>
        )}

        <Button
          onClick={handleSubmit((data) => mutation.mutate(data))}
          disabled={
            mutation.isPending ||
            (orderType === "delivery" && quote?.available === true && !quote.fee_amount)
          }
          className="w-full text-white font-semibold h-12 text-base rounded-xl disabled:opacity-50 bg-[var(--tenant-primary)] hover:opacity-90"
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              {paymentMethod === "mercadopago" ? "Redirigiendo a MercadoPago..." : "Confirmando pedido..."}
            </span>
          ) : (
            ctaLabel()
          )}
        </Button>
      </main>
    </div>
  );
}
