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
  const myHoursApproved = myTeamRow?.approved ?? 0;
  const teamDisplay = isCEO ? team : (myTeamRow ? [myTeamRow] : []);

  const teamWeekTotal = Math.round(week.reduce((s, d) => s + d.v, 0) * 10) / 10;

  return (
    <div className="content-pad page-enter">
      <div className="row" style={{ alignItems: "flex-end", marginBottom: 22 }}>
        <div>
          <div className="t-title">Dashboard</div>
          <div className="dim" style={{ marginTop: 2 }}>{today}</div>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label={isCEO ? "Total Anggota" : "Anggota Aktif"} value={totalMembers} sub="pengguna aktif" Icon={Icons.Users3} tone="var(--accent)" />
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
            label="Jam Kerja Saya Hari Ini"
            value={`${myHoursApproved}j`}
            sub="jam disetujui hari ini"
            Icon={Icons.Clock}
            tone="var(--accent)"
          />
        )}
        {!isCEO && (
          <StatCard
            label="Total Kerja Tim 7 Hari"
            value={`${teamWeekTotal}j`}
            sub="seluruh tim, 7 hari terakhir"
            Icon={Icons.Chart}
            tone="#2b9d6b"
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
  const { elapsed, pauseTimer, startTodo, finishTodo, go, setDeferDialog } = useApp();
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
        <Btn variant="subtle" icon={<Icons.Hourglass size={14} />}
             onClick={() => setDeferDialog({ id: todo.id, title: todo.title })}
             title="Tangguhkan ke hari berikutnya" style={{ fontSize: 12 }}>Tangguhkan</Btn>
        <Btn variant="subtle" icon={<Icons.ChevronRight size={15} />} onClick={() => go("detail", todo.id)}>Detail</Btn>
      </div>
    </Card>
  );
};

const QueueCard = ({ todo }) => {
  const { startTodo, go, openEdit, carryOverTodo, setDeferDialog } = useApp();
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
            : <>
                <Btn variant="accent" icon={<Icons.Play size={14} />} onClick={() => startTodo(todo.id)}>Start</Btn>
                <Btn icon={<Icons.ArrowRight size={14} />} onClick={() => carryOverTodo(todo.id)}
                     title="Pindahkan ke hari kerja berikutnya" style={{ fontSize: 12 }}>Teruskan ke Besok</Btn>
                <Btn icon={<Icons.Hourglass size={13} />}
                     onClick={() => setDeferDialog({ id: todo.id, title: todo.title })}
                     title="Tangguhkan — tidak bisa dikerjakan hari ini" style={{ fontSize: 12 }}>Tangguhkan</Btn>
              </>}
        </div>
      </div>
    </Card>
  );
};

const MyTodo = () => {
  const { todos, openAdd, hoursUsed, archiveTodo, go, pendingMemberCount,
          todoDate, todayDate, setTodoDate, carryOverTodo } = useApp();
  const ongoingList = todos.filter((t) => t.state === "ongoing");
  const queue = todos.filter((t) => t.state === "queue");
  const done = todos.filter((t) => t.state === "done");
  const deferred = todos.filter((t) => t.state === "deferred");
  const isToday = todoDate === todayDate;
  const dateLabel = isToday
    ? new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : new Date(todoDate + "T12:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="content-pad page-enter">
      <div className="row" style={{ alignItems: "flex-end", marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div className="t-title">My Todo</div>
          <div className="dim" style={{ marginTop: 2 }}>{dateLabel}</div>
        </div>
        <div className="row gap12 wrap">
          <div className="row gap8" style={{ alignItems: "center" }}>
            <input
              type="date"
              className="tbx"
              value={todoDate}
              max={todayDate}
              onChange={(e) => e.target.value && setTodoDate(e.target.value)}
              style={{ width: 148, fontSize: 13 }}
            />
            {!isToday && (
              <Btn size="sm" variant="subtle" onClick={() => setTodoDate(todayDate)} style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                ← Hari Ini
              </Btn>
            )}
          </div>
          {isToday && <Btn variant="accent" icon={<Icons.Plus size={16} />} onClick={openAdd}>Tambah Todo</Btn>}
        </div>
      </div>

      {isToday && (
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
      )}

      {isToday && pendingMemberCount > 0 && (
        <div className="muted-box row gap8" style={{ marginBottom: 8, cursor: "pointer" }} onClick={() => go("pending")}>
          <Icons.Hourglass size={14} style={{ color: "#c8650a" }} />
          <span className="t-caption" style={{ flex: 1 }}>
            {pendingMemberCount} todo menunggu approval / ditolak
          </span>
          <span className="t-caption accent-text">Lihat →</span>
        </div>
      )}

      {ongoingList.length > 0 && <>
        <SectionLabel><Icons.Refresh size={13} /> Sedang Berjalan</SectionLabel>
        <div className="col" style={{ gap: 12 }}>{ongoingList.map((t) => <RunningTodoCard key={t.id} todo={t} />)}</div>
      </>}

      {queue.length > 0 && <>
        <SectionLabel><Icons.Flag size={13} /> Antrian Siap Dikerjakan</SectionLabel>
        <div className="col" style={{ gap: 12 }}>{queue.map((t) => <QueueCard key={t.id} todo={t} />)}</div>
      </>}

      {deferred.length > 0 && <>
        <SectionLabel><Icons.Hourglass size={13} /> Ditangguhkan ({deferred.length})</SectionLabel>
        <div className="col" style={{ gap: 12 }}>
          {deferred.map((t) => (
            <Card key={t.id} hover>
              <div className="row gap12" style={{ alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div className="row gap8">
                    <span className="t-body-strong">{t.title}</span>
                    <Badge kind="deferred" />
                  </div>
                  <div className="dim t-caption" style={{ marginTop: 4 }}>Estimasi {t.est} jam</div>
                  {t.deferReason && (
                    <div className="muted-box mt12">
                      <div className="t-caption dim2" style={{ fontStyle: "italic" }}>"{t.deferReason}"</div>
                    </div>
                  )}
                </div>
                <Btn icon={<Icons.ArrowRight size={14} />} onClick={() => carryOverTodo(t.id)}
                     title="Aktifkan ulang ke hari kerja berikutnya" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                  Aktifkan Ulang
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      </>}

      <SectionLabel><Icons.CheckCircle size={13} /> Selesai {isToday ? "Hari Ini" : ""} ({done.length})</SectionLabel>
      {done.length === 0
        ? <Card><div className="dim t-caption">Belum ada todo selesai{isToday ? " hari ini" : ""}.</div></Card>
        : <Card pad={false}>
            {done.map((t, i) => (
              <div key={t.id} className="row gap12" style={{ padding: "12px 18px", borderTop: i ? "1px solid var(--divider)" : "none", alignItems: "center" }}>
                <Icons.CheckCircle size={17} style={{ color: "#0f7b3f" }} />
                <span className="t-body-strong" style={{ flex: 1 }}>{t.title}</span>
                <span className="dim t-caption">{t.est} jam</span>
                <span className="dim2 t-caption" style={{ width: 110, textAlign: "right" }}>{t.range}</span>
                {isToday && (
                  <Btn size="sm" icon={<Icons.Archive size={13} />} onClick={() => archiveTodo(t.id)}
                       style={{ marginLeft: 8 }} title="Arsipkan todo">Arsipkan</Btn>
                )}
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

/* ---------- MENUNGGU APPROVAL ---------- */
const PendingApproval = () => {
  const { todos, openEdit, deleteTodo, carryOverTodo, routeParam } = useApp();
  const waiting = todos.filter((t) => t.state === "waiting");
  const rejected = todos.filter((t) => t.state === "rejected");
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const highlight = (id) => routeParam === id
    ? { outline: "2px solid var(--accent)", outlineOffset: 2, borderRadius: 8 }
    : {};

  return (
    <div className="content-pad page-enter">
      <div className="row" style={{ alignItems: "flex-end", marginBottom: 18 }}>
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
            <Card key={t.id} hover style={highlight(t.id)}>
              <div className="row" style={{ alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div className="row gap8"><span className="t-body-strong">{t.title}</span><Badge kind="waiting" /></div>
                  <div className="dim t-caption" style={{ marginTop: 4 }}>
                    Diajukan {t.submittedAt} &nbsp;·&nbsp; Est {t.est} jam
                    {t.overtime && <span className="badge over" style={{ marginLeft: 6 }}><Icons.Warning size={11} />Overtime</span>}
                  </div>
                </div>
                <div className="col gap8" style={{ alignItems: "flex-end" }}>
                  <div className="muted-box t-caption dim" style={{ padding: "6px 10px" }}>Auto-approve ⚡ 09:00</div>
                  <Btn icon={<Icons.ArrowRight size={13} />} onClick={() => carryOverTodo(t.id)}
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
            <Card key={t.id} hover style={highlight(t.id)}>
              <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div className="row gap8">
                    <span className="t-body-strong">{t.title}</span>
                    <Badge kind="rejected" />
                  </div>
                  <div className="dim t-caption" style={{ marginTop: 4 }}>Estimasi {t.est} jam</div>
                  <div className="muted-box mt12" style={{ borderColor: "rgba(196,43,28,.28)" }}>
                    <div className="row gap8"><Icons.XCircle size={14} style={{ color: "#c42b1c" }} />
                      <span className="t-caption" style={{ color: "#c42b1c", fontWeight: 600 }}>Ditolak</span></div>
                    {t.rejectNote && <div className="t-caption dim" style={{ marginTop: 4 }}>"{t.rejectNote}"</div>}
                  </div>
                </div>
                <div className="col gap8" style={{ alignItems: "flex-end" }}>
                  <Btn icon={<Icons.Edit size={14} />} onClick={() => openEdit(t)}>Edit &amp; Resubmit</Btn>
                  <Btn variant="subtle" icon={<Icons.Trash size={14} />} onClick={() => deleteTodo(t.id)}
                       style={{ color: "#c42b1c" }}>Hapus</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>}
    </div>
  );
};

/* ---------- SELESAI (ARSIP) ---------- */
const Selesai = () => {
  const { archived } = useApp();
  return (
    <div className="content-pad page-enter">
      <div className="row" style={{ alignItems: "flex-end", marginBottom: 18 }}>
        <div>
          <div className="t-title">Selesai</div>
          <div className="dim" style={{ marginTop: 2 }}>Todo yang sudah diarsipkan</div>
        </div>
      </div>

      {archived.length === 0 && (
        <Card><div className="dim t-caption">Belum ada todo yang diarsipkan. Selesaikan todo lalu klik "Arsipkan".</div></Card>
      )}

      {archived.length > 0 && (
        <Card pad={false}>
          {archived.map((t, i) => (
            <div key={t.id} className="row gap12" style={{ padding: "13px 18px", borderTop: i ? "1px solid var(--divider)" : "none", alignItems: "center" }}>
              <Icons.Archive size={16} style={{ color: "#0f7b3f", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="t-body-strong">{t.title}</div>
                {t.desc && <div className="dim t-caption" style={{ marginTop: 2 }}>{t.desc}</div>}
              </div>
              <span className="dim t-caption">{t.est} jam</span>
              <span className="dim2 t-caption" style={{ width: 110, textAlign: "right" }}>{t.range || t.createdAt || ""}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

/* ---------- BANTUAN (HELP) ---------- */
const FAQ_ITEMS = [
  {
    q: 'Apa itu status "Menunggu Approval"?',
    a: 'Todo yang kamu ajukan sedang menunggu persetujuan CEO. Todo belum bisa dimulai sampai disetujui. Jika CEO tidak merespons sebelum batas waktu yang dikonfigurasi, todo akan otomatis disetujui (auto-approve).',
  },
  {
    q: 'Apa yang terjadi jika todo ditolak CEO?',
    a: 'Todo yang ditolak muncul di halaman "Menunggu Approval" dengan alasan penolakan. Kamu bisa klik "Edit & Resubmit" untuk memperbaiki dan mengajukan ulang, atau klik "Hapus" untuk menghapus todo tersebut.',
  },
  {
    q: 'Bisakah saya mengubah todo yang sudah diajukan?',
    a: 'Hanya todo yang berstatus Ditolak yang bisa diubah, dengan fitur "Edit & Resubmit". Todo yang sedang menunggu atau sudah disetujui tidak bisa diedit secara langsung.',
  },
  {
    q: 'Apa itu Overtime?',
    a: 'Jika total estimasi jam todo kamu dalam satu hari melebihi 8 jam, todo tersebut akan masuk kategori Overtime. Todo overtime memerlukan approval khusus dari CEO dan ditandai dengan label oranye.',
  },
  {
    q: 'Apa itu Auto-approve?',
    a: 'Jika CEO belum merespons todo kamu sebelum batas waktu yang telah dikonfigurasi (default pukul 09:00 WIB), sistem akan otomatis menyetujui todo tersebut. Ini memastikan pekerjaanmu tidak tertunda.',
  },
  {
    q: 'Bagaimana cara mengarsipkan todo yang selesai?',
    a: 'Setelah todo berstatus Selesai (DONE), kamu bisa klik tombol "Arsipkan" di samping todo tersebut di halaman My Todo. Todo yang diarsipkan akan tersimpan di halaman "Selesai" dan tidak muncul lagi di My Todo.',
  },
  {
    q: 'Apa itu "Teruskan ke Besok"?',
    a: 'Tombol ini memindahkan todo yang sudah disetujui tapi belum dikerjakan ke hari kerja berikutnya. Berguna jika kamu tidak sempat mengerjakan todo hari ini dan ingin melanjutkannya besok.',
  },
  {
    q: 'Kenapa saya tidak bisa mengajukan todo di akhir pekan?',
    a: 'TeamFlow hanya mendukung hari kerja (Senin–Jumat). Pengajuan todo di Sabtu atau Minggu akan ditolak otomatis oleh sistem untuk memastikan manajemen waktu kerja yang sehat.',
  },
  {
    q: 'Berapa batas maksimum jam kerja per hari?',
    a: 'Batas normal adalah 8 jam per hari. Kamu bisa mengajukan lebih dari itu, namun todo akan dikategorikan sebagai Overtime dan memerlukan persetujuan khusus dari CEO.',
  },
  {
    q: 'Apakah saya bisa melihat todo hari-hari sebelumnya?',
    a: 'Ya! Di halaman My Todo terdapat filter tanggal di pojok kanan atas. Pilih tanggal lain untuk melihat todo di hari tersebut. Default-nya adalah hari ini.',
  },
];

const Help = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const STEPS = [
    { n: 1, title: "Buka halaman My Todo", desc: "Klik menu My Todo di navigasi kiri." },
    { n: 2, title: 'Klik tombol "Tambah Todo"', desc: "Tombol biru di pojok kanan atas halaman My Todo." },
    { n: 3, title: "Isi Judul Todo", desc: "Masukkan judul singkat yang menggambarkan pekerjaan, misalnya: \"Desain halaman login\"." },
    { n: 4, title: "Tulis Deskripsi (min. 10 kata)", desc: "Jelaskan secara detail apa yang akan dikerjakan, langkah-langkahnya, tools yang digunakan, dan hasil yang diharapkan. Deskripsi minimal 10 kata agar CEO bisa menilai kelayakannya." },
    { n: 5, title: "Pilih Estimasi Waktu", desc: "Pilih durasi pengerjaan: 0.5 / 1 / 1.5 / 2 jam. Pastikan total jam hari ini tidak melebihi 8 jam (kecuali izin overtime)." },
    { n: 6, title: 'Klik "Ajukan"', desc: "Todo dikirim ke CEO untuk disetujui. Kamu bisa mulai mengerjakan setelah disetujui." },
  ];

  const RULES = [
    { icon: Icons.Clock, color: "#c8650a", title: "Batas 8 Jam/Hari", desc: "Total estimasi todo dalam satu hari maksimal 8 jam. Lebih dari itu = Overtime, butuh approval khusus." },
    { icon: Icons.Flag, color: "var(--accent)", title: "Deskripsi Minimal 10 Kata", desc: "Setiap todo wajib memiliki deskripsi yang jelas agar CEO dapat menilai keperluan dan urgensinya." },
    { icon: Icons.Hourglass, color: "#2b9d6b", title: "Auto-approve Sesuai Batas", desc: "Jika CEO tidak merespons sebelum batas waktu (dikonfigurasi di Settings CEO), todo otomatis disetujui." },
    { icon: Icons.Calendar, color: "#5e3d89", title: "Hanya Hari Kerja (Sen–Jum)", desc: "Pengajuan todo hanya bisa dilakukan di hari kerja. Akhir pekan ditolak otomatis oleh sistem." },
  ];

  return (
    <div className="content-pad page-enter" style={{ maxWidth: 780 }}>
      <div className="t-title" style={{ marginBottom: 4 }}>Bantuan &amp; Panduan</div>
      <div className="dim" style={{ marginBottom: 24 }}>Panduan penggunaan TeamFlow untuk anggota tim</div>

      {/* Section 1 — Steps */}
      <SectionLabel><Icons.Tasks size={13} /> Cara Menambahkan Todo</SectionLabel>
      <Card>
        <div className="col" style={{ gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} className="row gap14" style={{
              padding: "14px 0",
              borderTop: i ? "1px solid var(--divider)" : "none",
            }}>
              <div style={{
                flexShrink: 0, width: 32, height: 32, borderRadius: "50%",
                background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                color: "var(--accent)", display: "grid", placeItems: "center",
                fontWeight: 700, fontSize: 14,
              }}>{s.n}</div>
              <div>
                <div className="t-body-strong">{s.title}</div>
                <div className="dim t-caption" style={{ marginTop: 3 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 2 — Rules */}
      <SectionLabel><Icons.Info size={13} /> Aturan &amp; Ketentuan</SectionLabel>
      <div className="stat-grid" style={{ marginBottom: 0 }}>
        {RULES.map((r, i) => (
          <Card key={i} hover>
            <div className="row gap12" style={{ marginBottom: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center",
                color: r.color, background: `color-mix(in srgb, ${r.color} 14%, transparent)`,
                flexShrink: 0,
              }}><r.icon size={18} /></div>
              <span className="t-body-strong" style={{ alignSelf: "center" }}>{r.title}</span>
            </div>
            <p className="dim t-caption" style={{ margin: 0, lineHeight: 1.5 }}>{r.desc}</p>
          </Card>
        ))}
      </div>

      {/* Section 3 — FAQ */}
      <SectionLabel><Icons.Bolt size={13} /> Tanya Jawab (FAQ)</SectionLabel>
      <div className="col" style={{ gap: 6 }}>
        {FAQ_ITEMS.map((item, i) => (
          <Card key={i} pad={false} style={{ overflow: "hidden" }}>
            <div className="row gap12 reveal" style={{ padding: "14px 18px", cursor: "pointer" }}
                 onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <Icons.ChevronRight size={15} className="dim2" style={{
                transform: openFaq === i ? "rotate(90deg)" : "none",
                transition: "transform .18s",
                flexShrink: 0,
              }} />
              <span className="t-body-strong" style={{ flex: 1 }}>{item.q}</span>
            </div>
            {openFaq === i && (
              <div style={{ padding: "0 18px 16px 45px", borderTop: "1px solid var(--divider)" }}>
                <p className="dim t-caption" style={{ margin: "12px 0 0", lineHeight: 1.6 }}>{item.a}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="muted-box mt16 row gap8" style={{ alignItems: "flex-start" }}>
        <Icons.Info size={14} className="accent-text" style={{ marginTop: 1, flexShrink: 0 }} />
        <span className="t-caption dim">
          Jika masih ada pertanyaan atau menemukan masalah, hubungi CEO atau admin tim kamu.
        </span>
      </div>
    </div>
  );
};

Object.assign(window, { LoginPage, Dashboard, MyTodo, TodoDetail, AnimatedBars, PendingApproval, Selesai, Help });
