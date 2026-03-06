"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { useTenantPath } from "@/hooks/useTenantPath";

function FailureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenant = searchParams.get("tenant");
  const tenantPath = useTenantPath(tenant);
  const mpPaymentId = searchParams.get("payment_id");

  const { restorePendingCart } = useCartStore();

  useEffect(() => {
    restorePendingCart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isRejected = !!mpPaymentId;

  const title = isRejected ? "Pago rechazado" : "Error en el pago";
  const description = isRejected
    ? "Tu pago fue rechazado por MercadoPago. Podés intentar con otra tarjeta o método de pago."
    : "El pago no pudo procesarse. Podés intentarlo nuevamente.";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center space-y-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto"
        >
          <XCircle size={40} className="text-red-600" />
        </motion.div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-2 text-sm">{description}</p>
        </div>

        <div className="flex flex-col gap-3">
          {isRejected && (
            <Button
              onClick={() => router.push(tenantPath("/checkout"))}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold h-12 rounded-xl"
            >
              Reintentar pago
            </Button>
          )}
          <Button variant="outline" className="w-full h-12 rounded-xl" asChild>
            <Link href={tenantPath("/")}>Volver al menú</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function FailurePage() {
  return (
    <Suspense>
      <FailureContent />
    </Suspense>
  );
}
