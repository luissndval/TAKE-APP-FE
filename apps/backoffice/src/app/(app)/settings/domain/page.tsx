"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DomainInfo {
  slug: string;
  custom_domain: string | null;
  custom_domain_verified: boolean;
}

export default function DomainSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<DomainInfo>({
    queryKey: ["settings-domain"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/backoffice/settings/domain");
      return data;
    },
  });

  const [customDomain, setCustomDomain] = useState("");

  useEffect(() => {
    if (data?.custom_domain) {
      setCustomDomain(data.custom_domain);
    }
  }, [data]);

  const setMutation = useMutation({
    mutationFn: async () => {
      const { data: result } = await api.post(
        "/api/v1/backoffice/settings/domain",
        { custom_domain: customDomain }
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-domain"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/api/v1/backoffice/settings/domain");
    },
    onSuccess: () => {
      setCustomDomain("");
      queryClient.invalidateQueries({ queryKey: ["settings-domain"] });
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
        <h2 className="text-xl font-bold text-gray-900">Dominio</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configurá el dominio propio para tu menú online.
        </p>
      </div>

      {/* Dominio actual de plataforma */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-gray-500" />
            <CardTitle className="text-base">Subdominio de TakeApp</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm font-mono text-gray-700">
              {data?.slug}.takeapp.com
            </span>
            <span className="ml-auto text-xs text-green-600 font-medium flex items-center gap-1">
              <CheckCircle size={12} />
              Activo
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Este subdominio siempre estará disponible, independientemente del
            dominio custom.
          </p>
        </CardContent>
      </Card>

      {/* Dominio custom */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dominio personalizado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado actual */}
          {data?.custom_domain && (
            <div
              className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${
                data.custom_domain_verified
                  ? "bg-green-50 border-green-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              {data.custom_domain_verified ? (
                <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    data.custom_domain_verified ? "text-green-800" : "text-amber-800"
                  }`}
                >
                  {data.custom_domain}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    data.custom_domain_verified ? "text-green-600" : "text-amber-600"
                  }`}
                >
                  {data.custom_domain_verified
                    ? "Dominio verificado y activo"
                    : "Pendiente de verificación DNS"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                title="Eliminar dominio custom"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          )}

          {/* Formulario */}
          <div className="space-y-1.5">
            <Label>
              {data?.custom_domain ? "Cambiar dominio" : "Configurar dominio"}
            </Label>
            <Input
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="menu.turestaurante.com"
              type="text"
            />
            <p className="text-xs text-gray-400">
              Ingresá el dominio sin &quot;https://&quot; (ej: menu.turestaurante.com).
            </p>
          </div>

          {!data?.custom_domain_verified && data?.custom_domain && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 space-y-2">
              <p className="font-semibold">Instrucciones DNS</p>
              <p>
                Agregá un registro CNAME en tu proveedor de DNS apuntando a{" "}
                <span className="font-mono font-bold">cname.takeapp.com</span>.
              </p>
              <p className="text-xs text-blue-600">
                La verificación puede demorar hasta 24-48 horas.
              </p>
            </div>
          )}

          {setMutation.isError && (
            <p className="text-sm text-red-600">
              Error al configurar el dominio. Verificá el formato ingresado.
            </p>
          )}

          {setMutation.isSuccess && (
            <p className="text-sm text-green-600">
              Dominio registrado. Configurá los registros DNS y aguardá la
              verificación.
            </p>
          )}

          <Button
            onClick={() => setMutation.mutate()}
            disabled={setMutation.isPending || !customDomain.trim()}
            className="w-full text-white"
            style={{ backgroundColor: "var(--backoffice-primary)" }}
          >
            {setMutation.isPending ? "Guardando..." : "Guardar dominio"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
