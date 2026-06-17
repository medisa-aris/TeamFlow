export function getLocalDate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
}

export function getAvatarColor(firstName) {
  const palette = [
    'linear-gradient(140deg,#d36a3a,#a8431f)',
    'linear-gradient(140deg,#855cba,#5e3d89)',
    'linear-gradient(140deg,#3a8fd3,#1f5da8)',
    'linear-gradient(140deg,#888,#555)',
    'linear-gradient(140deg,#2b9d6b,#127a4d)',
    'linear-gradient(140deg,#c8650a,#9a4a00)',
    'linear-gradient(140deg,#d33a6e,#a81f4e)',
  ];
  if (!firstName) return palette[1];
  let hash = 0;
  for (let i = 0; i < firstName.length; i++) hash = firstName.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function fmtHMS(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh} : ${mm} : ${ss}`;
}

export function fmtClock(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function fmtTime(dt) {
  if (!dt) return null;
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function fmtDate(dt) {
  if (!dt) return null;
  return new Date(dt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function countWords(str) {
  return (str || '').trim().split(/\s+/).filter(Boolean).length;
}

export function validatePw(pw) {
  return pw && pw.length >= 8;
}

export function mapTodo(t) {
  const s = t.status;
  let state, running, paused;
  if (s === 'PENDING_APPROVAL' || s === 'PENDING_OVERTIME_APPROVAL') {
    state = 'waiting'; running = false; paused = false;
  } else if (s === 'APPROVED' || s === 'AUTO_APPROVED') {
    state = 'queue'; running = false; paused = false;
  } else if (s === 'REJECTED') {
    state = 'rejected'; running = false; paused = false;
  } else if (s === 'ONGOING') {
    state = 'ongoing'; running = true; paused = false;
  } else if (s === 'PAUSED') {
    state = 'ongoing'; running = false; paused = true;
  } else if (s === 'DONE') {
    state = 'done'; running = false; paused = false;
  } else if (s === 'DEFERRED') {
    state = 'deferred'; running = false; paused = false;
  } else {
    state = 'waiting'; running = false; paused = false;
  }

  const sessions = t.sessions || [];
  const closedSessions = sessions.filter((ss) => ss.elapsedSeconds != null);
  const acc = closedSessions.reduce((sum, ss) => sum + Number(ss.elapsedSeconds), 0);

  const openSession = sessions.find((ss) => !ss.pausedAt && !ss.completedAt);
  const lastStart = running && openSession ? new Date(openSession.startedAt).getTime() : null;

  const sessionHistory = sessions.map((ss) => {
    const closed = ss.pausedAt || ss.completedAt;
    const endDt = ss.pausedAt || ss.completedAt;
    const durationSec = Number(ss.elapsedSeconds) || 0;
    const mins = Math.round(durationSec / 60);
    return {
      type: ss.pausedAt ? 'pause' : 'run',
      from: fmtTime(ss.startedAt),
      to: closed ? fmtTime(endDt) : 'Sekarang',
      note: closed ? `${mins} menit` : 'berjalan',
    };
  });

  let range = null;
  if (s === 'DONE' && sessions.length) {
    const first = sessions[0];
    const last = sessions[sessions.length - 1];
    const endDt = last.completedAt || last.pausedAt;
    if (endDt) range = `${fmtTime(first.startedAt)}–${fmtTime(endDt)}`;
  }

  const rejectLog = (t.approvalLogs || []).find((l) => l.action === 'REJECTED');
  const rejectNote = rejectLog?.reason || null;

  const deferEvent = (t.events || []).find((e) => e.toStatus === 'DEFERRED');
  const deferReason = deferEvent?.note || null;

  const startedAt = openSession
    ? fmtTime(openSession.startedAt)
    : sessions.length ? fmtTime(sessions[0].startedAt) : null;

  return {
    id: t.id,
    title: t.title,
    desc: t.description || '',
    est: Number(t.estimatedHours),
    state,
    running,
    paused,
    acc,
    lastStart,
    startedAt,
    createdAt: fmtTime(t.createdAt),
    target: null,
    submittedAt: fmtTime(t.createdAt),
    deadline: '09:00',
    rejectNote,
    range,
    sessions: sessionHistory,
    approved: ['APPROVED', 'AUTO_APPROVED', 'ONGOING', 'PAUSED', 'DONE'].includes(s),
    overtime: t.isOvertime,
    status: s,
    userId: t.userId,
    deferReason,
  };
}

export function mapTeamTodo(t) {
  return {
    ...mapTodo(t),
    userName: t.user?.fullName || 'Unknown',
    userFirst: (t.user?.fullName || '?').split(' ')[0],
    userEmail: t.user?.email || '',
  };
}

export function mapApprovalItem(t) {
  const first = (t.user?.fullName || '?').split(' ')[0];
  return {
    id: t.id,
    userFirst: first,
    userName: t.user?.fullName || 'Unknown',
    title: t.title,
    est: t.estimatedHours,
    submittedAt: fmtTime(t.createdAt),
    desc: t.description || '',
    usedToday: Math.round(parseFloat(t.usedToday || 0) * 10) / 10,
    withThis: Math.round(parseFloat(t.withThis || 0) * 10) / 10,
    overtime: t.status === 'PENDING_OVERTIME_APPROVAL',
  };
}

export function mapUser(u) {
  const first = (u.fullName || '').split(' ')[0];
  return {
    id: u.id,
    name: u.fullName,
    first,
    email: u.email,
    role: u.role === 'CEO' ? 'CEO' : 'Member',
    status: u.isActive ? 'Aktif' : 'Nonaktif',
    isActive: u.isActive,
  };
}

export function mapTeamHours(members) {
  return (members || []).map((m) => {
    const worked = parseFloat(m.today_hours_worked || 0);
    const approved = parseFloat(m.today_hours_approved || 0);
    const hasOngoing = m.current_status === 'ONGOING';
    let status;
    if (hasOngoing) status = 'ongoing';
    else if (worked >= 8) status = 'done';
    else if (worked > 0) status = 'paused';
    else status = 'idle';
    return {
      first: (m.full_name || '').split(' ')[0],
      name: m.full_name || '',
      userId: m.user_id,
      used: Math.round(worked * 10) / 10,
      approved: Math.round(approved * 10) / 10,
      total: 8,
      status,
      currentTodo: m.current_todo_title || null,
    };
  });
}

export function mapWeek7(historyData) {
  if (!historyData) return [];
  const dayNames = { 0: 'Min', 1: 'Sen', 2: 'Sel', 3: 'Rab', 4: 'Kam', 5: 'Jum', 6: 'Sab' };
  const histMap = {};
  (historyData.history || []).forEach((h) => { histMap[h.date] = parseFloat(h.total_worked_hours || 0); });
  return (historyData.days || []).slice().reverse().map((d) => ({
    d: dayNames[new Date(d + 'T12:00:00').getDay()] || d,
    v: Math.round((histMap[d] || 0) * 10) / 10,
  }));
}

export function mapReportDetail(data) {
  if (!data?.user) return null;
  const first = (data.user.fullName || '').split(' ')[0];
  const totalWorkedHours = data.summary?.totalWorkedHours || 0;
  const items = (data.todos || []).map((t) => ({
    time: fmtTime(t.createdAt) || '—',
    task: t.title,
    h: Number(t.estimatedHours),
    state: t.status === 'DONE' ? 'done'
         : (t.status === 'ONGOING' || t.status === 'PAUSED') ? 'ongoing'
         : t.status === 'REJECTED' ? 'rejected'
         : t.status === 'DEFERRED' ? 'deferred'
         : 'queued',
  }));

  const pauseItems = (data.todos || []).flatMap((t) =>
    (t.sessions || []).filter((s) => s.pausedAt).map((s) => ({
      task: t.title,
      start: fmtTime(s.startedAt),
      end: fmtTime(s.pausedAt),
      durationMin: Math.round((Number(s.elapsedSeconds) || 0) / 60),
    }))
  );

  return {
    id: data.user.id,
    first,
    name: data.user.fullName,
    used: Math.round(totalWorkedHours * 10) / 10,
    items,
    pause: pauseItems,
  };
}
