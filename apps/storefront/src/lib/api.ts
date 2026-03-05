import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface ProductVariant {
  id: string;
  name: string;
  price_delta: string;
  is_available: boolean;
}

export interface ProductOption {
  id: string;
  name: string;
  price_delta: string;
  is_available: boolean;
  position: number;
}

export interface ProductOptionGroup {
  id: string;
  name: string;
  min_options: number;
  max_options: number;
  is_required: boolean;
  position: number;
  options: ProductOption[];
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_available: boolean;
  position: number;
  variants: ProductVariant[];
  option_groups: ProductOptionGroup[];
  stock_type: "unlimited" | "finite" | "daily";
  stock_quantity: number;
}

export interface ComboItem {
  id: string;
  name: string;
  is_required: boolean;
  position: number;
  product_ids: string[] | null;
}

export interface Combo {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_available: boolean;
  position: number;
  items: ComboItem[];
}

export interface Category {
  id: string;
  name: string;
  position: number;
  is_active: boolean;
  products: Product[];
  combos: Combo[];
}

export interface Menu {
  tenant_name: string;
  tenant_slug: string;
  logo_url: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  font_family?: string | null;
  accepting_orders: boolean;
  paused_reason: string | null;
  is_open: boolean;
  categories: Category[];
}

export interface OrderItemIn {
  product_id: string;
  quantity: number;
  notes?: string;
}

export type PaymentMethod = "mercadopago" | "transfer" | "cash";

export interface PaymentMethodsPublic {
  mercadopago: boolean;
  mp_public_key: string | null;
  transfer: boolean;
  cash: boolean;
  transfer_cbu: string | null;
  transfer_alias: string | null;
  transfer_holder_name: string | null;
}

export interface TenantPublic {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  font_family: string | null;
  menu_layout: string | null;
  payment_methods: PaymentMethodsPublic | null;
  google_maps_api_key: string | null;
}

export interface DeliveryQuoteOut {
  available: boolean;
  fee_amount: number | null;
  fee_currency: string | null;
  eta_pickup_sec: number | null;
  eta_delivery_sec: number | null;
  provider: string | null;
}

export interface OrderIn {
  tenant_slug: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  order_type: "takeaway" | "delivery";
  payment_method: PaymentMethod;
  coupon_code?: string;
  delivery_fee_estimate?: number | null;
  items: OrderItemIn[];
}

export interface OrderOut {
  id: string;
  status: string;
  customer_name: string;
  total_amount: string;
  order_type: "takeaway" | "delivery";
  payment_method: PaymentMethod | null;
  mp_payment_id: string | null;
  created_at: string;
  items: Array<{
    id: string;
    product_name: string;
    unit_price: string;
    quantity: number;
    notes: string | null;
  }>;
}

export interface OrderItemPublicOut {
  product_name: string;
  unit_price: string;
  quantity: number;
  subtotal: string;
}

export interface TransferDataOut {
  cbu: string | null;
  alias: string | null;
  holder_name: string | null;
}

export interface DeliveryJobPublicOut {
  status: string;
  driver_name: string | null;
  driver_vehicle_name: string | null;
  driver_vehicle_plate: string | null;
  tracking_url: string | null;
  estimated_delivery_at: string | null;
  estimated_pickup_sec: number | null;
  estimated_delivery_sec: number | null;
}

export interface OrderPublicOut {
  id: string;
  status: string;
  payment_method: PaymentMethod | null;
  order_type: "takeaway" | "delivery";
  total_amount: string;
  delivery_fee: number | null;
  discount_amount: string | null;
  created_at: string;
  items: OrderItemPublicOut[];
  transfer_data: TransferDataOut | null;
  delivery_job: DeliveryJobPublicOut | null;
  tenant_slug: string | null;
}

export interface PaymentPreference {
  preference_id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface PaymentStatusOut {
  order_status: string;
  payment_status: string;
  declared_at: string | null;
  voucher_url: string | null;
  operation_number: string | null;
  rejection_reason: string | null;
  confirmed_at: string | null;
  expires_at: string;
}

// ── Funciones ──────────────────────────────────────────────────────────────

export async function fetchMenu(tenantSlug: string): Promise<Menu> {
  const { data } = await apiClient.get<Menu>(`/menu/${tenantSlug}`);
  return data;
}

export async function createOrder(payload: OrderIn): Promise<OrderOut> {
  const { data } = await apiClient.post<OrderOut>("/orders", payload);
  return data;
}

export async function createPaymentPreference(
  orderId: string
): Promise<PaymentPreference> {
  const { data } = await apiClient.post<PaymentPreference>(
    "/payments/create-preference",
    { order_id: orderId }
  );
  return data;
}

export async function fetchOrder(orderId: string): Promise<OrderPublicOut> {
  const { data } = await apiClient.get<OrderPublicOut>(`/orders/${orderId}`);
  return data;
}

export async function fetchTenantPublic(slug: string): Promise<TenantPublic> {
  const { data } = await apiClient.get<TenantPublic>(`/public/tenant/${slug}`);
  return data;
}

export async function getPaymentStatus(orderId: string): Promise<PaymentStatusOut> {
  const { data } = await apiClient.get<PaymentStatusOut>(`/orders/${orderId}/payment-status`);
  return data;
}

export async function declarePayment(orderId: string): Promise<PaymentStatusOut> {
  const { data } = await apiClient.post<PaymentStatusOut>(`/orders/${orderId}/declare-payment`);
  return data;
}

export async function fetchDeliveryQuote(
  tenantSlug: string,
  address: string
): Promise<DeliveryQuoteOut> {
  const { data } = await apiClient.post<DeliveryQuoteOut>("/delivery/quote", {
    tenant_slug: tenantSlug,
    dropoff_address: address,
  });
  return data;
}

export async function uploadVoucher(
  orderId: string,
  file: File,
  operationNumber?: string,
  onProgress?: (pct: number) => void
): Promise<PaymentStatusOut> {
  const formData = new FormData();
  formData.append("file", file);
  if (operationNumber) formData.append("operation_number", operationNumber);

  const { data } = await apiClient.post<PaymentStatusOut>(
    `/orders/${orderId}/upload-voucher`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress
        ? (e) => onProgress(Math.round(((e.loaded ?? 0) / (e.total ?? 1)) * 100))
        : undefined,
    }
  );
  return data;
}
