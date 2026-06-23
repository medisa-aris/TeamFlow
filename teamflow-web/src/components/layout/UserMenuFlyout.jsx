'use client';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { Icons } from '@/components/ui/icons';

export function UserMenuFlyout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUserMenuOpen = useUIStore((s) => s.setUserMenuOpen);
  const me = useAuthStore((s) => s.me);
  const clearAuth = useAuthStore((s) => s.clear);

  const close = () => setUserMenuOpen(false);

  const goSettings = () => {
    close();
    router.push('/settings');
  };

  const logout = async () => {
    close();
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    clearAuth();
    queryClient.clear();
    router.replace('/login');
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 39 }} onClick={close} />
      <div className="card solid" style={{
        position: 'absolute', top: 50, right: 8, width: 220, zIndex: 40,
        padding: 0, boxShadow: 'var(--shadow-flyout)', overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 14px' }}>
          <div className="t-body-strong">{me?.fullName || me?.first || '—'}</div>
          <div className="t-caption dim2" style={{ marginTop: 1 }}>{me?.email || me?.role || ''}</div>
        </div>
        <div className="hr" />
        <button
          className="row gap8 t-caption"
          style={{ width: '100%', padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          onClick={goSettings}
        >
          <Icons.Users3 size={15} /> Profil &amp; Settings
        </button>
        <div className="hr" />
        <button
          className="row gap8 t-caption"
          style={{ width: '100%', padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#c42b1c' }}
          onClick={logout}
        >
          <Icons.Logout size={15} /> Keluar / Logout
        </button>
      </div>
    </>
  );
}
