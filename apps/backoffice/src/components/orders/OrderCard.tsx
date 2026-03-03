import { Order } from '@/types/orders';
import StatusBadge from './StatusBadge';
import Link from 'next/link';

export default function OrderCard({ order }: { order: Order }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{order.customer_name}</p>
          <p className="text-sm text-gray-500">
            {order.order_type === 'delivery' ? 'Delivery' : 'Take away'}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">
          ${order.total_amount.toLocaleString('es-AR')}
        </p>
        <p className="text-xs text-gray-400">
          {new Date(order.created_at).toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
      <Link
        href={`/orders/${order.id}`}
        className="mt-3 block text-center rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
      >
        Ver detalle
      </Link>
    </div>
  );
}
