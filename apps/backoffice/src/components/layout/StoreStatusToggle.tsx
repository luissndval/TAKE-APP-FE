"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function StoreStatusToggle() {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["restaurant-status"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/backoffice/settings/status");
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (newData: { accepting_orders: boolean; paused_reason?: string }) => {
      const { data } = await api.patch("/api/v1/backoffice/settings/status", newData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-status"] });
      setIsPopoverOpen(false);
    },
  });

  if (isLoading) {
    return <Loader2 className="h-5 w-5 animate-spin text-gray-400" />;
  }

  const isAccepting = status?.accepting_orders;

  const handleToggle = () => {
    if (isAccepting) {
      // Abrir popover para pedir razón al pausar
      setIsPopoverOpen(true);
    } else {
      // Activar directo
      mutation.mutate({ accepting_orders: true, paused_reason: "" });
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 rounded-full border bg-gray-50">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${isAccepting ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
          {isAccepting ? 'Recibiendo Pedidos' : 'Pedidos Pausados'}
        </span>
      </div>

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center">
            <Switch 
              checked={isAccepting}
              onCheckedChange={handleToggle}
              disabled={mutation.isPending}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold leading-none text-gray-900 flex items-center gap-2">
              <Pause size={16} /> Pausar pedidos
            </h4>
            <p className="text-sm text-gray-500">
              ¿Por qué pausarás la recepción? (Se mostrará a los clientes)
            </p>
          </div>
          <div className="space-y-3">
            <Input 
              placeholder="Ej: Cocina saturada, cerrado por lluvia..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsPopoverOpen(false)}>
                Cancelar
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => mutation.mutate({ accepting_orders: false, paused_reason: reason })}
                disabled={mutation.isPending}
              >
                Pausar Ahora
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
