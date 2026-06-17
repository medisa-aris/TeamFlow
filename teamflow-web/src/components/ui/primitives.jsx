'use client';
import { useReveal } from '@/hooks/useReveal';
import { Icons } from '@/components/ui/icons';
import { getAvatarColor } from '@/lib/utils';
import { STATUS_META } from '@/lib/constants';

export function Avatar({ first, size = 32, ring }) {
  const initials = (first || '?').slice(0, 1).toUpperCase();
  const bg = getAvatarColor(first);
  return (
    <div className="avatar" style={{
      width: size, height: size, fontSize: size * 0.42, background: bg,
      boxShadow: ring ? '0 0 0 2px var(--card-solid), 0 0 0 4px var(--accent)' : 'none',
    }}>{initials}</div>
  );
}

export function Badge({ kind, label, children }) {
  const m = STATUS_META[kind] || STATUS_META.idle;
  const Icon = Icons[m.iconKey];
  return (
    <span className={`badge ${m.cls}`}>
      {Icon && <Icon size={12} />}
      {label || children || m.label}
    </span>
  );
}

export function Btn({ variant = 'default', size, block, icon, children, className = '', ...rest }) {
  const onMove = useReveal();
  const cls = ['btn', variant !== 'default' ? variant : '', size || '', block ? 'block' : '', 'reveal', className]
    .filter(Boolean).join(' ');
  return (
    <button className={cls} onMouseMove={onMove} {...rest}>
      {icon}{children}
    </button>
  );
}

export function HBtn({ children, badge, ...rest }) {
  const onMove = useReveal();
  return (
    <button className="hbtn reveal" onMouseMove={onMove} {...rest}>
      {children}
      {badge != null && <span className="dot">{badge}</span>}
    </button>
  );
}

export function Toggle({ on, onChange }) {
  return (
    <div className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <span className="track"><span className="knob" /></span>
    </div>
  );
}

export function Field({ label, req, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label className="field-label">{label}{req && <span className="req"> *</span>}</label>}
      {children}
      {hint && <div className="t-caption dim2" style={{ marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

export function TextBox(props) {
  return <input className="tbx" {...props} />;
}

export function TextArea(props) {
  return <textarea className="tbx" {...props} />;
}

export function Select({ children, ...rest }) {
  return (
    <div className="select-wrap">
      <select className="tbx" {...rest}>{children}</select>
      <Icons.Chevron size={14} />
    </div>
  );
}

export function SearchBox({ ...rest }) {
  return (
    <div className="input-icon" style={{ minWidth: 200 }}>
      <Icons.Search size={15} />
      <input className="tbx" {...rest} />
    </div>
  );
}

export function Card({ children, className = '', pad = true, solid, style, hover }) {
  const onMove = useReveal();
  return (
    <div
      className={`card ${solid ? 'solid' : ''} ${hover ? 'reveal-border' : ''} ${className}`}
      style={style}
      onMouseMove={hover ? onMove : undefined}
    >
      {pad ? <div className="card-pad">{children}</div> : children}
    </div>
  );
}

export function SectionLabel({ children }) {
  return <div className="section-label">{children}</div>;
}

export function ProgressBar({ value, max = 1, thick, variant }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={`pbar ${thick ? 'thick' : ''}`}>
      <i className={variant || ''} style={{ width: pct + '%' }} />
    </div>
  );
}

export function Smoke({ onClick }) {
  return <div className="smoke" onClick={onClick} />;
}

export function Dialog({ title, icon, onClose, children, footer, width }) {
  return (
    <>
      <Smoke onClick={onClose} />
      <div className="dialog" style={width ? { width } : undefined} role="dialog">
        <div className="dialog-head">
          {icon}
          <div className="t-body-lg" style={{ fontWeight: 600, flex: 1 }}>{title}</div>
          <HBtn onClick={onClose}><Icons.Close size={16} /></HBtn>
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-foot">{footer}</div>}
      </div>
    </>
  );
}

export function Panel({ title, icon, onClose, children, footer }) {
  return (
    <>
      <Smoke onClick={onClose} />
      <div className="panel" role="dialog">
        <div className="panel-head">
          {icon}
          <div className="t-subtitle" style={{ flex: 1 }}>{title}</div>
          <HBtn onClick={onClose}><Icons.Close size={16} /></HBtn>
        </div>
        <div className="panel-body">{children}</div>
        {footer && <div className="panel-foot">{footer}</div>}
      </div>
    </>
  );
}

export function ToastHost({ toasts, remove }) {
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.leaving ? 'out' : ''}`}>
          <span className={`ti ${t.kind}`}>
            {t.kind === 'ok' ? <Icons.Check size={14} /> :
             t.kind === 'err' ? <Icons.Close size={14} /> : <Icons.Info size={14} />}
          </span>
          <div style={{ flex: 1 }}>
            <div className="t-body-strong">{t.title}</div>
            {t.msg && <div className="t-caption dim" style={{ marginTop: 2 }}>{t.msg}</div>}
          </div>
          <HBtn onClick={() => remove(t.id)} style={{ width: 28, height: 28 }}>
            <Icons.Close size={13} />
          </HBtn>
        </div>
      ))}
    </div>
  );
}
