"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Ticket, Trash2, Calendar, Tag, AlertCircle } from "lucide-react";
import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
}

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsPopoverOpen] = useState(false);
  
  // Form state
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ["backoffice-coupons"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/backoffice/menu/coupons");
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code,
        type,
        value: parseFloat(value),
        min_order_amount: minAmount ? parseFloat(minAmount) : null,
        max_uses: maxUses ? parseInt(maxUses) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: true,
      };
      return api.post("/api/v1/backoffice/menu/coupons", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backoffice-coupons"] });
      setIsPopoverOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/v1/backoffice/menu/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backoffice-coupons"] });
    },
  });

  const resetForm = () => {
    setCode("");
    setType("percentage");
    setValue("");
    setMinAmount("");
    setMaxUses("");
    setExpiresAt("");
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando cupones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cupones de Descuento</h2>
          <p className="text-sm text-gray-500 mt-1">Creá códigos promocionales para tus clientes.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsPopoverOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 text-white" style={{ backgroundColor: "var(--backoffice-primary)" }}>
              <Plus size={16} /> Nuevo Cupón
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear nuevo cupón</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código (ej: PROMO10)</Label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CÓDIGO" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                      <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Valor</Label>
                  <Input id="value" type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min">Monto mín. pedido</Label>
                  <Input id="min" type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="Opcional" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">Usos máximos</Label>
                  <Input id="max" type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Opcional" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry">Fecha de expiración</Label>
                <Input id="expiry" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>

              <Button 
                className="w-full text-white" 
                style={{ backgroundColor: "var(--backoffice-primary)" }}
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !code || !value}
              >
                {createMutation.isPending ? "Creando..." : "Crear Cupón"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => (
          <Card key={coupon.id} className="overflow-hidden">
            <div className="h-2 bg-orange-400" />
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket size={18} className="text-orange-500" />
                  <span className="font-black text-lg tracking-tight">{coupon.code}</span>
                </div>
                <Badge variant={coupon.is_active ? "default" : "secondary"}>
                  {coupon.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-gray-400" />
                  <span className="font-bold text-gray-900">
                    {coupon.type === "percentage" ? `${coupon.value}% de desc.` : `$${coupon.value} de desc.`}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span>
                    {coupon.expires_at 
                      ? `Expira el ${format(new Date(coupon.expires_at), "dd/MM/yy HH:mm", { locale: es })}`
                      : "Sin expiración"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-gray-400" />
                  <span>
                    {coupon.max_uses ? `${coupon.current_uses} / ${coupon.max_uses} usos` : `${coupon.current_uses} usos totales`}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  onClick={() => {
                    if (confirm("¿Eliminar este cupón?")) deleteMutation.mutate(coupon.id);
                  }}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {coupons.length === 0 && !isLoading && (
          <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Ticket size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No tenés cupones creados aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}
