"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Save, CheckCircle, AlertCircle, Pencil, Trash2, MapPin, Truck, Car, Store } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import AddressAutocomplete from "@/components/AddressAutocomplete";

interface IntegrationsConfig {
  google_maps_enabled: boolean;
  has_google_maps_key: boolean;
  google_maps_api_key_for_autocomplete: string | null;
  uber_direct_enabled: boolean;
  has_uber_direct_credentials: boolean;
  uber_direct_customer_id: string | null;
  uber_store_id: string | null;
  default_pickup_name: string | null;
  default_pickup_phone: string | null;
  default_pickup_address: {
    street_address: string[];
    city: string;
    state: string;
    zip_code: string;
    country: string;
  } | null;
  default_pickup_lat: number | null;
  default_pickup_lng: number | null;
  default_dropoff_type: string;
  cabify_enabled: boolean;
  has_cabify_credentials: boolean;
  cabify_environment: string;
  cabify_webhook_subscribed: boolean;
  cabify_pickup_address: string | null;
  cabify_pickup_instructions: string | null;
}

// ── Google Maps Card ────────────────────────────────────────────────────────

function GoogleMapsCard({
  config,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: {
  config: IntegrationsConfig | undefined;
  onSave: (payload: Record<string, unknown>) => void;
  onDelete: (provider: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(false);

  const hasKey = config?.has_google_maps_key ?? false;
  const isEnabled = config?.google_maps_enabled ?? false;

  useEffect(() => {
    if (config) setEnabled(config.google_maps_enabled);
  }, [config?.google_maps_enabled]);

  const handleSave = () => {
    const payload: Record<string, unknown> = { google_maps_enabled: enabled };
    if (apiKey && apiKey !== "****") payload.google_maps_api_key = apiKey;
    onSave(payload);
    setEditing(false);
    setApiKey("");
  };

  const handleToggle = (val: boolean) => {
    setEnabled(val);
    if (val && !hasKey) {
      setEditing(true);
    } else {
      onSave({ google_maps_enabled: val });
    }
  };

  const showForm = !hasKey || editing;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin size={18} className="text-blue-500" />
            Google Maps
          </CardTitle>
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                <CheckCircle size={11} /> Activo
              </span>
            ) : (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                Inactivo
              </span>
            )}
            <Switch checked={enabled} onCheckedChange={handleToggle} />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Autocompletado de dirección en checkout y configuración de logística.
        </p>
      </CardHeader>

      {(enabled || hasKey) && (
        <CardContent className="space-y-4">
          {hasKey && !editing ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div>
                <p className="text-sm text-gray-700 font-medium">API Key guardada</p>
                <p className="text-xs text-gray-400 mt-0.5">••••••••••••••••••••</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setEditing(true); setApiKey(""); }}
                  className="gap-1.5 text-xs"
                >
                  <Pencil size={12} /> Modificar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isDeleting}
                  onClick={() => onDelete("google_maps")}
                  className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 size={12} /> Eliminar
                </Button>
              </div>
            </div>
          ) : showForm ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="gmapsKey">API Key de Google Maps</Label>
                <Input
                  id="gmapsKey"
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  Obtené tu clave en{" "}
                  <span className="font-mono text-blue-600">console.cloud.google.com</span>{" "}
                  → Maps JavaScript API + Places API habilitadas.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !apiKey}
                  className="gap-1.5 text-white"
                  style={{ backgroundColor: "var(--backoffice-primary)" }}
                >
                  <Save size={14} />
                  {isSaving ? "Guardando..." : "Guardar"}
                </Button>
                {editing && (
                  <Button size="sm" variant="outline" onClick={() => { setEditing(false); setApiKey(""); }}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}

// ── Dirección del Local (compartida por Uber y Cabify) ──────────────────────

function LocalAddressCard({
  config,
  onSave,
  isSaving,
}: {
  config: IntegrationsConfig | undefined;
  onSave: (payload: Record<string, unknown>) => void;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pickupName, setPickupName] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [pickupStreet, setPickupStreet] = useState("");
  const [pickupCity, setPickupCity] = useState("Buenos Aires");
  const [pickupState, setPickupState] = useState("CABA");
  const [pickupZip, setPickupZip] = useState("");
  const [pickupLat, setPickupLat] = useState("");
  const [pickupLng, setPickupLng] = useState("");
  const [pickupInstructions, setPickupInstructions] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");

  const hasData = !!(config?.default_pickup_name || config?.default_pickup_address);
  const gmapsKey = config?.google_maps_api_key_for_autocomplete ?? "";

  useEffect(() => {
    if (!config || editing) return;
    setPickupName(config.default_pickup_name ?? "");
    setPickupPhone(config.default_pickup_phone ?? "");
    const street = config.default_pickup_address?.street_address?.[0] ?? "";
    setPickupStreet(street);
    setPickupCity(config.default_pickup_address?.city ?? "Buenos Aires");
    setPickupState(config.default_pickup_address?.state ?? "CABA");
    setPickupZip(config.default_pickup_address?.zip_code ?? "");
    setPickupLat(config.default_pickup_lat != null ? String(config.default_pickup_lat) : "");
    setPickupLng(config.default_pickup_lng != null ? String(config.default_pickup_lng) : "");
    setPickupInstructions(config.cabify_pickup_instructions ?? "");
    setFormattedAddress(config.cabify_pickup_address ?? street);
  }, [config, editing]);

  const handleSave = () => {
    const payload: Record<string, unknown> = {};
    if (pickupName) payload.default_pickup_name = pickupName;
    if (pickupPhone) payload.default_pickup_phone = pickupPhone;
    if (pickupLat) payload.default_pickup_lat = parseFloat(pickupLat);
    if (pickupLng) payload.default_pickup_lng = parseFloat(pickupLng);
    if (pickupStreet) {
      payload.default_pickup_address = {
        street_address: [pickupStreet],
        city: pickupCity,
        state: pickupState,
        zip_code: pickupZip,
        country: "AR",
      };
      // Cabify usa un string plano de dirección
      payload.cabify_pickup_address =
        formattedAddress || [pickupStreet, pickupCity, pickupState].filter(Boolean).join(", ");
    }
    payload.cabify_pickup_instructions = pickupInstructions;
    onSave(payload);
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Store size={18} className="text-orange-500" />
            Dirección del Local
          </CardTitle>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Punto de retiro compartido por todas las integraciones de logística (Uber Direct, Cabify).
        </p>
      </CardHeader>

      <CardContent>
        {hasData && !editing ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div>
              {config?.default_pickup_name && (
                <p className="text-sm text-gray-700 font-medium">{config.default_pickup_name}</p>
              )}
              {config?.default_pickup_address?.street_address?.[0] && (
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <MapPin size={10} />
                  {config.default_pickup_address.street_address[0]}
                  {config.default_pickup_address.city ? `, ${config.default_pickup_address.city}` : ""}
                </p>
              )}
              {config?.default_pickup_phone && (
                <p className="text-xs text-gray-400 mt-0.5">{config.default_pickup_phone}</p>
              )}
              {config?.cabify_pickup_instructions && (
                <p className="text-xs text-gray-400 mt-0.5 italic">{config.cabify_pickup_instructions}</p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              className="gap-1.5 text-xs"
            >
              <Pencil size={12} /> Modificar
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="localName">Nombre del local</Label>
              <Input
                id="localName"
                type="text"
                placeholder="La Burguería"
                value={pickupName}
                onChange={(e) => setPickupName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="localPhone">Teléfono (con código país)</Label>
              <Input
                id="localPhone"
                type="tel"
                placeholder="+5491112345678"
                value={pickupPhone}
                onChange={(e) => setPickupPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <AddressAutocomplete
                apiKey={gmapsKey}
                defaultValue={pickupStreet}
                onAddressSelect={(data) => {
                  setPickupStreet(data.formatted_address);
                  setFormattedAddress(data.formatted_address);
                  if (data.locality) setPickupCity(data.locality);
                  if (data.admin_area_level_1) setPickupState(data.admin_area_level_1);
                  if (data.postal_code) setPickupZip(data.postal_code);
                  setPickupLat(String(data.lat));
                  setPickupLng(String(data.lng));
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="localLat">Latitud</Label>
                <Input
                  id="localLat"
                  type="number"
                  step="0.000001"
                  placeholder="-34.6037"
                  value={pickupLat}
                  onChange={(e) => setPickupLat(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="localLng">Longitud</Label>
                <Input
                  id="localLng"
                  type="number"
                  step="0.000001"
                  placeholder="-58.3816"
                  value={pickupLng}
                  onChange={(e) => setPickupLng(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="localInstructions">
                Instrucciones de retiro{" "}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </Label>
              <Input
                id="localInstructions"
                type="text"
                placeholder="Retirar en mostrador, preguntar por pedidos online"
                value={pickupInstructions}
                onChange={(e) => setPickupInstructions(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-1.5 text-white"
                style={{ backgroundColor: "var(--backoffice-primary)" }}
              >
                <Save size={14} />
                {isSaving ? "Guardando..." : "Guardar dirección"}
              </Button>
              {editing && (
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Uber Direct Card ────────────────────────────────────────────────────────

const DROPOFF_TYPES = [
  { value: "DOOR", label: "En la puerta (DOOR)" },
  { value: "CURBSIDE", label: "En la vereda (CURBSIDE)" },
  { value: "LEAVE_AT_DOOR", label: "Dejar en puerta (LEAVE_AT_DOOR)" },
];

function UberDirectCard({
  config,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: {
  config: IntegrationsConfig | undefined;
  onSave: (payload: Record<string, unknown>) => void;
  onDelete: (provider: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
}) {
  const [editingCreds, setEditingCreds] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [dropoffType, setDropoffType] = useState("DOOR");

  const hasCredentials = config?.has_uber_direct_credentials ?? false;
  const isEnabled = config?.uber_direct_enabled ?? false;

  useEffect(() => {
    if (!config || editingCreds) return;
    setCustomerId(config.uber_direct_customer_id ?? "");
    setStoreId(config.uber_store_id ?? "");
    setDropoffType(config.default_dropoff_type ?? "DOOR");
  }, [config?.uber_direct_customer_id, config?.uber_store_id, config?.default_dropoff_type, editingCreds]);

  const startEditingCreds = () => {
    setEditingCreds(true);
    setClientId("");
    setClientSecret("");
    setCustomerId(config?.uber_direct_customer_id ?? "");
    setStoreId(config?.uber_store_id ?? "");
    setDropoffType(config?.default_dropoff_type ?? "DOOR");
  };

  const handleSaveCredentials = () => {
    const payload: Record<string, unknown> = {
      default_dropoff_type: dropoffType,
    };
    if (clientId) payload.uber_direct_client_id = clientId;
    if (clientSecret) payload.uber_direct_client_secret = clientSecret;
    if (customerId) payload.uber_direct_customer_id = customerId;
    if (storeId) payload.uber_store_id = storeId;
    onSave(payload);
    setEditingCreds(false);
    setClientId("");
    setClientSecret("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck size={18} className="text-black" />
            Uber Direct
          </CardTitle>
          <div className="flex items-center gap-2">
            {isEnabled ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                <CheckCircle size={11} /> Activo
              </span>
            ) : (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                Inactivo
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Delivery on-demand con seguimiento en tiempo real.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Credenciales API ── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Credenciales API</p>
          {hasCredentials && !editingCreds ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div>
                <p className="text-sm text-gray-700 font-medium">Credenciales guardadas</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {config?.uber_direct_customer_id
                    ? `Customer ID: ${config.uber_direct_customer_id}`
                    : "Client ID y Secret guardados"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Entrega: {DROPOFF_TYPES.find((d) => d.value === config?.default_dropoff_type)?.label ?? config?.default_dropoff_type}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startEditingCreds}
                  className="gap-1.5 text-xs"
                >
                  <Pencil size={12} /> Modificar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isDeleting}
                  onClick={() => onDelete("uber")}
                  className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 size={12} /> Eliminar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">
                Obtené tus credenciales en{" "}
                <span className="font-mono text-blue-600">direct.uber.com → Developer</span>
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="uberClientId">Client ID</Label>
                <Input
                  id="uberClientId"
                  type="text"
                  placeholder={hasCredentials ? "Dejá vacío para no cambiar" : "Tu Client ID"}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="uberClientSecret">Client Secret</Label>
                <Input
                  id="uberClientSecret"
                  type="password"
                  placeholder={hasCredentials ? "Dejá vacío para no cambiar" : "Tu Client Secret"}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="uberCustomerId">Customer ID</Label>
                <Input
                  id="uberCustomerId"
                  type="text"
                  placeholder="Tu Customer ID"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="uberStoreId">Store ID (opcional)</Label>
                <Input
                  id="uberStoreId"
                  type="text"
                  placeholder="Tu Store ID"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de entrega al cliente</Label>
                <div className="space-y-1.5">
                  {DROPOFF_TYPES.map((dt) => (
                    <label
                      key={dt.value}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                        dropoffType === dt.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="uberDropoffType"
                        value={dt.value}
                        checked={dropoffType === dt.value}
                        onChange={() => setDropoffType(dt.value)}
                        className="accent-blue-600"
                      />
                      {dt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveCredentials}
                  disabled={isSaving}
                  className="gap-1.5 text-white"
                  style={{ backgroundColor: "var(--backoffice-primary)" }}
                >
                  <Save size={14} />
                  {isSaving ? "Guardando..." : "Guardar"}
                </Button>
                {editingCreds && (
                  <Button size="sm" variant="outline" onClick={() => setEditingCreds(false)}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Cabify Card ──────────────────────────────────────────────────────────────

function CabifyCard({
  config,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: {
  config: IntegrationsConfig | undefined;
  onSave: (payload: Record<string, unknown>) => void;
  onDelete: (provider: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [environment, setEnvironment] = useState("sandbox");

  const hasCredentials = config?.has_cabify_credentials ?? false;
  const isEnabled = config?.cabify_enabled ?? false;

  useEffect(() => {
    if (!config || editing) return;
    setEnvironment(config.cabify_environment ?? "sandbox");
  }, [config?.cabify_environment, editing]);

  const startEditing = () => {
    setEditing(true);
    setEnvironment(config?.cabify_environment ?? "sandbox");
  };

  const handleSave = () => {
    const payload: Record<string, unknown> = {
      cabify_environment: environment,
    };
    if (apiKey) payload.cabify_api_key = apiKey;
    if (secretKey) payload.cabify_secret_key = secretKey;
    onSave(payload);
    setEditing(false);
    setApiKey("");
    setSecretKey("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Car size={18} className="text-purple-500" />
            Cabify Logistics
          </CardTitle>
          <div className="flex items-center gap-2">
            {isEnabled ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                <CheckCircle size={11} /> Activo
                {config?.cabify_webhook_subscribed && (
                  <span className="text-green-600"> · webhook ✓</span>
                )}
              </span>
            ) : (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                Inactivo
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Delivery con seguimiento vía Cabify Business.
        </p>
      </CardHeader>

      <CardContent>
        {hasCredentials && !editing ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div>
              <p className="text-sm text-gray-700 font-medium">Credenciales guardadas</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Entorno: {config?.cabify_environment === "production" ? "Producción" : "Sandbox"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={startEditing}
                className="gap-1.5 text-xs"
              >
                <Pencil size={12} /> Modificar
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isDeleting}
                onClick={() => onDelete("cabify")}
                className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 size={12} /> Eliminar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">
                Generá tus claves en{" "}
                <span className="font-mono text-purple-600">logistics.cabify.com → Integraciones</span>
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="cabifyApiKey">API Key</Label>
                <Input
                  id="cabifyApiKey"
                  type="password"
                  placeholder={hasCredentials ? "Dejá vacío para no cambiar" : "cabify-api-key-xxxxx"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cabifySecretKey">Secret Key</Label>
                <Input
                  id="cabifySecretKey"
                  type="password"
                  placeholder={hasCredentials ? "Dejá vacío para no cambiar" : "cabify-secret-key-xxxxx"}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Entorno</Label>
                <div className="flex gap-3">
                  {[
                    { value: "sandbox", label: "Sandbox (pruebas)" },
                    { value: "production", label: "Producción" },
                  ].map((env) => (
                    <label
                      key={env.value}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                        environment === env.value
                          ? "border-purple-500 bg-purple-50 text-purple-800 font-medium"
                          : "border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cabifyEnv"
                        value={env.value}
                        checked={environment === env.value}
                        onChange={() => setEnvironment(env.value)}
                        className="accent-purple-600"
                      />
                      {env.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-1.5 text-white"
                style={{ backgroundColor: "var(--backoffice-primary)" }}
              >
                <Save size={14} />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
              {editing && (
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function IntegrationsSettingsPage() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery<IntegrationsConfig>({
    queryKey: ["settings-integrations"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/backoffice/settings/integrations");
      return data;
    },
  });

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.put("/api/v1/backoffice/settings/integrations", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-integrations"] });
      setSaveError(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      setSaveError(err.response?.data?.detail ?? "Error al guardar la configuración.");
      setSaveSuccess(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (provider: string) => {
      await api.delete(`/api/v1/backoffice/settings/integrations/${provider}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-integrations"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Cargando configuraciones...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <KeyRound size={22} />
          Integraciones
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Administrá las credenciales de APIs de terceros para tu local.
          Las credenciales se almacenan de forma segura y encriptada.
        </p>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          <CheckCircle size={15} /> Configuración guardada correctamente.
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={15} /> {saveError}
        </div>
      )}

      <GoogleMapsCard
        config={config}
        onSave={saveMutation.mutate}
        onDelete={deleteMutation.mutate}
        isSaving={saveMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />

      <LocalAddressCard
        config={config}
        onSave={saveMutation.mutate}
        isSaving={saveMutation.isPending}
      />

      <UberDirectCard
        config={config}
        onSave={saveMutation.mutate}
        onDelete={deleteMutation.mutate}
        isSaving={saveMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />

      <CabifyCard
        config={config}
        onSave={saveMutation.mutate}
        onDelete={deleteMutation.mutate}
        isSaving={saveMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />

      <p className="text-xs text-gray-400">
        Las configuraciones de proveedor y despacho automático se gestionan en{" "}
        <Link href="/settings/logistics" className="text-blue-500 underline">
          Logística
        </Link>
        .
      </p>
    </div>
  );
}
