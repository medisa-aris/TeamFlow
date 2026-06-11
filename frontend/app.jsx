/* ============================================================
   TeamFlow — App root: auth, data loading, actions, context
   ============================================================ */
const { useState, useEffect, useRef, useCallback } = React;

/* --- decode JWT payload (no signature check needed client-side) --- */
function decodeJwt(token) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch { return null; }
}

/* --- toast management --- */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((kind, title, msg) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, kind, title, msg, leaving: false }]);
    setTimeout(() => {
      setToasts((p) => p.map((t) => t.id === id ? { ...t, leaving: true } : t));
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 320);
    }, 3800);
  }, []);
  const remove = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, push, remove };
}

/* ============================================================
   Main App
   ============================================================ */
const App = () => {
  /* --- auth --- */
  const [loggedIn, setLoggedIn] = useState(false);
  const [me, setMe] = useState(null);

  /* --- ui state --- */
  const [route, setRoute] = useState("dashboard");
  const [compact, setCompact] = useState(false);
  const [theme, setThemeState] = useState(
    localStorage.getItem("tf_theme") || "dark"
  );
  const [notifOpen, setNotifOpen] = useState(false);

  /* --- data --- */
  const [todos, setTodos] = useState([]);
  const [archived, setArchived] = useState([]);
  const [systemConfig, setSystemConfig] = useState({ approvalDeadlineHour: 9 });
  const [team, setTeam] = useState([]);
  const [week, setWeek] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [processed, setProcessed] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reportDetail, setReportDetail] = useState([]);
  const [report, setReport] = useState([]);

  /* --- routing param (e.g. todo id for detail view) --- */
  const [routeParam, setRouteParam] = useState(null);

  /* --- add/edit panel --- */
  const [addPanel, setAddPanel] = useState(null);

  /* --- notif prefs --- */
  const [notif, setNotif] = useState({ approved: true, rejected: true, reminder: false });

  const { toasts, push: pushToast, remove: removeToast } = useToasts();

  const pollingRef = useRef(null);
  const role = me?.role || "Member";
  const isCEO = role === "CEO";

  /* ---------- session restore ---------- */
  useEffect(() => {
    const token = localStorage.getItem("tf_access");
    const stored = localStorage.getItem("tf_user");
    if (token && stored) {
      try {
        const u = JSON.parse(stored);
        setMe(u);
        setLoggedIn(true);
      } catch { /* ignore */ }
    }
  }, []);

  /* ---------- theme ---------- */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tf_theme", theme);
  }, [theme]);

  const setTheme = (t) => setThemeState(t);

  /* ---------- data loaders ---------- */
  const loadTodos = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const raw = await window.API.Todos.list(today, true);
      setTodos((raw || []).map(window.TF.mapTodo));
    } catch (e) { console.error("loadTodos", e); }
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const [todayData, histData] = await Promise.all([
        window.API.Dashboard.today(),
        window.API.Dashboard.history(7),
      ]);
      setTeam(window.TF.mapTeamHours(todayData?.members || []));
      setWeek(window.TF.mapWeek7(histData));
    } catch (e) { console.error("loadDashboard", e); }
  }, []);

  const loadApprovals = useCallback(async () => {
    try {
      const raw = await window.API.Todos.pendingApprovals();
      setApprovals((raw || []).map(window.TF.mapApprovalItem));
    } catch (e) { console.error("loadApprovals", e); }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const raw = await window.API.Users.list();
      setUsers((raw || []).map(window.TF.mapUser));
    } catch (e) { console.error("loadUsers", e); }
  }, []);

  const loadSystemConfig = useCallback(async () => {
    try {
      const cfg = await window.API.SystemConfig.get();
      if (cfg) setSystemConfig(cfg);
    } catch (e) { console.error("loadSystemConfig", e); }
  }, []);

  const loadArchived = useCallback(async () => {
    try {
      const raw = await window.API.Todos.archived();
      setArchived((raw || []).map(window.TF.mapTodo));
    } catch (e) { console.error("loadArchived", e); }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const raw = await window.API.Notifications.list();
      setNotifications(Array.isArray(raw) ? raw : (raw?.notifications ?? []));
    } catch (e) { console.error("loadNotifications", e); }
  }, []);

  const loadReport = useCallback(async () => {
    if (!me) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      if (isCEO) {
        const us = users.length ? users : (await window.API.Users.list().then((r) => r.map(window.TF.mapUser)));
        const details = await Promise.all(
          us.map((u) => window.API.Reports.user(u.id, today).then(window.TF.mapReportDetail).catch(() => null))
        );
        setReportDetail(details.filter(Boolean));
        const reportSummary = us.map((u) => {
          const d = details.find((x) => x?.id === u.id);
          return { first: u.first, days: [d?.used || 0, 0, 0, 0, 0] };
        });
        setReport(reportSummary);
      } else {
        const d = await window.API.Reports.user(me.id, today).then(window.TF.mapReportDetail);
        setReportDetail(d ? [d] : []);
        setReport(d ? [{ first: d.first, days: [d.used || 0, 0, 0, 0, 0] }] : []);
      }
    } catch (e) { console.error("loadReport", e); }
  }, [me, isCEO, users]);

  /* ---------- full refresh ---------- */
  const refresh = useCallback(async () => {
    await Promise.all([
      loadTodos(),
      loadDashboard(),
      loadNotifications(),
      ...(isCEO ? [loadApprovals(), loadUsers()] : []),
    ]);
  }, [loadTodos, loadDashboard, loadNotifications, loadApprovals, loadUsers, isCEO]);

  /* ---------- on login: also load system config ---------- */
  useEffect(() => {
    if (loggedIn && me) loadSystemConfig();
  }, [loggedIn, me?.id]);

  /* ---------- on login ---------- */
  useEffect(() => {
    if (!loggedIn || !me) return;

    refresh();

    /* SSE */
    window.API.SSE.connect((ev) => {
      if (!ev?.type) return;
      if (ev.type.startsWith("todo")) { loadTodos(); loadDashboard(); }
      if (ev.type.startsWith("notification")) {
        loadNotifications();
        loadTodos();
        loadDashboard();
        if (isCEO) loadApprovals();
      }
    });

    /* 15s polling */
    pollingRef.current = setInterval(refresh, 15000);

    return () => {
      window.API.SSE.disconnect();
      clearInterval(pollingRef.current);
    };
  }, [loggedIn, me?.id]);

  /* ---------- load report when navigating to laporan --- */
  useEffect(() => {
    if (route === "laporan" && loggedIn) loadReport();
  }, [route, loggedIn]);

  /* ---------- load archived when navigating to selesai --- */
  useEffect(() => {
    if (route === "selesai" && loggedIn) loadArchived();
  }, [route, loggedIn]);

  /* ---------- auth actions ---------- */
  const login = async (email, pw) => {
    const data = await window.API.Auth.login(email, pw);
    const payload = decodeJwt(data.accessToken);
    const userObj = {
      id: data.user?.id || payload?.sub,
      name: data.user?.fullName || payload?.email || email,
      first: (data.user?.fullName || email).split(" ")[0],
      email: data.user?.email || email,
      role: data.user?.role === "CEO" ? "CEO" : "Member",
    };
    localStorage.setItem("tf_access", data.accessToken);
    localStorage.setItem("tf_refresh", data.refreshToken);
    localStorage.setItem("tf_user", JSON.stringify(userObj));
    setMe(userObj);
    setLoggedIn(true);
    setRoute("dashboard");
  };

  const logout = async () => {
    const rt = localStorage.getItem("tf_refresh");
    window.API.SSE.disconnect();
    clearInterval(pollingRef.current);
    await window.API.Auth.logout(rt);
    setLoggedIn(false);
    setMe(null);
    setTodos([]); setArchived([]); setTeam([]); setWeek([]);
    setApprovals([]); setUsers([]); setNotifications([]);
    setReportDetail([]); setReport([]);
    setRoute("dashboard");
  };

  /* ---------- navigation ---------- */
  const go = (page, param = null) => { setRoute(page); setRouteParam(param); setNotifOpen(false); };
  const toggleRail = () => setCompact((c) => !c);

  /* ---------- todo actions ---------- */
  const startTodo = async (id) => {
    const t = todos.find((x) => x.id === id);
    try {
      if (t?.paused) await window.API.Todos.resume(id);
      else await window.API.Todos.start(id);
      await loadTodos();
    } catch (e) { pushToast("err", "Gagal memulai todo", e.message); }
  };

  const pauseTimer = async (id) => {
    try {
      await window.API.Todos.pause(id);
      await loadTodos();
    } catch (e) { pushToast("err", "Gagal pause todo", e.message); }
  };

  const finishTodo = async (id) => {
    try {
      await window.API.Todos.complete(id);
      await Promise.all([loadTodos(), loadDashboard()]);
      pushToast("ok", "Todo selesai! Kerja bagus 🎉");
    } catch (e) { pushToast("err", "Gagal menyelesaikan todo", e.message); }
  };

  const submitTodo = async (data, editing) => {
    try {
      if (editing && data.id) {
        await window.API.Todos.update(data.id, data);
        pushToast("ok", "Todo diperbarui", "Menunggu approval ulang CEO");
      } else if (isCEO && data.targetMemberId) {
        await window.API.Todos.createForMember(data.targetMemberId, data);
        pushToast("ok", "Todo dibuat untuk anggota", "Auto-approved");
      } else {
        await window.API.Todos.create(data);
        pushToast("ok", "Todo diajukan", "Menunggu approval CEO");
      }
      setAddPanel(null);
      await loadTodos();
    } catch (e) { pushToast("err", "Gagal menyimpan todo", e.message); }
  };

  const deleteTodo = async (id) => {
    try {
      await window.API.Todos.delete(id);
      await loadTodos();
      pushToast("ok", "Todo dihapus");
    } catch (e) { pushToast("err", "Gagal menghapus todo", e.message); }
  };

  const archiveTodo = async (id) => {
    try {
      await window.API.Todos.archive(id);
      await Promise.all([loadTodos(), loadArchived()]);
      pushToast("ok", "Todo diarsipkan", "Tersimpan di halaman Selesai");
    } catch (e) { pushToast("err", "Gagal mengarsipkan todo", e.message); }
  };

  const carryOverTodo = async (id) => {
    try {
      await window.API.Todos.carryOver(id);
      await loadTodos();
      pushToast("ok", "Todo diteruskan ke hari kerja berikutnya");
    } catch (e) { pushToast("err", "Gagal meneruskan todo", e.message); }
  };

  const openAdd = () => setAddPanel({ mode: "add", todo: null });
  const openEdit = (todo) => setAddPanel({ mode: "edit", todo });
  const closeAdd = () => setAddPanel(null);

  /* ---------- elapsed timer helper (live seconds for a todo) ---------- */
  const elapsed = useCallback((todo) => {
    if (!todo) return 0;
    const acc = todo.acc || 0;
    if (todo.running && todo.lastStart) {
      return acc + Math.floor((Date.now() - todo.lastStart) / 1000);
    }
    return acc;
  }, []);

  /* ---------- approval actions ---------- */
  const decideApproval = async (item, result, note) => {
    try {
      if (result === "approved") await window.API.Todos.approve(item.id, note || "");
      else await window.API.Todos.reject(item.id, note || "Ditolak");

      const label = result === "approved" ? "Approved" : "Ditolak";
      setProcessed((p) => [
        { id: item.id, userFirst: item.userFirst, text: item.title, result, at: window.TF.fmtTime(new Date().toISOString()) },
        ...p,
      ]);
      await loadApprovals();
      pushToast("ok", `Todo ${label}`, `${item.userName} — ${item.title}`);
    } catch (e) { pushToast("err", "Gagal memproses approval", e.message); }
  };

  /* ---------- user actions ---------- */
  const saveUser = async (u) => {
    try {
      if (u._new) {
        await window.API.Users.create(u);
        pushToast("ok", "User dibuat", u.email);
      } else {
        await window.API.Users.update(u.id, u);
        pushToast("ok", "User diperbarui", u.name);
      }
      await loadUsers();
    } catch (e) { pushToast("err", "Gagal menyimpan user", e.message); }
  };

  const deleteUser = async (id) => {
    try {
      await window.API.Users.update(id, { isActive: false });
      await loadUsers();
      pushToast("ok", "User dinonaktifkan");
    } catch (e) { pushToast("err", "Gagal menonaktifkan user", e.message); }
  };

  /* ---------- notifications ---------- */
  const markNotifRead = useCallback(async (id) => {
    try {
      await window.API.Notifications.delete(id);
      setNotifications((p) => p.filter((n) => n.id !== id));
    } catch { /* ignore */ }
  }, []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const pendingCount = approvals.length;
  const pendingMemberCount = todos.filter((t) => t.state === "waiting" || t.state === "rejected").length;

  /* ---------- derived --- */
  const hoursUsed = todos
    .filter((t) => ["ongoing", "done", "queue"].includes(t.state))
    .reduce((s, t) => s + (t.est || 0), 0);

  /* ---------- render ---------- */
  const ctx = {
    /* auth */
    loggedIn, me, role, isCEO, login, logout,
    /* ui */
    route, go, compact, toggleRail,
    theme, setTheme,
    notifOpen, setNotifOpen,
    /* data */
    todos, archived, team, week, approvals, processed,
    users, notifications, reportDetail, report, systemConfig,
    /* counts */
    unreadCount, pendingCount, pendingMemberCount,
    /* add panel */
    addPanel, openAdd, closeAdd, hoursUsed,
    /* notif prefs */
    notif, setNotif,
    /* routing */
    routeParam,
    /* actions */
    startTodo, pauseTimer, finishTodo, submitTodo,
    deleteTodo, archiveTodo, carryOverTodo,
    decideApproval, saveUser, deleteUser,
    markNotifRead, elapsed,
    /* add/edit */
    openEdit,
    /* toast */
    pushToast,
  };

  if (!loggedIn) {
    return (
      <AppContext.Provider value={ctx}>
        <LoginPage />
        <ToastHost toasts={toasts} remove={removeToast} />
      </AppContext.Provider>
    );
  }

  const PAGE = {
    dashboard: Dashboard,
    mytodo: MyTodo,
    pending: PendingApproval,
    selesai: Selesai,
    detail: TodoDetail,
    approval: ApprovalQueue,
    laporan: Laporan,
    users: UserManagement,
    settings: Settings,
    help: Help,
  };

  const Page = PAGE[route] || Dashboard;
  const allNavItems = [...NAV, ...NAV_FOOT];
  const navItem = allNavItems.find((n) => n.key === route);
  const pageTitle = navItem?.label || "Dashboard";

  return (
    <AppContext.Provider value={ctx}>
      <div className={`app ${compact ? "compact" : ""}`}>
        <Header />
        <div className="app-body">
          <NavRail />
          <main className="content-host">
            <Page />
          </main>
        </div>
        {addPanel && <AddTodoPanel />}
        <ToastHost toasts={toasts} remove={removeToast} />
      </div>
    </AppContext.Provider>
  );
};

/* mount */
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
