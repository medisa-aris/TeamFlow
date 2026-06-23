# TeamFlow — Sistem Manajemen Todo Tim

> Aplikasi manajemen produktivitas harian berbasis approval, dibangun dengan NestJS (backend) dan Next.js 15 (frontend BFF). Dirancang **mobile-first** karena 90% pengguna mengakses melalui smartphone.

---

## Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Fitur Utama](#fitur-utama)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Prasyarat](#prasyarat)
- [Instalasi & Menjalankan](#instalasi--menjalankan)
- [Alur Kerja Aplikasi](#alur-kerja-aplikasi)
- [API Endpoint](#api-endpoint)
- [Skema Database](#skema-database)
- [Variabel Lingkungan](#variabel-lingkungan)
- [Desain UI](#desain-ui)

---

## Gambaran Umum

TeamFlow membantu tim kecil mengelola pekerjaan harian secara terstruktur melalui sistem **todo berbasis approval**. Setiap anggota tim mengajukan rencana kerja, CEO (atau delegasi) menyetujui atau menolak, dan sistem secara otomatis meng-approve jika tidak ada respons sebelum jam yang dikonfigurasi (default pukul 09:00).

```
Anggota buat todo → CEO approve/reject → Anggota mulai timer → Selesai
                         ↑
              Auto-approve jam 09:00 jika belum direspons
```

---

## Fitur Utama

### Anggota Tim (Member)
- **Buat Todo** — Ajukan rencana kerja dengan estimasi waktu (0.5–8 jam)
- **Timer Live** — Start, pause, resume, dan selesaikan todo dengan timer real-time
- **Status Tracking** — Pantau status todo: Menunggu Approval → Antrian → Berjalan → Selesai
- **Resubmit** — Edit dan ajukan ulang todo yang ditolak
- **Ganti Password** — Ubah password dari halaman Settings

### CEO / Approver
- **Approval Queue** — Lihat semua todo yang menunggu persetujuan
- **Info Beban Kerja** — Lihat jam yang sudah dipakai dan proyeksi dengan todo baru
- **Overtime Approval** — Todo yang melebihi 8 jam/hari mendapat label khusus dan perlu persetujuan eksplisit
- **Delegasi** — CEO bisa mendelegasikan wewenang approval ke anggota lain per requestor
- **Konfigurasi Sistem** — Atur jam auto-approve (approval deadline hour)

### Dashboard & Laporan
- **Dashboard Real-Time** — Status tim hari ini, jam kerja, dan todo yang berjalan
- **Grafik 7 Hari** — Visualisasi jam kerja tim per hari
- **Laporan Harian** — Detail produktivitas per anggota

### Notifikasi
- **SSE (Server-Sent Events)** — Update real-time tanpa polling berlebihan
- **Notifikasi In-App** — Todo disetujui, ditolak, atau perlu perhatian
- **Polling Fallback** — Refresh otomatis setiap 30 detik sebagai cadangan

### Manajemen User (CEO)
- Tambah dan nonaktifkan akun anggota tim
- Atur delegasi approval per requestor

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│                   Browser / Mobile                   │
│  Next.js 15 App Router (teamflow-web/)              │
│  React Query + Zustand + Fluent Design CSS          │
│  Tidak ada JWT di browser — HttpOnly cookies        │
└────────────────────┬────────────────────────────────┘
                     │ Cookie (tf_access, tf_refresh)
                     ▼
┌─────────────────────────────────────────────────────┐
│        Next.js BFF Layer  :3000                     │
│  /api/auth/login  → set HttpOnly cookies            │
│  /api/proxy/*     → inject Bearer, proxy ke NestJS  │
│  /api/sse         → streaming proxy ke NestJS       │
└────────────────────┬────────────────────────────────┘
                     │ Bearer token (server-to-server)
                     ▼
┌─────────────────────────────────────────────────────┐
│          NestJS Backend  :3001/api/v1               │
│                                                      │
│  Auth  │  Todos  │  Dashboard  │  Reports            │
│  Users │  Notif  │  Delegations│  SSE                │
│        │         │  SystemConfig                     │
│                                                      │
│  ┌──────────────┐   ┌──────────────────────────┐    │
│  │  Prisma ORM  │   │  BullMQ + Redis Queue     │    │
│  │  PostgreSQL  │   │  (auto-approve scheduler) │    │
│  └──────────────┘   └──────────────────────────┘    │
└─────────────────────────────────────────────────────┘
         │                        │
    PostgreSQL 16              Redis 7
```

---

## Tech Stack

### Backend
| Komponen | Teknologi |
|----------|-----------|
| Framework | NestJS 10 (TypeScript) |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 + BullMQ |
| Autentikasi | JWT RS256 — access token 15 menit, refresh token 7 hari |
| Real-time | Server-Sent Events (SSE) |
| Scheduler | BullMQ delayed jobs (auto-approve jam 09:00) |
| Logging | nestjs-pino + pino-pretty |
| Rate Limiting | @nestjs/throttler |

### Frontend (Next.js — `teamflow-web/`)
| Komponen | Teknologi |
|----------|-----------|
| Framework | Next.js 15 App Router |
| UI Library | React 18 (JSX, tanpa TypeScript) |
| Server State | @tanstack/react-query v5 |
| Client State | Zustand |
| Tema | next-themes (SSR-safe dark/light, `data-theme` attribute) |
| Desain | WinUI 3 / Fluent Design CSS (Mica blur, reveal hover) |
| Real-time | SSE via `/api/sse` BFF proxy + React Query invalidation |
| Autentikasi | HttpOnly cookies (`tf_access`, `tf_refresh`) — tidak ada JWT di browser |
| BFF proxy | `/api/proxy/[...path]` — inject Bearer header server-side |

---

## Struktur Proyek

```
TeamFlow/
├── backend/                        # NestJS API
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma           # 9 model, 5 enum
│   │   ├── seed.ts                 # Seed CEO + member + system_config
│   │   └── migrations/             # Prisma migrations
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/               # Login, refresh, logout (JWT RS256)
│   │   │   ├── todos/              # CRUD + lifecycle + state machine
│   │   │   ├── users/              # Manajemen pengguna
│   │   │   ├── delegations/        # Delegasi wewenang approval per requestor
│   │   │   ├── dashboard/          # Statistik tim hari ini & historis
│   │   │   ├── reports/            # Laporan per user
│   │   │   ├── notifications/      # Notifikasi + SSE stream
│   │   │   ├── scheduler/          # Auto-approve BullMQ processor
│   │   │   ├── system-config/      # Konfigurasi approval deadline hour
│   │   │   ├── redis/              # Redis module (ioredis)
│   │   │   └── prisma/             # Prisma service
│   │   └── common/
│   │       ├── constants/          # Todo state machine transitions, queue names
│   │       ├── decorators/         # @CurrentUser(), @Roles()
│   │       ├── enums/              # TodoStatus, UserRole, dll.
│   │       ├── guards/             # JwtAuthGuard, RolesGuard
│   │       ├── filters/            # AllExceptionsFilter
│   │       └── utils/              # elapsed-seconds, working-day helpers
│   ├── .env.example
│   └── package.json
│
├── teamflow-web/                   # Next.js 15 BFF frontend (default)
│   ├── middleware.js               # Cek tf_access cookie → redirect ke /login
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/       # Halaman login (publik)
│   │   │   ├── (app)/              # Halaman terproteksi
│   │   │   │   ├── dashboard/
│   │   │   │   ├── mytodo/ + [id]/
│   │   │   │   ├── pending/
│   │   │   │   ├── approval/
│   │   │   │   ├── teamtodo/
│   │   │   │   ├── laporan/
│   │   │   │   ├── selesai/
│   │   │   │   ├── settings/
│   │   │   │   ├── users/
│   │   │   │   └── help/
│   │   │   └── api/
│   │   │       ├── auth/login/     # Set HttpOnly cookies
│   │   │       ├── auth/logout/    # Hapus cookies
│   │   │       ├── proxy/[...path]/ # Forward ke NestJS + inject Bearer
│   │   │       └── sse/            # Streaming proxy SSE
│   │   ├── components/
│   │   │   ├── layout/             # Header, NavRail
│   │   │   ├── ui/                 # icons.jsx, primitives.jsx
│   │   │   └── features/           # AddTodoPanel, DeferDialog, MultiSelectDropdown
│   │   ├── hooks/                  # useSSE, useTodoEngine, useToasts, useTicker
│   │   ├── lib/                    # apiClient.js, utils.js, constants.js
│   │   └── store/                  # authStore.js, uiStore.js (Zustand)
│   └── package.json
│
├── frontend/                       # React SPA legacy (archived, tidak digunakan)
│   ├── index.html                  # CSS Fluent + mobile + CDN scripts
│   ├── icons.jsx                   # Semua ikon SVG Fluent
│   ├── api.jsx                     # window.API — service layer lengkap
│   ├── data.jsx                    # window.TF — mapper & helper
│   ├── components.jsx              # AppContext, atom UI, NavRail, Header
│   ├── pages1.jsx                  # Login, Dashboard, My Todo, Timer
│   ├── pages2.jsx                  # Approval, User Mgmt, Laporan, Settings
│   └── app.jsx                     # Root: auth, polling, SSE, semua aksi
│
├── docs/
│   ├── teamflow-srs-v1.1.md        # Software Requirements Specification
│   └── todo-team-wireframe.md      # UI wireframes
│
├── docker-compose.yml              # PostgreSQL + Redis + Backend
└── README.md
```

---

## Prasyarat

Pastikan sudah terpasang:

- **Node.js** v20+ dan **npm** v10+
- **Docker** dan **Docker Compose**
- **Git**

---

## Instalasi & Menjalankan

### 1. Clone repositori

```bash
git clone <repo-url>
cd TeamFlow
```

### 2. Jalankan infrastruktur (PostgreSQL + Redis)

```bash
docker-compose up -d postgres redis
```

### 3. Siapkan backend

```bash
cd backend

# Salin dan isi variabel lingkungan
cp .env.example .env
# Edit .env: isi JWT_PRIVATE_KEY dan JWT_PUBLIC_KEY (base64-encoded PEM)

# Install dependensi
npm install

# Jalankan migrasi database
npx prisma migrate deploy

# (Opsional) Seed data awal — CEO + beberapa Member + system_config
npx prisma db seed

# Jalankan server development
npm run start:dev
```

Backend berjalan di **http://localhost:3001**

### 4. Jalankan frontend

```bash
# Di terminal baru, dari root proyek
cd teamflow-web
npm install
npm run dev
```

Frontend berjalan di **http://localhost:3000**

### 5. Akses aplikasi

Buka **http://localhost:3000** di browser.

---

## Alur Kerja Aplikasi

### Alur Pengajuan Todo

```
1. Member buka halaman "My Todo"
2. Klik "Tambah Todo" → isi judul, deskripsi, estimasi waktu
3. Todo dikirim ke backend → status: PENDING_APPROVAL
4. CEO menerima notifikasi di Approval Queue
5. CEO approve/reject sebelum jam 09:00
   └─ Jika belum direspons → AUTO_APPROVED jam 09:00 (BullMQ)
6. Member menerima notifikasi hasil
7. Jika disetujui → todo masuk Antrian (status: APPROVED)
8. Member klik "Start" → timer mulai (status: ONGOING)
9. Bisa pause/resume (status: PAUSED ↔ ONGOING)
10. Klik "Selesai" → (status: DONE)
```

### Status Todo

```
PENDING_APPROVAL
PENDING_OVERTIME_APPROVAL  ──→  APPROVED / REJECTED
                                    ↓
                               AUTO_APPROVED (jam 09:00)
                                    ↓
                               ONGOING ←──→ PAUSED
                                    ↓
                                  DONE
```

### Aturan Overtime

- Total jam harian melebihi **8 jam** → status `PENDING_OVERTIME_APPROVAL`
- Perlu approval eksplisit dari CEO (tidak bisa auto-approve)
- Ditampilkan dengan label **"Overtime"** di Approval Queue

---

## API Endpoint

Base URL: `http://localhost:3001/api/v1`

### Autentikasi
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/auth/login` | Login — kembalikan access + refresh token |
| POST | `/auth/refresh` | Perbarui access token |
| POST | `/auth/logout` | Invalidasi refresh token |
| PATCH | `/auth/change-password` | Ganti password |

### Todo
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/todos` | Daftar todo hari ini milik user |
| POST | `/todos` | Buat todo baru |
| GET | `/todos/pending-approvals` | Todo menunggu approval (CEO/delegate) |
| POST | `/todos/:id/start` | Mulai todo |
| POST | `/todos/:id/pause` | Jeda todo |
| POST | `/todos/:id/resume` | Lanjutkan todo yang dijeda |
| POST | `/todos/:id/complete` | Selesaikan todo |
| PATCH | `/todos/:id/approve` | Setujui todo (CEO/delegate) |
| PATCH | `/todos/:id/reject` | Tolak todo (CEO/delegate) |

### Dashboard & Laporan
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/dashboard/today` | Statistik tim hari ini |
| GET | `/dashboard/history?days=7` | Historis jam kerja tim |
| GET | `/reports/user/:userId` | Detail laporan per user |

### Pengguna & Delegasi
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/users` | Daftar semua pengguna (CEO) |
| POST | `/users` | Buat pengguna baru (CEO) |
| PATCH | `/users/:id` | Update nama / status aktif (CEO) |
| POST | `/delegations` | Buat delegasi approval (CEO) |
| DELETE | `/delegations/:id` | Cabut delegasi (CEO) |

### Notifikasi & SSE
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/notifications` | Daftar notifikasi user |
| PATCH | `/notifications/:id/read` | Tandai sudah dibaca |
| GET | `/events/stream` | SSE stream (Bearer token di header) |

### Konfigurasi Sistem
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/system-config` | Baca konfigurasi sistem (CEO) |
| PATCH | `/system-config` | Update approval deadline hour (CEO) |

---

## Skema Database

```
User ─────────────┬──── Todo ──────────── TodoSession
  │               │       │
  │               │       ├──── TodoEvent
  │               │       └──── ApprovalLog
  │               │
  └── ApprovalDelegation
  └── RefreshToken

User ──── Notification
SystemConfig (single-row config)
```

**Model utama (9 model, 5 enum):**
- `User` — id, email, fullName, role (MEMBER/CEO), passwordHash, isActive, failedLoginAttempts, lockedUntil
- `RefreshToken` — hashed refresh tokens dengan expiresAt/revokedAt
- `Todo` — id, title, description, estimatedHours, status, isOvertime, todoDate, totalSeconds
- `TodoSession` — id, todoId, startedAt, pausedAt, completedAt, elapsedSeconds
- `TodoEvent` — audit log setiap transisi status (fromStatus, toStatus, triggeredBy)
- `ApprovalLog` — id, todoId, actorId, action, reason, isDelegateAction, actionedAt
- `ApprovalDelegation` — requestorUserId, delegateUserId, delegatedByUserId, activeFrom, activeUntil
- `Notification` — id, recipientUserId, actorUserId, todoId, type, title, body, readAt
- `SystemConfig` — single row (id=1): approvalDeadlineHour

---

## Variabel Lingkungan

Salin `backend/.env.example` ke `backend/.env` lalu isi:

```env
# App
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://teamflow:password@localhost:5432/teamflow"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT (RS256) — base64-encoded PEM strings
JWT_PRIVATE_KEY=<base64-encoded private key>
JWT_PUBLIC_KEY=<base64-encoded public key>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info

# Rate limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### Generate JWT Key Pair

```bash
# Generate keys
openssl genrsa -out private.key 2048
openssl rsa -in private.key -pubout -out public.key

# Base64-encode untuk .env
cat private.key | base64 -w 0   # → JWT_PRIVATE_KEY
cat public.key  | base64 -w 0   # → JWT_PUBLIC_KEY
```

---

## Desain UI

Antarmuka menggunakan sistem desain **WinUI 3 / Fluent Design** dari Microsoft:

- **Mica/Acrylic blur** — latar belakang transparan dengan blur
- **Reveal hover** — efek highlight mengikuti posisi kursor
- **Dark / Light theme** — toggle di header, disimpan di localStorage
- **Animasi Fluent** — transisi halus dengan `cubic-bezier(.33,1,.68,1)`

### Responsif Mobile-First

| Breakpoint | Layout |
|------------|--------|
| Desktop (>900px) | Navigation rail kiri 240px |
| Tablet (≤900px) | Navigation rail kompak 56px |
| Mobile (≤600px) | **Bottom tab bar** + bottom-sheet dialog |
| Kecil (≤380px) | Satu kolom penuh |

Semua tombol dan elemen interaktif memiliki area sentuh minimum **44×44px** di perangkat mobile.

---

## Lisensi

Proyek ini dibuat untuk kebutuhan internal tim. Hak cipta © 2026.
