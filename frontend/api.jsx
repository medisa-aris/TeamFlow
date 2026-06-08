/* ============================================================
   TeamFlow — API service layer
   Connects to NestJS backend at http://localhost:3001/api/v1
   ============================================================ */

const BASE = "http://localhost:3001/api/v1";

async function apiFetch(url, opts = {}) {
  const token = localStorage.getItem("tf_access");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };

  const res = await fetch(`${BASE}${url}`, { ...opts, headers });

  if (res.status === 401) {
    const refreshToken = localStorage.getItem("tf_refresh");
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const { accessToken } = await refreshRes.json();
          localStorage.setItem("tf_access", accessToken);
          const retryRes = await fetch(`${BASE}${url}`, {
            ...opts,
            headers: { ...headers, Authorization: `Bearer ${accessToken}` },
          });
          if (retryRes.status === 401) {
            localStorage.removeItem("tf_access");
            localStorage.removeItem("tf_refresh");
            localStorage.removeItem("tf_user");
            window.location.reload();
          }
          if (!retryRes.ok) {
            const err = await retryRes.json().catch(() => ({}));
            const msg = Array.isArray(err.message) ? err.message.join(", ") : (err.message || "API error");
            throw Object.assign(new Error(msg), { status: retryRes.status, data: err });
          }
          return retryRes;
        }
      } catch (innerErr) {
        if (innerErr.status) throw innerErr;
      }
    }
    localStorage.removeItem("tf_access");
    localStorage.removeItem("tf_refresh");
    localStorage.removeItem("tf_user");
    window.location.reload();
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message.join(", ") : (err.message || "API error");
    throw Object.assign(new Error(msg), { status: res.status, data: err });
  }

  return res;
}

async function apiGet(url) {
  const res = await apiFetch(url);
  return res.json();
}

async function apiPost(url, body) {
  const res = await apiFetch(url, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function apiPatch(url, body) {
  const res = await apiFetch(url, { method: "PATCH", body: JSON.stringify(body || {}) });
  return res.json();
}

let sseController = null;

window.API = {
  Auth: {
    async login(email, password) {
      const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = Array.isArray(err.message) ? err.message.join(", ") : (err.message || "Login gagal");
        throw new Error(msg);
      }
      return res.json();
    },
    async changePassword(currentPassword, newPassword) {
      const res = await apiFetch("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return res.json();
    },
    async logout(refreshToken) {
      try {
        if (refreshToken) {
          await apiFetch("/auth/logout", {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
          });
        }
      } catch { /* ignore */ }
      localStorage.removeItem("tf_access");
      localStorage.removeItem("tf_refresh");
      localStorage.removeItem("tf_user");
    },
  },

  Todos: {
    async list(date, includeDone = false) {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (includeDone) params.set("includeDone", "true");
      const qs = params.toString();
      return apiGet(`/todos${qs ? "?" + qs : ""}`);
    },
    async create(data) {
      return apiPost("/todos", {
        title: data.title,
        description: data.desc || "",
        estimatedHours: Number(data.est),
      });
    },
    async start(id) { return apiPost(`/todos/${id}/start`); },
    async pause(id) { return apiPost(`/todos/${id}/pause`); },
    async resume(id) { return apiPost(`/todos/${id}/resume`); },
    async complete(id) { return apiPost(`/todos/${id}/complete`); },
    async approve(id, reason) {
      return apiPatch(`/todos/${id}/approve`, reason ? { reason } : {});
    },
    async reject(id, reason) {
      return apiPatch(`/todos/${id}/reject`, { reason: reason || "Ditolak" });
    },
    async pendingApprovals() { return apiGet("/todos/pending-approvals"); },
  },

  Dashboard: {
    async today() { return apiGet("/dashboard/today"); },
    async history(days = 7) { return apiGet(`/dashboard/history?days=${days}`); },
  },

  Reports: {
    async user(userId, date) {
      const qs = date ? `?date=${date}` : "";
      return apiGet(`/reports/user/${userId}${qs}`);
    },
  },

  Notifications: {
    async list(unreadOnly = false) {
      return apiGet(`/notifications${unreadOnly ? "?unread_only=true" : ""}`);
    },
    async markRead(id) { return apiPatch(`/notifications/${id}/read`, {}); },
  },

  Users: {
    async list() { return apiGet("/users"); },
    async create(data) {
      return apiPost("/users", {
        email: data.email,
        fullName: data.name,
        password: data.password,
        role: data.role === "CEO" ? "CEO" : "MEMBER",
      });
    },
    async update(id, data) {
      const body = {};
      if (data.name !== undefined) body.fullName = data.name;
      if (data.isActive !== undefined) body.isActive = data.isActive;
      else if (data.status !== undefined) body.isActive = data.status === "Aktif";
      // include password only if provided (admin reset)
      if (data.password && data.password.trim()) body.password = data.password;
      return apiPatch(`/users/${id}`, body);
    },
  },

  SSE: {
    async connect(onEvent) {
      const token = localStorage.getItem("tf_access");
      if (!token) return;
      sseController = new AbortController();
      try {
        const res = await fetch(`${BASE}/events/stream`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: sseController.signal,
        });
        if (!res.ok || !res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";
              for (const line of lines) {
                if (line.startsWith("data:")) {
                  try {
                    const data = JSON.parse(line.slice(5).trim());
                    onEvent(data);
                  } catch { /* skip malformed */ }
                }
              }
            }
          } catch (e) {
            if (e.name !== "AbortError") {
              // Reconnect after 5s on unexpected disconnect
              setTimeout(() => window.API.SSE.connect(onEvent), 5000);
            }
          }
        };
        pump();
      } catch (e) {
        if (e.name !== "AbortError") {
          setTimeout(() => window.API.SSE.connect(onEvent), 5000);
        }
      }
    },
    disconnect() {
      sseController?.abort();
      sseController = null;
    },
  },
};
