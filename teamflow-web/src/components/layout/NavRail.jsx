'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useReveal } from '@/hooks/useReveal';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { Icons } from '@/components/ui/icons';
import { NAV, NAV_FOOT } from '@/lib/constants';
import { apiGet } from '@/lib/apiClient';
import { mapTodo } from '@/lib/utils';
import { getLocalDate } from '@/lib/utils';

function NavItem({ item, active, onClick, badgeVal }) {
  const onMove = useReveal();
  const Icon = Icons[item.iconKey];
  return (
    <div
      className={`nav-item reveal ${active ? 'sel' : ''}`}
      onClick={onClick}
      onMouseMove={onMove}
      title={item.label}
    >
      <span className="ic">{Icon && <Icon size={18} />}</span>
      <span className="lbl">{item.label}</span>
      {badgeVal ? <span className="badge-count">{badgeVal}</span> : null}
    </div>
  );
}

export function NavRail() {
  const pathname = usePathname();
  const router = useRouter();
  const compact = useUIStore((s) => s.compact);
  const me = useAuthStore((s) => s.me);
  const role = me?.role || 'Member';

  const { data: todos } = useQuery({
    queryKey: ['todos', getLocalDate()],
    queryFn: () => apiGet(`todos?date=${getLocalDate()}&includeDone=true`).then((r) => (r || []).map(mapTodo)),
    enabled: !!me,
  });

  const { data: approvals } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => apiGet('todos/pending-approvals'),
    enabled: !!me && role === 'CEO',
  });

  const pendingCount = approvals?.length || 0;
  const pendingMemberCount = (todos || []).filter((t) => t.state === 'waiting' || t.state === 'rejected').length;

  const visible = (it) => it.roles.includes(role);

  const badgeFor = (it) => {
    if (it.badge === 'pending') return pendingCount || 0;
    if (it.badge === 'pending_member') return pendingMemberCount || 0;
    return 0;
  };

  const isActive = (key) => pathname === '/' + key || pathname.startsWith('/' + key + '/');

  const handleNav = (key) => router.push('/' + key);

  return (
    <nav className={`rail ${compact ? 'compact' : ''}`}>
      <div className="rail-scroll">
        {NAV.filter(visible).map((it) => (
          <NavItem
            key={it.key}
            item={it}
            active={isActive(it.key)}
            onClick={() => handleNav(it.key)}
            badgeVal={badgeFor(it)}
          />
        ))}
      </div>
      <div>
        <div className="hr" style={{ margin: '6px 8px' }} />
        {NAV_FOOT.filter(visible).map((it) => (
          <NavItem key={it.key} item={it} active={isActive(it.key)} onClick={() => handleNav(it.key)} />
        ))}
      </div>
    </nav>
  );
}
