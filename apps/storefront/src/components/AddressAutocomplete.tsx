"use client";

import React, { useRef, useState } from "react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { Input } from "./ui/input";
import { Loader2, MapPin } from "lucide-react";

const libraries: ("places")[] = ["places"];

interface AddressAutocompleteProps {
  apiKey?: string;
  onAddressSelect: (address: {
    formatted_address: string;
    lat: number;
    lng: number;
    street_number?: string;
    route?: string;
    locality?: string;
    admin_area_level_1?: string;
    postal_code?: string;
    country?: string;
  }) => void;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

// Inner component — solo se monta cuando hay una API key válida.
// De esta forma useJsApiLoader nunca se llama con "" ni cambia de opciones.
function GoogleMapsAutocompleteInner({
  apiKey,
  onAddressSelect,
  defaultValue = "",
  placeholder = "Ingresá tu dirección...",
  className = "",
}: AddressAutocompleteProps & { apiKey: string }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [inputValue, setInputValue] = useState(defaultValue);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
    autocomplete.setComponentRestrictions({ country: "ar" });
    autocomplete.setFields(["address_components", "formatted_address", "geometry"]);
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (!place || !place.geometry || !place.geometry.location) return;
      if (place.geometry && place.geometry.location) {
        const addressData: any = {
          formatted_address: place.formatted_address || "",
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        place.address_components?.forEach((component) => {
          const type = component.types[0];
          if (type === "street_number") addressData.street_number = component.long_name;
          if (type === "route") addressData.route = component.long_name;
          if (type === "locality") addressData.locality = component.long_name;
          if (type === "administrative_area_level_1") addressData.admin_area_level_1 = component.long_name;
          if (type === "postal_code") addressData.postal_code = component.long_name;
          if (type === "country") addressData.country = component.long_name;
        });
        setInputValue(place.formatted_address || "");
        onAddressSelect(addressData);
      }
    }
  };

  if (loadError) {
    return (
      <div className="text-red-500 text-xs p-2 border border-red-200 rounded bg-red-50">
        Error al cargar Google Maps. Verificá la API Key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative">
        <Input disabled placeholder="Cargando mapa..." className={className} />
        <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
        <div className="relative">
          <Input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={`${className} pr-10`}
          />
          <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </Autocomplete>
    </div>
  );
}

// Componente público — decide si mostrar autocompletado o input de texto libre.
export default function AddressAutocomplete({
  apiKey = "",
  onAddressSelect,
  defaultValue = "",
  placeholder = "Ingresá tu dirección...",
  className = "",
}: AddressAutocompleteProps) {
  const resolvedApiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  if (!resolvedApiKey) {
    return (
      <Input
        type="text"
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={className}
        onBlur={(e) => onAddressSelect({ formatted_address: e.target.value, lat: 0, lng: 0 })}
      />
    );
  }

  return (
    <GoogleMapsAutocompleteInner
      apiKey={resolvedApiKey}
      onAddressSelect={onAddressSelect}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={className}
    />
  );
}
