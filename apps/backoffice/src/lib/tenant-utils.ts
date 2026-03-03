/**
 * Extrae el slug del tenant desde el hostname del navegador.
 *
 * Desarrollo:
 *   laburgueria.localhost   →  'laburgueria'
 *   localhost               →  null  (contexto superadmin)
 *
 * Producción:
 *   laburgueria.takeapp.com →  'laburgueria'
 *   takeapp.com             →  null  (contexto superadmin)
 */
export function getTenantSlug(): string | null {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname;

  // Dominios base sin tenant
  if (hostname === "localhost" || hostname === "takeapp.com") {
    return null;
  }

  // *.localhost (dev): "laburgueria.localhost" → "laburgueria"
  if (hostname.endsWith(".localhost")) {
    return hostname.slice(0, -".localhost".length);
  }

  // *.takeapp.com (prod): "laburgueria.takeapp.com" → "laburgueria"
  if (hostname.endsWith(".takeapp.com")) {
    return hostname.slice(0, -".takeapp.com".length);
  }

  return null;
}

/** True cuando estamos en el dominio base sin subdominio (contexto superadmin) */
export function isSuperadminContext(): boolean {
  return getTenantSlug() === null;
}
