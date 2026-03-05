"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle,
  Circle,
  Clock,
  Copy,
  FileText,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";
import {
  declarePayment,
  getPaymentStatus,
  uploadVoucher,
  type OrderPublicOut,
  type PaymentStatusOut,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Tipos ────────────────────────────────────────────────────────────────────

type TransferPhase = "loading" | "data" | "voucher" | "validating";

interface TransferFlowProps {
  orderId: string;
  order: OrderPublicOut;
  primaryColor: string;
  tenant: string | null;
}

// ── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
    >
      {copied ? (
        <>
          <Check size={13} className="text-green-500" />
          <span className="text-green-600">Copiado</span>
        </>
      ) : (
        <>
          <Copy size={13} />
          {label}
        </>
      )}
    </button>
  );
}

// ── Timer ─────────────────────────────────────────────────────────────────────

function useCountdown(expiresAt: string) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const target = new Date(expiresAt).getTime();
    function tick() {
      setRemaining(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return { remaining, minutes, seconds };
}

// ── FASE 1 — Datos de pago ────────────────────────────────────────────────────

function PhaseData({
  order,
  paymentStatus,
  primaryColor,
  tenant,
  onDeclared,
}: {
  order: OrderPublicOut;
  paymentStatus: PaymentStatusOut;
  primaryColor: string;
  tenant: string | null;
  onDeclared: () => void;
}) {
  const router = useRouter();
  const [declaring, setDeclaring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { remaining, minutes, seconds } = useCountdown(paymentStatus.expires_at);
  const td = order.transfer_data;

  async function handleDeclare() {
    setDeclaring(true);
    setError(null);
    try {
      await declarePayment(order.id);
      onDeclared();
    } catch {
      setError("No pudimos registrar tu pago. Intentá de nuevo.");
      setDeclaring(false);
    }
  }

  if (remaining === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center space-y-3">
        <XCircle size={32} className="text-red-400 mx-auto" />
        <p className="font-semibold text-red-800">La orden expiró</p>
        <p className="text-sm text-red-600">
          El tiempo para realizar la transferencia venció. Podés generar un nuevo pedido.
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(tenant ? `/${tenant}` : "/")}
        >
          Volver al menú
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Monto */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Monto exacto a transferir</p>
          <p className="text-3xl font-bold text-gray-900">
            $
            {parseFloat(String(order.total_amount)).toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}
          </p>
          <div className="mt-2 flex justify-center">
            <CopyButton
              text={parseFloat(String(order.total_amount)).toFixed(2)}
              label="Copiar monto"
            />
          </div>
        </div>

        {/* Datos bancarios */}
        <h3 className="text-sm font-semibold text-gray-700">Datos bancarios</h3>

        {td?.holder_name && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400">Titular</p>
              <p className="text-sm font-medium text-gray-800">{td.holder_name}</p>
            </div>
            <CopyButton text={td.holder_name} label="Copiar" />
          </div>
        )}

        {td?.cbu && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400">CBU</p>
              <p className="text-sm font-medium text-gray-800 font-mono">{td.cbu}</p>
            </div>
            <CopyButton text={td.cbu} label="Copiar CBU" />
          </div>
        )}

        {td?.alias && (
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs text-gray-400">Alias</p>
              <p className="text-sm font-medium text-gray-800">{td.alias}</p>
            </div>
            <CopyButton text={td.alias} label="Copiar alias" />
          </div>
        )}
      </div>

      {/* Timer */}
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <Clock size={16} className="text-amber-500 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          Tenés{" "}
          <span className="font-bold tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>{" "}
          para realizar la transferencia
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* CTA */}
      <Button
        onClick={handleDeclare}
        disabled={declaring}
        className="w-full text-white font-semibold h-12 text-base rounded-xl disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        {declaring ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Registrando...
          </span>
        ) : (
          "Ya realicé la transferencia →"
        )}
      </Button>

      <button
        onClick={() => router.push(tenant ? `/${tenant}/checkout` : "/")}
        className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2"
      >
        Cambiar método de pago
      </button>
    </div>
  );
}

// ── FASE 3 — Upload comprobante ───────────────────────────────────────────────

function PhaseVoucher({
  orderId,
  primaryColor,
  onUploaded,
  onSkip,
}: {
  orderId: string;
  primaryColor: string;
  onUploaded: () => void;
  onSkip: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [opNum, setOpNum] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(f.type)) {
      setError("Solo se aceptan imágenes (JPG, PNG) o PDF.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("El archivo supera el límite de 5MB.");
      return;
    }
    setError(null);
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    setProgress(0);
    try {
      await uploadVoucher(orderId, file, opNum || undefined, setProgress);
      onUploaded();
    } catch {
      setError("No pudimos subir el comprobante. Intentá de nuevo.");
      setUploading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-4">
      <div>
        <h3 className="font-semibold text-gray-800">Adjuntá tu comprobante</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Esto nos ayuda a validar tu pago más rápido
        </p>
      </div>

      {/* Drop zone */}
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-blue-400 bg-blue-50"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Upload size={28} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-700">
            Arrastrá o hacé click para seleccionar
          </p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF — Máximo 5MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Comprobante" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText size={28} className="text-blue-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
            <button
              onClick={() => { setFile(null); setPreview(null); }}
              className="text-xs text-blue-500 hover:text-blue-700 mt-0.5"
            >
              Cambiar archivo
            </button>
          </div>
        </div>
      )}

      {/* Número de operación */}
      <div className="space-y-1">
        <Label htmlFor="op_num" className="text-sm text-gray-700">
          Número de operación{" "}
          <span className="text-gray-400 font-normal">(opcional)</span>
        </Label>
        <Input
          id="op_num"
          value={opNum}
          onChange={(e) => setOpNum(e.target.value.slice(0, 30))}
          placeholder="Ej: 00123456789"
        />
        <p className="text-xs text-gray-400">Lo encontrás en el comprobante de tu banco</p>
      </div>

      {/* Barra de progreso */}
      {uploading && (
        <div className="space-y-1">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: primaryColor }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center">{progress}%</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full text-white font-semibold h-12 rounded-xl disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        {uploading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Enviando comprobante...
          </span>
        ) : (
          "Enviar comprobante"
        )}
      </Button>

      <button
        onClick={onSkip}
        className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1"
      >
        Continuar sin comprobante
      </button>
    </div>
  );
}

// ── FASE 4 — Timeline de validación ──────────────────────────────────────────

const TIMELINE_STEPS = [
  { key: "declared",  label: "Transferencia informada" },
  { key: "voucher",   label: "Comprobante enviado" },
  { key: "review",    label: "En revisión" },
  { key: "result",    label: "Resultado" },
] as const;

function getNodeState(
  stepKey: string,
  ps: string,
): "completed" | "active" | "pending" {
  const order = ["payment_declared", "voucher_uploaded", "under_review", "confirmed", "rejected"];
  const idx = order.indexOf(ps);
  switch (stepKey) {
    case "declared": return idx >= 0 ? "completed" : "pending";
    case "voucher":  return idx >= 1 ? "completed" : idx === 0 ? "active" : "pending";
    case "review":   return idx >= 2 ? (idx === 2 ? "active" : "completed") : "pending";
    case "result":   return idx >= 3 ? "completed" : "pending";
    default:         return "pending";
  }
}

function PhaseValidating({
  orderId,
  paymentStatus: initialStatus,
  primaryColor,
  tenant,
  onGoToVoucher,
}: {
  orderId: string;
  paymentStatus: PaymentStatusOut;
  primaryColor: string;
  tenant: string | null;
  onGoToVoucher: () => void;
}) {
  const router = useRouter();
  const [ps, setPs] = useState(initialStatus);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [canRefresh, setCanRefresh] = useState(true);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  // Polling automático cada 15s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const updated = await getPaymentStatus(orderId);
        setPs(updated);
      } catch {
        // silencioso
      }
    }, 15000);
    return () => clearInterval(id);
  }, [orderId]);

  async function handleManualRefresh() {
    if (!canRefresh) return;
    setCanRefresh(false);
    try {
      const updated = await getPaymentStatus(orderId);
      setPs(updated);
    } catch {
      // silencioso
    }
    setLastRefresh(Date.now());
    setTimeout(() => setCanRefresh(true), 10000);
  }

  const isRejected = ps.payment_status === "rejected";

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-0">
        {TIMELINE_STEPS.map((step, i) => {
          const nodeState = getNodeState(step.key, ps.payment_status ?? "");
          const isLast = i === TIMELINE_STEPS.length - 1;
          return (
            <div key={step.key} className="flex gap-3">
              {/* Nodo + línea */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    nodeState === "completed"
                      ? "bg-green-500"
                      : nodeState === "active"
                      ? "ring-2 ring-offset-1 bg-white"
                      : "bg-gray-100"
                  }`}
                  style={nodeState === "active" ? { outlineColor: primaryColor } : undefined}
                >
                  {nodeState === "completed" ? (
                    <CheckCircle size={14} className="text-white" />
                  ) : nodeState === "active" ? (
                    <span
                      className="w-3 h-3 rounded-full animate-pulse"
                      style={{ backgroundColor: primaryColor }}
                    />
                  ) : (
                    <Circle size={14} className="text-gray-300" />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 my-1 ${
                      nodeState === "completed" ? "bg-green-300" : "bg-gray-100"
                    }`}
                    style={{ minHeight: 20 }}
                  />
                )}
              </div>
              {/* Label */}
              <div className={`pb-4 pt-1 ${isLast ? "" : ""}`}>
                <p
                  className={`text-sm font-medium ${
                    nodeState === "completed"
                      ? "text-green-700"
                      : nodeState === "active"
                      ? "text-gray-800"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                  {step.key === "result" && isRejected && " ❌"}
                  {step.key === "result" && ps.payment_status === "confirmed" && " ✅"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Thumbnail del comprobante */}
      {ps.voucher_url && (
        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
          {ps.voucher_url.endsWith(".pdf") ? (
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText size={22} className="text-blue-400" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${API_BASE}${ps.voucher_url}`}
              alt="Comprobante"
              className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <p className="text-xs text-gray-600">Comprobante adjuntado</p>
        </div>
      )}

      {/* Sin comprobante: opción de adjuntar */}
      {!ps.voucher_url && !isRejected && (
        <button
          onClick={onGoToVoucher}
          className="w-full text-sm text-center py-3 px-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors"
        >
          📎 Adjuntá tu comprobante ahora
        </button>
      )}

      {/* Motivo de rechazo */}
      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-red-800">No pudimos validar tu pago</p>
          {ps.rejection_reason && (
            <p className="text-sm text-red-600">{ps.rejection_reason}</p>
          )}
          <div className="space-y-2 pt-1">
            <Button
              onClick={onGoToVoucher}
              variant="outline"
              className="w-full border-red-200 text-red-700 hover:bg-red-50"
            >
              Subir otro comprobante
            </Button>
            <Button
              onClick={() => router.push(tenant ? `/${tenant}/checkout` : "/")}
              variant="outline"
              className="w-full"
            >
              Cambiar método de pago
            </Button>
            <Button
              onClick={() => router.push(tenant ? `/${tenant}` : "/")}
              variant="outline"
              className="w-full"
            >
              Volver al menú
            </Button>
          </div>
        </div>
      )}

      {/* Actualizar estado */}
      {!isRejected && (
        <button
          onClick={handleManualRefresh}
          disabled={!canRefresh}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40 py-2 transition-colors"
        >
          <RefreshCw size={14} className={canRefresh ? "" : "animate-spin"} />
          Actualizar estado
        </button>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function TransferFlow({ orderId, order, primaryColor, tenant }: TransferFlowProps) {
  const [phase, setPhase] = useState<TransferPhase>("loading");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusOut | null>(null);

  useEffect(() => {
    getPaymentStatus(orderId).then((ps) => {
      setPaymentStatus(ps);
      const s = ps.payment_status;
      if (!s || s === "awaiting_payment") {
        setPhase("data");
      } else if (s === "payment_declared") {
        setPhase("voucher");
      } else {
        setPhase("validating");
      }
    });
  }, [orderId]);

  if (phase === "loading" || !paymentStatus) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === "data") {
    return (
      <PhaseData
        order={order}
        paymentStatus={paymentStatus}
        primaryColor={primaryColor}
        tenant={tenant}
        onDeclared={() => {
          setPhase("voucher");
        }}
      />
    );
  }

  if (phase === "voucher") {
    return (
      <PhaseVoucher
        orderId={orderId}
        primaryColor={primaryColor}
        onUploaded={() => setPhase("validating")}
        onSkip={() => setPhase("validating")}
      />
    );
  }

  return (
    <PhaseValidating
      orderId={orderId}
      paymentStatus={paymentStatus}
      primaryColor={primaryColor}
      tenant={tenant}
      onGoToVoucher={() => setPhase("voucher")}
    />
  );
}
