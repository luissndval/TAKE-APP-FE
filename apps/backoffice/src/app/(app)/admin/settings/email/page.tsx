'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, CheckCircle, AlertCircle, Send, Save } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface SmtpConfig {
  smtp_email: string;
  smtp_sender_name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_use_tls: boolean;
  has_password: boolean;
}

interface SmtpForm {
  smtp_email: string;
  smtp_app_password: string;
  smtp_sender_name: string;
  smtp_host: string;
  smtp_port: string;
  smtp_use_tls: boolean;
}

const DEFAULTS: SmtpForm = {
  smtp_email: '',
  smtp_app_password: '',
  smtp_sender_name: 'TakeApp',
  smtp_host: 'smtp.gmail.com',
  smtp_port: '587',
  smtp_use_tls: true,
};

export default function EmailSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SmtpForm>(DEFAULTS);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: config, isLoading } = useQuery<SmtpConfig>({
    queryKey: ['superadmin', 'smtp'],
    queryFn: () => api.get('/api/v1/superadmin/settings/smtp').then((r) => r.data),
  });

  useEffect(() => {
    if (!config) return;
    setForm({
      smtp_email: config.smtp_email,
      smtp_app_password: config.has_password ? '****' : '',
      smtp_sender_name: config.smtp_sender_name,
      smtp_host: config.smtp_host,
      smtp_port: String(config.smtp_port),
      smtp_use_tls: config.smtp_use_tls,
    });
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.put('/api/v1/superadmin/settings/smtp', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'smtp'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const testMutation = useMutation({
    mutationFn: (email: string) =>
      api.post('/api/v1/superadmin/settings/smtp/test', { test_email: email || null }),
    onSuccess: (res) => {
      setTestResult({ ok: true, msg: res.data.detail });
    },
    onError: (err: unknown) => {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Error al enviar email de prueba.';
      setTestResult({ ok: false, msg: detail });
    },
  });

  const handleSave = () => {
    const payload: Record<string, unknown> = {
      smtp_email: form.smtp_email,
      smtp_sender_name: form.smtp_sender_name,
      smtp_host: form.smtp_host,
      smtp_port: parseInt(form.smtp_port) || 587,
      smtp_use_tls: form.smtp_use_tls,
    };
    // Solo enviar el password si fue modificado
    if (form.smtp_app_password && form.smtp_app_password !== '****') {
      payload.smtp_app_password = form.smtp_app_password;
    }
    saveMutation.mutate(payload);
  };

  const isConfigured = config?.smtp_email && config?.has_password;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Mail className="h-6 w-6 text-gray-700" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración SMTP</h1>
          <p className="text-sm text-gray-500">
            Configura el servidor de email para enviar notificaciones desde la plataforma.
          </p>
        </div>
        <div className="ml-auto">
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              <CheckCircle className="h-4 w-4" />
              Configurado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
              <AlertCircle className="h-4 w-4" />
              Sin configurar
            </span>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Credenciales SMTP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="smtp_email">Email de envío</Label>
              <Input
                id="smtp_email"
                type="email"
                placeholder="noreply@gmail.com"
                value={form.smtp_email}
                onChange={(e) => setForm({ ...form, smtp_email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtp_app_password">App Password</Label>
              <Input
                id="smtp_app_password"
                type="password"
                placeholder={config?.has_password ? '••••••••' : 'xxxx xxxx xxxx xxxx'}
                value={form.smtp_app_password}
                onChange={(e) => setForm({ ...form, smtp_app_password: e.target.value })}
              />
              <p className="text-xs text-gray-400">
                Generá una App Password en Google Account → Seguridad → Contraseñas de aplicaciones.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="smtp_sender_name">Nombre del remitente</Label>
            <Input
              id="smtp_sender_name"
              placeholder="TakeApp"
              value={form.smtp_sender_name}
              onChange={(e) => setForm({ ...form, smtp_sender_name: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="smtp_host">Host SMTP</Label>
              <Input
                id="smtp_host"
                placeholder="smtp.gmail.com"
                value={form.smtp_host}
                onChange={(e) => setForm({ ...form, smtp_host: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtp_port">Puerto</Label>
              <Input
                id="smtp_port"
                type="number"
                placeholder="587"
                value={form.smtp_port}
                onChange={(e) => setForm({ ...form, smtp_port: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Usar TLS/STARTTLS</p>
              <p className="text-xs text-gray-400">Recomendado para el puerto 587.</p>
            </div>
            <Switch
              checked={form.smtp_use_tls}
              onCheckedChange={(v) => setForm({ ...form, smtp_use_tls: v })}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'Guardando...' : 'Guardar configuración'}
            </Button>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Guardado
              </span>
            )}
            {saveMutation.isError && (
              <span className="text-sm text-red-600">Error al guardar</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email de prueba</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Enviá un email de prueba para verificar que la configuración SMTP funciona correctamente.
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="destino@ejemplo.com (opcional)"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => {
                setTestResult(null);
                testMutation.mutate(testEmail);
              }}
              disabled={testMutation.isPending}
              className="gap-2 whitespace-nowrap"
            >
              <Send className="h-4 w-4" />
              {testMutation.isPending ? 'Enviando...' : 'Enviar prueba'}
            </Button>
          </div>

          {testResult && (
            <div
              className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
                testResult.ok
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {testResult.msg}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
