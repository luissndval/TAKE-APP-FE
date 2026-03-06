"use client";

/**
 * Returns a path builder that is subdomain-aware.
 *
 * When the app is accessed via a subdomain (e.g. laburgueria.andesit.io),
 * the tenant slug is already encoded in the hostname, so internal paths
 * must NOT include the slug prefix.
 *
 * When accessed via the root domain (e.g. andesit.io/laburgueria), the slug
 * must be included in the path.
 *
 * Usage:
 *   const tenantPath = useTenantPath(tenant);
 *   router.push(tenantPath('/checkout')); // → '/checkout' or '/laburgueria/checkout'
 */
export function useTenantPath(tenant: string | null) {
  return (path: string): string => {
    if (!tenant) return path || "/";
    if (isSubdomainMode(tenant)) return path || "/";
    return `/${tenant}${path}`;
  };
}

function isSubdomainMode(tenant: string): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.split(":")[0];
  return host.split(".")[0] === tenant;
}
