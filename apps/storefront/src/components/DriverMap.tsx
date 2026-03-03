"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

// Fix para ícono de Leaflet en Next.js (las imágenes no se resuelven por defecto)
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface RecenterProps {
  lat: number;
  lng: number;
}

function Recenter({ lat, lng }: RecenterProps) {
  const map = useMap();
  map.setView([lat, lng]);
  return null;
}

interface DriverMapProps {
  lat: number;
  lng: number;
}

export default function DriverMap({ lat, lng }: DriverMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      style={{ height: "200px", width: "100%", borderRadius: "12px" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} />
      <Recenter lat={lat} lng={lng} />
    </MapContainer>
  );
}
