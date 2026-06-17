'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useToasts } from '@/hooks/useToasts';
import { apiGet, apiPost, apiPatch } from '@/lib/apiClient';
import { mapUser, validatePw } from '@/lib/utils';
import { Icons } from '@/components/ui/icons';
import { Card, Btn, HBtn, Badge, Avatar, Field, TextBox, Select, SearchBox, Dialog } from '@/components/ui/primitives';

function UserEditDialog({ user, onClose, onSave }) {
  const [f, setF] = useState({ password: '', confirmPw: '', ...user });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const isNew = !!user._new;

  const pwErr = validatePw(f.password);
  const pwMismatch = f.password && f.confirmPw && f.password !== f.confirmPw;
  const pwRequiredOk = isNew ? (f.password.length >= 8 && !pwErr) : (!f.password || (!pwErr && !pwMismatch));
  const valid = f.name.trim() && f.email.trim() && pwRequiredOk && !pwMismatch;

  return (
    <Dialog title={isNew ? 'Tambah User' : 'Edit User'} width={460}
      icon={<span style={{ color: 'var(--accent)' }}>{isNew ? <Icons.Plus size={20} /> : <Icons.Edit size={20} />}</span>}
      onClose={onClose}
      footer={<><Btn onClick={onClose}>Batal</Btn>
        <Btn variant="accent" disabled={!valid} onClick={() => onSave(f)} icon={<Icons.Check size={16} />}>Simpan</Btn></>}>
      <Field label="Nama Lengkap" req>
        <TextBox value={f.name} onChange={set('name')} placeholder="Nama lengkap" autoFocus />
      </Field>
      {isNew && <>
        <Field label="Email" req>
          <TextBox value={f.email} onChange={set('email')} placeholder="nama@teamflow.id" />
        </Field>
        <Field label="Role">
          <Select value={f.role} onChange={set('role')}><option>Member</option><option>CEO</option></Select>
        </Field>
      </>}
      {!isNew && <>
        <Field label="Email">
          <TextBox value={f.email} disabled style={{ opacity: .6 }} />
        </Field>
        <Field label="Status">
          <Select value={f.status} onChange={set('status')}><option>Aktif</option><option>Nonaktif</option></Select>
        </Field>
      </>}

      <div className="hr" style={{ margin: '14px 0 16px' }} />
      <div className="t-caption dim" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icons.Lock size={13} />
        {isNew ? 'Password akun' : 'Reset password (kosongkan jika tidak ingin mengubah)'}
      </div>
      <Field label={isNew ? 'Password' : 'Password Baru'} req={isNew} hint="Min. 8 karakter, 1 huruf kapital, 1 angka">
        <TextBox type="password" value={f.password} onChange={set('password')} placeholder="••••••••"
          style={pwErr && f.password ? { borderColor: '#c42b1c' } : {}} />
        {pwErr && f.password && (
          <div className="row gap6 mt4" style={{ color: '#c42b1c', fontSize: 12 }}>
            <Icons.XCircle size={13} />{pwErr}
          </div>
        )}
      </Field>
      <Field label="Konfirmasi Password" req={isNew}>
        <TextBox type="password" value={f.confirmPw} onChange={set('confirmPw')} placeholder="••••••••"
          style={pwMismatch ? { borderColor: '#c42b1c' } : {}} />
        {pwMismatch && (
          <div className="row gap6 mt4" style={{ color: '#c42b1c', fontSize: 12 }}>
            <Icons.XCircle size={13} />Password tidak cocok
          </div>
        )}
      </Field>
      {!isNew && (
        <div className="muted-box t-caption dim row gap8">
          <Icons.Info size={13} />Email dan role tidak dapat diubah setelah dibuat.
        </div>
      )}
    </Dialog>
  );
}

export default function UsersPage() {
  const me = useAuthStore((s) => s.me);
  const { push: pushToast } = useToasts();
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);

  const { data: usersRaw = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiGet('users'),
    enabled: !!me,
  });

  const users = usersRaw.map(mapUser);
  const filtered = users.filter((u) => (u.name + u.email).toLowerCase().includes(q.toLowerCase()));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const saveMut = useMutation({
    mutationFn: (u) => {
      if (u._new) {
        return apiPost('users', {
          email: u.email,
          fullName: u.name,
          password: u.password,
          role: u.role === 'CEO' ? 'CEO' : 'MEMBER',
        });
      }
      const body = {};
      if (u.name !== undefined) body.fullName = u.name;
      if (u.status !== undefined) body.isActive = u.status === 'Aktif';
      if (u.password && u.password.trim()) body.password = u.password;
      return apiPatch(`users/${u.id}`, body);
    },
    onSuccess: (_, u) => {
      invalidate();
      pushToast('ok', u._new ? 'User dibuat' : 'User diperbarui', u._new ? u.email : u.name);
      setEditing(null);
    },
    onError: (e) => pushToast('err', 'Gagal menyimpan user', e.message),
  });

  const deactivateMut = useMutation({
    mutationFn: (id) => apiPatch(`users/${id}`, { isActive: false }),
    onSuccess: () => { invalidate(); pushToast('ok', 'User dinonaktifkan'); },
    onError: (e) => pushToast('err', 'Gagal menonaktifkan user', e.message),
  });

  return (
    <div className="content-pad page-enter">
      <div className="row" style={{ alignItems: 'flex-end', marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div className="t-title">User Management</div>
          <div className="dim" style={{ marginTop: 2 }}>{users.length} pengguna terdaftar</div>
        </div>
        <div className="row gap12 wrap">
          <SearchBox placeholder="Cari nama / email..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Btn variant="accent" icon={<Icons.Plus size={16} />}
               onClick={() => setEditing({ name: '', email: '', role: 'Member', status: 'Aktif', password: '', _new: true })}>
            Tambah User
          </Btn>
        </div>
      </div>

      <Card pad={false} style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr>
            <th style={{ width: 40 }}>#</th><th>Nama</th><th className="hide-mobile">Email</th>
            <th style={{ width: 90 }}>Role</th><th style={{ width: 110 }}>Status</th>
            <th style={{ width: 80, textAlign: 'right' }}>Aksi</th>
          </tr></thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id}>
                <td className="dim2">{i + 1}</td>
                <td><div className="row gap10"><Avatar first={u.first || u.name} size={26} /><span className="t-body-strong">{u.name}</span></div></td>
                <td className="dim hide-mobile">{u.email}</td>
                <td>{u.role === 'CEO'
                  ? <span className="badge" style={{ color: 'var(--accent)', background: 'color-mix(in srgb,var(--accent) 14%,transparent)' }}>CEO</span>
                  : <span className="dim">Member</span>}</td>
                <td>{u.status === 'Aktif'
                  ? <Badge kind="done" label="Aktif" />
                  : <Badge kind="idle" label="Nonaktif" />}</td>
                <td>
                  <div className="row" style={{ gap: 2, justifyContent: 'flex-end' }}>
                    <HBtn title="Edit" onClick={() => setEditing({ ...u })} style={{ width: 30, height: 30 }}><Icons.Edit size={15} /></HBtn>
                    <HBtn title="Nonaktifkan" onClick={() => {
                      if (u.role === 'CEO') { pushToast('err', 'Tidak bisa menonaktifkan CEO'); return; }
                      deactivateMut.mutate(u.id);
                    }} style={{ width: 30, height: 30 }}><Icons.Trash size={15} /></HBtn>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="dim" style={{ textAlign: 'center', padding: 24 }}>Tidak ada pengguna cocok.</td></tr>}
          </tbody>
        </table>
      </Card>

      {editing && (
        <UserEditDialog user={editing} onClose={() => setEditing(null)}
          onSave={(u) => saveMut.mutate(u)} />
      )}
    </div>
  );
}
