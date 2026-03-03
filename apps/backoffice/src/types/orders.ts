export enum OrderStatus {
  PENDING = 'pending',
  AWAITING_TRANSFER = 'awaiting_transfer',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DISPATCHED = 'dispatched',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export enum OrderType {
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

export interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  notes: string | null;
}

export interface DeliveryJob {
  id: string;
  provider: string;
  status: string;
  driver_name: string | null;
  driver_phone: string | null;
  driver_lat: number | null;
  driver_lng: number | null;
  tracking_url: string | null;
  estimated_delivery_at: string | null;
}

export interface TransferPaymentInfo {
  status: string;
  declared_at: string | null;
  voucher_url: string | null;
  operation_number: string | null;
  rejection_reason: string | null;
  confirmed_at: string | null;
}

export interface Order {
  id: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  order_type: OrderType;
  payment_method: string | null;
  total_amount: number;
  delivery_fee: number | null;
  created_at: string;
  items: OrderItem[];
  delivery_job?: DeliveryJob | null;
  transfer_payment?: TransferPaymentInfo | null;
}
