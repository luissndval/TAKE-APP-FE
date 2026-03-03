"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/hooks/useAuth";
import { TokenResponse, User } from "@/types/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createLogger } from "@/lib/logger";
import { isSuperadminContext } from "@/lib/tenant-utils";

const logger = createLogger("PlatformLogin");

const schema = z.object({
  email:    z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export default function PlatformLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError]        = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Si se accede desde un subdominio de tenant, redirigir al login del restaurante
  useEffect(() => {
    if (!isSuperadminContext()) {
      logger.warn("platform-login accessed from tenant subdomain — redirecting");
      window.location.href = "/login";
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    logger.info("Superadmin login attempt", { email: values.email });

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

      if (!userData.platform_role) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        logger.warn("Login denied — user is not a platform admin", { email: values.email });
        setError("Este usuario no tiene permisos de plataforma. Usá la URL de tu restaurante.");
        return;
      }

      setAuth(userData);
      logger.info("Superadmin login successful", {
        email:         values.email,
        platform_role: userData.platform_role,
      });
      router.push("/admin/tenants");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const msg = axiosErr.response?.data?.detail || "Error al iniciar sesión";
      logger.error("Login failed", { email: values.email, error: msg });
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Panel izquierdo — branding plataforma */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-10 bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 rounded-xl p-2">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">TakeApp</span>
        </div>

        <div className="space-y-4">
          <p className="text-white/50 text-sm uppercase tracking-widest font-medium">
            Plataforma
          </p>
          <h2 className="text-white text-4xl font-bold leading-tight">
            Panel de administración
          </h2>
          <p className="text-white/60 text-base leading-relaxed">
            Acceso exclusivo para el equipo de TakeApp. Gestioná tenants, planes y estadísticas globales.
          </p>
        </div>

        <div className="space-y-3">
          {["Gestión de restaurantes", "Planes y facturación", "Estadísticas globales"].map(
            (f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="text-white/60 text-sm">{f}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Header móvil */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="rounded-xl p-2 bg-gray-900">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">TakeApp</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">Acceso de plataforma</h1>
            <p className="text-sm text-gray-500">Solo para el equipo de TakeApp</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                {...register("email")}
                type="email"
                placeholder="admin@takeapp.com"
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
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-semibold mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Ingresando...
                </span>
              ) : (
                "Ingresar como Admin"
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-400 text-center">
            TakeApp &copy; {new Date().getFullYear()} &mdash; Acceso restringido
          </p>
        </div>
      </div>
    </div>
  );
}
