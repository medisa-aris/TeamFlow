/* ============================================================
   TeamFlow — pages 2: Approval, Users, Laporan, Settings, AddTodo
   ============================================================ */

/* ---------- shared helpers ---------- */
function validatePw(pw) {
  if (!pw) return null;
  if (pw.length < 8) return "Minimal 8 karakter";
  if (!/[A-Z]/.test(pw)) return "Harus ada huruf kapital";
  if (!/[0-9]/.test(pw)) return "Harus ada angka";
  return null;
}

/* ---------- ADD / EDIT TODO PANEL ---------- */
const MIN_DESC_WORDS = 20;
function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

const AddTodoPanel = () => {
  const { addPanel, closeAdd, submitTodo, hoursUsed, isCEO, users, systemConfig } = useApp();
  const deadlineHour = systemConfig?.approvalDeadlineHour ?? 9;
  const deadlineLabel = `${String(deadlineHour).padStart(2, "0")}:00`;
  const editing = addPanel.mode === "edit";
  const [title, setTitle] = useState(addPanel.todo?.title || "");
  const [desc, setDesc] = useState(addPanel.todo?.desc || "");
  const [est, setEst] = useState(addPanel.todo?.est || 0.5);
  const [descTouched, setDescTouched] = useState(false);
  const [targetMemberId, setTargetMemberId] = useState("");

  const members = (users || []).filter((u) => u.role === "Member" || u.role === "MEMBER");

  const remaining = Math.max(0, 8 - hoursUsed);
  const projected = hoursUsed + Number(est);
  const over = projected > 8;

  const wordCount = countWords(desc);
  const descOk = wordCount >= MIN_DESC_WORDS;
  const descWarn = descTouched && !descOk;
  const memberOk = !isCEO || !!targetMemberId;
  const valid = title.trim().length > 0 && descOk && memberOk;

  const panelTitle = isCEO
    ? "Buat Todo untuk Anggota"
    : editing ? "Edit & Resubmit" : "Tambah Todo Baru";

  return (
    <Panel
      title={panelTitle}
      icon={<span style={{ color: "var(--accent)" }}>{editing ? <Icons.Edit size={20} /> : <Icons.Plus size={20} />}</span>}
      onClose={closeAdd}
      footer={<>
        <Btn onClick={closeAdd}>Batal</Btn>
        <Btn variant="accent" disabled={!valid} icon={<Icons.ArrowRight size={15} />}
             onClick={() => submitTodo({ ...addPanel.todo, title: title.trim(), desc, est: Number(est), targetMemberId: isCEO ? targetMemberId : undefined }, editing)}>
          {isCEO ? "Buat Todo" : editing ? "Resubmit" : "Ajukan"}
        </Btn>
      </>}
    >
      {isCEO && (
        <Field label="Anggota" req hint="Pilih anggota yang akan mendapat todo ini">
          <Select value={targetMemberId} onChange={(e) => setTargetMemberId(e.target.value)}>
            <option value="">— Pilih anggota —</option>
            {members.map((u) => <option key={u.id} value={u.id}>{u.name || u.first}</option>)}
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
          style={descWarn ? { borderColor: "#c8650a", boxShadow: "0 0 0 2px rgba(200,101,10,.2)" } : {}}
        />
        <div className="row gap8 mt4" style={{ justifyContent: "space-between" }}>
          {descWarn ? (
            <div className="row gap6" style={{ color: "#c8650a", fontSize: 12 }}>
              <Icons.Warning size={13} />
              <span>Deskripsi terlalu singkat — perlu {MIN_DESC_WORDS - wordCount} kata lagi</span>
            </div>
          ) : descOk ? (
            <div className="row gap6" style={{ color: "#0f7b3f", fontSize: 12 }}>
              <Icons.CheckCircle size={13} />
              <span>Deskripsi cukup detail</span>
            </div>
          ) : (
            <span />
          )}
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
          <div className="muted-box" style={{ borderColor: over ? "rgba(200,95,10,.35)" : "var(--stroke)" }}>
            <div className="row gap8">
              <Icons.Clock size={15} className="dim" />
              <span className="t-caption" style={{ flex: 1 }}>Sisa jam hari ini</span>
              <span className="t-body-strong">{remaining} jam</span>
            </div>
            <div className="mt8"><ProgressBar value={projected} max={8} variant={over ? "warn" : ""} /></div>
            <div className="row gap8 mt8">
              {over
                ? <><Icons.Warning size={14} style={{ color: "#c8650a" }} /><span className="t-caption" style={{ color: "#c8650a" }}>Overtime — {projected}/8 jam, perlu approval khusus CEO</span></>
                : <><Icons.CheckCircle size={14} style={{ color: "#0f7b3f" }} /><span className="t-caption" style={{ color: "#0f7b3f" }}>Dalam batas normal — {projected}/8 jam</span></>}
            </div>
          </div>
          <div className="muted-box mt16" style={{ background: "color-mix(in srgb, var(--accent) 7%, transparent)", borderColor: "color-mix(in srgb, var(--accent) 22%, transparent)" }}>
            <div className="row gap8" style={{ alignItems: "flex-start" }}>
              <Icons.Info size={15} className="accent-text" style={{ marginTop: 1 }} />
              <span className="t-caption dim">Todo dikirim ke CEO untuk approval. Auto-approve ⚡ jika CEO belum merespons sebelum <b>{deadlineLabel}</b>.</span>
            </div>
          </div>
        </>
      )}

      {isCEO && (
        <div className="muted-box mt16" style={{ background: "color-mix(in srgb, var(--accent) 7%, transparent)", borderColor: "color-mix(in srgb, var(--accent) 22%, transparent)" }}>
          <div className="row gap8" style={{ alignItems: "flex-start" }}>
            <Icons.Info size={15} className="accent-text" style={{ marginTop: 1 }} />
            <span className="t-caption dim">Todo akan langsung auto-approved ⚡ dan anggota akan mendapat notifikasi.</span>
          </div>
        </div>
      )}
    </Panel>
  );
};

/* ---------- APPROVAL QUEUE ---------- */
const ApprovalCard = ({ item, onDecision }) => {
  const [note, setNote] = useState("");
  return (
    <Card hover>
      <div className="row gap12" style={{ marginBottom: 12 }}>
        <Avatar first={item.userFirst} size={34} />
        <div style={{ flex: 1 }}>
          <div className="t-body-strong">{item.userName}</div>
          <div className="t-caption dim2">diajukan {item.submittedAt}</div>
        </div>
        {item.overtime && <Badge kind="over" label="Overtime" />}
      </div>
      <div className="hr" style={{ marginBottom: 12 }} />
      <div className="row gap8"><Icons.Pin size={15} className="accent-text" />
        <span className="t-body-strong" style={{ flex: 1 }}>{item.title}</span>
        <span className="dim t-caption">Est {item.est} jam</span></div>
      {item.desc && <p className="dim t-caption" style={{ margin: "8px 0 0", lineHeight: 1.5 }}>"{item.desc}"</p>}

      <div className="muted-box mt12" style={item.overtime ? { borderColor: "rgba(200,95,10,.35)", background: "color-mix(in srgb,#c8650a 6%, transparent)" } : {}}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="t-caption dim">Jam dipakai hari ini</span>
          <span className="t-caption" style={{ fontWeight: 600 }}>{item.usedToday}/8 jam</span>
        </div>
        <div className="row mt4" style={{ justifyContent: "space-between" }}>
          <span className="t-caption dim">Dengan todo ini</span>
          <span className="t-caption" style={{ fontWeight: 700, color: item.overtime ? "#c8650a" : "#0f7b3f" }}>
            {item.withThis}/8 jam {item.overtime ? "⚠ overtime" : "✓"}
          </span>
        </div>
      </div>

      <div className="mt12">
        <label className="field-label t-caption dim">Catatan (opsional)</label>
        <TextBox value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tambahkan catatan untuk anggota..." />
      </div>
      <div className="row gap12 mt12">
        <Btn variant="danger" icon={<Icons.XCircle size={15} />} onClick={() => onDecision(item, "rejected", note)} style={{ flex: 1 }}>Tolak</Btn>
        <Btn variant="accent" icon={<Icons.Check size={16} />} onClick={() => onDecision(item, "approved", note)} style={{ flex: 1 }}>
          {item.overtime ? "Approve Overtime" : "Approve"}
        </Btn>
      </div>
    </Card>
  );
};

const ApprovalQueue = () => {
  const { approvals, processed, decideApproval, openAdd, systemConfig } = useApp();
  useTicker(true);
  const cfgHour = systemConfig?.approvalDeadlineHour ?? 9;
  const now = new Date();
  const deadline = new Date(now); deadline.setHours(cfgHour, 0, 0, 0);
  const remainMs = deadline - now;
  const remainMin = Math.max(0, Math.round(remainMs / 60000));
  const isPast = remainMs < 0;
  const deadlineLabel = `${String(cfgHour).padStart(2, "0")}:00`;

  return (
    <div className="content-pad page-enter" style={{ maxWidth: 760 }}>
      <div className="row" style={{ alignItems: "flex-end", marginBottom: 4 }}>
        <div className="t-title" style={{ flex: 1 }}>Approval Queue</div>
        <Btn variant="accent" icon={<Icons.Plus size={15} />} onClick={openAdd}>Buat Todo untuk Anggota</Btn>
      </div>
      <Card className="mt16">
        <div className="row gap16" style={{ alignItems: "center" }}>
          <div className="row gap8"><Icons.Clock size={18} className="accent-text" />
            <div className="col">
              <span className="t-caption dim2">Batas approve</span>
              <span className="t-body-strong">{deadlineLabel} pagi</span>
            </div>
          </div>
          <div style={{ width: 1, height: 34, background: "var(--divider)" }} />
          <div className="col">
            <span className="t-caption dim2">
              {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="t-body-strong" style={{ color: isPast ? "#0f7b3f" : "#c8650a" }}>
              {isPast ? `Sudah melewati ${deadlineLabel}` : `Tersisa ${remainMin} menit`}
            </span>
          </div>
          <div className="spacer" />
          {!isPast && <div style={{ width: 140 }}>
            <ProgressBar value={60 - remainMin} max={60} thick variant="warn" />
          </div>}
        </div>
      </Card>

      <SectionLabel><Icons.Hourglass size={13} /> Menunggu Approval ({approvals.length})</SectionLabel>
      {approvals.length === 0
        ? <Card><div className="col" style={{ alignItems: "center", padding: 18, gap: 8 }}>
            <Icons.CheckCircle size={32} className="dim2" /><span className="dim">Semua todo sudah diproses 🎉</span></div></Card>
        : <div className="col" style={{ gap: 14 }}>{approvals.map((a) => <ApprovalCard key={a.id} item={a} onDecision={decideApproval} />)}</div>}

      <SectionLabel><Icons.Check size={13} /> Sudah Diproses Hari Ini ({processed.length})</SectionLabel>
      {processed.length === 0
        ? <Card><div className="dim t-caption">Belum ada yang diproses hari ini.</div></Card>
        : <Card pad={false}>
            {processed.map((p, i) => (
              <div key={p.id} className="row gap12" style={{ padding: "12px 18px", borderTop: i ? "1px solid var(--divider)" : "none" }}>
                <Avatar first={p.userFirst} size={26} />
                <span className="t-body-strong" style={{ width: 60 }}>{p.userFirst}</span>
                <span className="dim" style={{ flex: 1 }}>{p.text}</span>
                <span className="dim2 t-caption">{p.at}</span>
                <Badge kind={p.result === "approved" ? "approved" : "rejected"} label={p.result === "approved" ? "Approved" : "Ditolak"} />
              </div>
            ))}
          </Card>}
    </div>
  );
};

/* ---------- USER MANAGEMENT ---------- */
const UserManagement = () => {
  const { users, saveUser, deleteUser, pushToast } = useApp();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const filtered = users.filter((u) => (u.name + u.email).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="content-pad page-enter">
      <div className="row" style={{ alignItems: "flex-end", marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div className="t-title">User Management</div>
          <div className="dim" style={{ marginTop: 2 }}>{users.length} pengguna terdaftar</div>
        </div>
        <div className="row gap12 wrap">
          <SearchBox placeholder="Cari nama / email..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Btn variant="accent" icon={<Icons.Plus size={16} />}
               onClick={() => setEditing({ name: "", email: "", role: "Member", status: "Aktif", password: "", _new: true })}>
            Tambah User
          </Btn>
        </div>
      </div>

      <Card pad={false} style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead><tr>
            <th style={{ width: 40 }}>#</th><th>Nama</th><th className="hide-mobile">Email</th>
            <th style={{ width: 90 }}>Role</th><th style={{ width: 110 }}>Status</th>
            <th style={{ width: 80, textAlign: "right" }}>Aksi</th>
          </tr></thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id}>
                <td className="dim2">{i + 1}</td>
                <td><div className="row gap10" style={{ gap: 10 }}><Avatar first={u.first || u.name} size={26} /><span className="t-body-strong">{u.name}</span></div></td>
                <td className="dim hide-mobile">{u.email}</td>
                <td>{u.role === "CEO"
                  ? <span className="badge" style={{ color: "var(--accent)", background: "color-mix(in srgb,var(--accent) 14%,transparent)" }}>CEO</span>
                  : <span className="dim">Member</span>}</td>
                <td>{u.status === "Aktif"
                  ? <Badge kind="done" label="Aktif" />
                  : <Badge kind="idle" label="Nonaktif" />}</td>
                <td>
                  <div className="row" style={{ gap: 2, justifyContent: "flex-end" }}>
                    <HBtn title="Edit" onClick={() => setEditing({ ...u })} style={{ width: 30, height: 30 }}><Icons.Edit size={15} /></HBtn>
                    <HBtn title="Nonaktifkan" onClick={() => {
                      if (u.role === "CEO") { pushToast("err", "Tidak bisa menonaktifkan CEO"); return; }
                      deleteUser(u.id);
                    }} style={{ width: 30, height: 30 }}><Icons.Trash size={15} /></HBtn>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="dim" style={{ textAlign: "center", padding: 24 }}>Tidak ada pengguna cocok.</td></tr>}
          </tbody>
        </table>
      </Card>

      {editing && <UserEditDialog user={editing} onClose={() => setEditing(null)}
        onSave={(u) => { saveUser(u); setEditing(null); }} />}
    </div>
  );
};

const UserEditDialog = ({ user, onClose, onSave }) => {
  const [f, setF] = useState({ password: "", confirmPw: "", ...user });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const isNew = !!user._new;

  const pwErr = validatePw(f.password);
  const pwMismatch = f.password && f.confirmPw && f.password !== f.confirmPw;
  const pwRequiredOk = isNew ? (f.password.length >= 8 && !pwErr) : (!f.password || (!pwErr && !pwMismatch));
  const valid = f.name.trim() && f.email.trim() && pwRequiredOk && !pwMismatch;

  return (
    <Dialog title={isNew ? "Tambah User" : "Edit User"} width={460}
      icon={<span style={{ color: "var(--accent)" }}>{isNew ? <Icons.Plus size={20} /> : <Icons.Edit size={20} />}</span>}
      onClose={onClose}
      footer={<><Btn onClick={onClose}>Batal</Btn>
        <Btn variant="accent" disabled={!valid} onClick={() => onSave(f)} icon={<Icons.Check size={16} />}>Simpan</Btn></>}>
      <Field label="Nama Lengkap" req>
        <TextBox value={f.name} onChange={set("name")} placeholder="Nama lengkap" autoFocus />
      </Field>
      {isNew && <>
        <Field label="Email" req>
          <TextBox value={f.email} onChange={set("email")} placeholder="nama@teamflow.id" />
        </Field>
        <Field label="Role">
          <Select value={f.role} onChange={set("role")}><option>Member</option><option>CEO</option></Select>
        </Field>
      </>}
      {!isNew && <>
        <Field label="Email">
          <TextBox value={f.email} disabled style={{ opacity: .6 }} />
        </Field>
        <Field label="Status">
          <Select value={f.status} onChange={set("status")}><option>Aktif</option><option>Nonaktif</option></Select>
        </Field>
      </>}

      {/* Password section — required for new, optional for edit */}
      <div className="hr" style={{ margin: "14px 0 16px" }} />
      <div className="t-caption dim" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <Icons.Lock size={13} />
        {isNew ? "Password akun" : "Reset password (kosongkan jika tidak ingin mengubah)"}
      </div>
      <Field label={isNew ? "Password" : "Password Baru"} req={isNew}
             hint="Min. 8 karakter, 1 huruf kapital, 1 angka">
        <TextBox type="password" value={f.password} onChange={set("password")} placeholder="••••••••"
          style={pwErr && f.password ? { borderColor: "#c42b1c" } : {}} />
        {pwErr && f.password && (
          <div className="row gap6 mt4" style={{ color: "#c42b1c", fontSize: 12 }}>
            <Icons.XCircle size={13} />{pwErr}
          </div>
        )}
      </Field>
      <Field label="Konfirmasi Password" req={isNew}>
        <TextBox type="password" value={f.confirmPw} onChange={set("confirmPw")} placeholder="••••••••"
          style={pwMismatch ? { borderColor: "#c42b1c" } : {}} />
        {pwMismatch && (
          <div className="row gap6 mt4" style={{ color: "#c42b1c", fontSize: 12 }}>
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
};

/* ---------- LAPORAN HARIAN ---------- */
const ReportDetailCard = ({ p }) => (
  <Card hover>
    <div className="row gap12" style={{ marginBottom: 10 }}>
      <Avatar first={p.first} size={30} />
      <span className="t-body-strong" style={{ flex: 1 }}>{p.name || p.first}</span>
      <span className="badge" style={{ color: "var(--accent)", background: "color-mix(in srgb,var(--accent) 13%,transparent)" }}>{p.used}/8 jam</span>
    </div>
    <div className="col" style={{ gap: 8 }}>
      {p.items.map((it, i) => (
        <div key={i} className="row gap12">
          <span className="dim2 t-caption" style={{ width: 44 }}>{it.time}</span>
          <span className="t-body" style={{ flex: 1, minWidth: 0 }}>{it.task}</span>
          <div style={{ width: 80 }}><ProgressBar value={it.h} max={2} variant={it.state === "done" ? "full" : ""} /></div>
          <span className="dim t-caption" style={{ width: 48, textAlign: "right" }}>{it.h} jam</span>
          {it.state === "done" ? <Icons.CheckCircle size={15} style={{ color: "#0f7b3f" }} /> : <Icons.Refresh size={14} className="spin accent-text" />}
        </div>
      ))}
      {p.items.length === 0 && <div className="dim t-caption">Tidak ada todo hari ini.</div>}
    </div>
    <div className="muted-box mt12" style={{ padding: "10px 12px" }}>
      <div className="row gap8" style={{ marginBottom: p.pause.length ? 8 : 0 }}>
        <Icons.Pause size={12} className="dim" />
        <span className="t-caption dim" style={{ fontWeight: 600 }}>Riwayat Pause</span>
      </div>
      {p.pause.length === 0
        ? <span className="t-caption dim">Tidak ada pause</span>
        : <table className="tbl" style={{ fontSize: 12, marginTop: 0 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Tugas</th>
                <th style={{ textAlign: "center", width: 60 }}>Mulai</th>
                <th style={{ textAlign: "center", width: 60 }}>Selesai</th>
                <th style={{ textAlign: "right", width: 64 }}>Durasi</th>
              </tr>
            </thead>
            <tbody>
              {p.pause.map((r, i) => (
                <tr key={i}>
                  <td className="t-caption" style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.task}</td>
                  <td className="t-caption dim2" style={{ textAlign: "center" }}>{r.start}</td>
                  <td className="t-caption dim2" style={{ textAlign: "center" }}>{r.end}</td>
                  <td className="t-caption" style={{ textAlign: "right", fontWeight: 600 }}>{r.durationMin} mnt</td>
                </tr>
              ))}
            </tbody>
          </table>}
    </div>
  </Card>
);

const Laporan = () => {
  const { report, reportDetail, week, isCEO } = useApp();
  const [scope, setScope] = useState("Semua");
  const [period, setPeriod] = useState("Minggu ini");
  const [selectedMember, setSelectedMember] = useState("all");
  const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum"];

  const memberOptions = isCEO
    ? reportDetail.map((p) => ({ id: p.id || p.first, name: p.name || p.first }))
    : [];

  const filteredDetail = selectedMember === "all"
    ? reportDetail
    : reportDetail.filter((p) => (p.id || p.first) === selectedMember);

  return (
    <div className="content-pad page-enter">
      <div className="row" style={{ alignItems: "flex-end", marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div className="t-title">Laporan Harian</div>
          <div className="dim" style={{ marginTop: 2 }}>Ringkasan jam kerja tim</div>
        </div>
        <div className="row gap12 wrap">
          {isCEO && memberOptions.length > 0 && (
            <div className="select-wrap">
              <select className="tbx" style={{ minWidth: 140 }} value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)}>
                <option value="all">Semua Anggota</option>
                {memberOptions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <Icons.Chevron size={14} />
            </div>
          )}
          <div className="select-wrap"><select className="tbx" style={{ minWidth: 130 }} value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option>Minggu ini</option><option>Minggu lalu</option><option>Bulan ini</option></select><Icons.Chevron size={14} /></div>
        </div>
      </div>

      {report.length > 0 && selectedMember === "all" && (
        <Card>
          <div className="t-subtitle" style={{ marginBottom: 14 }}>Ringkasan {period}</div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl" style={{ minWidth: 400 }}>
              <thead><tr><th style={{ width: 90 }}>Anggota</th>
                {dayLabels.map((d) => <th key={d} style={{ textAlign: "center" }}>{d}</th>)}
                <th style={{ textAlign: "right", width: 80 }}>Total</th></tr></thead>
              <tbody>
                {report.map((r) => {
                  const total = r.days.reduce((a, b) => a + b, 0);
                  return (
                    <tr key={r.first}>
                      <td><div className="row gap8"><Avatar first={r.first} size={24} /><span className="t-body-strong">{r.first}</span></div></td>
                      {r.days.map((h, i) => (
                        <td key={i} style={{ textAlign: "center" }}>
                          <span style={{ display: "inline-grid", placeItems: "center", width: 30, height: 30, borderRadius: 7,
                            fontWeight: 600, fontSize: 13,
                            color: h >= 8 ? "var(--accent)" : "var(--text-secondary)",
                            background: h >= 8 ? "color-mix(in srgb,var(--accent) 13%,transparent)" : "var(--subtle-sel)" }}>{h}</span>
                        </td>
                      ))}
                      <td style={{ textAlign: "right", fontWeight: 700 }}>{total} jam</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <SectionLabel><Icons.Calendar size={13} /> Detail Hari Ini</SectionLabel>
      {filteredDetail.length === 0
        ? <Card><div className="dim t-caption">Memuat laporan...</div></Card>
        : <div className="col" style={{ gap: 14 }}>{filteredDetail.map((p) => <ReportDetailCard key={p.id || p.first} p={p} />)}</div>}
    </div>
  );
};

/* ---------- SETTINGS / PROFILE ---------- */
const Settings = () => {
  const { me, notif, setNotif, logout, pushToast, isCEO, systemConfig } = useApp();
  const [tz, setTz] = useState("Asia/Jakarta (WIB)");
  const [fname, setFname] = useState(me?.name || "");
  const [saving, setSaving] = useState(false);

  // CEO approval deadline
  const [deadlineHour, setDeadlineHour] = useState(systemConfig?.approvalDeadlineHour ?? 9);
  const [deadlineSaving, setDeadlineSaving] = useState(false);
  const saveDeadline = async () => {
    setDeadlineSaving(true);
    try {
      await window.API.SystemConfig.update(deadlineHour);
      pushToast("ok", "Batas approval diperbarui", `Auto-approve pukul ${String(deadlineHour).padStart(2,"0")}:00 WIB`);
    } catch (e) { pushToast("err", "Gagal menyimpan", e.message); }
    setDeadlineSaving(false);
  };

  // change-password state
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const pwErr = validatePw(newPw);
  const pwMismatch = newPw && confirmPw && newPw !== confirmPw;
  const pwValid = curPw && newPw && confirmPw && !pwErr && !pwMismatch;

  const saveProfile = async () => {
    setSaving(true);
    try {
      await window.API.Users.update(me.id, { name: fname });
      pushToast("ok", "Perubahan disimpan");
    } catch (e) {
      pushToast("err", "Gagal menyimpan", e.message);
    }
    setSaving(false);
  };

  const savePassword = async () => {
    setPwSaving(true);
    try {
      await window.API.Auth.changePassword(curPw, newPw);
      pushToast("ok", "Password berhasil diubah", "Silakan login ulang di perangkat lain");
      setCurPw(""); setNewPw(""); setConfirmPw("");
    } catch (e) {
      pushToast("err", "Gagal mengubah password", e.message);
    }
    setPwSaving(false);
  };

  return (
    <div className="content-pad page-enter" style={{ maxWidth: 720 }}>
      <div className="t-title" style={{ marginBottom: 4 }}>Settings &amp; Profile</div>

      <SectionLabel><Icons.Users3 size={13} /> Profil Saya</SectionLabel>
      <Card>
        <div className="row gap16" style={{ marginBottom: 18 }}>
          <div style={{ position: "relative" }}>
            <Avatar first={me?.first || "?"} size={64} />
          </div>
          <div className="col">
            <span className="t-body-lg" style={{ fontWeight: 600 }}>{me?.name || "—"}</span>
            <span className="dim">{me?.email} · {me?.role}</span>
          </div>
        </div>
        <div className="row gap12 wrap">
          <div style={{ flex: 1, minWidth: 200 }}><Field label="Nama"><TextBox value={fname} onChange={(e) => setFname(e.target.value)} /></Field></div>
          <div style={{ flex: 1, minWidth: 200 }}><Field label="Email"><TextBox value={me?.email || ""} disabled style={{ opacity: .6 }} /></Field></div>
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <Btn variant="accent" disabled={saving} icon={<Icons.Check size={16} />} onClick={saveProfile}>
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Btn>
        </div>
      </Card>

      <SectionLabel><Icons.Bell size={13} /> Preferensi Notifikasi</SectionLabel>
      <Card pad={false}>
        {[
          { k: "approved", t: "Notifikasi todo approved", s: "Saat CEO menyetujui todo kamu" },
          { k: "rejected", t: "Notifikasi todo rejected", s: "Saat todo ditolak / perlu revisi" },
          { k: "reminder", t: "Reminder 30 menit sebelum batas", s: "Pengingat batas jam harian" },
        ].map((r, i) => (
          <div key={r.k} className="row gap16" style={{ padding: "14px 18px", borderTop: i ? "1px solid var(--divider)" : "none" }}>
            <div className="col" style={{ flex: 1 }}><span className="t-body-strong">{r.t}</span><span className="dim t-caption">{r.s}</span></div>
            <Toggle on={notif[r.k]} onChange={(v) => setNotif({ ...notif, [r.k]: v })} />
          </div>
        ))}
      </Card>

      <SectionLabel><Icons.Lock size={13} /> Ganti Password</SectionLabel>
      <Card>
        <div className="row gap8" style={{ marginBottom: 14, alignItems: "center", justifyContent: "space-between" }}>
          <span className="t-caption dim">Gunakan password kuat — min. 8 karakter, 1 huruf kapital, 1 angka</span>
          <HBtn title={showPw ? "Sembunyikan" : "Tampilkan"} onClick={() => setShowPw(!showPw)} style={{ width: 28, height: 28 }}>
            {showPw ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
          </HBtn>
        </div>
        <Field label="Password Saat Ini" req>
          <TextBox type={showPw ? "text" : "password"} value={curPw} onChange={(e) => setCurPw(e.target.value)} placeholder="••••••••" />
        </Field>
        <Field label="Password Baru" req hint="Min. 8 karakter, 1 huruf kapital, 1 angka">
          <TextBox type={showPw ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••"
            style={pwErr && newPw ? { borderColor: "#c42b1c" } : newPw && !pwErr ? { borderColor: "#0f7b3f" } : {}} />
          {pwErr && newPw && (
            <div className="row gap6 mt4" style={{ color: "#c42b1c", fontSize: 12 }}>
              <Icons.XCircle size={13} />{pwErr}
            </div>
          )}
        </Field>
        <Field label="Konfirmasi Password Baru" req>
          <TextBox type={showPw ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••"
            style={pwMismatch ? { borderColor: "#c42b1c" } : confirmPw && !pwMismatch ? { borderColor: "#0f7b3f" } : {}} />
          {pwMismatch && (
            <div className="row gap6 mt4" style={{ color: "#c42b1c", fontSize: 12 }}>
              <Icons.XCircle size={13} />Password tidak cocok
            </div>
          )}
          {confirmPw && !pwMismatch && newPw && !pwErr && (
            <div className="row gap6 mt4" style={{ color: "#0f7b3f", fontSize: 12 }}>
              <Icons.CheckCircle size={13} />Password cocok
            </div>
          )}
        </Field>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <Btn variant="accent" disabled={!pwValid || pwSaving} icon={<Icons.Lock size={15} />} onClick={savePassword}>
            {pwSaving ? "Menyimpan..." : "Ubah Password"}
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
          <div className="row gap12" style={{ alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <Select value={deadlineHour} onChange={(e) => setDeadlineHour(Number(e.target.value))}>
                {[7, 8, 9, 10, 11, 12].map((h) => (
                  <option key={h} value={h}>{String(h).padStart(2,"0")}:00 WIB</option>
                ))}
              </Select>
            </div>
            <Btn variant="accent" disabled={deadlineSaving} icon={<Icons.Check size={16} />} onClick={saveDeadline}>
              {deadlineSaving ? "Menyimpan..." : "Simpan"}
            </Btn>
          </div>
        </Card>
      </>}

      <div className="hr" style={{ margin: "26px 0" }} />
      <Btn variant="danger" icon={<Icons.Logout size={16} />} onClick={logout}>Keluar / Logout</Btn>
    </div>
  );
};

Object.assign(window, { AddTodoPanel, ApprovalQueue, UserManagement, Laporan, Settings });
