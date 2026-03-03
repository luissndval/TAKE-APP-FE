"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Truck, Save, CheckCircle, AlertCircle, KeyRound } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface LogisticsConfig {
  provider: string;
  auto_dispatch: boolean;
  delivery_radius_km: number;
  delivery_fee_surcharge: number;
}

const PROVIDERS = [
  { value: "manual", label: "Manual (coordinar propio delivery)" },
  { value: "uber", label: "Uber Direct" },
  { value: "cabify", label: "Cabify Logistics" },
];

export default function LogisticsSettingsPage() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery<LogisticsConfig>({
    queryKey: ["settings-logistics"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/backoffice/settings/logistics");
      return data;
    },
  });

  const [provider, setProvider] = useState("manual");
  const [autoDispatch, setAutoDispatch] = useState(false);
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState("10");
  const [deliveryFeeSurcharge, setDeliveryFeeSurcharge] = useState("0");

  useEffect(() => {
    if (!config) return;
    setProvider(config.provider);
    setAutoDispatch(config.auto_dispatch);
    setDeliveryRadiusKm(String(config.delivery_radius_km));
    setDeliveryFeeSurcharge(String(config.delivery_fee_surcharge ?? 0));
  }, [config]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put("/api/v1/backoffice/settings/logistics", {
        provider,
        auto_dispatch: autoDispatch,
        delivery_radius_km: parseFloat(deliveryRadiusKm) || 10,
        delivery_fee_surcharge: parseInt(deliveryFeeSurcharge) || 0,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-logistics"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Cargando configuración...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Logística de Delivery</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configurá el proveedor de delivery y el despacho automático.
        </p>
      </div>

      {/* Banner: credenciales de proveedores en Integraciones */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
        <KeyRound size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
        <div>
          <p className="font-medium">Las credenciales de Uber Direct y Cabify se configuran en Integraciones.</p>
          <p className="text-blue-600 mt-0.5">
            Configurá tus credenciales antes de seleccionar un proveedor.{" "}
            <Link href="/settings/integrations" className="font-semibold underline">
              Ir a Integraciones →
            </Link>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck size={18} className="text-gray-500" />
            Proveedor de delivery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selector proveedor */}
          <div className="space-y-2">
            <Label>Proveedor preferido</Label>
            <div className="space-y-2">
              {PROVIDERS.map((p) => (
                <label
                  key={p.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    provider === p.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="provider"
                    value={p.value}
                    checked={provider === p.value}
                    onChange={() => setProvider(p.value)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-800">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Auto-dispatch */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Despacho automático</p>
              <p className="text-xs text-gray-500">
                Al pasar un pedido a &ldquo;Listo&rdquo;, despacharlo automáticamente.
              </p>
            </div>
            <Switch checked={autoDispatch} onCheckedChange={setAutoDispatch} />
          </div>

          {/* Radio de delivery */}
          <div className="space-y-1.5">
            <Label htmlFor="radius">Radio de delivery (km)</Label>
            <Input
              id="radius"
              type="number"
              min="1"
              max="100"
              step="0.5"
              value={deliveryRadiusKm}
              onChange={(e) => setDeliveryRadiusKm(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {/* Recargo de envío */}
          <div className="space-y-1.5">
            <Label htmlFor="surcharge">Recargo de envío (ARS)</Label>
            <Input
              id="surcharge"
              type="number"
              min="0"
              step="1"
              value={deliveryFeeSurcharge}
              onChange={(e) => setDeliveryFeeSurcharge(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-xs text-gray-400">
              Monto fijo que se suma al costo de envío del proveedor. Ingresá 0 para no cobrar recargo.
            </p>
          </div>

          {/* Feedback */}
          {mutation.isSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle size={15} />
              Configuración guardada correctamente.
            </div>
          )}
          {mutation.isError && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle size={15} />
              {(mutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
                "Error al guardar la configuración."}
            </div>
          )}

          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="gap-2 text-white"
            style={{ backgroundColor: "var(--backoffice-primary)" }}
          >
            <Save size={16} />
            {mutation.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
