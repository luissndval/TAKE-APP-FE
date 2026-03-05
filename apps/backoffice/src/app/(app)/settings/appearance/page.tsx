"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Palette, Save, ImageIcon, Monitor, Frame } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/ui/ImageUploader";

interface AppearanceData {
  primary_color: string | null;
  secondary_color: string | null;
  font_family: string | null;
  menu_layout: string | null;
  logo_url: string | null;
  banner_url: string | null;
  favicon_url: string | null;
  contact_email: string | null;
}

const FONT_OPTIONS = ["Inter", "Roboto", "Poppins", "Lato", "Montserrat", "Open Sans"];
const LAYOUT_OPTIONS = [
  { value: "grid", label: "Grilla (cards con imagen)" },
  { value: "list", label: "Lista (compacta)" },
  { value: "cards", label: "Tarjetas (full-width)" },
];

export default function AppearanceSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AppearanceData>({
    queryKey: ["settings-appearance"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/backoffice/settings/appearance");
      return data;
    },
  });

  const [primaryColor, setPrimaryColor] = useState("#FF6B35");
  const [secondaryColor, setSecondaryColor] = useState("#2D2D2D");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [menuLayout, setMenuLayout] = useState("grid");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    if (!data) return;
    setPrimaryColor(data.primary_color ?? "#FF6B35");
    setSecondaryColor(data.secondary_color ?? "#2D2D2D");
    setFontFamily(data.font_family ?? "Inter");
    setMenuLayout(data.menu_layout ?? "grid");
    setLogoUrl(data.logo_url);
    setBannerUrl(data.banner_url);
    setFaviconUrl(data.favicon_url);
    setContactEmail(data.contact_email ?? '');
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch(
        "/api/v1/backoffice/settings/appearance",
        {
          primary_color: primaryColor || null,
          secondary_color: secondaryColor || null,
          font_family: fontFamily || null,
          menu_layout: menuLayout || null,
          logo_url: logoUrl || null,
          banner_url: bannerUrl || null,
          favicon_url: faviconUrl || null,
          contact_email: contactEmail || null,
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-appearance"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Apariencia</h2>
        <p className="text-sm text-gray-500 mt-1">
          Personalizá los colores, fuente y estilo del menú que ven tus clientes.
        </p>
      </div>

      {/* Colores */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-gray-500" />
            <CardTitle className="text-base">Colores</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Color primario</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#FF6B35"
                maxLength={7}
                className="w-36 font-mono text-sm"
              />
              <div
                className="flex-1 h-10 rounded-lg border border-gray-100"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color secundario</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <Input
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#2D2D2D"
                maxLength={7}
                className="w-36 font-mono text-sm"
              />
              <div
                className="flex-1 h-10 rounded-lg border border-gray-100"
                style={{ backgroundColor: secondaryColor }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fuente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipografía</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font}
                onClick={() => setFontFamily(font)}
                className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors text-left ${
                  fontFamily === font
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
                style={{ fontFamily: font }}
              >
                {font}
                <p className="text-xs font-normal mt-0.5 opacity-60">Aa Bb Cc</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Diseño del menú</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {LAYOUT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMenuLayout(opt.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors text-left ${
                  menuLayout === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="w-3 h-3 rounded-full border-2 flex-shrink-0"
                  style={{ borderColor: menuLayout === opt.value ? "#3b82f6" : "#d1d5db",
                            backgroundColor: menuLayout === opt.value ? "#3b82f6" : "transparent" }}
                />
                {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Imágenes de Marca */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon size={18} className="text-gray-500" />
            <CardTitle className="text-base">Imágenes de Marca</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUploader 
              label="Logo"
              type="logo"
              value={logoUrl}
              onChange={setLogoUrl}
            />
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Preview del Logo</Label>
              <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 h-[100px]">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={logoUrl.startsWith('http') ? logoUrl : `${process.env.NEXT_PUBLIC_API_URL ?? ""}${logoUrl}`}
                    alt="Logo preview" 
                    className="w-16 h-16 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <span className="text-xs text-gray-400 italic">Sin logo</span>
                )}
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Monitor size={16} className="text-gray-400" />
              Banner del menú
            </div>
            <ImageUploader 
              type="banner"
              value={bannerUrl}
              onChange={setBannerUrl}
            />
            <p className="text-xs text-gray-400 italic">
              Se muestra en la parte superior del menú (recomendado: 1200×400px).
            </p>
          </div>

          <hr className="border-gray-100" />

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Frame size={16} className="text-gray-400" />
              Favicon
            </div>
            <ImageUploader 
              type="favicon"
              value={faviconUrl}
              onChange={setFaviconUrl}
            />
            <p className="text-xs text-gray-400 italic">
              Icono de la pestaña del navegador (recomendado: 32×32px PNG).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email de contacto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información de contacto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="contact_email">Email de contacto</Label>
            <Input
              id="contact_email"
              type="email"
              placeholder="contacto@mirestaurante.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <p className="text-xs text-gray-400">
              Los clientes pueden responder tus emails de notificación a esta dirección.
            </p>
          </div>
        </CardContent>
      </Card>

      {mutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          Error al guardar los cambios.
        </div>
      )}

      {mutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Apariencia actualizada correctamente.
        </div>
      )}

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="gap-2 text-white"
        style={{ backgroundColor: "var(--backoffice-primary)" }}
      >
        <Save size={16} />
        {mutation.isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}
