'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/authStore';
import { useToasts } from '@/hooks/useToasts';
import { Icons } from '@/components/ui/icons';
import { Btn, HBtn, Field } from '@/components/ui/primitives';

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const setMe = useAuthStore((s) => s.setMe);
  const { push: pushToast } = useToasts();

  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Login gagal');
        setErr(msg);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.user) setMe(data.user);
      router.replace('/dashboard');
    } catch (ex) {
      setErr(ex.message || 'Login gagal. Periksa email dan password.');
      setLoading(false);
    }
  };

  return (
    <div className="login-stage">
      <div style={{ position: 'fixed', top: 16, right: 16 }}>
        <HBtn title="Ganti tema" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Icons.Moon size={18} /> : <Icons.Sun size={18} />}
        </HBtn>
      </div>
      <form className="login-card" onSubmit={submit}>
        <div className="col" style={{ alignItems: 'center', textAlign: 'center', marginBottom: 26 }}>
          <div className="brand-glyph"><Icons.Building size={26} /></div>
          <div className="t-title" style={{ marginTop: 16 }}>TeamFlow</div>
          <div className="dim" style={{ marginTop: 2 }}>Todo Management System</div>
        </div>
        <Field label="Email">
          <div className="input-icon">
            <Icons.Mail size={15} />
            <input className="tbx" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                   placeholder="email@company.com" autoComplete="username" required />
          </div>
        </Field>
        <Field label="Password">
          <div className="input-icon">
            <Icons.Lock size={15} />
            <input className="tbx has-toggle" type={showPw ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)}
                   placeholder="••••••••••" autoComplete="current-password" required />
            <button type="button" className="eye-toggle" tabIndex={-1}
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}>
              {showPw ? <Icons.EyeOff size={15} /> : <Icons.Eye size={15} />}
            </button>
          </div>
        </Field>
        {err && (
          <div className="row gap8" style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 12,
            background: 'rgba(196,43,28,0.10)', color: '#c42b1c', fontSize: 13 }}>
            <Icons.XCircle size={14} />{err}
          </div>
        )}
        <Btn variant="accent" size="lg" block type="submit" disabled={loading}
             icon={loading ? <Icons.Spinner size={16} className="spin" /> : null}>
          {loading ? 'Masuk...' : <><span>MASUK</span> <Icons.ArrowRight size={17} /></>}
        </Btn>
        <div className="col" style={{ alignItems: 'center', marginTop: 18 }}>
          <a className="link">Lupa password?</a>
        </div>
      </form>
    </div>
  );
}
