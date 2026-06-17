'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useToasts } from '@/hooks/useToasts';
import { useTicker } from '@/hooks/useTicker';
import { apiGet, apiPatch } from '@/lib/apiClient';
import { mapApprovalItem, fmtTime } from '@/lib/utils';
import { Icons } from '@/components/ui/icons';
import { Card, Btn, Badge, SectionLabel, ProgressBar, Avatar, TextBox } from '@/components/ui/primitives';
import { AddTodoPanel } from '@/components/features/AddTodoPanel';

function ApprovalCard({ item, onDecision }) {
  const [note, setNote] = useState('');
  return (
    <Card hover>
      <div className="row gap12" style={{ marginBottom: 12 }}>
        <Avatar first={item.userFirst} size={34} />
        <div style={{ flex: 1 }}>
          <div className="t-body-strong">{item.userName}</div>
          <div className="t-caption dim2">diajukan {item.submittedAt}</div>
        </div>
        {item.overtime && <Badge kind="over" label="Overtime" />}
      </div>
      <div className="hr" style={{ marginBottom: 12 }} />
      <div className="row gap8"><Icons.Pin size={15} className="accent-text" />
        <span className="t-body-strong" style={{ flex: 1 }}>{item.title}</span>
        <span className="dim t-caption">Est {item.est} jam</span></div>
      {item.desc && <p className="dim t-caption" style={{ margin: '8px 0 0', lineHeight: 1.5 }}>"{item.desc}"</p>}

      <div className="muted-box mt12" style={item.overtime ? { borderColor: 'rgba(200,95,10,.35)', background: 'color-mix(in srgb,#c8650a 6%, transparent)' } : {}}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="t-caption dim">Jam dipakai hari ini</span>
          <span className="t-caption" style={{ fontWeight: 600 }}>{item.usedToday}/8 jam</span>
        </div>
        <div className="row mt4" style={{ justifyContent: 'space-between' }}>
          <span className="t-caption dim">Dengan todo ini</span>
          <span className="t-caption" style={{ fontWeight: 700, color: item.overtime ? '#c8650a' : '#0f7b3f' }}>
            {item.withThis}/8 jam {item.overtime ? '⚠ overtime' : '✓'}
          </span>
        </div>
      </div>

      <div className="mt12">
        <label className="field-label t-caption dim">Catatan (opsional)</label>
        <TextBox value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tambahkan catatan untuk anggota..." />
      </div>
      <div className="row gap12 mt12">
        <Btn variant="danger" icon={<Icons.XCircle size={15} />} onClick={() => onDecision(item, 'rejected', note)} style={{ flex: 1 }}>Tolak</Btn>
        <Btn variant="accent" icon={<Icons.Check size={16} />} onClick={() => onDecision(item, 'approved', note)} style={{ flex: 1 }}>
          {item.overtime ? 'Approve Overtime' : 'Approve'}
        </Btn>
      </div>
    </Card>
  );
}

export default function ApprovalPage() {
  const me = useAuthStore((s) => s.me);
  const { push: pushToast } = useToasts();
  const queryClient = useQueryClient();
  const [processed, setProcessed] = useState([]);
  const [addPanel, setAddPanel] = useState(false);

  useTicker(true);

  const { data: syscfg } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => apiGet('system-config'),
    enabled: !!me,
  });

  const { data: approvalsRaw = [] } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => apiGet('todos/pending-approvals'),
    enabled: !!me,
  });

  const approvals = approvalsRaw.map(mapApprovalItem);
  const cfgHour = syscfg?.approvalDeadlineHour ?? 9;
  const now = new Date();
  const deadline = new Date(now); deadline.setHours(cfgHour, 0, 0, 0);
  const remainMs = deadline - now;
  const remainMin = Math.max(0, Math.round(remainMs / 60000));
  const isPast = remainMs < 0;
  const deadlineLabel = `${String(cfgHour).padStart(2, '0')}:00`;

  const decideMut = useMutation({
    mutationFn: ({ item, result, note }) => {
      if (result === 'approved') return apiPatch(`todos/${item.id}/approve`, note ? { reason: note } : {});
      return apiPatch(`todos/${item.id}/reject`, { reason: note || 'Ditolak' });
    },
    onSuccess: (_, { item, result }) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      const label = result === 'approved' ? 'Approved' : 'Ditolak';
      setProcessed((p) => [{ id: item.id, userFirst: item.userFirst, text: item.title, result, at: fmtTime(new Date().toISOString()) }, ...p]);
      pushToast('ok', `Todo ${label}`, `${item.userName} — ${item.title}`);
    },
    onError: (e) => pushToast('err', 'Gagal memproses approval', e.message),
  });

  return (
    <div className="content-pad page-enter" style={{ maxWidth: 760 }}>
      <div className="row" style={{ alignItems: 'flex-end', marginBottom: 4 }}>
        <div className="t-title" style={{ flex: 1 }}>Approval Queue</div>
        <Btn variant="accent" icon={<Icons.Plus size={15} />} onClick={() => setAddPanel(true)}>Buat Todo untuk Anggota</Btn>
      </div>
      <Card className="mt16">
        <div className="row gap16" style={{ alignItems: 'center' }}>
          <div className="row gap8"><Icons.Clock size={18} className="accent-text" />
            <div className="col">
              <span className="t-caption dim2">Batas approve</span>
              <span className="t-body-strong">{deadlineLabel} pagi</span>
            </div>
          </div>
          <div style={{ width: 1, height: 34, background: 'var(--divider)' }} />
          <div className="col">
            <span className="t-caption dim2">{now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="t-body-strong" style={{ color: isPast ? '#0f7b3f' : '#c8650a' }}>
              {isPast ? `Sudah melewati ${deadlineLabel}` : `Tersisa ${remainMin} menit`}
            </span>
          </div>
          <div className="spacer" />
          {!isPast && <div style={{ width: 140 }}>
            <ProgressBar value={60 - remainMin} max={60} thick variant="warn" />
          </div>}
        </div>
      </Card>

      <SectionLabel><Icons.Hourglass size={13} /> Menunggu Approval ({approvals.length})</SectionLabel>
      {approvals.length === 0
        ? <Card><div className="col" style={{ alignItems: 'center', padding: 18, gap: 8 }}>
            <Icons.CheckCircle size={32} className="dim2" /><span className="dim">Semua todo sudah diproses 🎉</span></div></Card>
        : <div className="col" style={{ gap: 14 }}>
            {approvals.map((a) => (
              <ApprovalCard key={a.id} item={a}
                onDecision={(item, result, note) => decideMut.mutate({ item, result, note })} />
            ))}
          </div>}

      <SectionLabel><Icons.Check size={13} /> Sudah Diproses Hari Ini ({processed.length})</SectionLabel>
      {processed.length === 0
        ? <Card><div className="dim t-caption">Belum ada yang diproses hari ini.</div></Card>
        : <Card pad={false}>
            {processed.map((p, i) => (
              <div key={p.id} className="row gap12" style={{ padding: '12px 18px', borderTop: i ? '1px solid var(--divider)' : 'none' }}>
                <Avatar first={p.userFirst} size={26} />
                <span className="t-body-strong" style={{ width: 60 }}>{p.userFirst}</span>
                <span className="dim" style={{ flex: 1 }}>{p.text}</span>
                <span className="dim2 t-caption">{p.at}</span>
                <Badge kind={p.result === 'approved' ? 'approved' : 'rejected'} label={p.result === 'approved' ? 'Approved' : 'Ditolak'} />
              </div>
            ))}
          </Card>}

      {addPanel && (
        <AddTodoPanel
          mode="add"
          todo={null}
          onClose={() => setAddPanel(false)}
          systemConfig={syscfg}
        />
      )}
    </div>
  );
}
