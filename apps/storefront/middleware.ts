import { NextRequest, NextResponse } from 'next/server';

const ROOT_DOMAIN = 'andesit.io';
const RESERVED_SUBDOMAINS = ['www', 'api', 'admin'];

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || '';
  // Strip port (e.g. localhost:3000 → localhost)
  const host = hostname.split(':')[0];
  const parts = host.split('.');

  // Only act on subdomains of andesit.io: requires exactly 3 parts (sub.andesit.io)
  // For localhost dev: tenant.localhost has 2 parts
  const isAndesitSubdomain = parts.length === 3 && parts.slice(1).join('.') === ROOT_DOMAIN;
  const isLocalhostSubdomain = parts.length === 2 && parts[1] === 'localhost';

  if (!isAndesitSubdomain && !isLocalhostSubdomain) {
    return NextResponse.next();
  }

  const subdomain = parts[0];

  if (RESERVED_SUBDOMAINS.includes(subdomain)) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;

  // If the path already starts with the tenant slug, Next.js can route it directly.
  // This handles internal navigation links that include /${tenant} in the href.
  if (pathname === `/${subdomain}` || pathname.startsWith(`/${subdomain}/`)) {
    return NextResponse.next();
  }

  // Rewrite to inject the tenant prefix so Next.js routes to /[tenant]/...
  const url = req.nextUrl.clone();
  url.pathname = `/${subdomain}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
