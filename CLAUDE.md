# TeamFlow — CLAUDE.md

Developer and AI guide for working on this codebase.

## Running the project

### Prerequisites
- Node.js v20+, npm v10+
- Docker + Docker Compose

### Quick start (development)

```bash
# 1. Start infra
docker-compose up -d postgres redis

# 2. Backend
cd backend
cp .env.example .env          # fill JWT keys (base64-encoded PEM)
npm install
npx prisma migrate deploy
npx prisma db seed            # seeds CEO + members + system_config row
npm run start:dev             # http://localhost:3001

# 3. Next.js frontend (new terminal, from project root)
cd teamflow-web
cp .env.local.example .env.local   # or set NEXTJS_INTERNAL_URL=http://localhost:3001
npm install
npm run dev                        # http://localhost:3000

# Legacy CDN frontend (optional, still works)
npx serve -p 3000 frontend
```

### Full Docker stack

```bash
# Build and run everything (backend + postgres + redis)
docker-compose up --build
# Next.js frontend (separate — no container yet)
cd teamflow-web && npm run dev
```

### JWT key generation

The backend uses RS256. Keys must be **base64-encoded** (not raw PEM) in `.env`:

```bash
openssl genrsa -out private.key 2048
openssl rsa -in private.key -pubout -out public.key
# Then base64-encode each for .env:
cat private.key | base64 -w 0   # → JWT_PRIVATE_KEY
cat public.key  | base64 -w 0   # → JWT_PUBLIC_KEY
```

---

## Architecture

```
frontend/            React 18 via CDN + Babel standalone (legacy, no build step)
teamflow-web/        Next.js 15 App Router (current frontend — BFF pattern)
  src/
    app/
      (auth)/login/  Login page (public)
      (app)/         Protected pages (dashboard, mytodo, approval, etc.)
      api/auth/      Login + logout BFF routes (set/clear HttpOnly cookies)
      api/proxy/     Generic API proxy → NestJS (injects Bearer server-side)
      api/sse/       Dedicated SSE streaming proxy
    components/
      layout/        Header, NavRail
      ui/            icons.jsx, primitives.jsx (Card, Btn, Badge…)
      features/      AddTodoPanel, DeferDialog, MultiSelectDropdown
    hooks/           useTicker, useSSE, useTodoEngine, useToasts, useReveal
    lib/             apiClient.js, utils.js, queryClient.js, constants.js
    store/           authStore.js (me, notifPrefs), uiStore.js (compact, persisted)
  middleware.js      Redirect unauthenticated → /login (checks tf_access cookie)
backend/src/
  modules/
    auth/            JWT RS256 login/refresh/logout
    todos/           CRUD + state machine + sessions
    users/           User management (CEO only)
    delegations/     Approval delegation (CEO assigns delegate per requestor)
    dashboard/       Today's stats + 7-day history
    reports/         Per-user daily report
    notifications/   Notification CRUD + SSE stream (sse/sse.service.ts)
    scheduler/       BullMQ auto-approve job at 09:00
    system-config/   Configurable approval deadline hour (defaults to 9)
    redis/           Shared Redis module (ioredis)
    prisma/          Shared PrismaService
  common/
    constants/       ALLOWED_TRANSITIONS map, queue names
    decorators/      @CurrentUser(), @Roles()
    enums/           TodoStatus, UserRole, etc.
    guards/          JwtAuthGuard, RolesGuard
    filters/         AllExceptionsFilter (pino logging)
    utils/           elapsed-seconds, working-day helpers
```

### Key architectural decisions

- **BFF (Backend-For-Frontend)** — The Next.js frontend (`teamflow-web/`) never exposes JWTs to the browser. Tokens live in HttpOnly cookies (`tf_access`, `tf_refresh`). All API calls go through `/api/proxy/[...path]`, which injects the Bearer header server-side. Auth routes at `/api/auth/login` and `/api/auth/logout` set/clear the cookies.
- **State machine** — `todo-state-machine.ts` defines `ALLOWED_TRANSITIONS`. All status changes go through `TodoStateMachineService.transition()`, which enforces valid moves.
- **Overtime** — Creating a todo that pushes daily total > 8 h lands it in `PENDING_OVERTIME_APPROVAL` instead of `PENDING_APPROVAL`. Overtime todos cannot be auto-approved.
- **Auto-approve** — BullMQ scheduler enqueues a delayed job per todo on creation (fires at 09:00 WIB). The `approval_deadline_hour` in `system_config` row (id=1) is the source of truth; seed ensures the row exists.
- **Delegation** — `ApprovalDelegation` is requestor-scoped: CEO delegates approval of member X's todos to delegate Y. `delegations.service.ts#resolveApprover()` and `#canApprove()` enforce this.
- **SSE transport** — The generic proxy buffers the response body, so SSE uses a dedicated `/api/sse` route that streams `upstream.body` directly. The legacy CDN frontend used `fetch` + `ReadableStream.getReader()` with a manual Bearer header.
- **Soft deletes** — All main models have `deletedAt`; Prisma middleware filters these out globally.
- **Refresh tokens** — Stored hashed in `RefreshToken` table (not Redis), supporting revocation. Rotated on every `/auth/refresh`.

---

## Database schema (9 models, 5 enums)

| Model | Notes |
|-------|-------|
| `User` | email, fullName, role (MEMBER/CEO), passwordHash, isActive, failedLoginAttempts, lockedUntil |
| `RefreshToken` | hashed tokens with expiresAt/revokedAt |
| `Todo` | title, description, estimatedHours, status, isOvertime, todoDate, totalSeconds |
| `TodoSession` | per-run session: startedAt, pausedAt, completedAt, elapsedSeconds |
| `TodoEvent` | audit log of every status transition |
| `ApprovalLog` | approval/rejection records with actor + isDelegateAction |
| `ApprovalDelegation` | CEO delegates requestorUserId→delegateUserId |
| `Notification` | typed notifications (see NotificationType enum) |
| `SystemConfig` | single-row config (id=1): approvalDeadlineHour |

Enums: `UserRole`, `TodoStatus`, `TodoTrigger`, `ApprovalAction`, `NotificationType`

---

## Frontend file map

### Next.js frontend (`teamflow-web/src/`)

| File | Contents |
|------|----------|
| `app/(auth)/login/page.jsx` | Login form; POST `/api/auth/login`, sets me in authStore, redirects to `/dashboard` |
| `app/(app)/dashboard/page.jsx` | Stats cards, animated bars, team hours — queries `['dashboard','today']` + `['dashboard','history']` |
| `app/(app)/mytodo/page.jsx` | Running todo + queue; mutations for start/pause/finish/archive/carry-over |
| `app/(app)/mytodo/[id]/page.jsx` | Todo detail with live timer (useTicker) |
| `app/(app)/pending/page.jsx` | Waiting + rejected todos; carry-over + delete + re-edit |
| `app/(app)/selesai/page.jsx` | Archived todos list |
| `app/(app)/approval/page.jsx` | Approval queue (CEO/delegate); approve/reject + countdown |
| `app/(app)/teamtodo/page.jsx` | All member todos with date/user/status filters + column sort |
| `app/(app)/laporan/page.jsx` | Weekly + daily reports with SVG download |
| `app/(app)/settings/page.jsx` | Profile, password, system config, notification prefs, logout |
| `app/(app)/users/page.jsx` | User management (CEO); create/edit/deactivate |
| `app/(app)/help/page.jsx` | Static FAQ, steps, rules |
| `components/layout/Header.jsx` | Topbar: page title, notifications flyout, theme toggle |
| `components/layout/NavRail.jsx` | Side nav; active item via `usePathname()` |
| `components/ui/icons.jsx` | 47 SVG icon components (`Icons.Home`, `Icons.Play`, …) |
| `components/ui/primitives.jsx` | Card, Btn, Badge, Field, Dialog, Panel, ToastHost, Avatar, … |
| `components/features/AddTodoPanel.jsx` | Create/edit todo panel; CEO can create for any member |
| `components/features/DeferDialog.jsx` | Defer todo with reason |
| `components/features/MultiSelectDropdown.jsx` | Multi-select with click-outside; shared by teamtodo + laporan |
| `lib/apiClient.js` | `apiGet`, `apiPost`, `apiPatch`, `apiDelete` → routes through `/api/proxy/*` |
| `lib/utils.js` | `fmtHMS`, `fmtClock`, `mapTodo`, `mapApprovalItem`, `mapUser`, `mapTeamHours`, … |
| `lib/constants.js` | `STATUS_META`, `NAV`, `NOTIF_KIND` — string `iconKey` values (file is `.js` not `.jsx`) |
| `store/authStore.js` | `me`, `notifPrefs`, `setMe`, `setNotifPrefs`, `clear` |
| `store/uiStore.js` | `compact`, `notifOpen`; `compact` persisted to localStorage |
| `hooks/useSSE.js` | Connects `/api/sse`; invalidates React Query on todo/notification events |
| `hooks/useTodoEngine.js` | 1 s interval: F1 browser notification (≤600 s remaining), F2 auto-stop |
| `hooks/useToasts.js` | Toast context provider + `useToasts()` hook |
| `hooks/useTicker.js` | 1 s interval that forces re-render (for live timers) |

### Legacy CDN frontend (`frontend/`)

| File | Contents |
|------|----------|
| `index.html` | All Fluent/WinUI3 CSS + mobile overrides + CDN `<script>` tags |
| `icons.jsx` | SVG icon components + `Spinner` |
| `api.jsx` | `window.API` — Auth, Todos, Dashboard, Reports, Notifications, Users, SSE |
| `data.jsx` | `window.TF` — formatters (`fmtHMS`, `fmtClock`) + mappers for API responses |
| `components.jsx` | `AppContext`, atom components (Card, Btn, Badge…), NavRail, Header, NotifFlyout |
| `pages1.jsx` | LoginPage, Dashboard, MyTodo, RunningTodoCard, QueueCard, TodoDetail |
| `pages2.jsx` | AddTodoPanel, ApprovalQueue, UserManagement, Laporan, Settings |
| `app.jsx` | App root: session restore, login/logout, data loaders, polling, SSE, all actions |

Global state in the legacy frontend lives on `AppContext` in `components.jsx`; all mutations flow down via context.

---

## Conventions

- **Language** — Backend: TypeScript strict. Next.js frontend: JSX (no TypeScript). Legacy frontend: JSX with Babel standalone (no types).
- **API prefix** — All routes under `/api/v1`.
- **Auth** — `JwtAuthGuard` is global (applied in `app.module.ts`). Use `@Public()` decorator to opt out. Role-based access uses `@Roles(UserRole.CEO)` + `RolesGuard`.
- **Error format** — `AllExceptionsFilter` normalises all errors to `{ statusCode, message, error, path, timestamp }`.
- **Logging** — `nestjs-pino` with `pino-pretty` in dev. Log level via `LOG_LEVEL` env var.
- **Rate limiting** — `@nestjs/throttler` (100 req / 60 s per IP by default, configurable via env).
- **Prisma** — Never call `prisma.model.delete()`; always set `deletedAt: new Date()`.

---

## Common tasks

**Add a new API endpoint**
1. Add DTO in `modules/<feature>/dto/`
2. Add service method in `<feature>.service.ts`
3. Add controller route in `<feature>.controller.ts`
4. No module changes needed unless it's a new feature module

**Change approval deadline hour at runtime**
- `PATCH /system-config` with `{ "approvalDeadlineHour": <0-23> }` (CEO only)
- The scheduler reads this from DB on each job execution

**Reset the database**
```bash
cd backend
npx prisma migrate reset   # drops + recreates + seeds
```

**Inspect the database**
```bash
cd backend
npx prisma studio          # opens GUI at http://localhost:5555
```
