import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime); // A5 note
    
    gain.gain.setValueAtTime(0.5, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.5);
  } catch (e) {
    console.error("Could not play notification sound", e);
  }
};

export const useOrdersSocket = () => {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let destroyed = false;

    const connect = () => {
      const token = localStorage.getItem('access_token');
      if (!token || destroyed) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, '') || 'localhost:8000';

      const socket = new WebSocket(`${protocol}//${host}/api/v1/backoffice/orders/live?token=${token}`);
      socketRef.current = socket;

      socket.onmessage = (event) => {
        const { event: eventName, data } = JSON.parse(event.data);

        if (eventName === 'new_order') {
          playNotificationSound();

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("¡Nuevo Pedido!", {
              body: `Recibiste un nuevo pedido de ${data.customer_name || "un cliente"}.`,
              icon: "/favicon.ico"
            });
          }

          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
        } else if (eventName === 'order_status_changed') {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['order', data.order_id] });
        }
      };

      socket.onclose = () => {
        if (!destroyed) {
          retryRef.current = setTimeout(connect, 5000);
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    connect();

    return () => {
      destroyed = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      socketRef.current?.close();
    };
  }, [queryClient]);

  return socketRef.current;
};
