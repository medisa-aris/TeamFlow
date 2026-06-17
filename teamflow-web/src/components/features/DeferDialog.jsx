'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToasts } from '@/hooks/useToasts';
import { apiPost } from '@/lib/apiClient';
import { Icons } from '@/components/ui/icons';
import { Dialog, Btn, Field, TextArea } from '@/components/ui/primitives';

export function DeferDialog({ id, title, onClose }) {
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= 5;
  const queryClient = useQueryClient();
  const { push: pushToast } = useToasts();

  const mutation = useMutation({
    mutationFn: () => apiPost(`todos/${id}/defer`, { reason: reason.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      pushToast('ok', 'Todo ditangguhkan', 'Task akan terlihat di bagian Ditangguhkan');
      onClose();
    },
    onError: (e) => pushToast('err', 'Gagal menangguhkan todo', e.message),
  });

  return (
    <Dialog
      title="Tangguhkan Task"
      icon={<Icons.Hourglass size={20} style={{ color: '#c8650a' }} />}
      onClose={onClose}
      width={440}
      footer={<>
        <Btn onClick={onClose}>Batal</Btn>
        <Btn variant="accent" disabled={!valid || mutation.isPending} icon={<Icons.Check size={15} />}
             onClick={() => mutation.mutate()}>
          Konfirmasi
        </Btn>
      </>}
    >
      <div className="t-caption dim" style={{ marginBottom: 14, lineHeight: 1.5 }}>
        Task <strong>"{title}"</strong> tidak bisa dilanjutkan hari ini.
        Berikan alasan penangguhan — task akan muncul di bagian Ditangguhkan dan bisa diaktifkan ulang ke hari berikutnya.
      </div>
      <Field label="Alasan Penangguhan" req>
        <TextArea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Contoh: Tidak sempat karena ada meeting mendadak..."
          rows={3}
          autoFocus
        />
      </Field>
    </Dialog>
  );
}
