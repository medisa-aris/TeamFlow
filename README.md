# TeamFlow — Sistem Manajemen Todo Tim

> Aplikasi manajemen produktivitas harian berbasis approval, dibangun dengan NestJS (backend) dan React 18 (frontend). Dirancang **mobile-first** karena 90% pengguna mengakses melalui smartphone.

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

TeamFlow membantu tim kecil mengelola pekerjaan harian secara terstruktur melalui sistem **todo berbasis approval**. Setiap anggota tim mengajukan rencana kerja, CEO (atau delegasi) menyetujui atau menolak, dan sistem secara otomatis meng-approve jika tidak ada respons sebelum pukul 09:00.

```
Anggota buat todo → CEO approve/reject → Anggota mulai timer → Selesai
                         ↑
              Auto-approve jam 09:00 jika belum direspons
```

---

## Fitur Utama

### 👤 Anggota Tim (Member)
- **Buat Todo** — Ajukan rencana kerja dengan estimasi waktu (0.5–2 jam)
- **Timer Live** — Start, pause, resume, dan selesaikan todo dengan timer real-time
- **Status Tracking** — Pantau status todo: Menunggu Approval → Antrian → Berjalan → Selesai
- **Resubmit** — Edit dan ajukan ulang todo yang ditolak

### 👔 CEO / Approver
- **Approval Queue** — Lihat semua todo yang menunggu persetujuan
- **Info Beban Kerja** — Lihat jam yang sudah dipakai dan proyeksi dengan todo baru
- **Overtime Approval** — Todo yang melebihi 8 jam/hari mendapat label khusus
- **Delegasi** — CEO bisa mendelegasikan wewenang approval ke anggota lain

### 📊 Dashboard & Laporan
- **Dashboard Real-Time** — Status tim hari ini, jam kerja, dan todo yang berjalan
- **Grafik 7 Hari** — Visualisasi jam kerja tim per hari
- **Laporan Harian** — Detail produktivitas per anggota

### 🔔 Notifikasi
- **SSE (Server-Sent Events)** — Update real-time tanpa polling berlebihan
- **Notifikasi In-App** — Todo disetujui, ditolak, atau perlu perhatian
- **Polling Fallback** — Refresh otomatis setiap 30 detik sebagai cadangan

### ⚙️ Manajemen User (CEO)
- Tambah dan nonaktifkan akun anggota tim
- Atur delegasi approval

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│                   Browser / Mobile                   │
│  React 18 (CDN) + Babel + WinUI 3 Fluent Design CSS │
│  frontend/ (static files, no build step)            │
└────────────────────┬────────────────────────────────┘
                     │ HTTP + SSE
                     ▼
┌─────────────────────────────────────────────────────┐
│          NestJS Backend  :3001/api/v1               │
│                                                      │
│  Auth  │  Todos  │  Dashboard  │  Reports            │
│  Users │  Notif  │  Delegations│  SSE                │
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
| Framework | NestJS (TypeScript) |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 + BullMQ |
| Autentikasi | JWT RS256 — access token 15 menit, refresh token 7 hari |
| Real-time | Server-Sent Events (SSE) |
| Scheduler | BullMQ delayed jobs (auto-approve jam 09:00) |

### Frontend
| Komponen | Teknologi |
|----------|-----------|
| UI Library | React 18 via CDN (tanpa build step) |
| Transpiler | Babel Standalone |
| Desain | WinUI 3 / Fluent Design CSS (Mica blur, reveal hover) |
| Tema | Dark / Light (toggle) |
| Real-time | Fetch-based SSE + polling 30 detik |
| Penyimpanan | localStorage (`tf_access`, `tf_refresh`, `tf_user`) |

---

## Struktur Proyek

```
TeamFlow/
├── backend/                        # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma           # 8 model, 5 enum
│   │   └── migrations/             # Prisma migrations
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/               # Login, refresh, logout (JWT RS256)
│   │   │   ├── todos/              # CRUD + lifecycle + state machine
│   │   │   ├── users/              # Manajemen pengguna
│   │   │   ├── delegations/        # Delegasi wewenang approval
│   │   │   ├── dashboard/          # Statistik tim hari ini & historis
│   │   │   ├── reports/            # Laporan per user
│   │   │   ├── notifications/      # Notifikasi + SSE stream
│   │   │   ├── scheduler/          # Auto-approve BullMQ processor
│   │   │   ├── redis/              # Redis module
│   │   │   └── prisma/             # Prisma service
│   │   └── common/
│   │       ├── constants/          # Todo state machine transitions
│   │       └── decorators/         # @CurrentUser(), @Roles()
│   ├── .env.example
│   └── package.json
│
├── frontend/                       # React SPA (static, no build)
│   ├── index.html                  # CSS Fluent + mobile + CDN scripts
│   ├── icons.jsx                   # Semua ikon SVG Fluent
│   ├── api.jsx                     # window.API — service layer lengkap
│   ├── data.jsx                    # window.TF — mapper & helper
│   ├── components.jsx              # AppContext, atom UI, NavRail, Header
│   ├── pages1.jsx                  # Login, Dashboard, My Todo, Timer
│   ├── pages2.jsx                  # Approval, User Mgmt, Laporan, Settings
│   └── app.jsx                     # Root: auth, polling, SSE, semua aksi
│
├── migrations/
│   └── 001_init.sql                # DDL lengkap (PostgreSQL)
│
├── docker-compose.yml              # PostgreSQL + Redis
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
# Edit .env: isi DATABASE_URL, JWT_PRIVATE_KEY, JWT_PUBLIC_KEY, REDIS_URL

# Install dependensi
npm install

# Jalankan migrasi database
npx prisma migrate deploy

# (Opsional) Seed data awal — CEO + beberapa Member
npx prisma db seed

# Jalankan server development
npm run start:dev
```

Backend berjalan di **http://localhost:3001**

### 4. Jalankan frontend

```bash
# Di terminal baru, dari root proyek
npx serve -p 3000 frontend
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

### Todo
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/todos` | Daftar todo hari ini milik user |
| POST | `/todos` | Buat todo baru |
| GET | `/todos/pending-approvals` | Todo menunggu approval (CEO) |
| POST | `/todos/:id/start` | Mulai todo |
| POST | `/todos/:id/pause` | Jeda todo |
| POST | `/todos/:id/resume` | Lanjutkan todo yang dijeda |
| POST | `/todos/:id/complete` | Selesaikan todo |
| PATCH | `/todos/:id/approve` | Setujui todo (CEO) |
| PATCH | `/todos/:id/reject` | Tolak todo (CEO) |

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

---

## Skema Database

```
User ─────────────┬──── Todo ──────────── TodoSession
  │               │       │
  │               │       └──── ApprovalLog
  │               │
  └── Delegation ─┘

User ──── Notification
```

**Model utama:**
- `User` — id, email, fullName, role (MEMBER/CEO), passwordHash, isActive
- `Todo` — id, title, description, estimatedHours, status, isOvertime, userId
- `TodoSession` — id, todoId, startedAt, pausedAt, completedAt, elapsedSeconds
- `ApprovalLog` — id, todoId, actorId, action, reason, actionedAt
- `Notification` — id, userId, type, title, body, readAt
- `Delegation` — id, delegatorId (CEO), delegateeId, requestorId, isActive

---

## Variabel Lingkungan

Salin `backend/.env.example` ke `backend/.env` lalu isi:

```env
# Database
DATABASE_URL="postgresql://teamflow:teamflow@localhost:5432/teamflow"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT (RS256) — generate dengan: openssl genrsa -out private.pem 2048
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development
```

### Generate JWT Key Pair

```bash
# Private key
openssl genrsa -out private.pem 2048

# Public key
openssl rsa -in private.pem -pubout -out public.pem

# Konversi ke satu baris untuk .env
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' private.pem
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' public.pem
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
