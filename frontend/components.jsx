/* ============================================================
   TeamFlow — shared primitives & app chrome
   ============================================================ */
const AppContext = React.createContext(null);
const useApp = () => useContext(AppContext);

/* reveal-hover: pointer-follow highlight on .reveal / .reveal-border */
function useReveal() {
  return useCallback((e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--rx", `${e.clientX - r.left}px`);
    el.style.setProperty("--ry", `${e.clientY - r.top}px`);
  }, []);
}
/* shared 1s ticker for live timers */
function useTicker(active) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
}

/* ---------- atoms ---------- */
const Avatar = ({ first, size = 32, ring }) => {
  const initials = (first || "?").slice(0, 1).toUpperCase();
  const bg = window.TF.getAvatarColor(first);
  return (
    <div className="avatar" style={{
      width: size, height: size, fontSize: size * 0.42, background: bg,
      boxShadow: ring ? `0 0 0 2px var(--card-solid), 0 0 0 4px var(--accent)` : "none",
    }}>{initials}</div>
  );
};

const STATUS_META = {
  ongoing:  { cls: "ongoing",  label: "Ongoing",  Icon: () => <Icons.Refresh size={13}/> },
  done:     { cls: "done",     label: "Selesai",  Icon: () => <Icons.Check size={13}/> },
  paused:   { cls: "paused",   label: "Paused",   Icon: () => <Icons.Pause size={11}/> },
  idle:     { cls: "idle",     label: "Idle",     Icon: () => <Icons.Sleep size={13}/> },
  pending:  { cls: "pending",  label: "Menunggu", Icon: () => <Icons.Hourglass size={12}/> },
  waiting:  { cls: "pending",  label: "Menunggu Approval", Icon: () => <Icons.Hourglass size={12}/> },
  approved: { cls: "done",     label: "Approved", Icon: () => <Icons.Check size={13}/> },
  rejected: { cls: "rejected", label: "Rejected", Icon: () => <Icons.Close size={11}/> },
  queue:    { cls: "ongoing",  label: "Siap",     Icon: () => <Icons.Play size={11}/> },
  over:     { cls: "over",     label: "Overtime", Icon: () => <Icons.Warning size={12}/> },
  deferred: { cls: "paused",   label: "Ditangguhkan", Icon: () => <Icons.Hourglass size={12}/> },
};
const Badge = ({ kind, label, children }) => {
  const m = STATUS_META[kind] || STATUS_META.idle;
  return (
    <span className={`badge ${m.cls}`}>
      <m.Icon />{label || children || m.label}
    </span>
  );
};

const Btn = ({ variant = "default", size, block, icon, children, className = "", ...rest }) => {
  const onMove = useReveal();
  const cls = ["btn", variant !== "default" ? variant : "", size || "", block ? "block" : "",
    "reveal", className].filter(Boolean).join(" ");
  return (
    <button className={cls} onMouseMove={onMove} {...rest}>
      {icon}{children}
    </button>
  );
};

const HBtn = ({ children, badge, ...rest }) => {
  const onMove = useReveal();
  return (
    <button className="hbtn reveal" onMouseMove={onMove} {...rest}>
      {children}
      {badge != null && <span className="dot">{badge}</span>}
    </button>
  );
};

const Toggle = ({ on, onChange }) => (
  <div className={`toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)} role="switch" aria-checked={on}>
    <span className="track"><span className="knob" /></span>
  </div>
);

const Field = ({ label, req, children, hint }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label className="field-label">{label}{req && <span className="req"> *</span>}</label>}
    {children}
    {hint && <div className="t-caption dim2" style={{ marginTop: 5 }}>{hint}</div>}
  </div>
);

const TextBox = (props) => <input className="tbx" {...props} />;
const TextArea = (props) => <textarea className="tbx" {...props} />;
const Select = ({ children, ...rest }) => (
  <div className="select-wrap">
    <select className="tbx" {...rest}>{children}</select>
    <Icons.Chevron size={14} />
  </div>
);
const SearchBox = ({ ...rest }) => (
  <div className="input-icon" style={{ minWidth: 200 }}>
    <Icons.Search size={15} />
    <input className="tbx" {...rest} />
  </div>
);

const Card = ({ children, className = "", pad = true, solid, style, hover }) => {
  const onMove = useReveal();
  return (
    <div className={`card ${solid ? "solid" : ""} ${hover ? "reveal-border" : ""} ${className}`}
         style={style} onMouseMove={hover ? onMove : undefined}>
      {pad ? <div className="card-pad">{children}</div> : children}
    </div>
  );
};

const SectionLabel = ({ children }) => <div className="section-label">{children}</div>;

const ProgressBar = ({ value, max = 1, thick, variant }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={`pbar ${thick ? "thick" : ""}`}>
      <i className={variant || ""} style={{ width: pct + "%" }} />
    </div>
  );
};

/* ---------- dialog / panel shells ---------- */
const Smoke = ({ onClick }) => <div className="smoke" onClick={onClick} />;

const Dialog = ({ title, icon, onClose, children, footer, width }) => (
  <>
    <Smoke onClick={onClose} />
    <div className="dialog" style={width ? { width } : undefined} role="dialog">
      <div className="dialog-head">
        {icon}<div className="t-body-lg" style={{ fontWeight: 600, flex: 1 }}>{title}</div>
        <HBtn onClick={onClose}><Icons.Close size={16} /></HBtn>
      </div>
      <div className="dialog-body">{children}</div>
      {footer && <div className="dialog-foot">{footer}</div>}
    </div>
  </>
);

const Panel = ({ title, icon, onClose, children, footer }) => (
  <>
    <Smoke onClick={onClose} />
    <div className="panel" role="dialog">
      <div className="panel-head">
        {icon}<div className="t-subtitle" style={{ flex: 1 }}>{title}</div>
        <HBtn onClick={onClose}><Icons.Close size={16} /></HBtn>
      </div>
      <div className="panel-body">{children}</div>
      {footer && <div className="panel-foot">{footer}</div>}
    </div>
  </>
);

/* ---------- toasts ---------- */
const ToastHost = ({ toasts, remove }) => (
  <div className="toast-host">
    {toasts.map((t) => (
      <div key={t.id} className={`toast ${t.leaving ? "out" : ""}`}>
        <span className={`ti ${t.kind}`}>
          {t.kind === "ok" ? <Icons.Check size={14} /> :
           t.kind === "err" ? <Icons.Close size={14} /> : <Icons.Info size={14} />}
        </span>
        <div style={{ flex: 1 }}>
          <div className="t-body-strong">{t.title}</div>
          {t.msg && <div className="t-caption dim" style={{ marginTop: 2 }}>{t.msg}</div>}
        </div>
        <HBtn onClick={() => remove(t.id)} style={{ width: 28, height: 28 }}><Icons.Close size={13} /></HBtn>
      </div>
    ))}
  </div>
);

/* ============================================================
   Navigation rail (WinUI NavigationView)
   ============================================================ */
const NAV = [
  { key: "dashboard", label: "Dashboard",          Icon: Icons.Home,     roles: ["CEO", "Member"] },
  { key: "mytodo",    label: "My Todo",             Icon: Icons.Tasks,    roles: ["Member"] },
  { key: "pending",   label: "Menunggu Approval",   Icon: Icons.Clock,    roles: ["Member"], badge: "pending_member" },
  { key: "selesai",   label: "Selesai",             Icon: Icons.Archive,  roles: ["Member"] },
  { key: "approval",  label: "Approval Queue",      Icon: Icons.Approval, roles: ["CEO"], badge: "pending" },
  { key: "teamtodo",  label: "Todo Tim",            Icon: Icons.Users3,   roles: ["CEO"] },
  { key: "laporan",   label: "Laporan Harian",      Icon: Icons.Chart,    roles: ["CEO", "Member"] },
  { key: "help",      label: "Bantuan",             Icon: Icons.Info,     roles: ["Member"] },
  { key: "users",     label: "User Management",     Icon: Icons.People,   roles: ["CEO"] },
];
const NAV_FOOT = [
  { key: "settings",  label: "Settings",         Icon: Icons.Settings, roles: ["CEO", "Member"] },
];

const NavItem = ({ item, active, onClick, badgeVal }) => {
  const onMove = useReveal();
  return (
    <div className={`nav-item reveal ${active ? "sel" : ""}`} onClick={onClick} onMouseMove={onMove}
         title={item.label}>
      <span className="ic"><item.Icon size={18} /></span>
      <span className="lbl">{item.label}</span>
      {badgeVal ? <span className="badge-count">{badgeVal}</span> : null}
    </div>
  );
};

const NavRail = () => {
  const { route, go, role, compact, pendingCount, pendingMemberCount } = useApp();
  const visible = (it) => it.roles.includes(role);
  const badgeFor = (it) => {
    if (it.badge === "pending") return pendingCount || 0;
    if (it.badge === "pending_member") return pendingMemberCount || 0;
    return 0;
  };
  return (
    <nav className={`rail ${compact ? "compact" : ""}`}>
      <div className="rail-scroll">
        {NAV.filter(visible).map((it) => (
          <NavItem key={it.key} item={it} active={route === it.key}
                   onClick={() => go(it.key)}
                   badgeVal={badgeFor(it)} />
        ))}
      </div>
      <div>
        <div className="hr" style={{ margin: "6px 8px" }} />
        {NAV_FOOT.filter(visible).map((it) => (
          <NavItem key={it.key} item={it} active={route === it.key} onClick={() => go(it.key)} />
        ))}
      </div>
    </nav>
  );
};

/* ============================================================
   Header / title bar
   ============================================================ */
const Header = () => {
  const { toggleRail, theme, setTheme, me, unreadCount, notifOpen, setNotifOpen, go } = useApp();
  return (
    <header className="titlebar">
      <HBtn onClick={toggleRail} title="Menu"><Icons.Menu size={18} /></HBtn>
      <div className="row gap8" style={{ marginLeft: 2 }}>
        <div className="brand-glyph" style={{ width: 30, height: 30, borderRadius: 8 }}>
          <Icons.Building size={17} />
        </div>
        <div className="t-body-strong hide-mobile-sm" style={{ fontWeight: 700, letterSpacing: "-.01em" }}>TeamFlow</div>
        <span className="t-caption dim2 hide-mobile" style={{ marginTop: 1 }}>Todo Management</span>
      </div>
      <div className="spacer" />
      <div className="row gap8">
        <HBtn title="Notifikasi" badge={unreadCount || null} onClick={() => setNotifOpen(!notifOpen)}>
          <Icons.Bell size={18} />
        </HBtn>
        <HBtn title="Ganti tema" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? <Icons.Moon size={17} /> : <Icons.Sun size={18} />}
        </HBtn>
        <div className="row gap8" style={{ cursor: "pointer", padding: "2px 6px 2px 4px", borderRadius: 6 }}
             onClick={() => go("settings")} title="Profil">
          <Avatar first={me?.first || "?"} size={30} />
          <div className="col hide-mobile" style={{ lineHeight: 1.15 }}>
            <span className="t-caption" style={{ fontWeight: 600 }}>{me?.first || "—"}</span>
            <span className="t-caption dim2" style={{ fontSize: 11 }}>{me?.role || ""}</span>
          </div>
        </div>
      </div>
      {notifOpen && <NotifFlyout />}
    </header>
  );
};

/* ============================================================
   Notification flyout — uses real notifications from context
   ============================================================ */
const NOTIF_KIND = {
  TODO_APPROVED: "ok", TODO_AUTO_APPROVED: "ok",
  TODO_REJECTED: "err",
  TODO_PENDING_APPROVAL: "info",
  DELEGATION_CREATED: "info", DELEGATION_REVOKED: "info",
};
const NOTIF_NAV = {
  TODO_APPROVED: "mytodo", TODO_AUTO_APPROVED: "mytodo",
  TODO_REJECTED: "pending",
  TODO_PENDING_APPROVAL: "approval",
  DELEGATION_CREATED: "settings", DELEGATION_REVOKED: "settings",
};

const NotifFlyout = () => {
  const { setNotifOpen, notifications, go, markNotifRead, clearAllNotifs } = useApp();
  const items = (notifications || []).slice(0, 5);
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 39 }} onClick={() => setNotifOpen(false)} />
      <div className="card solid" style={{
        position: "absolute", top: 50, right: 8, width: 320, zIndex: 40,
        padding: 0, boxShadow: "var(--shadow-flyout)", overflow: "hidden",
      }}>
        <div className="row" style={{ padding: "12px 14px 8px" }}>
          <div className="t-body-strong" style={{ flex: 1 }}>Notifikasi</div>
          <span className="t-caption dim2">{items.filter((n) => !n.readAt).length} baru</span>
          {items.length > 0 && (
            <button
              className="t-caption"
              style={{ marginLeft: 10, color: "#c42b1c", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              onClick={() => { clearAllNotifs(); setNotifOpen(false); }}
            >
              Hapus Semua
            </button>
          )}
        </div>
        <div className="hr" />
        {items.length === 0 && (
          <div className="t-caption dim" style={{ padding: "16px 14px" }}>Tidak ada notifikasi</div>
        )}
        {items.map((n, i) => {
          const k = NOTIF_KIND[n.type] || "info";
          const to = NOTIF_NAV[n.type] || "dashboard";
          return (
            <div key={n.id || i} className="row gap12 reveal"
                 style={{ padding: "11px 14px", cursor: "pointer", alignItems: "flex-start",
                          background: n.readAt ? "transparent" : "color-mix(in srgb, var(--accent) 5%, transparent)" }}
                 onClick={() => { setNotifOpen(false); markNotifRead(n.id); go(to, n.todoId || null); }}>
              <span style={{ flex: "0 0 22px", height: 22, display: "grid", placeItems: "center",
                             borderRadius: "50%", marginTop: 1, background: "var(--subtle-sel)",
                             color: k === "err" ? "#c42b1c" : k === "ok" ? "#0f7b3f" : "var(--accent)" }}>
                <Icons.Dot size={10} />
              </span>
              <div style={{ flex: 1 }}>
                <div className="t-caption" style={{ fontWeight: n.readAt ? 400 : 600 }}>{n.title}</div>
                <div className="t-caption dim2" style={{ marginTop: 2 }}>{n.body}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

Object.assign(window, {
  AppContext, useApp, useReveal, useTicker,
  Avatar, Badge, STATUS_META, Btn, HBtn, Toggle, Field, TextBox, TextArea, Select, SearchBox,
  Card, SectionLabel, ProgressBar, Smoke, Dialog, Panel, ToastHost,
  NavRail, Header, NAV, NAV_FOOT, NOTIF_NAV,
});
