"use client";

import { useMutation } from "@tanstack/react-query";
import { fetchDeliveryQuote, type DeliveryQuoteOut } from "@/lib/api";

export function useDeliveryQuote() {
  return useMutation<DeliveryQuoteOut, Error, { tenantSlug: string; address: string }>({
    mutationFn: ({ tenantSlug, address }) => fetchDeliveryQuote(tenantSlug, address),
    retry: 1,
  });
}
