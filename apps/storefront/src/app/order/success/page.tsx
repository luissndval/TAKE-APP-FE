"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SuccessRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const externalReference = searchParams.get("external_reference");
  const tenant = searchParams.get("tenant");

  useEffect(() => {
    if (externalReference) {
      router.replace(
        `/order/${externalReference}?tenant=${tenant ?? ""}`
      );
    } else {
      router.replace(tenant ? `/${tenant}` : "/");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessRedirect />
    </Suspense>
  );
}
