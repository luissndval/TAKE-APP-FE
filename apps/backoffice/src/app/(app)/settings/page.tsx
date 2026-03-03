"use client";

import { Settings, Store, MapPin, Clock, Palette, Truck, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    icon: Store,
    title: "Información del negocio",
    description: "Nombre, logo, slug y dirección del local.",
  },
  {
    icon: Clock,
    title: "Horario de atención",
    description: "Días y horarios en que el negocio acepta pedidos.",
  },
  {
    icon: Palette,
    title: "Apariencia",
    description: "Color primario y logo que verán los clientes en el menú.",
  },
  {
    icon: Truck,
    title: "Delivery",
    description: "Radio de entrega, costo de envío y tiempo estimado.",
  },
  {
    icon: ShoppingBag,
    title: "Tipos de pedido",
    description: "Habilitar o deshabilitar delivery y take away.",
  },
  {
    icon: MapPin,
    title: "Dirección",
    description: "Dirección física del local para pedidos de retiro.",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900">Configuración</h2>
      </div>

      {/* Banner próximamente */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <Settings size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Próximamente</p>
          <p className="text-sm text-blue-600 mt-0.5">
            La configuración del negocio estará disponible en la próxima versión. Por ahora podés gestionar pedidos y el menú desde las secciones correspondientes.
          </p>
        </div>
      </div>

      {/* Vista previa de secciones */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="opacity-60 cursor-not-allowed">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg p-2 bg-gray-100">
                    <Icon size={16} className="text-gray-500" />
                  </div>
                  <CardTitle className="text-sm">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500">{section.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
