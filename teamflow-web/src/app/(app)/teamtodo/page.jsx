'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { apiGet } from '@/lib/apiClient';
import { mapTeamTodo, getLocalDate } from '@/lib/utils';
import { Icons } from '@/components/ui/icons';
import { Card, Badge, Avatar } from '@/components/ui/primitives';
import { MultiSelectDropdown } from '@/components/features/MultiSelectDropdown';

const STATUS_LABELS = {
  PENDING_APPROVAL: 'Menunggu Approval',
  PENDING_OVERTIME_APPROVAL: 'Menunggu (Overtime)',
  APPROVED: 'Antrian',
  AUTO_APPROVED: 'Antrian (Auto)',
  REJECTED: 'Ditolak',
  ONGOING: 'Sedang Berjalan',
  PAUSED: 'Dijeda',
  DONE: 'Selesai',
  DEFERRED: 'Ditangguhkan',
};

const STATE_KIND = {
  PENDING_APPROVAL: 'waiting', PENDING_OVERTIME_APPROVAL: 'waiting',
  APPROVED: 'queue', AUTO_APPROVED: 'queue',
  REJECTED: 'rejected', ONGOING: 'ongoing',
  PAUSED: 'paused', DONE: 'done', DEFERRED: 'deferred',
};

export default function TeamTodoPage() {
  const me = useAuthStore((s) => s.me);
  const todayStr = getLocalDate();
  const [filterUserIds, setFilterUserIds] = useState([]);
  const [filterDate, setFilterDate] = useState(todayStr);
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const { data: usersRaw = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiGet('users'),
    enabled: !!me,
  });

  const members = usersRaw.filter((u) => (u.role === 'MEMBER' || u.role === 'Member') && u.isActive);
  const memberOptions = members.map((u) => ({ value: u.id, label: u.fullName || u.name }));
  const statusOptions = Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));

  const params = new URLSearchParams();
  filterUserIds.forEach((id) => params.append('userId', id));
  if (filterDate) params.set('date', filterDate);
  filterStatuses.forEach((s) => params.append('status', s));

  const { data: teamRaw = [], isFetching } = useQuery({
    queryKey: ['team-todos', filterDate, filterUserIds, filterStatuses],
    queryFn: () => apiGet(`todos/team?${params.toString()}`),
    enabled: !!me,
  });

  const teamTodos = teamRaw.map(mapTeamTodo);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = [...teamTodos].sort((a, b) => {
    let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
    if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortArrow = ({ k }) => sortKey !== k ? null : (
    <span style={{ marginLeft: 3, fontSize: 10, opacity: 0.7 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  );

  const ColHead = ({ k, children, style }) => (
    <span onClick={() => handleSort(k)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
               color: sortKey === k ? 'var(--text)' : 'var(--text-secondary)', ...style }}
      className="t-caption">
      {children}<SortArrow k={k} />
    </span>
  );

  return (
    <div className="content-pad page-enter">
      <div className="row" style={{ alignItems: 'flex-end', marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div className="t-title">Todo Tim</div>
          <div className="dim" style={{ marginTop: 2 }}>Semua todo anggota tim</div>
        </div>
      </div>

      <Card style={{ marginBottom: 16, position: 'relative', zIndex: 10 }}>
        <div className="row gap12 wrap">
          <MultiSelectDropdown options={memberOptions} selected={filterUserIds} onChange={setFilterUserIds}
            placeholder="Semua Anggota"
            onSelectAll={() => setFilterUserIds(memberOptions.map((o) => o.value))}
            onClearAll={() => setFilterUserIds([])} />
          <input type="date" className="tbx" value={filterDate}
            onChange={(e) => e.target.value && setFilterDate(e.target.value)}
            style={{ flex: '1 1 140px', minWidth: 130, fontSize: 13 }} />
          <MultiSelectDropdown options={statusOptions} selected={filterStatuses} onChange={setFilterStatuses}
            placeholder="Semua Status" />
          {filterDate !== todayStr && (
            <button className="btn subtle sm" onClick={() => setFilterDate(todayStr)} style={{ fontSize: 12 }}>
              ← Hari Ini
            </button>
          )}
        </div>
      </Card>

      {isFetching && <div className="dim t-caption" style={{ padding: '12px 0' }}>Memuat...</div>}

      {!isFetching && teamTodos.length === 0 && (
        <Card><div className="dim t-caption">Tidak ada todo untuk filter ini.</div></Card>
      )}

      {!isFetching && teamTodos.length > 0 && (
        <Card pad={false}>
          <div className="row" style={{ padding: '8px 18px', borderBottom: '1px solid var(--divider)', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 26, flexShrink: 0 }} />
            <ColHead k="userName" style={{ minWidth: 70 }}>Anggota</ColHead>
            <ColHead k="title" style={{ flex: 1, minWidth: 120 }}>Judul</ColHead>
            <ColHead k="est" style={{ minWidth: 64, textAlign: 'right' }}>Est.</ColHead>
            <ColHead k="status" style={{ minWidth: 110 }}>Status</ColHead>
            <ColHead k="createdAt" style={{ minWidth: 48, textAlign: 'right' }}>Waktu</ColHead>
          </div>
          {sorted.map((t, i) => (
            <div key={t.id} className="row" style={{ padding: '11px 18px', borderTop: i ? '1px solid var(--divider)' : 'none', alignItems: 'center', gap: 8 }}>
              <Avatar first={t.userFirst} size={26} />
              <span className="t-body-strong" style={{ minWidth: 70 }}>{t.userFirst}</span>
              <span style={{ flex: 1, minWidth: 120 }} className="t-body">{t.title}</span>
              <span className="dim t-caption" style={{ minWidth: 64, textAlign: 'right', whiteSpace: 'nowrap' }}>{t.est} jam</span>
              <div className="row gap4" style={{ minWidth: 110 }}>
                <Badge kind={STATE_KIND[t.status] || 'idle'} label={STATUS_LABELS[t.status] || t.status} />
                {t.overtime && <Badge kind="over" label="OT" />}
              </div>
              <span className="dim2 t-caption" style={{ minWidth: 48, textAlign: 'right' }}>{t.createdAt}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
