'use client';

import { Order } from '@/types/orders';
import StatusBadge from './StatusBadge';
import Link from 'next/link';

interface Props {
  orders: Order[];
}

export default function OrderTable({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-12 text-center text-gray-500">
        No hay pedidos con los filtros aplicados.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Tipo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Hora
            </th>
            <th className="relative px-6 py-3">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                  <p className="text-xs text-gray-500">{order.customer_phone}</p>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {order.order_type === 'delivery' ? 'Delivery' : 'Take away'}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <StatusBadge status={order.status} />
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                ${order.total_amount.toLocaleString('es-AR')}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {new Date(order.created_at).toLocaleString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                })}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                <Link
                  href={`/orders/${order.id}`}
                  className="font-medium text-indigo-600 hover:text-indigo-900"
                >
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
