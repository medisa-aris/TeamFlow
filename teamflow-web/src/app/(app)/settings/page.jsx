'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useToasts } from '@/hooks/useToasts';
import { apiGet, apiPatch } from '@/lib/apiClient';
import { validatePw } from '@/lib/utils';
import { Icons } from '@/components/ui/icons';
import { Card, Btn, HBtn, Toggle, Field, TextBox, Select, SectionLabel, Avatar } from '@/components/ui/primitives';

export default function SettingsPage() {
  const router = useRouter();
  const me = useAuthStore((s) => s.me);
  const notifPrefs = useAuthStore((s) => s.notifPrefs);
  const setNotifPrefs = useAuthStore((s) => s.setNotifPrefs);
  const clearAuth = useAuthStore((s) => s.clear);
  const isCEO = me?.role === 'CEO';
  const { push: pushToast } = useToasts();
  const queryClient = useQueryClient();

  const [tz, setTz] = useState('Asia/Jakarta (WIB)');
  const [fname, setFname] = useState(me?.name || '');
  const [showPw, setShowPw] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const { data: syscfg } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => apiGet('system-config'),
    enabled: !!me,
  });
  const [deadlineHour, setDeadlineHour] = useState(9);
  useEffect(() => { if (syscfg?.approvalDeadlineHour != null) setDeadlineHour(syscfg.approvalDeadlineHour); }, [syscfg]);

  const pwErr = validatePw(newPw);
  const pwMismatch = newPw && confirmPw && newPw !== confirmPw;
  const pwValid = curPw && newPw && confirmPw && !pwErr && !pwMismatch;

  const profileMut = useMutation({
    mutationFn: () => apiPatch(`users/${me.id}`, { fullName: fname }),
    onSuccess: () => pushToast('ok', 'Perubahan disimpan'),
    onError: (e) => pushToast('err', 'Gagal menyimpan', e.message),
  });

  const pwMut = useMutation({
    mutationFn: () => apiPatch('auth/change-password', { currentPassword: curPw, newPassword: newPw }),
    onSuccess: () => {
      pushToast('ok', 'Password berhasil diubah', 'Silakan login ulang di perangkat lain');
      setCurPw(''); setNewPw(''); setConfirmPw('');
    },
    onError: (e) => pushToast('err', 'Gagal mengubah password', e.message),
  });

  const deadlineMut = useMutation({
    mutationFn: () => apiPatch('system-config', { approvalDeadlineHour: Number(deadlineHour) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      pushToast('ok', 'Batas approval diperbarui', `Auto-approve pukul ${String(deadlineHour).padStart(2, '0')}:00 WIB`);
    },
    onError: (e) => pushToast('err', 'Gagal menyimpan', e.message),
  });

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    clearAuth();
    queryClient.clear();
    router.replace('/login');
  };

  return (
    <div className="content-pad page-enter" style={{ maxWidth: 720 }}>
      <div className="t-title" style={{ marginBottom: 4 }}>Settings &amp; Profile</div>

      <SectionLabel><Icons.Users3 size={13} /> Profil Saya</SectionLabel>
      <Card>
        <div className="row gap16" style={{ marginBottom: 18 }}>
          <Avatar first={me?.first || '?'} size={64} />
          <div className="col">
            <span className="t-body-lg" style={{ fontWeight: 600 }}>{me?.name || '—'}</span>
            <span className="dim">{me?.email} · {me?.role}</span>
          </div>
        </div>
        <div className="row gap12 wrap">
          <div style={{ flex: 1, minWidth: 200 }}><Field label="Nama"><TextBox value={fname} onChange={(e) => setFname(e.target.value)} /></Field></div>
          <div style={{ flex: 1, minWidth: 200 }}><Field label="Email"><TextBox value={me?.email || ''} disabled style={{ opacity: .6 }} /></Field></div>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <Btn variant="accent" disabled={profileMut.isPending} icon={<Icons.Check size={16} />} onClick={() => profileMut.mutate()}>
            {profileMut.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Btn>
        </div>
      </Card>

      <SectionLabel><Icons.Bell size={13} /> Preferensi Notifikasi</SectionLabel>
      <Card pad={false}>
        {[
          { k: 'approved', t: 'Notifikasi todo approved', s: 'Saat CEO menyetujui todo kamu' },
          { k: 'rejected', t: 'Notifikasi todo rejected', s: 'Saat todo ditolak / perlu revisi' },
          { k: 'reminder', t: 'Reminder 30 menit sebelum batas', s: 'Pengingat batas jam harian' },
        ].map((r, i) => (
          <div key={r.k} className="row gap16" style={{ padding: '14px 18px', borderTop: i ? '1px solid var(--divider)' : 'none' }}>
            <div className="col" style={{ flex: 1 }}><span className="t-body-strong">{r.t}</span><span className="dim t-caption">{r.s}</span></div>
            <Toggle on={notifPrefs[r.k]} onChange={(v) => setNotifPrefs({ ...notifPrefs, [r.k]: v })} />
          </div>
        ))}
      </Card>

      <SectionLabel><Icons.Lock size={13} /> Ganti Password</SectionLabel>
      <Card>
        <div className="row gap8" style={{ marginBottom: 14, alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="t-caption dim">Gunakan password kuat — min. 8 karakter, 1 huruf kapital, 1 angka</span>
          <HBtn title={showPw ? 'Sembunyikan' : 'Tampilkan'} onClick={() => setShowPw(!showPw)} style={{ width: 28, height: 28 }}>
            {showPw ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
          </HBtn>
        </div>
        <Field label="Password Saat Ini" req>
          <TextBox type={showPw ? 'text' : 'password'} value={curPw} onChange={(e) => setCurPw(e.target.value)} placeholder="••••••••" />
        </Field>
        <Field label="Password Baru" req hint="Min. 8 karakter, 1 huruf kapital, 1 angka">
          <TextBox type={showPw ? 'text' : 'password'} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••"
            style={pwErr && newPw ? { borderColor: '#c42b1c' } : newPw && !pwErr ? { borderColor: '#0f7b3f' } : {}} />
          {pwErr && newPw && (
            <div className="row gap6 mt4" style={{ color: '#c42b1c', fontSize: 12 }}><Icons.XCircle size={13} />{pwErr}</div>
          )}
        </Field>
        <Field label="Konfirmasi Password Baru" req>
          <TextBox type={showPw ? 'text' : 'password'} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••"
            style={pwMismatch ? { borderColor: '#c42b1c' } : confirmPw && !pwMismatch ? { borderColor: '#0f7b3f' } : {}} />
          {pwMismatch && (
            <div className="row gap6 mt4" style={{ color: '#c42b1c', fontSize: 12 }}><Icons.XCircle size={13} />Password tidak cocok</div>
          )}
          {confirmPw && !pwMismatch && newPw && !pwErr && (
            <div className="row gap6 mt4" style={{ color: '#0f7b3f', fontSize: 12 }}><Icons.CheckCircle size={13} />Password cocok</div>
          )}
        </Field>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <Btn variant="accent" disabled={!pwValid || pwMut.isPending} icon={<Icons.Lock size={15} />} onClick={() => pwMut.mutate()}>
            {pwMut.isPending ? 'Menyimpan...' : 'Ubah Password'}
          </Btn>
        </div>
      </Card>

      <SectionLabel><Icons.Clock size={13} /> Zona Waktu</SectionLabel>
      <Card>
        <Select value={tz} onChange={(e) => setTz(e.target.value)}>
          <option>Asia/Jakarta (WIB)</option><option>Asia/Makassar (WITA)</option><option>Asia/Jayapura (WIT)</option>
        </Select>
      </Card>

      {isCEO && <>
        <SectionLabel><Icons.Clock size={13} /> Batas Waktu Approval</SectionLabel>
        <Card>
          <div className="t-caption dim" style={{ marginBottom: 14 }}>
            Auto-approve akan berjalan setiap hari kerja pada jam yang dipilih (WIB). Todo yang belum direspons sebelum jam ini akan otomatis disetujui.
          </div>
          <div className="row gap12" style={{ alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <Select value={deadlineHour} onChange={(e) => setDeadlineHour(Number(e.target.value))}>
                {[7, 8, 9, 10, 11, 12].map((h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00 WIB</option>
                ))}
              </Select>
            </div>
            <Btn variant="accent" disabled={deadlineMut.isPending} icon={<Icons.Check size={16} />} onClick={() => deadlineMut.mutate()}>
              {deadlineMut.isPending ? 'Menyimpan...' : 'Simpan'}
            </Btn>
          </div>
        </Card>
      </>}

      <div className="hr" style={{ margin: '26px 0' }} />
      <Btn variant="danger" icon={<Icons.Logout size={16} />} onClick={logout}>Keluar / Logout</Btn>
    </div>
  );
}
