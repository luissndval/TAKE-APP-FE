"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Save } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface NotificationConfig {
  email_enabled: boolean;
  sms_enabled: boolean;
  notify_on: {
    confirmed?: boolean;
    dispatched?: boolean;
    delivered?: boolean;
    failed?: boolean;
  };
}

const EVENTS: { key: keyof NotificationConfig["notify_on"]; label: string; description: string }[] = [
  { key: "confirmed", label: "Pedido confirmado", description: "Al confirmar el pago y comenzar la preparación" },
  { key: "dispatched", label: "Pedido despachado", description: "Cuando el repartidor retira el pedido" },
  { key: "delivered", label: "Pedido entregado", description: "Al marcar el pedido como entregado" },
  { key: "failed", label: "Pedido cancelado", description: "Si el pedido falla o es cancelado" },
];

export default function NotificationsSettingsPage() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery<NotificationConfig>({
    queryKey: ["settings-notifications"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/backoffice/settings/notifications");
      return data;
    },
  });

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [notifyOn, setNotifyOn] = useState<NotificationConfig["notify_on"]>({
    confirmed: true,
    dispatched: true,
    delivered: true,
    failed: true,
  });

  useEffect(() => {
    if (!config) return;
    setEmailEnabled(config.email_enabled);
    setSmsEnabled(config.sms_enabled);
    setNotifyOn(config.notify_on ?? {});
  }, [config]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put("/api/v1/backoffice/settings/notifications", {
        email_enabled: emailEnabled,
        sms_enabled: smsEnabled,
        notify_on: notifyOn,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-notifications"] });
    },
  });

  const toggleEvent = (key: keyof NotificationConfig["notify_on"]) => {
    setNotifyOn((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones al Cliente</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configurá qué notificaciones reciben tus clientes al actualizar el estado de sus pedidos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={18} className="text-gray-500" />
            Canales de notificación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Email</p>
              <p className="text-xs text-gray-500">Enviar emails transaccionales al cliente.</p>
            </div>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">SMS</p>
              <p className="text-xs text-gray-500">
                Requiere configurar Twilio. Costo adicional por mensaje.
              </p>
            </div>
            <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eventos a notificar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-gray-500 mb-2">
            Seleccioná qué eventos generan notificación al cliente.
          </p>
          {EVENTS.map((event) => (
            <div
              key={event.key}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
            >
              <div>
                <Label className="text-sm font-medium text-gray-900 cursor-pointer">
                  {event.label}
                </Label>
                <p className="text-xs text-gray-500">{event.description}</p>
              </div>
              <Switch
                checked={!!notifyOn[event.key]}
                onCheckedChange={() => toggleEvent(event.key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {mutation.isSuccess && (
        <p className="text-sm text-green-600">✓ Configuración guardada.</p>
      )}
      {mutation.isError && (
        <p className="text-sm text-red-600">Error al guardar la configuración.</p>
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

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Modo desarrollo</p>
        <p>
          Los emails y SMS se loggean en consola del backend. Para envíos reales, configurá
          RESEND_API_KEY y las credenciales de Twilio en el archivo <code>.env</code>.
        </p>
      </div>
    </div>
  );
}
