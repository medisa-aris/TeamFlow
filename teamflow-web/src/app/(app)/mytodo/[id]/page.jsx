'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useToasts } from '@/hooks/useToasts';
import { useTicker } from '@/hooks/useTicker';
import { apiGet, apiPost } from '@/lib/apiClient';
import { mapTodo, fmtHMS } from '@/lib/utils';
import { Icons } from '@/components/ui/icons';
import { Card, Btn, Badge, SectionLabel, ProgressBar } from '@/components/ui/primitives';

function elapsed(todo) {
  if (!todo) return 0;
  const acc = todo.acc || 0;
  if (todo.running && todo.lastStart) return acc + Math.floor((Date.now() - todo.lastStart) / 1000);
  return acc;
}

export default function TodoDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const me = useAuthStore((s) => s.me);
  const { push: pushToast } = useToasts();
  const queryClient = useQueryClient();

  const { data: raw = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: () => apiGet('todos?includeDone=true'),
    enabled: !!me,
  });

  const todos = raw.map(mapTodo);
  const todo = todos.find((t) => t.id === id) || todos.find((t) => t.state === 'ongoing');
  const running = todo && todo.running;

  useTicker(!!running);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const startMut = useMutation({
    mutationFn: () => {
      return todo?.paused ? apiPost(`todos/${todo.id}/resume`) : apiPost(`todos/${todo.id}/start`);
    },
    onSuccess: invalidate,
    onError: (e) => pushToast('err', 'Gagal memulai todo', e.message),
  });

  const pauseMut = useMutation({
    mutationFn: () => apiPost(`todos/${todo.id}/pause`),
    onSuccess: invalidate,
    onError: (e) => pushToast('err', 'Gagal pause todo', e.message),
  });

  const finishMut = useMutation({
    mutationFn: () => apiPost(`todos/${todo.id}/complete`),
    onSuccess: () => { invalidate(); pushToast('ok', 'Todo selesai! Kerja bagus 🎉'); },
    onError: (e) => pushToast('err', 'Gagal menyelesaikan todo', e.message),
  });

  if (!todo) return (
    <div className="content-pad page-enter">
      <Card>Todo tidak ditemukan.</Card>
    </div>
  );

  const sec = elapsed(todo);
  const pct = Math.min(100, Math.round((sec / (todo.est * 3600)) * 100));
  const stateLabel = running ? 'SEDANG BERJALAN' : todo.state === 'done' ? 'SELESAI' : 'DIJEDA';

  const meta = [
    { Icon: Icons.Calendar, k: 'Dibuat', v: `Hari ini — ${todo.createdAt || '—'}` },
    { Icon: Icons.Play, k: 'Mulai', v: todo.startedAt || '—' },
    { Icon: Icons.Clock, k: 'Estimasi', v: `${todo.est} jam` },
    { Icon: Icons.Flag, k: 'Target Selesai', v: todo.target || '09:00' },
  ];

  return (
    <div className="content-pad page-enter" style={{ maxWidth: 860 }}>
      <Btn variant="subtle" icon={<Icons.ArrowLeft size={16} />} onClick={() => router.push('/mytodo')} style={{ marginBottom: 16, marginLeft: -8 }}>
        Kembali ke My Todo
      </Btn>

      <div className="row gap8" style={{ marginBottom: 10 }}>
        {running && <Icons.Refresh size={15} className="spin accent-text" />}
        <span className="t-caption accent-text" style={{ fontWeight: 700, letterSpacing: '.05em' }}>{stateLabel}</span>
        <div className="spacer" />
        <Badge kind="approved" />
      </div>
      <div className="t-title-lg">{todo.title}</div>
      {todo.desc && <p className="dim" style={{ maxWidth: 600, marginTop: 8, lineHeight: 1.5 }}>{todo.desc}</p>}

      <div className="card" style={{ marginTop: 20, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)' }}>
        {meta.map((m, i) => (
          <div key={i} className="row gap12" style={{ padding: '14px 18px',
            borderTop: i > 1 ? '1px solid var(--divider)' : 'none',
            borderLeft: i % 2 ? '1px solid var(--divider)' : 'none' }}>
            <m.Icon size={17} className="dim2" />
            <div className="col"><span className="t-caption dim2">{m.k}</span><span className="t-body-strong">{m.v}</span></div>
          </div>
        ))}
      </div>

      <Card style={{ marginTop: 20, textAlign: 'center', padding: '34px 24px',
        background: 'color-mix(in srgb, var(--accent) 7%, var(--card))',
        borderColor: 'color-mix(in srgb, var(--accent) 28%, var(--stroke))' }}>
        <div className="timer-face accent-text timer-lg">{fmtHMS(sec)}</div>
        <div className="row gap8" style={{ justifyContent: 'center', marginTop: 4 }}>
          {running && <span className="pulse-dot" />}
          <span className="t-caption dim" style={{ fontWeight: 600, letterSpacing: '.06em' }}>{stateLabel}</span>
        </div>
        <div style={{ maxWidth: 420, margin: '22px auto 0' }}>
          <ProgressBar value={pct} max={100} thick variant={pct >= 100 ? 'full' : ''} />
          <div className="t-caption dim2" style={{ marginTop: 6 }}>Progress {pct}% dari estimasi {todo.est} jam</div>
        </div>
      </Card>

      {todo.state !== 'done' && (
        <div className="row gap12" style={{ marginTop: 16 }}>
          {running
            ? <Btn size="lg" icon={<Icons.Pause size={16} />} onClick={() => pauseMut.mutate()} style={{ flex: '0 0 auto' }}>Pause</Btn>
            : <Btn size="lg" variant="accent" icon={<Icons.Play size={15} />} onClick={() => startMut.mutate()} style={{ flex: '0 0 auto' }}>Lanjutkan</Btn>}
          <Btn size="lg" variant="accent" block icon={<Icons.Check size={17} />} onClick={() => finishMut.mutate()}>Tandai Selesai</Btn>
        </div>
      )}

      <SectionLabel><Icons.Clock size={13} /> Riwayat Sesi</SectionLabel>
      <Card pad={false}>
        {(todo.sessions || []).length === 0
          ? <div style={{ padding: '14px 18px' }} className="dim t-caption">Belum ada sesi tercatat.</div>
          : (todo.sessions || []).map((s, i) => (
            <div key={i} className="row gap12" style={{ padding: '12px 18px', borderTop: i ? '1px solid var(--divider)' : 'none' }}>
              <span style={{ color: s.type === 'run' ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                {s.type === 'run' ? <Icons.Play size={13} /> : <Icons.Pause size={13} />}
              </span>
              <span className="t-body-strong" style={{ width: 150 }}>{s.from} → {s.to}</span>
              <span className="dim t-caption">{s.note}</span>
            </div>
          ))}
      </Card>
    </div>
  );
}
