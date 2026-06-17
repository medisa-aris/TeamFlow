'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { apiGet } from '@/lib/apiClient';
import { mapTeamHours, mapWeek7 } from '@/lib/utils';
import { Icons } from '@/components/ui/icons';
import { Card, Badge, ProgressBar, Avatar } from '@/components/ui/primitives';

function StatCard({ label, value, sub, Icon, tone }) {
  return (
    <Card hover className="reveal" style={{ position: 'relative' }}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="col" style={{ flex: 1, gap: 2 }}>
          <span className="t-caption dim" style={{ minHeight: 32 }}>{label}</span>
          <span className="t-title-lg" style={{ marginTop: 4 }}>{value}</span>
          {sub && <span className="t-caption dim2" style={{ marginTop: 2 }}>{sub}</span>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, display: 'grid', placeItems: 'center',
          color: tone, background: `color-mix(in srgb, ${tone} 14%, transparent)` }}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}

function AnimatedBars({ data }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);
  const mx = Math.max(...data.map((d) => d.v), 1);
  return (
    <div className="bars">
      {data.map((d, i) => (
        <div className="bcol" key={i}>
          <span className="bval">{d.v}</span>
          <div className="bstack">
            <div className="bfill" style={{
              height: mounted ? `${(d.v / mx) * 100}%` : 0,
              transitionDelay: `${i * 55}ms`,
              opacity: d.v === 0 ? 0.25 : 1,
            }} />
          </div>
          <span className="blbl">{d.d}</span>
        </div>
      ))}
    </div>
  );
}

function TeamHourRow({ p }) {
  return (
    <div className="row gap12" style={{ padding: '9px 0' }}>
      <Avatar first={p.first} size={30} />
      <div style={{ width: 54 }} className="t-body-strong">{p.first}</div>
      <div style={{ flex: 1 }}>
        <ProgressBar value={p.used} max={p.total}
          variant={p.status === 'done' ? 'full' : p.used >= p.total ? 'warn' : ''} />
      </div>
      <div className="dim t-caption" style={{ width: 56, textAlign: 'right' }}>{p.used}/{p.total} jam</div>
      <div style={{ width: 132, display: 'flex', justifyContent: 'flex-end' }}>
        <Badge kind={p.status} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const me = useAuthStore((s) => s.me);
  const isCEO = me?.role === 'CEO';
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const { data: todayData } = useQuery({
    queryKey: ['dashboard', 'today'],
    queryFn: () => apiGet('dashboard/today'),
    enabled: !!me,
  });

  const { data: histData } = useQuery({
    queryKey: ['dashboard', 'history'],
    queryFn: () => apiGet('dashboard/history?days=7'),
    enabled: !!me,
  });

  const { data: todosRaw = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: () => apiGet('todos?includeDone=true'),
    enabled: !!me && !isCEO,
  });

  const { data: approvalsRaw = [] } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => apiGet('todos/pending-approvals'),
    enabled: !!me && isCEO,
  });

  const { data: usersRaw = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiGet('users'),
    enabled: !!me && isCEO,
  });

  const team = mapTeamHours(todayData?.members || []);
  const week = mapWeek7(histData);

  const ongoing = isCEO
    ? team.filter((t) => t.status === 'ongoing').length
    : todosRaw.filter((t) => t.status === 'ONGOING').length;

  const doneCount = todosRaw.filter((t) => t.status === 'DONE').length;

  const pending = isCEO
    ? approvalsRaw.length
    : todosRaw.filter((t) => t.status === 'PENDING_APPROVAL' || t.status === 'PENDING_OVERTIME_APPROVAL').length;

  const totalMembers = isCEO ? usersRaw.length : team.length || '—';

  const myTeamRow = !isCEO ? team.find((t) => t.userId === me?.id) : null;
  const myHoursApproved = myTeamRow?.approved ?? 0;
  const teamDisplay = isCEO ? team : (myTeamRow ? [myTeamRow] : []);
  const teamWeekTotal = Math.round(week.reduce((s, d) => s + d.v, 0) * 10) / 10;

  return (
    <div className="content-pad page-enter">
      <div className="row" style={{ alignItems: 'flex-end', marginBottom: 22 }}>
        <div>
          <div className="t-title">Dashboard</div>
          <div className="dim" style={{ marginTop: 2 }}>{today}</div>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label={isCEO ? 'Total Anggota' : 'Anggota Aktif'} value={totalMembers} sub="pengguna aktif" Icon={Icons.Users3} tone="var(--accent)" />
        <StatCard label="Ongoing Sekarang" value={ongoing}
          sub={isCEO ? 'sedang bekerja' : 'todo berjalan'} Icon={Icons.Refresh} tone="#2b9d6b" />
        <StatCard label="Menunggu Approval" value={pending}
          sub={isCEO ? 'batas 09:00' : 'menunggu CEO'} Icon={Icons.Hourglass} tone="#c8650a" />
        <StatCard label="Selesai Hari Ini" value={doneCount} sub="todo tuntas" Icon={Icons.CheckCircle} tone="#0f7b3f" />
        {!isCEO && (
          <StatCard label="Jam Kerja Saya Hari Ini" value={`${myHoursApproved}j`}
            sub="jam disetujui hari ini" Icon={Icons.Clock} tone="var(--accent)" />
        )}
        {!isCEO && (
          <StatCard label="Total Kerja Tim 7 Hari" value={`${teamWeekTotal}j`}
            sub="seluruh tim, 7 hari terakhir" Icon={Icons.Chart} tone="#2b9d6b" />
        )}
      </div>

      <div className="two-col" style={{ marginTop: 24 }}>
        <Card>
          <div className="row" style={{ marginBottom: 6 }}>
            <div className="t-subtitle" style={{ flex: 1 }}>
              {isCEO ? 'Jam Kerja Tim Hari Ini' : 'Jam Kerja Saya Hari Ini'}
            </div>
            <span className="pulse-dot" />
          </div>
          <div className="hr" style={{ margin: '6px 0 4px' }} />
          {team.length === 0
            ? <div className="dim t-caption" style={{ padding: '12px 0' }}>Memuat data...</div>
            : teamDisplay.length === 0
              ? <div className="dim t-caption" style={{ padding: '12px 0' }}>Data belum tersedia</div>
              : teamDisplay.map((p) => <TeamHourRow key={p.userId || p.first} p={p} />)}
        </Card>

        <Card>
          <div className="t-subtitle" style={{ marginBottom: 4 }}>7 Hari Terakhir</div>
          <div className="dim t-caption" style={{ marginBottom: 8 }}>Total jam kerja tim per hari</div>
          {week.length > 0
            ? <AnimatedBars data={week} />
            : <div className="dim t-caption" style={{ padding: '20px 0' }}>Memuat grafik...</div>}
        </Card>
      </div>
    </div>
  );
}
