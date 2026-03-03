"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Save, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ScheduleDay {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

const DAYS = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
];

const DEFAULT_SCHEDULE: ScheduleDay[] = DAYS.map((_, index) => ({
  day_of_week: index,
  open_time: "09:00:00",
  close_time: "23:00:00",
  is_closed: false,
}));

export default function ScheduleSettingsPage() {
  const queryClient = useQueryClient();
  const [schedules, setSchedules] = useState<ScheduleDay[]>(DEFAULT_SCHEDULE);

  const { data, isLoading } = useQuery<ScheduleDay[]>({
    queryKey: ["settings-schedule"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/backoffice/settings/schedule");
      return data;
    },
  });

  useEffect(() => {
    if (data && data.length > 0) {
      // Mappear datos recibidos asegurando que estén los 7 días
      const newSchedules = [...DEFAULT_SCHEDULE];
      data.forEach(s => {
        newSchedules[s.day_of_week] = s;
      });
      setSchedules(newSchedules);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (payload: { schedules: ScheduleDay[] }) => {
      const { data } = await api.put("/api/v1/backoffice/settings/schedule", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-schedule"] });
    },
  });

  const handleToggle = (index: number) => {
    const newSchedules = [...schedules];
    newSchedules[index].is_closed = !newSchedules[index].is_closed;
    setSchedules(newSchedules);
  };

  const handleChangeTime = (index: number, field: 'open_time' | 'close_time', value: string) => {
    const newSchedules = [...schedules];
    // Asegurar formato HH:mm:ss
    const formattedValue = value.length === 5 ? `${value}:00` : value;
    newSchedules[index][field] = formattedValue;
    setSchedules(newSchedules);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Cargando horarios...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Horarios de Atención</h2>
        <p className="text-sm text-gray-500 mt-1">
          Definí en qué momentos tu tienda está abierta para recibir pedidos automáticamente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-gray-500" />
            <CardTitle className="text-base">Horario Semanal</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="divide-y">
          {schedules.map((day, index) => (
            <div key={index} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-[120px]">
                <p className="font-bold text-gray-900">{DAYS[index]}</p>
                <p className="text-xs text-gray-500">
                  {day.is_closed ? 'Cerrado todo el día' : 'Abierto'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {!day.is_closed ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="time" 
                      value={day.open_time.substring(0, 5)}
                      onChange={(e) => handleChangeTime(index, 'open_time', e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <span className="text-gray-400">a</span>
                    <input 
                      type="time" 
                      value={day.close_time.substring(0, 5)}
                      onChange={(e) => handleChangeTime(index, 'close_time', e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex-1 h-9 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200 px-8">
                    <span className="text-xs text-gray-400 font-medium">No disponible</span>
                  </div>
                )}

                <div className="flex items-center gap-2 border-l pl-4 ml-2">
                  <Label htmlFor={`close-${index}`} className="text-xs font-bold text-gray-400 uppercase">Cerrado</Label>
                  <Switch 
                    id={`close-${index}`}
                    checked={day.is_closed}
                    onCheckedChange={() => handleToggle(index)}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {mutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex gap-2">
          <AlertCircle size={18} /> Error al guardar los horarios.
        </div>
      )}

      {mutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Horarios actualizados correctamente.
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => mutation.mutate({ schedules })}
          disabled={mutation.isPending}
          className="gap-2 text-white px-8"
          style={{ backgroundColor: "var(--backoffice-primary)" }}
        >
          {mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Guardar Horarios
        </Button>
      </div>
    </div>
  );
}
