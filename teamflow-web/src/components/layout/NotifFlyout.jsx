'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { Icons } from '@/components/ui/icons';
import { apiGet, apiDelete } from '@/lib/apiClient';
import { NOTIF_KIND, NOTIF_NAV } from '@/lib/constants';

export function NotifFlyout() {
  const router = useRouter();
  const setNotifOpen = useUIStore((s) => s.setNotifOpen);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiGet('notifications').then((r) => Array.isArray(r) ? r : (r?.notifications ?? [])),
  });

  const markRead = useMutation({
    mutationFn: (id) => apiDelete(`notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const clearAll = useMutation({
    mutationFn: () => apiDelete('notifications'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = notifications.slice(0, 5);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 39 }} onClick={() => setNotifOpen(false)} />
      <div className="card solid" style={{
        position: 'absolute', top: 50, right: 8, width: 320, zIndex: 40,
        padding: 0, boxShadow: 'var(--shadow-flyout)', overflow: 'hidden',
      }}>
        <div className="row" style={{ padding: '12px 14px 8px' }}>
          <div className="t-body-strong" style={{ flex: 1 }}>Notifikasi</div>
          <span className="t-caption dim2">{items.filter((n) => !n.readAt).length} baru</span>
          {items.length > 0 && (
            <button
              className="t-caption"
              style={{ marginLeft: 10, color: '#c42b1c', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => { clearAll.mutate(); setNotifOpen(false); }}
            >
              Hapus Semua
            </button>
          )}
        </div>
        <div className="hr" />
        {items.length === 0 && (
          <div className="t-caption dim" style={{ padding: '16px 14px' }}>Tidak ada notifikasi</div>
        )}
        {items.map((n, i) => {
          const k = NOTIF_KIND[n.type] || 'info';
          const to = NOTIF_NAV[n.type] || '/dashboard';
          return (
            <div
              key={n.id || i}
              className="row gap12 reveal"
              style={{
                padding: '11px 14px', cursor: 'pointer', alignItems: 'flex-start',
                background: n.readAt ? 'transparent' : 'color-mix(in srgb, var(--accent) 5%, transparent)',
              }}
              onClick={() => {
                setNotifOpen(false);
                markRead.mutate(n.id);
                router.push(to);
              }}
            >
              <span style={{
                flex: '0 0 22px', height: 22, display: 'grid', placeItems: 'center',
                borderRadius: '50%', marginTop: 1, background: 'var(--subtle-sel)',
                color: k === 'err' ? '#c42b1c' : k === 'ok' ? '#0f7b3f' : 'var(--accent)',
              }}>
                <Icons.Dot size={10} />
              </span>
              <div style={{ flex: 1 }}>
                <div className="t-caption" style={{ fontWeight: n.readAt ? 400 : 600 }}>{n.title}</div>
                <div className="t-caption dim2" style={{ marginTop: 2 }}>{n.body}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
