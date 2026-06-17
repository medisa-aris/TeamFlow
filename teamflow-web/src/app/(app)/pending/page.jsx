'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useToasts } from '@/hooks/useToasts';
import { apiGet, apiPost, apiDelete } from '@/lib/apiClient';
import { mapTodo } from '@/lib/utils';
import { Icons } from '@/components/ui/icons';
import { Card, Btn, Badge, SectionLabel } from '@/components/ui/primitives';
import { AddTodoPanel } from '@/components/features/AddTodoPanel';

export default function PendingPage() {
  const me = useAuthStore((s) => s.me);
  const { push: pushToast } = useToasts();
  const queryClient = useQueryClient();
  const [editPanel, setEditPanel] = useState(null);

  const { data: raw = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: () => apiGet('todos?includeDone=true'),
    enabled: !!me,
  });

  const todos = raw.map(mapTodo);
  const waiting = todos.filter((t) => t.state === 'waiting');
  const rejected = todos.filter((t) => t.state === 'rejected');
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['todos'] });

  const carryOverMut = useMutation({
    mutationFn: (id) => apiPost(`todos/${id}/carry-over`),
    onSuccess: () => { invalidate(); pushToast('ok', 'Todo diteruskan ke hari kerja berikutnya'); },
    onError: (e) => pushToast('err', 'Gagal meneruskan todo', e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => apiDelete(`todos/${id}`),
    onSuccess: () => { invalidate(); pushToast('ok', 'Todo dihapus'); },
    onError: (e) => pushToast('err', 'Gagal menghapus todo', e.message),
  });

  return (
    <div className="content-pad page-enter">
      <div className="row" style={{ alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <div className="t-title">Menunggu Approval</div>
          <div className="dim" style={{ marginTop: 2 }}>{today}</div>
        </div>
      </div>

      {waiting.length === 0 && rejected.length === 0 && (
        <Card><div className="dim t-caption">Tidak ada todo yang menunggu approval atau ditolak.</div></Card>
      )}

      {waiting.length > 0 && <>
        <SectionLabel><Icons.Hourglass size={13} /> Menunggu Approval ({waiting.length})</SectionLabel>
        <div className="col" style={{ gap: 12 }}>
          {waiting.map((t) => (
            <Card key={t.id} hover>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div className="row gap8"><span className="t-body-strong">{t.title}</span><Badge kind="waiting" /></div>
                  <div className="dim t-caption" style={{ marginTop: 4 }}>
                    Diajukan {t.submittedAt} &nbsp;·&nbsp; Est {t.est} jam
                    {t.overtime && <span className="badge over" style={{ marginLeft: 6 }}><Icons.Warning size={11} />Overtime</span>}
                  </div>
                </div>
                <div className="col gap8" style={{ alignItems: 'flex-end' }}>
                  <div className="muted-box t-caption dim" style={{ padding: '6px 10px' }}>Auto-approve ⚡ 09:00</div>
                  <Btn icon={<Icons.ArrowRight size={13} />} onClick={() => carryOverMut.mutate(t.id)}
                       style={{ fontSize: 12 }}>Teruskan ke Besok</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>}

      {rejected.length > 0 && <>
        <SectionLabel><Icons.XCircle size={13} /> Ditolak ({rejected.length})</SectionLabel>
        <div className="col" style={{ gap: 12 }}>
          {rejected.map((t) => (
            <Card key={t.id} hover>
              <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div className="row gap8">
                    <span className="t-body-strong">{t.title}</span>
                    <Badge kind="rejected" />
                  </div>
                  <div className="dim t-caption" style={{ marginTop: 4 }}>Estimasi {t.est} jam</div>
                  <div className="muted-box mt12" style={{ borderColor: 'rgba(196,43,28,.28)' }}>
                    <div className="row gap8"><Icons.XCircle size={14} style={{ color: '#c42b1c' }} />
                      <span className="t-caption" style={{ color: '#c42b1c', fontWeight: 600 }}>Ditolak</span></div>
                    {t.rejectNote && <div className="t-caption dim" style={{ marginTop: 4 }}>"{t.rejectNote}"</div>}
                  </div>
                </div>
                <div className="col gap8" style={{ alignItems: 'flex-end' }}>
                  <Btn icon={<Icons.Edit size={14} />} onClick={() => setEditPanel(t)}>Edit &amp; Resubmit</Btn>
                  <Btn variant="subtle" icon={<Icons.Trash size={14} />} onClick={() => deleteMut.mutate(t.id)}
                       style={{ color: '#c42b1c' }}>Hapus</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>}

      {editPanel && (
        <AddTodoPanel
          mode="edit"
          todo={editPanel}
          onClose={() => setEditPanel(null)}
        />
      )}
    </div>
  );
}
