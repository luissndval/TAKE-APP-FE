"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Copy, 
  CheckCircle2, 
  Clock, 
  Upload, 
  ChevronRight, 
  ArrowLeft,
  FileText,
  AlertCircle,
  RefreshCw,
  Search
} from "lucide-react";
import { 
  fetchOrder, 
  getPaymentStatus, 
  declarePayment, 
  uploadVoucher,
  type PaymentStatusOut 
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

function TransferPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const tenant = searchParams.get("tenant");
  
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [operationNumber, setOperationNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 1. Obtener datos del pedido (incluye CBU/Alias del tenant)
  const { data: order, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId!),
    enabled: !!orderId,
  });

  // 2. Obtener estado del pago (Polling cada 10s)
  const { data: payment, refetch: refetchStatus } = useQuery({
    queryKey: ["payment-status", orderId],
    queryFn: () => getPaymentStatus(orderId!),
    enabled: !!orderId,
    refetchInterval: (query) => {
      const data = query.state.data as PaymentStatusOut | undefined;
      // Detener polling si ya está confirmado o fallido
      if (data?.payment_status === "confirmed" || data?.order_status === "failed") return false;
      return 10000;
    }
  });

  // Redirigir a éxito si ya está confirmado
  useEffect(() => {
    if (payment?.payment_status === "confirmed" || payment?.order_status === "confirmed") {
      router.push(`/order/success?external_reference=${orderId}&tenant=${tenant}`);
    }
  }, [payment, orderId, tenant, router]);

  // Mutaciones
  const declareMutation = useMutation({
    mutationFn: () => declarePayment(orderId!),
    onSuccess: () => refetchStatus(),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadVoucher(orderId!, file, operationNumber, setUploadProgress),
    onSuccess: () => {
      setSelectedFile(null);
      setUploadProgress(0);
      refetchStatus();
    },
  });

  if (isLoadingOrder || !orderId || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(key);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const status = payment?.payment_status || "awaiting_payment";

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[var(--tenant-primary)] text-white px-4 py-4 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 rounded-full bg-white/20">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">Pago por Transferencia</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Resumen Monto */}
        <div className="text-center space-y-1">
          <p className="text-gray-500 text-sm">Monto a transferir</p>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-3xl font-black text-gray-900">
              ${parseFloat(order.total_amount).toLocaleString("es-AR")}
            </h2>
            <button 
              onClick={() => handleCopy(order.total_amount, 'amount')}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              {isCopied === 'amount' ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>
          <p className="text-xs text-orange-600 font-medium bg-orange-50 inline-block px-2 py-1 rounded">
            Transferí el monto exacto para agilizar la validación
          </p>
        </div>

        {/* Datos Bancarios (FASE 1) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Search size={16} />
            </div>
            <h3 className="font-bold text-gray-800">Datos de la cuenta</h3>
          </div>

          {[
            { label: "Titular", value: order.transfer_data?.holder_name, key: "holder" },
            { label: "CBU", value: order.transfer_data?.cbu, key: "cbu", copyable: true },
            { label: "Alias", value: order.transfer_data?.alias, key: "alias", copyable: true },
          ].map((item) => (
            <div key={item.key} className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{item.label}</p>
              <div className="flex items-center justify-between group">
                <p className="text-sm font-semibold text-gray-700 break-all">{item.value || "No configurado"}</p>
                {item.copyable && item.value && (
                  <button 
                    onClick={() => handleCopy(item.value!, item.key)}
                    className="flex-shrink-0 ml-2 p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {isCopied === item.key ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Flujo de Confirmación (FASE 2, 3, 4) */}
        {status === "awaiting_payment" ? (
          <Button 
            className="w-full h-14 text-base font-bold rounded-2xl bg-[var(--tenant-primary)] shadow-lg shadow-orange-200"
            onClick={() => declareMutation.mutate()}
            disabled={declareMutation.isPending}
          >
            {declareMutation.isPending ? "Procesando..." : "Ya realicé la transferencia"}
          </Button>
        ) : (
          <div className="space-y-6">
            {/* Timeline Visual (FASE 4) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Clock size={18} className="text-gray-400" />
                Estado de tu pago
              </h3>
              
              <div className="relative space-y-8 left-1">
                {[
                  { id: "payment_declared", label: "Transferencia informada", icon: CheckCircle2 },
                  { id: "voucher_uploaded", label: "Comprobante enviado", icon: Upload },
                  { id: "confirmed", label: "Pago confirmado", icon: CheckCircle2 },
                ].map((step, i) => {
                  const isPast = status === step.id || (status === "voucher_uploaded" && step.id === "payment_declared");
                  const isCurrent = status === step.id;
                  
                  return (
                    <div key={step.id} className="flex items-center gap-4 relative">
                      {i < 2 && (
                        <div className={`absolute left-3.5 top-8 w-0.5 h-8 ${isPast ? 'bg-green-500' : 'bg-gray-100'}`} />
                      )}
                      <div className={`z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        isPast ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300'
                      } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}>
                        <step.icon size={14} />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${isPast ? 'text-gray-800' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-gray-500 mt-0.5 animate-pulse">En revisión...</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upload Comprobante (FASE 3) */}
            {status === "payment_declared" && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-gray-800">Adjuntá tu comprobante</h3>
                <p className="text-xs text-gray-500">Esto nos ayuda a validar tu pago mucho más rápido.</p>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="op_number" className="text-xs font-bold text-gray-400 uppercase">Nº de operación (opcional)</Label>
                    <Input 
                      id="op_number"
                      placeholder="Ej: 12345678"
                      value={operationNumber}
                      onChange={(e) => setOperationNumber(e.target.value)}
                      className="rounded-xl border-gray-200"
                    />
                  </div>

                  <div 
                    onClick={() => document.getElementById('voucher-input')?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                      selectedFile ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    <input 
                      id="voucher-input"
                      type="file" 
                      className="hidden" 
                      accept="image/*,application/pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    {selectedFile ? (
                      <>
                        <FileText size={32} className="text-green-500" />
                        <p className="text-sm font-bold text-green-700 truncate max-w-full px-4">{selectedFile.name}</p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                          className="text-xs text-red-500 font-bold"
                        >
                          Quitar
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload size={32} className="text-gray-300" />
                        <p className="text-sm font-bold text-gray-500">Seleccionar archivo</p>
                        <p className="text-[10px] text-gray-400">JPG, PNG o PDF (máx 5MB)</p>
                      </>
                    )}
                  </div>

                  {selectedFile && (
                    <Button 
                      className="w-full h-12 rounded-xl bg-gray-900 text-white"
                      onClick={() => uploadMutation.mutate(selectedFile)}
                      disabled={uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? `Enviando ${uploadProgress}%...` : "Enviar comprobante"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Mensajes de feedback */}
            {status === "voucher_uploaded" && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex gap-3">
                <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-green-800">¡Comprobante enviado!</p>
                  <p className="text-xs text-green-700 mt-0.5">Estamos validando tu pago. En breve verás la confirmación aquí mismo.</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-center">
              <button 
                onClick={() => refetchStatus()}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                <RefreshCw size={14} />
                Actualizar estado
              </button>
            </div>
          </div>
        )}

        {/* Ayuda */}
        <div className="bg-gray-100 rounded-2xl p-4 flex gap-3">
          <AlertCircle size={20} className="text-gray-400 flex-shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">
            Si tenés algún problema con la transferencia, podés contactarnos enviando el comprobante por WhatsApp.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function TransferPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>}>
      <TransferPageContent />
    </Suspense>
  );
}
