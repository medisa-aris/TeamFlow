'use client';
import { useTheme } from 'next-themes';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { Icons } from '@/components/ui/icons';
import { HBtn, Avatar } from '@/components/ui/primitives';
import { NotifFlyout } from '@/components/layout/NotifFlyout';
import { UserMenuFlyout } from '@/components/layout/UserMenuFlyout';
import { apiGet } from '@/lib/apiClient';

export function Header() {
  const { theme, setTheme } = useTheme();
  const toggleRail = useUIStore((s) => s.toggleRail);
  const notifOpen = useUIStore((s) => s.notifOpen);
  const setNotifOpen = useUIStore((s) => s.setNotifOpen);
  const userMenuOpen = useUIStore((s) => s.userMenuOpen);
  const setUserMenuOpen = useUIStore((s) => s.setUserMenuOpen);
  const me = useAuthStore((s) => s.me);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiGet('notifications').then((r) => Array.isArray(r) ? r : (r?.notifications ?? [])),
    enabled: !!me,
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <header className="titlebar">
      <HBtn onClick={toggleRail} title="Menu"><Icons.Menu size={18} /></HBtn>
      <div className="row gap8" style={{ marginLeft: 2 }}>
        <div className="brand-glyph" style={{ width: 30, height: 30, borderRadius: 8 }}>
          <Icons.Building size={17} />
        </div>
        <div className="t-body-strong hide-mobile-sm" style={{ fontWeight: 700, letterSpacing: '-.01em' }}>TeamFlow</div>
        <span className="t-caption dim2 hide-mobile" style={{ marginTop: 1 }}>Todo Management</span>
      </div>
      <div className="spacer" />
      <div className="row gap8" style={{ position: 'relative' }}>
        <HBtn title="Notifikasi" badge={unreadCount || null} onClick={() => setNotifOpen(!notifOpen)}>
          <Icons.Bell size={18} />
        </HBtn>
        <HBtn title="Ganti tema" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Icons.Moon size={17} /> : <Icons.Sun size={18} />}
        </HBtn>
        <div
          className="row gap8"
          style={{ cursor: 'pointer', padding: '2px 6px 2px 4px', borderRadius: 6 }}
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          title="Profil"
        >
          <Avatar first={me?.first || '?'} size={30} />
          <div className="col hide-mobile" style={{ lineHeight: 1.15 }}>
            <span className="t-caption" style={{ fontWeight: 600 }}>{me?.first || '—'}</span>
            <span className="t-caption dim2" style={{ fontSize: 11 }}>{me?.role || ''}</span>
          </div>
        </div>
        {notifOpen && <NotifFlyout />}
        {userMenuOpen && <UserMenuFlyout />}
      </div>
    </header>
  );
}
