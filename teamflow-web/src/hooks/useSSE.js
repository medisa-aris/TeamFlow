'use client';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useSSE(enabled) {
  const queryClient = useQueryClient();
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    let retryTimeout;

    const connect = async () => {
      controllerRef.current = new AbortController();
      try {
        const res = await fetch('/api/sse', {
          headers: { Accept: 'text/event-stream' },
          signal: controllerRef.current.signal,
          credentials: 'include',
        });

        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            try {
              const ev = JSON.parse(line.slice(5).trim());
              if (!ev?.type || ev.type === 'heartbeat') continue;
              if (ev.type.startsWith('todo')) {
                queryClient.invalidateQueries({ queryKey: ['todos'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard'] });
              }
              if (ev.type.startsWith('notification')) {
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                queryClient.invalidateQueries({ queryKey: ['todos'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                queryClient.invalidateQueries({ queryKey: ['approvals'] });
              }
            } catch { /* skip malformed */ }
          }
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          retryTimeout = setTimeout(connect, 5000);
        }
      }
    };

    connect();
    return () => {
      controllerRef.current?.abort();
      clearTimeout(retryTimeout);
    };
  }, [enabled, queryClient]);
}
