"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, SearchX } from "lucide-react";
import api from "@/lib/api";
import { getTenantSlug, isSuperadminContext } from "@/lib/tenant-utils";
import { createLogger } from "@/lib/logger";

const logger = createLogger("TenantLogin");
import { useAuthStore } from "@/hooks/useAuth";
import { TokenResponse, User } from "@/types/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface TenantPublicInfo {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

type LoadState = "loading" | "not_found" | "ready";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [tenantInfo, setTenantInfo] = useState<TenantPublicInfo | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    // Sin subdominio → redirigir al login de plataforma (superadmin)
    if (isSuperadminContext()) {
      logger.info("No tenant subdomain — redirecting to platform login");
      window.location.href = "/backoffice/platform-login";
      return;
    }

    const slug = getTenantSlug()!;

    api
      .get<TenantPublicInfo>(`/api/v1/public/tenant/${slug}`)
      .then(({ data }) => {
        logger.info("Tenant info loaded", { slug: data.slug, name: data.name });
        setTenantInfo(data);
        setLoadState("ready");
      })
      .catch(() => {
        logger.warn("Tenant not found", { slug });
        setLoadState("not_found");
      });
  }, []);

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const formData = new URLSearchParams();
      formData.append("username", values.email);
      formData.append("password", values.password);

      const { data: tokenData } = await api.post<TokenResponse>(
        "/api/v1/auth/login",
        formData,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      localStorage.setItem("access_token", tokenData.access_token);
      localStorage.setItem("refresh_token", tokenData.refresh_token);

      const { data: userData } = await api.get<User>("/api/v1/auth/me");

      // Validar que el usuario pertenece al restaurante de la URL
      if (tenantInfo) {
        const isTenantMatch  = userData.tenant_id === tenantInfo.id;
        const isPlatformAdmin = !!userData.platform_role;
        if (!isTenantMatch && !isPlatformAdmin) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          logger.warn("User does not belong to tenant", {
            expected: tenantInfo.slug,
            user_tenant_id: userData.tenant_id,
          });
          setLoginError(
            `Este usuario no pertenece a ${tenantInfo.name}. Verificá tus credenciales.`
          );
          return;
        }
      }
      logger.info("Login successful", {
        email:        values.email,
        tenant:       tenantInfo?.slug,
        tenant_role:  userData.tenant_role,
      });

      setAuth(userData);
      router.push(userData.tenant_role === "kitchen" ? "/kitchen" : "/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setLoginError(
        axiosErr.response?.data?.detail || "Error al iniciar sesión"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Estado: cargando ──────────────────────────────────────────────────────
  if (loadState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <span className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── Estado: restaurante no encontrado (404) ───────────────────────────────
  if (loadState === "not_found") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center space-y-5 max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100">
            <SearchX size={32} className="text-gray-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Restaurante no encontrado
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              No existe ningún restaurante registrado en esta URL.
              <br />
              Verificá que la dirección sea correcta.
            </p>
          </div>
          <div className="bg-gray-100 rounded-lg px-4 py-3 text-xs text-gray-500 font-mono break-all">
            {typeof window !== "undefined" ? window.location.hostname : ""}
          </div>
          <p className="text-xs text-gray-400">
            ¿Sos operador de un restaurante?{" "}
            <span className="font-medium">
              Pedile a tu administrador la URL correcta.
            </span>
          </p>
        </div>
      </div>
    );
  }

  // ── Estado: listo (login form) ────────────────────────────────────────────
  const isTenantLogin = !!tenantInfo;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Panel izquierdo — branding */}
      <div
        className="hidden lg:flex lg:w-2/5 flex-col justify-between p-10"
        style={{ backgroundColor: "var(--backoffice-primary)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          {isTenantLogin && tenantInfo.logo_url ? (
            <img
              src={tenantInfo.logo_url}
              alt={tenantInfo.name}
              className="h-10 w-10 rounded-xl object-cover"
            />
          ) : (
            <div className="bg-white/20 rounded-xl p-2">
              <UtensilsCrossed size={22} className="text-white" />
            </div>
          )}
          <span className="text-white font-bold text-lg tracking-tight">
            {isTenantLogin ? tenantInfo.name : "TakeApp"}
          </span>
        </div>

        {/* Copy central */}
        <div className="space-y-4">
          <p className="text-white/60 text-sm uppercase tracking-widest font-medium">
            {isTenantLogin ? "Panel del Restaurante" : "Plataforma"}
          </p>
          <h2 className="text-white text-4xl font-bold leading-tight">
            {isTenantLogin
              ? `Bienvenido a ${tenantInfo.name}`
              : "Panel de administración"}
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            {isTenantLogin
              ? "Gestioná tus pedidos, menú y equipo desde un solo lugar."
              : "Acceso exclusivo para el equipo de TakeApp."}
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3">
          {(isTenantLogin
            ? [
                "Pedidos en tiempo real",
                "Control del menú y stock",
                "Estadísticas de tu negocio",
              ]
            : [
                "Gestión de restaurantes",
                "Planes y facturación",
                "Estadísticas globales",
              ]
          ).map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
              <span className="text-white/80 text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Header móvil */}
          <div className="flex items-center gap-3 lg:hidden">
            <div
              className="rounded-xl p-2"
              style={{ backgroundColor: "var(--backoffice-primary)" }}
            >
              <UtensilsCrossed size={20} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">
              {isTenantLogin ? tenantInfo.name : "TakeApp"}
            </span>
          </div>

          {/* Título */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {isTenantLogin
                ? `Ingresá a ${tenantInfo.name}`
                : "Bienvenido de vuelta"}
            </h1>
            <p className="text-sm text-gray-500">
              {isTenantLogin
                ? "Panel de gestión de tu restaurante"
                : "Acceso de administrador de plataforma"}
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                {...register("email")}
                type="email"
                placeholder={
                  isTenantLogin
                    ? `operador@${tenantInfo.slug}.com`
                    : "admin@takeapp.com"
                }
                className={errors.email ? "border-red-400" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className={errors.password ? "border-red-400" : ""}
              />
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-white font-semibold mt-2"
              style={{ backgroundColor: "var(--backoffice-primary)" }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Ingresando...
                </span>
              ) : (
                "Ingresar al panel"
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-400 text-center">
            TakeApp &copy; {new Date().getFullYear()} &mdash;{" "}
            {isTenantLogin
              ? "Panel exclusivo para operadores"
              : "Acceso restringido"}
          </p>
        </div>
      </div>
    </div>
  );
}
