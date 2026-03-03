"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Banknote, Wallet, Save } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PaymentConfig {
  mp_enabled: boolean;
  mp_public_key: string | null;
  transfer_enabled: boolean;
  transfer_cbu: string | null;
  transfer_alias: string | null;
  transfer_holder_name: string | null;
  cash_enabled: boolean;
}

export default function PaymentsSettingsPage() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery<PaymentConfig>({
    queryKey: ["settings-payments"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/backoffice/settings/payments");
      return data;
    },
  });

  const [mpEnabled, setMpEnabled] = useState(false);
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [mpPublicKey, setMpPublicKey] = useState("");
  const [transferEnabled, setTransferEnabled] = useState(false);
  const [transferCbu, setTransferCbu] = useState("");
  const [transferAlias, setTransferAlias] = useState("");
  const [transferHolder, setTransferHolder] = useState("");
  const [cashEnabled, setCashEnabled] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    setMpEnabled(config.mp_enabled);
    setMpPublicKey(config.mp_public_key ?? "");
    setTransferEnabled(config.transfer_enabled);
    setTransferCbu(config.transfer_cbu ?? "");
    setTransferAlias(config.transfer_alias ?? "");
    setTransferHolder(config.transfer_holder_name ?? "");
    setCashEnabled(config.cash_enabled);
  }, [config]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!mpEnabled && !transferEnabled && !cashEnabled) {
        throw new Error("Debe haber al menos un método de pago habilitado.");
      }
      const payload: Record<string, unknown> = {
        mp_enabled: mpEnabled,
        transfer_enabled: transferEnabled,
        cash_enabled: cashEnabled,
      };
      if (mpEnabled) {
        if (mpAccessToken) payload.mp_access_token = mpAccessToken;
        if (mpPublicKey) payload.mp_public_key = mpPublicKey;
      }
      if (transferEnabled) {
        payload.transfer_cbu = transferCbu || null;
        payload.transfer_alias = transferAlias || null;
        payload.transfer_holder_name = transferHolder || null;
      }
      const { data } = await api.put(
        "/api/v1/backoffice/settings/payments",
        payload
      );
      return data;
    },
    onSuccess: () => {
      setValidationError(null);
      queryClient.invalidateQueries({ queryKey: ["settings-payments"] });
    },
    onError: (err: Error) => {
      setValidationError(err.message ?? "Error al guardar configuración.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Métodos de Pago</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configurá qué métodos de pago están disponibles para tus clientes.
        </p>
      </div>

      {/* MercadoPago */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <CreditCard size={18} className="text-blue-600" />
              </div>
              <CardTitle className="text-base">MercadoPago</CardTitle>
            </div>
            <Switch checked={mpEnabled} onCheckedChange={setMpEnabled} />
          </div>
        </CardHeader>
        {mpEnabled && (
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-1.5">
              <Label className="text-sm">Access Token</Label>
              <Input
                type="password"
                value={mpAccessToken}
                onChange={(e) => setMpAccessToken(e.target.value)}
                placeholder="APP_USR-..."
                autoComplete="off"
              />
              <p className="text-xs text-gray-400">
                Dejá en blanco para mantener el actual.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Public Key</Label>
              <Input
                value={mpPublicKey}
                onChange={(e) => setMpPublicKey(e.target.value)}
                placeholder="APP_USR-..."
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Transferencia */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Banknote size={18} className="text-amber-600" />
              </div>
              <CardTitle className="text-base">Transferencia bancaria</CardTitle>
            </div>
            <Switch
              checked={transferEnabled}
              onCheckedChange={setTransferEnabled}
            />
          </div>
        </CardHeader>
        {transferEnabled && (
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-1.5">
              <Label className="text-sm">Titular de la cuenta</Label>
              <Input
                value={transferHolder}
                onChange={(e) => setTransferHolder(e.target.value)}
                placeholder="Juan García"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">CBU</Label>
              <Input
                value={transferCbu}
                onChange={(e) => setTransferCbu(e.target.value)}
                placeholder="0000000000000000000000"
                maxLength={22}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Alias</Label>
              <Input
                value={transferAlias}
                onChange={(e) => setTransferAlias(e.target.value)}
                placeholder="mi.alias.mp"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Efectivo */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                <Wallet size={18} className="text-green-600" />
              </div>
              <CardTitle className="text-base">Efectivo</CardTitle>
            </div>
            <Switch checked={cashEnabled} onCheckedChange={setCashEnabled} />
          </div>
        </CardHeader>
        {cashEnabled && (
          <CardContent className="pt-0">
            <p className="text-sm text-gray-500">
              El cliente paga en efectivo al momento de retirar. Solo disponible
              para pedidos de tipo &quot;Retiro&quot;.
            </p>
          </CardContent>
        )}
      </Card>

      {validationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {validationError}
        </div>
      )}

      {mutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Configuración guardada correctamente.
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
    </div>
  );
}
