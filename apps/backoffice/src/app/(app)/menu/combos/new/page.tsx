"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Package, Trash2, ArrowLeft, Loader2, Save, ShoppingCart } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Category, Product } from "@/types/menu";

interface ComboItem {
  name: string;
  is_required: boolean;
  product_ids: string[];
}

export default function NewComboPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [items, setItems] = useState<ComboItem[]>([]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["backoffice-menu"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/backoffice/menu");
      return data;
    },
  });

  const allProducts = categories.flatMap(c => c.products);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        description,
        price: parseFloat(price),
        category_id: categoryId,
        items: items.map((it, idx) => ({ ...it, position: idx })),
        is_available: true,
      };
      return api.post("/api/v1/backoffice/menu/combos", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backoffice-menu"] });
      window.history.back();
    },
  });

  const addItem = () => {
    setItems([...items, { name: "", is_required: true, product_ids: [] }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ComboItem, value: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setItems(newItems);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold text-gray-900">Nuevo Combo / Promoción</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Información del Combo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nombre del Combo</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Combo Familiar" />
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿Qué incluye?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Precio del Combo ($)</Label>
                  <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <Label>Categoría</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccioná" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-gray-800">Pasos del Combo</h3>
              <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                <Plus size={14} /> Agregar Paso
              </Button>
            </div>

            {items.map((item, idx) => (
              <Card key={idx} className="border-2 border-gray-100">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <Input 
                      className="font-bold border-none bg-gray-50 focus-visible:ring-0 h-9"
                      placeholder="Ej: Elegí tu hamburguesa" 
                      value={item.name}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} className="text-red-400">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black text-gray-400">Productos permitidos en este paso</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {allProducts.map(p => {
                        const isSelected = item.product_ids.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              const newIds = isSelected 
                                ? item.product_ids.filter(id => id !== p.id)
                                : [...item.product_ids, p.id];
                              updateItem(idx, "product_ids", newIds);
                            }}
                            className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                              isSelected ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'border-gray-100 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardHeader><CardTitle className="text-base text-gray-500">Resumen</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <p className="text-3xl font-black text-gray-900">${parseFloat(price || "0").toLocaleString('es-AR')}</p>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{name || "Nuevo Combo"}</p>
              </div>
              <Button 
                className="w-full text-white h-12" 
                style={{ backgroundColor: "var(--backoffice-primary)" }}
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !name || !price || !categoryId || items.length === 0}
              >
                {createMutation.isPending ? <Loader2 className="animate-spin" /> : "Guardar Combo"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
