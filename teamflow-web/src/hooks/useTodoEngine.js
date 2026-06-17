'use client';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/apiClient';

export function useTodoEngine({ enabled, notifPrefs, onAutoStop }) {
  const queryClient = useQueryClient();
  const notifiedRef = useRef(new Set());
  const autoStoppedRef = useRef(new Set());

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => {
      const todosData = queryClient.getQueryData(['todos']) || [];
      const todos = Array.isArray(todosData) ? todosData : [];
      const running = todos.filter((t) => t.running);

      for (const t of running) {
        const sec = t.acc + (t.lastStart ? Math.floor((Date.now() - t.lastStart) / 1000) : 0);
        const remaining = t.est * 3600 - sec;

        if (remaining <= 600 && remaining > 0 && !notifiedRef.current.has(t.id) && notifPrefs?.reminder) {
          notifiedRef.current.add(t.id);
          if (typeof window !== 'undefined' && 'Notification' in window) {
            const body = `Task "${t.title}" tersisa ${Math.ceil(remaining / 60)} menit lagi.`;
            if (Notification.permission === 'granted') {
              new Notification('TeamFlow – Pengingat', { body });
            } else if (Notification.permission === 'default') {
              Notification.requestPermission().then((p) => {
                if (p === 'granted') new Notification('TeamFlow – Pengingat', { body });
              });
            }
          }
        }

        if (remaining <= 0 && !autoStoppedRef.current.has(t.id)) {
          autoStoppedRef.current.add(t.id);
          apiPost(`todos/${t.id}/complete`).then(() => {
            queryClient.invalidateQueries({ queryKey: ['todos'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            onAutoStop?.(t.title);
          }).catch(() => {});
        }
      }

      const runningIds = new Set(running.map((t) => t.id));
      for (const id of notifiedRef.current) {
        if (!runningIds.has(id)) notifiedRef.current.delete(id);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [enabled, notifPrefs?.reminder, queryClient, onAutoStop]);
}
