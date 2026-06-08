/* ============================================================
   TeamFlow — pages 1: Login, Dashboard, My Todo, Todo Detail
   ============================================================ */

/* ---------- LOGIN ---------- */
const LoginPage = () => {
  const { login, theme, setTheme } = useApp();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, pw);
    } catch (ex) {
      setErr(ex.message || "Login gagal. Periksa email dan password.");
      setLoading(false);
    }
  };

  return (
    <div className="login-stage">
      <div style={{ position: "fixed", top: 16, right: 16 }}>
        <HBtn title="Ganti tema" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? <Icons.Moon size={18} /> : <Icons.Sun size={18} />}
        </HBtn>
      </div>
      <form className="login-card" onSubmit={submit}>
        <div className="col" style={{ alignItems: "center", textAlign: "center", marginBottom: 26 }}>
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
            <input className="tbx" type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                   placeholder="••••••••••" autoComplete="current-password" required />
          </div>
        </Field>
        {err && (
          <div className="row gap8" style={{ padding: "8px 12px", borderRadius: 6, marginBottom: 12,
            background: "rgba(196,43,28,0.10)", color: "#c42b1c", fontSize: 13 }}>
            <Icons.XCircle size={14} />{err}
          </div>
        )}
        <Btn variant="accent" size="lg" block type="submit" disabled={loading}
             icon={loading ? <Icons.Spinner size={16} className="spin" /> : null}>
          {loading ? "Masuk..." : <><span>MASUK</span> <Icons.ArrowRight size={17} /></>}
        </Btn>
        <div className="col" style={{ alignItems: "center", marginTop: 18 }}>
          <a className="link">Lupa password?</a>
        </div>
      </form>
    </div>
  );
};

/* ---------- DASHBOARD ---------- */
const StatCard = ({ label, value, sub, Icon, tone }) => (
  <Card hover className="reveal" style={{ position: "relative" }}>
    <div className="row" style={{ alignItems: "flex-start" }}>
      <div className="col" style={{ flex: 1, gap: 2 }}>
        <span className="t-caption dim" style={{ minHeight: 32 }}>{label}</span>
        <span className="t-title-lg" style={{ marginTop: 4 }}>{value}</span>
        {sub && <span className="t-caption dim2" style={{ marginTop: 2 }}>{sub}</span>}
      </div>
      <div style={{ width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center",
        color: tone, background: `color-mix(in srgb, ${tone} 14%, transparent)` }}>
        <Icon size={20} />
      </div>
    </div>
  </Card>
);

const AnimatedBars = ({ data, unit = "jam", max }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);
  const mx = max || Math.max(...data.map((d) => d.v), 1);
  return (
    <div className="bars">
      {data.map((d, i) => (
        <div className="bcol" key={i}>
          <span className="bval">{d.v}</span>
          <div className="bstack">
            <div className="bfill" style={{
              height: mounted ? `${(d.v / mx) * 100}%` : 0,
              transitionDelay: `${i * 55}ms`,
              opacity: d.v === 0 ? 0.25 : 1,
            }} />
          </div>
          <span className="blbl">{d.d}</span>
        </div>
      ))}
    </div>
  );
};

const TeamHourRow = ({ p }) => {
  const meta = STATUS_META[p.status] || STATUS_META.idle;
  return (
    <div className="row gap12" style={{ padding: "9px 0" }}>
      <Avatar first={p.first} size={30} />
      <div style={{ width: 54 }} className="t-body-strong">{p.first}</div>
      <div style={{ flex: 1 }}>
        <ProgressBar value={p.used} max={p.total}
          variant={p.status === "done" ? "full" : p.used >= p.total ? "warn" : ""} />
      </div>
      <div className="dim t-caption" style={{ width: 56, textAlign: "right" }}>{p.used}/{p.total} jam</div>
      <div style={{ width: 132, display: "flex", justifyContent: "flex-end" }}>
        <Badge kind={p.status} />
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { team, week, todos, approvals, users, role, me } = useApp();
  const isCEO = role === "CEO";
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // CEO: team-wide counts; Member: hanya todo milik user login
  const ongoing = isCEO
    ? team.filter((t) => t.status === "ongoing").length
    : todos.filter((t) => t.state === "ongoing").length;

  const doneCount = todos.filter((t) => t.state === "done").length;

  const pending = isCEO
    ? approvals.length
    : todos.filter((t) => t.state === "waiting").length;

  const totalMembers = users.length || team.length || "—";

  // Data baris tim untuk member (filter ke user login saja)
  const myTeamRow = !isCEO ? team.find((t) => t.userId === me?.id) : null;
  const myHoursWorked = myTeamRow?.used ?? 0;
  const teamDisplay = isCEO ? team : (myTeamRow ? [myTeamRow] : []);

  return (
    <div className="content-pad page-enter">
      <div className="row" style={{ alignItems: "flex-end", marginBottom: 22 }}>
        <div>
          <div className="t-title">Dashboard</div>
          <div className="dim" style={{ marginTop: 2 }}>{today}</div>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Anggota" value={totalMembers} sub="pengguna aktif" Icon={Icons.Users3} tone="var(--accent)" />
        <StatCard
          label="Ongoing Sekarang"
          value={ongoing}
          sub={isCEO ? "sedang bekerja" : "todo berjalan"}
          Icon={Icons.Refresh}
          tone="#2b9d6b"
        />
        <StatCard
          label="Menunggu Approval"
          value={pending}
          sub={isCEO ? "batas 09:00" : "menunggu CEO"}
          Icon={Icons.Hourglass}
          tone="#c8650a"
        />
        <StatCard label="Selesai Hari Ini" value={doneCount} sub="todo tuntas" Icon={Icons.CheckCircle} tone="#0f7b3f" />
        {!isCEO && (
          <StatCard
            label="Jam Kerja Hari Ini"
            value={`${myHoursWorked}j`}
            sub="dari 8 jam target"
            Icon={Icons.Clock}
            tone="var(--accent)"
          />
        )}
      </div>

      <div className="two-col" style={{ marginTop: 24 }}>
        <Card>
          <div className="row" style={{ marginBottom: 6 }}>
            <div className="t-subtitle" style={{ flex: 1 }}>
              {isCEO ? "Jam Kerja Tim Hari Ini" : "Jam Kerja Saya Hari Ini"}
            </div>
            <span className="pulse-dot" />
          </div>
          <div className="hr" style={{ margin: "6px 0 4px" }} />
          {team.length === 0
            ? <div className="dim t-caption" style={{ padding: "12px 0" }}>Memuat data...</div>
            : teamDisplay.length === 0
              ? <div className="dim t-caption" style={{ padding: "12px 0" }}>Data belum tersedia</div>
              : teamDisplay.map((p) => <TeamHourRow key={p.userId || p.first} p={p} />)}
        </Card>

        <Card>
          <div className="t-subtitle" style={{ marginBottom: 4 }}>7 Hari Terakhir</div>
          <div className="dim t-caption" style={{ marginBottom: 8 }}>
            {isCEO ? "Total jam kerja tim per hari" : "Total jam kerja tim per hari"}
          </div>
          {week.length > 0
            ? <AnimatedBars data={week} max={Math.max(...week.map((d) => d.v), 1)} />
            : <div className="dim t-caption" style={{ padding: "20px 0" }}>Memuat grafik...</div>}
        </Card>
      </div>
    </div>
  );
};

/* ---------- MY TODO ---------- */
const RunningTodoCard = ({ todo }) => {
  const { elapsed, pauseTimer, startTodo, finishTodo, go } = useApp();
  const live = !!todo.running;
  useTicker(live);
  const sec = elapsed(todo);
  const pct = Math.min(100, Math.round((sec / (todo.est * 3600)) * 100));
  return (
    <Card hover style={{ borderColor: live ? "color-mix(in srgb, var(--accent) 35%, var(--stroke))" : "var(--stroke)" }}>
      <div className="row gap8" style={{ marginBottom: 12 }}>
        {live ? <Icons.Refresh size={15} className="spin accent-text" /> : <Icons.Pause size={14} className="dim2" />}
        <span className={`t-caption ${live ? "accent-text" : "dim2"}`} style={{ fontWeight: 700, letterSpacing: ".05em" }}>
          {live ? "SEDANG BERJALAN" : "DIJEDA"}
        </span>
        <div className="spacer" />
        <Badge kind="approved" />
      </div>
      <div className="row" style={{ alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="t-body-lg" style={{ fontWeight: 600, cursor: "pointer" }} onClick={() => go("detail", todo.id)}>{todo.title}</div>
          <div className="dim t-caption" style={{ marginTop: 4 }}>
            {todo.startedAt && <>Mulai {todo.startedAt} &nbsp;·&nbsp;</>}Estimasi {todo.est} jam
          </div>
          <div className="mt12" style={{ maxWidth: 320 }}>
            <ProgressBar value={pct} max={100} thick />
            <div className="row" style={{ justifyContent: "space-between", marginTop: 4 }}>
              <span className="t-caption dim2">{pct}%</span>
            </div>
          </div>
        </div>
        <div className="col" style={{ alignItems: "flex-end", gap: 4 }}>
          <div className={`timer-face ${live ? "accent-text" : ""}`}
               style={{ fontSize: 30, color: live ? undefined : "var(--text-secondary)" }}>
            {window.TF.fmtClock(sec)}
          </div>
        </div>
      </div>
      <div className="row gap12" style={{ marginTop: 16 }}>
        {live
          ? <Btn icon={<Icons.Pause size={15} />} onClick={() => pauseTimer(todo.id)}>Pause</Btn>
          : <Btn icon={<Icons.Play size={14} />} onClick={() => startTodo(todo.id)}>Lanjutkan</Btn>}
        <Btn variant="accent" icon={<Icons.Check size={16} />} onClick={() => finishTodo(todo.id)}>Selesai</Btn>
        <div className="spacer" />
        <Btn variant="subtle" icon={<Icons.ChevronRight size={15} />} onClick={() => go("detail", todo.id)}>Detail</Btn>
      </div>
    </Card>
  );
};

const QueueCard = ({ todo }) => {
  const { startTodo, go, openEdit } = useApp();
  const rejected = todo.state === "rejected";
  return (
    <Card hover>
      <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="row gap8">
            <span className="t-body-strong">{todo.title}</span>
            <Badge kind={rejected ? "rejected" : "approved"} />
          </div>
          <div className="dim t-caption" style={{ marginTop: 4 }}>Estimasi {todo.est} jam</div>
          {rejected && (
            <div className="muted-box mt12" style={{ borderColor: "rgba(196,43,28,.28)" }}>
              <div className="row gap8"><Icons.XCircle size={14} style={{ color: "#c42b1c" }} />
                <span className="t-caption" style={{ color: "#c42b1c", fontWeight: 600 }}>Ditolak</span></div>
              {todo.rejectNote && <div className="t-caption dim" style={{ marginTop: 4 }}>"{todo.rejectNote}"</div>}
            </div>
          )}
        </div>
        <div className="col gap8" style={{ alignItems: "flex-end" }}>
          {rejected
            ? <Btn icon={<Icons.Edit size={14} />} onClick={() => openEdit(todo)}>Edit &amp; Resubmit</Btn>
            : <Btn variant="accent" icon={<Icons.Play size={14} />} onClick={() => startTodo(todo.id)}>Start</Btn>}
        </div>
      </div>
    </Card>
  );
};

const MyTodo = () => {
  const { todos, openAdd, hoursUsed } = useApp();
  const ongoingList = todos.filter((t) => t.state === "ongoing");
  const waiting = todos.filter((t) => t.state === "waiting");
  const queue = todos.filter((t) => t.state === "queue" || t.state === "rejected");
  const done = todos.filter((t) => t.state === "done");
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="content-pad page-enter">
      <div className="row" style={{ alignItems: "flex-end", marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div className="t-title">My Todo</div>
          <div className="dim" style={{ marginTop: 2 }}>{today}</div>
        </div>
        <Btn variant="accent" icon={<Icons.Plus size={16} />} onClick={openAdd}>Tambah Todo</Btn>
      </div>

      <Card style={{ marginBottom: 4 }}>
        <div className="row gap16">
          <Icons.Clock size={20} className="dim" />
          <div style={{ flex: 1 }}>
            <div className="row" style={{ marginBottom: 6 }}>
              <span className="t-body-strong" style={{ flex: 1 }}>Sisa jam hari ini</span>
              <span className="dim t-caption">{hoursUsed}/8 jam terpakai</span>
            </div>
            <ProgressBar value={hoursUsed} max={8} thick variant={hoursUsed >= 8 ? "warn" : ""} />
          </div>
        </div>
      </Card>

      {ongoingList.length > 0 && <>
        <SectionLabel><Icons.Refresh size={13} /> Sedang Berjalan</SectionLabel>
        <div className="col" style={{ gap: 12 }}>{ongoingList.map((t) => <RunningTodoCard key={t.id} todo={t} />)}</div>
      </>}

      {waiting.length > 0 && <>
        <SectionLabel><Icons.Hourglass size={13} /> Menunggu Approval ({waiting.length})</SectionLabel>
        <div className="col" style={{ gap: 12 }}>
          {waiting.map((t) => (
            <Card key={t.id} hover>
              <div className="row" style={{ alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div className="row gap8"><span className="t-body-strong">{t.title}</span><Badge kind="waiting" /></div>
                  <div className="dim t-caption" style={{ marginTop: 4 }}>
                    Diajukan {t.submittedAt} &nbsp;·&nbsp; Batas approve {t.deadline} &nbsp;·&nbsp; Est {t.est} jam
                    {t.overtime && <span className="badge over" style={{ marginLeft: 6 }}><Icons.Warning size={11} />Overtime</span>}
                  </div>
                </div>
                <div className="muted-box t-caption dim" style={{ padding: "6px 10px" }}>Auto-approve ⚡ 09:00</div>
              </div>
            </Card>
          ))}
        </div>
      </>}

      {queue.length > 0 && <>
        <SectionLabel><Icons.Flag size={13} /> Antrian</SectionLabel>
        <div className="col" style={{ gap: 12 }}>{queue.map((t) => <QueueCard key={t.id} todo={t} />)}</div>
      </>}

      <SectionLabel><Icons.CheckCircle size={13} /> Selesai Hari Ini ({done.length})</SectionLabel>
      {done.length === 0
        ? <Card><div className="dim t-caption">Belum ada todo selesai hari ini.</div></Card>
        : <Card pad={false}>
            {done.map((t, i) => (
              <div key={t.id} className="row gap12" style={{ padding: "12px 18px", borderTop: i ? "1px solid var(--divider)" : "none" }}>
                <Icons.CheckCircle size={17} style={{ color: "#0f7b3f" }} />
                <span className="t-body-strong" style={{ flex: 1 }}>{t.title}</span>
                <span className="dim t-caption">{t.est} jam</span>
                <span className="dim2 t-caption" style={{ width: 110, textAlign: "right" }}>{t.range}</span>
              </div>
            ))}
          </Card>}
    </div>
  );
};

/* ---------- TODO DETAIL + TIMER ---------- */
const TodoDetail = () => {
  const { todos, routeParam, go, pauseTimer, startTodo, finishTodo, elapsed } = useApp();
  const todo = todos.find((t) => t.id === routeParam) || todos.find((t) => t.state === "ongoing");
  const running = todo && todo.running;
  useTicker(!!running);
  if (!todo) return <div className="content-pad page-enter"><Card>Todo tidak ditemukan.</Card></div>;
  const sec = elapsed(todo);
  const pct = Math.min(100, Math.round((sec / (todo.est * 3600)) * 100));
  const stateLabel = running ? "SEDANG BERJALAN" : todo.state === "done" ? "SELESAI" : "DIJEDA";
  const meta = [
    { Icon: Icons.Calendar, k: "Dibuat", v: `Hari ini — ${todo.createdAt || "—"}` },
    { Icon: Icons.Play, k: "Mulai", v: todo.startedAt || "—" },
    { Icon: Icons.Clock, k: "Estimasi", v: `${todo.est} jam` },
    { Icon: Icons.Flag, k: "Target Selesai", v: todo.target || "09:00" },
  ];
  return (
    <div className="content-pad page-enter" style={{ maxWidth: 860 }}>
      <Btn variant="subtle" icon={<Icons.ArrowLeft size={16} />} onClick={() => go("mytodo")} style={{ marginBottom: 16, marginLeft: -8 }}>
        Kembali ke My Todo
      </Btn>

      <div className="row gap8" style={{ marginBottom: 10 }}>
        {running && <Icons.Refresh size={15} className="spin accent-text" />}
        <span className="t-caption accent-text" style={{ fontWeight: 700, letterSpacing: ".05em" }}>{stateLabel}</span>
        <div className="spacer" />
        <Badge kind="approved" />
      </div>
      <div className="t-title-lg">{todo.title}</div>
      {todo.desc && <p className="dim" style={{ maxWidth: 600, marginTop: 8, lineHeight: 1.5 }}>{todo.desc}</p>}

      <div className="card" style={{ marginTop: 20, padding: 0, display: "grid", gridTemplateColumns: "repeat(2,1fr)" }}>
        {meta.map((m, i) => (
          <div key={i} className="row gap12" style={{ padding: "14px 18px",
            borderTop: i > 1 ? "1px solid var(--divider)" : "none",
            borderLeft: i % 2 ? "1px solid var(--divider)" : "none" }}>
            <m.Icon size={17} className="dim2" />
            <div className="col"><span className="t-caption dim2">{m.k}</span><span className="t-body-strong">{m.v}</span></div>
          </div>
        ))}
      </div>

      {/* big timer */}
      <Card style={{ marginTop: 20, textAlign: "center", padding: "34px 24px",
        background: "color-mix(in srgb, var(--accent) 7%, var(--card))",
        borderColor: "color-mix(in srgb, var(--accent) 28%, var(--stroke))" }}>
        <div className="timer-face accent-text timer-lg">{window.TF.fmtHMS(sec)}</div>
        <div className="row gap8" style={{ justifyContent: "center", marginTop: 4 }}>
          {running && <span className="pulse-dot" />}
          <span className="t-caption dim" style={{ fontWeight: 600, letterSpacing: ".06em" }}>{stateLabel}</span>
        </div>
        <div style={{ maxWidth: 420, margin: "22px auto 0" }}>
          <ProgressBar value={pct} max={100} thick variant={pct >= 100 ? "full" : ""} />
          <div className="t-caption dim2" style={{ marginTop: 6 }}>Progress {pct}% dari estimasi {todo.est} jam</div>
        </div>
      </Card>

      {todo.state !== "done" && (
        <div className="row gap12" style={{ marginTop: 16 }}>
          {running
            ? <Btn size="lg" icon={<Icons.Pause size={16} />} onClick={() => pauseTimer(todo.id)} style={{ flex: "0 0 auto" }}>Pause</Btn>
            : <Btn size="lg" variant="accent" icon={<Icons.Play size={15} />} onClick={() => startTodo(todo.id)} style={{ flex: "0 0 auto" }}>Lanjutkan</Btn>}
          <Btn size="lg" variant="accent" block icon={<Icons.Check size={17} />} onClick={() => finishTodo(todo.id)}>Tandai Selesai</Btn>
        </div>
      )}

      <SectionLabel><Icons.Clock size={13} /> Riwayat Sesi</SectionLabel>
      <Card pad={false}>
        {(todo.sessions || []).length === 0
          ? <div style={{ padding: "14px 18px" }} className="dim t-caption">Belum ada sesi tercatat.</div>
          : (todo.sessions || []).map((s, i) => (
            <div key={i} className="row gap12" style={{ padding: "12px 18px", borderTop: i ? "1px solid var(--divider)" : "none" }}>
              <span style={{ color: s.type === "run" ? "var(--accent)" : "var(--text-tertiary)" }}>
                {s.type === "run" ? <Icons.Play size={13} /> : <Icons.Pause size={13} />}
              </span>
              <span className="t-body-strong" style={{ width: 150 }}>{s.from} → {s.to}</span>
              <span className="dim t-caption">{s.note}</span>
            </div>
          ))}
      </Card>
    </div>
  );
};

Object.assign(window, { LoginPage, Dashboard, MyTodo, TodoDetail, AnimatedBars });
