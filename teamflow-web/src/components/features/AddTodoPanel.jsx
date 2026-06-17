'use client';
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useToasts } from '@/hooks/useToasts';
import { apiPost, apiPatch, apiGet } from '@/lib/apiClient';
import { Icons } from '@/components/ui/icons';
import { Panel, Btn, Field, TextBox, TextArea, Select, ProgressBar } from '@/components/ui/primitives';

const MIN_DESC_WORDS = 10;
function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

export function AddTodoPanel({ mode, todo, onClose, hoursUsed = 0, systemConfig }) {
  const me = useAuthStore((s) => s.me);
  const isCEO = me?.role === 'CEO';
  const deadlineHour = systemConfig?.approvalDeadlineHour ?? 9;
  const deadlineLabel = `${String(deadlineHour).padStart(2, '0')}:00`;
  const editing = mode === 'edit';

  const [title, setTitle] = useState(todo?.title || '');
  const [desc, setDesc] = useState(todo?.desc || '');
  const [est, setEst] = useState(todo?.est || 0.5);
  const [descTouched, setDescTouched] = useState(false);
  const [targetMemberId, setTargetMemberId] = useState('');

  const queryClient = useQueryClient();
  const { push: pushToast } = useToasts();

  const { data: usersRaw = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiGet('users'),
    enabled: isCEO,
  });

  const members = usersRaw.filter((u) => (u.role === 'MEMBER' || u.role === 'Member') && u.isActive)
    .map((u) => ({ id: u.id, name: u.fullName || u.name }));

  const remaining = Math.max(0, 8 - hoursUsed);
  const projected = hoursUsed + Number(est);
  const over = projected > 8;
  const wordCount = countWords(desc);
  const descOk = wordCount >= MIN_DESC_WORDS;
  const descWarn = descTouched && !descOk;
  const memberOk = !isCEO || !!targetMemberId;
  const valid = title.trim().length > 0 && descOk && memberOk;

  const mutation = useMutation({
    mutationFn: async () => {
      if (editing && todo?.id) {
        return apiPatch(`todos/${todo.id}`, {
          title: title.trim(),
          description: desc,
          estimatedHours: Number(est),
        });
      } else if (isCEO && targetMemberId) {
        return apiPost('todos/for-member', {
          title: title.trim(),
          description: desc,
          estimatedHours: Number(est),
          targetUserId: targetMemberId,
        });
      } else {
        return apiPost('todos', {
          title: title.trim(),
          description: desc,
          estimatedHours: Number(est),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (editing) pushToast('ok', 'Todo diperbarui', 'Menunggu approval ulang CEO');
      else if (isCEO) pushToast('ok', 'Todo dibuat untuk anggota', 'Auto-approved');
      else pushToast('ok', 'Todo diajukan', 'Menunggu approval CEO');
      onClose();
    },
    onError: (e) => pushToast('err', 'Gagal menyimpan todo', e.message),
  });

  const panelTitle = isCEO
    ? 'Buat Todo untuk Anggota'
    : editing ? 'Edit & Resubmit' : 'Tambah Todo Baru';

  return (
    <Panel
      title={panelTitle}
      icon={<span style={{ color: 'var(--accent)' }}>{editing ? <Icons.Edit size={20} /> : <Icons.Plus size={20} />}</span>}
      onClose={onClose}
      footer={<>
        <Btn onClick={onClose}>Batal</Btn>
        <Btn variant="accent" disabled={!valid || mutation.isPending} icon={<Icons.ArrowRight size={15} />}
             onClick={() => mutation.mutate()}>
          {isCEO ? 'Buat Todo' : editing ? 'Resubmit' : 'Ajukan'}
        </Btn>
      </>}
    >
      {isCEO && (
        <Field label="Anggota" req hint="Pilih anggota yang akan mendapat todo ini">
          <Select value={targetMemberId} onChange={(e) => setTargetMemberId(e.target.value)}>
            <option value="">— Pilih anggota —</option>
            {members.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </Field>
      )}
      <Field label="Judul" req>
        <TextBox value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Desain halaman dashboard..." autoFocus />
      </Field>
      <Field label="Deskripsi" req hint={`Minimal ${MIN_DESC_WORDS} kata agar todo jelas dipahami`}>
        <TextArea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={() => setDescTouched(true)}
          placeholder="Jelaskan secara rinci apa yang akan dikerjakan, langkah-langkahnya, tools yang digunakan, dan hasil yang diharapkan..."
          rows={5}
          style={descWarn ? { borderColor: '#c8650a', boxShadow: '0 0 0 2px rgba(200,101,10,.2)' } : {}}
        />
        <div className="row gap8 mt4" style={{ justifyContent: 'space-between' }}>
          {descWarn ? (
            <div className="row gap6" style={{ color: '#c8650a', fontSize: 12 }}>
              <Icons.Warning size={13} />
              <span>Deskripsi terlalu singkat — perlu {MIN_DESC_WORDS - wordCount} kata lagi</span>
            </div>
          ) : descOk ? (
            <div className="row gap6" style={{ color: '#0f7b3f', fontSize: 12 }}>
              <Icons.CheckCircle size={13} />
              <span>Deskripsi cukup detail</span>
            </div>
          ) : <span />}
          <span className="t-caption dim2">{wordCount}/{MIN_DESC_WORDS} kata</span>
        </div>
      </Field>
      <Field label="Estimasi Waktu" req hint="Pilih 0.5 / 1 / 1.5 / 2 jam">
        <Select value={est} onChange={(e) => setEst(e.target.value)}>
          {[0.5, 1, 1.5, 2].map((v) => <option key={v} value={v}>{v} jam</option>)}
        </Select>
      </Field>

      {!isCEO && (
        <>
          <div className="muted-box" style={{ borderColor: over ? 'rgba(200,95,10,.35)' : 'var(--stroke)' }}>
            <div className="row gap8">
              <Icons.Clock size={15} className="dim" />
              <span className="t-caption" style={{ flex: 1 }}>Sisa jam hari ini</span>
              <span className="t-body-strong">{remaining} jam</span>
            </div>
            <div className="mt8"><ProgressBar value={projected} max={8} variant={over ? 'warn' : ''} /></div>
            <div className="row gap8 mt8">
              {over
                ? <><Icons.Warning size={14} style={{ color: '#c8650a' }} /><span className="t-caption" style={{ color: '#c8650a' }}>Overtime — {projected}/8 jam, perlu approval khusus CEO</span></>
                : <><Icons.CheckCircle size={14} style={{ color: '#0f7b3f' }} /><span className="t-caption" style={{ color: '#0f7b3f' }}>Dalam batas normal — {projected}/8 jam</span></>}
            </div>
          </div>
          <div className="muted-box mt16" style={{ background: 'color-mix(in srgb, var(--accent) 7%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 22%, transparent)' }}>
            <div className="row gap8" style={{ alignItems: 'flex-start' }}>
              <Icons.Info size={15} className="accent-text" style={{ marginTop: 1 }} />
              <span className="t-caption dim">Todo dikirim ke CEO untuk approval. Auto-approve ⚡ jika CEO belum merespons sebelum <b>{deadlineLabel}</b>.</span>
            </div>
          </div>
        </>
      )}

      {isCEO && (
        <div className="muted-box mt16" style={{ background: 'color-mix(in srgb, var(--accent) 7%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 22%, transparent)' }}>
          <div className="row gap8" style={{ alignItems: 'flex-start' }}>
            <Icons.Info size={15} className="accent-text" style={{ marginTop: 1 }} />
            <span className="t-caption dim">Todo akan langsung auto-approved ⚡ dan anggota akan mendapat notifikasi.</span>
          </div>
        </div>
      )}
    </Panel>
  );
}
