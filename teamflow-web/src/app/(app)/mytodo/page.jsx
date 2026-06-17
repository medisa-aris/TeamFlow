'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useToasts } from '@/hooks/useToasts';
import { useTicker } from '@/hooks/useTicker';
import { apiGet, apiPost } from '@/lib/apiClient';
import { mapTodo, fmtClock, getLocalDate } from '@/lib/utils';
import { Icons } from '@/components/ui/icons';
import { Card, Btn, Badge, SectionLabel, ProgressBar } from '@/components/ui/primitives';
import { AddTodoPanel } from '@/components/features/AddTodoPanel';
import { DeferDialog } from '@/components/features/DeferDialog';

function elapsed(todo) {
  if (!todo) return 0;
  const acc = todo.acc || 0;
  if (todo.running && todo.lastStart) return acc + Math.floor((Date.now() - todo.lastStart) / 1000);
  return acc;
}

function RunningTodoCard({ todo, onPause, onStart, onFinish, onDefer, onDetail }) {
  const live = !!todo.running;
  useTicker(live);
  const sec = elapsed(todo);
  const pct = Math.min(100, Math.round((sec / (todo.est * 3600)) * 100));
  return (
    <Card hover style={{ borderColor: live ? 'color-mix(in srgb, var(--accent) 35%, var(--stroke))' : 'var(--stroke)' }}>
      <div className="row gap8" style={{ marginBottom: 12 }}>
        {live ? <Icons.Refresh size={15} className="spin accent-text" /> : <Icons.Pause size={14} className="dim2" />}
        <span className={`t-caption ${live ? 'accent-text' : 'dim2'}`} style={{ fontWeight: 700, letterSpacing: '.05em' }}>
          {live ? 'SEDANG BERJALAN' : 'DIJEDA'}
        </span>
        <div className="spacer" />
        <Badge kind="approved" />
      </div>
      <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="t-body-lg" style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => onDetail(todo.id)}>{todo.title}</div>
          <div className="dim t-caption" style={{ marginTop: 4 }}>
            {todo.startedAt && <>Mulai {todo.startedAt} &nbsp;·&nbsp;</>}Estimasi {todo.est} jam
          </div>
          <div className="mt12" style={{ maxWidth: 320 }}>
            <ProgressBar value={pct} max={100} thick />
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
              <span className="t-caption dim2">{pct}%</span>
            </div>
          </div>
        </div>
        <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
          <div className={`timer-face ${live ? 'accent-text' : ''}`}
               style={{ fontSize: 30, color: live ? undefined : 'var(--text-secondary)' }}>
            {fmtClock(sec)}
          </div>
        </div>
      </div>
      <div className="row gap12" style={{ marginTop: 16 }}>
        {live
          ? <Btn icon={<Icons.Pause size={15} />} onClick={() => onPause(todo.id)}>Pause</Btn>
          : <Btn icon={<Icons.Play size={14} />} onClick={() => onStart(todo.id)}>Lanjutkan</Btn>}
        <Btn variant="accent" icon={<Icons.Check size={16} />} onClick={() => onFinish(todo.id)}>Selesai</Btn>
        <div className="spacer" />
        <Btn variant="subtle" icon={<Icons.Hourglass size={14} />} onClick={() => onDefer(todo)}
             title="Tangguhkan ke hari berikutnya" style={{ fontSize: 12 }}>Tangguhkan</Btn>
        <Btn variant="subtle" icon={<Icons.ChevronRight size={15} />} onClick={() => onDetail(todo.id)}>Detail</Btn>
      </div>
    </Card>
  );
}

function QueueCard({ todo, onStart, onCarryOver, onDefer, onEdit }) {
  const rejected = todo.state === 'rejected';
  return (
    <Card hover>
      <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="row gap8">
            <span className="t-body-strong">{todo.title}</span>
            <Badge kind={rejected ? 'rejected' : 'approved'} />
          </div>
          <div className="dim t-caption" style={{ marginTop: 4 }}>Estimasi {todo.est} jam</div>
          {rejected && (
            <div className="muted-box mt12" style={{ borderColor: 'rgba(196,43,28,.28)' }}>
              <div className="row gap8"><Icons.XCircle size={14} style={{ color: '#c42b1c' }} />
                <span className="t-caption" style={{ color: '#c42b1c', fontWeight: 600 }}>Ditolak</span></div>
              {todo.rejectNote && <div className="t-caption dim" style={{ marginTop: 4 }}>"{todo.rejectNote}"</div>}
            </div>
          )}
        </div>
        <div className="col gap8" style={{ alignItems: 'flex-end' }}>
          {rejected
            ? <Btn icon={<Icons.Edit size={14} />} onClick={() => onEdit(todo)}>Edit &amp; Resubmit</Btn>
            : <>
                <Btn variant="accent" icon={<Icons.Play size={14} />} onClick={() => onStart(todo.id)}>Start</Btn>
                <Btn icon={<Icons.ArrowRight size={14} />} onClick={() => onCarryOver(todo.id)}
                     title="Pindahkan ke hari kerja berikutnya" style={{ fontSize: 12 }}>Teruskan ke Besok</Btn>
                <Btn icon={<Icons.Hourglass size={13} />} onClick={() => onDefer(todo)}
                     title="Tangguhkan — tidak bisa dikerjakan hari ini" style={{ fontSize: 12 }}>Tangguhkan</Btn>
              </>}
        </div>
      </div>
    </Card>
  );
}

export default function MyTodoPage() {
  const router = useRouter();
  const me = useAuthStore((s) => s.me);
  const { push: pushToast } = useToasts();
  const queryClient = useQueryClient();
  const todayDate = getLocalDate();

  const [todoDate, setTodoDate] = useState(todayDate);
  const [addPanel, setAddPanel] = useState(null);
  const [deferTarget, setDeferTarget] = useState(null);

  const isToday = todoDate === todayDate;

  const { data: raw = [] } = useQuery({
    queryKey: ['todos', todoDate],
    queryFn: () => apiGet(`todos?date=${todoDate}&includeDone=true`),
    enabled: !!me,
  });

  const { data: syscfg } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => apiGet('system-config'),
    enabled: !!me,
  });

  const todos = raw.map(mapTodo);
  const ongoingList = todos.filter((t) => t.state === 'ongoing');
  const queue = todos.filter((t) => t.state === 'queue');
  const done = todos.filter((t) => t.state === 'done');
  const deferred = todos.filter((t) => t.state === 'deferred');
  const hoursUsed = todos
    .filter((t) => ['ongoing', 'done', 'queue'].includes(t.state))
    .reduce((s, t) => s + (t.est || 0), 0);
  const pendingMemberCount = todos.filter((t) => t.state === 'waiting' || t.state === 'rejected').length;

  const dateLabel = isToday
    ? new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : new Date(todoDate + 'T12:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const startMut = useMutation({
    mutationFn: (id) => {
      const t = todos.find((x) => x.id === id);
      return t?.paused ? apiPost(`todos/${id}/resume`) : apiPost(`todos/${id}/start`);
    },
    onSuccess: invalidate,
    onError: (e) => pushToast('err', 'Gagal memulai todo', e.message),
  });

  const pauseMut = useMutation({
    mutationFn: (id) => apiPost(`todos/${id}/pause`),
    onSuccess: invalidate,
    onError: (e) => pushToast('err', 'Gagal pause todo', e.message),
  });

  const finishMut = useMutation({
    mutationFn: (id) => apiPost(`todos/${id}/complete`),
    onSuccess: () => { invalidate(); pushToast('ok', 'Todo selesai! Kerja bagus 🎉'); },
    onError: (e) => pushToast('err', 'Gagal menyelesaikan todo', e.message),
  });

  const archiveMut = useMutation({
    mutationFn: (id) => apiPost(`todos/${id}/archive`),
    onSuccess: () => { invalidate(); pushToast('ok', 'Todo diarsipkan', 'Tersimpan di halaman Selesai'); },
    onError: (e) => pushToast('err', 'Gagal mengarsipkan todo', e.message),
  });

  const carryOverMut = useMutation({
    mutationFn: (id) => apiPost(`todos/${id}/carry-over`),
    onSuccess: () => { invalidate(); pushToast('ok', 'Todo diteruskan ke hari kerja berikutnya'); },
    onError: (e) => pushToast('err', 'Gagal meneruskan todo', e.message),
  });

  return (
    <div className="content-pad page-enter">
      <div className="row" style={{ alignItems: 'flex-end', marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div className="t-title">My Todo</div>
          <div className="dim" style={{ marginTop: 2 }}>{dateLabel}</div>
        </div>
        <div className="row gap12 wrap">
          <div className="row gap8" style={{ alignItems: 'center' }}>
            <input type="date" className="tbx" value={todoDate} max={todayDate}
              onChange={(e) => e.target.value && setTodoDate(e.target.value)}
              style={{ width: 148, fontSize: 13 }} />
            {!isToday && (
              <Btn size="sm" variant="subtle" onClick={() => setTodoDate(todayDate)} style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                ← Hari Ini
              </Btn>
            )}
          </div>
          {isToday && <Btn variant="accent" icon={<Icons.Plus size={16} />} onClick={() => setAddPanel({ mode: 'add', todo: null })}>Tambah Todo</Btn>}
        </div>
      </div>

      {isToday && (
        <Card style={{ marginBottom: 4 }}>
          <div className="row gap16">
            <Icons.Clock size={20} className="dim" />
            <div style={{ flex: 1 }}>
              <div className="row" style={{ marginBottom: 6 }}>
                <span className="t-body-strong" style={{ flex: 1 }}>Sisa jam hari ini</span>
                <span className="dim t-caption">{hoursUsed}/8 jam terpakai</span>
              </div>
              <ProgressBar value={hoursUsed} max={8} thick variant={hoursUsed >= 8 ? 'warn' : ''} />
            </div>
          </div>
        </Card>
      )}

      {isToday && pendingMemberCount > 0 && (
        <div className="muted-box row gap8" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => router.push('/pending')}>
          <Icons.Hourglass size={14} style={{ color: '#c8650a' }} />
          <span className="t-caption" style={{ flex: 1 }}>{pendingMemberCount} todo menunggu approval / ditolak</span>
          <span className="t-caption accent-text">Lihat →</span>
        </div>
      )}

      {ongoingList.length > 0 && <>
        <SectionLabel><Icons.Refresh size={13} /> Sedang Berjalan</SectionLabel>
        <div className="col" style={{ gap: 12 }}>
          {ongoingList.map((t) => (
            <RunningTodoCard key={t.id} todo={t}
              onPause={(id) => pauseMut.mutate(id)}
              onStart={(id) => startMut.mutate(id)}
              onFinish={(id) => finishMut.mutate(id)}
              onDefer={(todo) => setDeferTarget(todo)}
              onDetail={(id) => router.push(`/mytodo/${id}`)}
            />
          ))}
        </div>
      </>}

      {queue.length > 0 && <>
        <SectionLabel><Icons.Flag size={13} /> Antrian Siap Dikerjakan</SectionLabel>
        <div className="col" style={{ gap: 12 }}>
          {queue.map((t) => (
            <QueueCard key={t.id} todo={t}
              onStart={(id) => startMut.mutate(id)}
              onCarryOver={(id) => carryOverMut.mutate(id)}
              onDefer={(todo) => setDeferTarget(todo)}
              onEdit={(todo) => setAddPanel({ mode: 'edit', todo })}
            />
          ))}
        </div>
      </>}

      {deferred.length > 0 && <>
        <SectionLabel><Icons.Hourglass size={13} /> Ditangguhkan ({deferred.length})</SectionLabel>
        <div className="col" style={{ gap: 12 }}>
          {deferred.map((t) => (
            <Card key={t.id} hover>
              <div className="row gap12" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div className="row gap8">
                    <span className="t-body-strong">{t.title}</span>
                    <Badge kind="deferred" />
                  </div>
                  <div className="dim t-caption" style={{ marginTop: 4 }}>Estimasi {t.est} jam</div>
                  {t.deferReason && (
                    <div className="muted-box mt12">
                      <div className="t-caption dim2" style={{ fontStyle: 'italic' }}>"{t.deferReason}"</div>
                    </div>
                  )}
                </div>
                <Btn icon={<Icons.ArrowRight size={14} />} onClick={() => carryOverMut.mutate(t.id)}
                     title="Aktifkan ulang ke hari kerja berikutnya" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                  Aktifkan Ulang
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      </>}

      <SectionLabel><Icons.CheckCircle size={13} /> Selesai {isToday ? 'Hari Ini' : ''} ({done.length})</SectionLabel>
      {done.length === 0
        ? <Card><div className="dim t-caption">Belum ada todo selesai{isToday ? ' hari ini' : ''}.</div></Card>
        : <Card pad={false}>
            {done.map((t, i) => (
              <div key={t.id} className="row gap12" style={{ padding: '12px 18px', borderTop: i ? '1px solid var(--divider)' : 'none', alignItems: 'center' }}>
                <Icons.CheckCircle size={17} style={{ color: '#0f7b3f' }} />
                <span className="t-body-strong" style={{ flex: 1 }}>{t.title}</span>
                <span className="dim t-caption">{t.est} jam</span>
                <span className="dim2 t-caption" style={{ width: 110, textAlign: 'right' }}>{t.range}</span>
                {isToday && (
                  <Btn size="sm" icon={<Icons.Archive size={13} />} onClick={() => archiveMut.mutate(t.id)}
                       style={{ marginLeft: 8 }} title="Arsipkan todo">Arsipkan</Btn>
                )}
              </div>
            ))}
          </Card>}

      {addPanel && (
        <AddTodoPanel
          mode={addPanel.mode}
          todo={addPanel.todo}
          onClose={() => setAddPanel(null)}
          hoursUsed={hoursUsed}
          systemConfig={syscfg}
        />
      )}

      {deferTarget && (
        <DeferDialog
          id={deferTarget.id}
          title={deferTarget.title}
          onClose={() => setDeferTarget(null)}
        />
      )}
    </div>
  );
}
