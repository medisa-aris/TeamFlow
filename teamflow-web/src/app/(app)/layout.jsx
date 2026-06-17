'use client';
import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useToasts } from '@/hooks/useToasts';
import { useSSE } from '@/hooks/useSSE';
import { useTodoEngine } from '@/hooks/useTodoEngine';
import { Header } from '@/components/layout/Header';
import { NavRail } from '@/components/layout/NavRail';
import { ToastHost } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/primitives';
import { Btn } from '@/components/ui/primitives';
import { Icons } from '@/components/ui/icons';

function AppEffects() {
  const me = useAuthStore((s) => s.me);
  const notifPrefs = useAuthStore((s) => s.notifPrefs);
  const { push } = useToasts();
  const [autoStopTitle, setAutoStopTitle] = useState(null);

  const onAutoStop = useCallback((title) => {
    setAutoStopTitle(title);
    push('info', 'Waktu Estimasi Habis', `"${title}" telah otomatis diselesaikan.`);
  }, [push]);

  useSSE(!!me);
  useTodoEngine({ enabled: !!me, notifPrefs, onAutoStop });

  return (
    <>
      {autoStopTitle && (
        <Dialog
          title="Waktu Estimasi Habis"
          icon={<Icons.Clock size={20} style={{ color: '#c8650a' }} />}
          onClose={() => setAutoStopTitle(null)}
          footer={<Btn variant="accent" onClick={() => setAutoStopTitle(null)}>OK</Btn>}
        >
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            Waktu estimasi untuk <strong>"{autoStopTitle}"</strong> telah habis.
            Task telah otomatis diselesaikan.
          </p>
        </Dialog>
      )}
    </>
  );
}

export default function AppLayout({ children }) {
  const compact = useUIStore((s) => s.compact);
  const { toasts, remove } = useToasts();

  return (
    <div className={`app ${compact ? 'compact' : ''}`}>
      <Header />
      <div className="app-body">
        <NavRail />
        <main className="content-host">
          {children}
        </main>
      </div>
      <AppEffects />
      <ToastHost toasts={toasts} remove={remove} />
    </div>
  );
}
