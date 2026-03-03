import { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  params: { tenant: string };
}

interface TenantPublicInfo {
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  font_family: string | null;
}

async function fetchTenantTheme(slug: string): Promise<TenantPublicInfo | null> {
  // INTERNAL_API_URL usa el nombre del servicio Docker (http://backend:8000)
  // para que el fetch server-side funcione dentro del contenedor.
  // NEXT_PUBLIC_API_URL es solo para el browser.
  const baseUrl =
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000";

  try {
    const res = await fetch(`${baseUrl}/api/v1/public/tenant/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { tenant: string };
}): Promise<Metadata> {
  const data = await fetchTenantTheme(params.tenant);
  return data
    ? { title: `${data.name} | TakeApp`, description: `Pedí online en ${data.name}` }
    : { title: "TakeApp" };
}

export default async function TenantLayout({ children, params }: LayoutProps) {
  const data = await fetchTenantTheme(params.tenant);

  const primaryColor   = data?.primary_color   ?? "#f97316";
  const secondaryColor = data?.secondary_color ?? "#2d2d2d";
  const fontFamily     = data?.font_family     ?? "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // Script inline: se ejecuta sincrónicamente antes de que el browser pinte,
  // eliminando el flash de color incorrecto. Setea en :root para que los
  // portals de Radix UI (Sheet, Dialog) también hereden las variables.
  const themeScript = `
    (function(){
      var r=document.documentElement.style;
      r.setProperty('--tenant-primary','${primaryColor}');
      r.setProperty('--tenant-secondary','${secondaryColor}');
      r.setProperty('--font-sans','${fontFamily.replace(/'/g, "\\'")}');
    })();
  `.trim();

  return (
    <div
      className="tenant-wrapper min-h-screen"
      style={{
        // @ts-ignore
        "--tenant-primary": primaryColor,
        "--tenant-secondary": secondaryColor,
        "--font-sans": fontFamily,
      }}
    >
      {/* Script síncrono: setea variables en :root antes de cualquier paint */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {children}
    </div>
  );
}
