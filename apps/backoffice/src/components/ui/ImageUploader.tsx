"use client";

import { useState, useRef } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "./button";
import api from "@/lib/api";

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string) => void;
  type: "logo" | "banner" | "favicon";
  label?: string;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  type,
  label,
  className = "",
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen es muy pesada (máximo 2MB)");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post(`/api/v1/backoffice/settings/upload-image?type=${type}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data.url);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Error al subir la imagen");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  const fullUrl = value 
    ? (value.startsWith("http") ? value : `${process.env.NEXT_PUBLIC_API_URL ?? ""}${value}`)
    : null;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      
      <div className="relative group">
        {value ? (
          <div className="relative rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center min-h-[100px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={fullUrl!} 
              alt={label || "Uploaded image"} 
              className={`object-contain max-h-[150px] w-full ${type === 'favicon' ? 'w-16 h-16' : ''}`}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button 
                type="button"
                variant="secondary" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                Cambiar
              </Button>
              <Button 
                type="button"
                variant="destructive" 
                size="sm"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full min-h-[100px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="animate-spin text-gray-400" size={24} />
            ) : (
              <ImageIcon className="text-gray-400" size={24} />
            )}
            <span className="text-sm text-gray-500">
              {isUploading ? "Subiendo..." : "Subir imagen"}
            </span>
          </button>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFileChange}
        />
      </div>
      
      {/* Fallback para URL manual si el usuario lo prefiere */}
      <div className="flex items-center gap-2">
        <input 
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="O pegá una URL externa..."
          className="flex-1 text-xs border-none bg-transparent text-gray-400 focus:ring-0 p-0 italic"
        />
      </div>
    </div>
  );
}
