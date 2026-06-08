# 📋 Team Todo App — Struktur Halaman & Wireframe

---

## 🗂️ TOTAL HALAMAN: 8 Page

| No | Halaman | Role |
|----|---------|------|
| 1 | Login | Semua |
| 2 | Dashboard Overview | Semua |
| 3 | My Todo (List + Form) | Member |
| 4 | Todo Detail / Timer | Member |
| 5 | Approval Queue | CEO |
| 6 | User Management | CEO/Admin |
| 7 | Laporan Harian per Orang | Semua |
| 8 | Settings / Profile | Semua |

---

## 🔄 NAVIGATION FLOW

```mermaid
flowchart TD
    A([🌐 Login Page]) --> B{Role?}
    B -->|CEO| C[Dashboard Overview]
    B -->|Member| C

    C --> D[My Todo Page]
    C --> E[Approval Queue]
    C --> F[Laporan Harian]
    C --> G[User Management]
    C --> H[Settings / Profile]

    D --> I[Todo Detail + Timer]
    I -->|Back| D

    E -->|Approve / Reject| D
    G -->|Edit User| G

    style A fill:#1a1a2e,color:#fff
    style C fill:#16213e,color:#fff
    style E fill:#e94560,color:#fff
```

---

## PAGE 1 — LOGIN

```
┌─────────────────────────────────────────┐
│                                         │
│           🏢 TeamFlow                   │
│        Todo Management System           │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  📧  email@company.com            │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  🔒  ••••••••••                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │         MASUK  →                  │  │
│  └───────────────────────────────────┘  │
│                                         │
│         Lupa password?                  │
└─────────────────────────────────────────┘
```

---

## PAGE 2 — DASHBOARD OVERVIEW

```
┌──────────────────────────────────────────────────────────────────┐
│ 🏢 TeamFlow          [Notif 🔔 3]     [Avatar] Budi (CEO)  [≡]  │
├──────────┬───────────────────────────────────────────────────────┤
│          │                                                        │
│  [🏠]    │  📊 DASHBOARD — Senin, 2 Jun 2025                    │
│  Home    │                                                        │
│  [✅]    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  My Todo │  │ Total    │ │ Ongoing  │ │ Menunggu │ │ Selesai│  │
│  [📋]    │  │ Anggota  │ │ Sekarang │ │ Approval │ │  Hari  │  │
│  Approval│  │   12     │ │    4     │ │    2     │ │  ini   │  │
│  [📈]    │  │ 👥       │ │ 🔄       │ │ ⏳       │  │   8   │  │
│  Laporan │  └──────────┘ └──────────┘ └──────────┘ └────────┘  │
│  [👥]    │                                                        │
│  Users   │  ── JAM KERJA TIM HARI INI ──────────────────────    │
│  [⚙️]    │                                                        │
│  Settings│  Andi    ████████████░░░░  6/8 jam  [🔄 Ongoing]     │
│          │  Budi    ████████████████  8/8 jam  [✅ Selesai]      │
│          │  Citra   ████░░░░░░░░░░░░  2/8 jam  [⏸ Paused]      │
│          │  Deni    ░░░░░░░░░░░░░░░░  0/8 jam  [💤 Idle]        │
│          │  Eka     ██████████░░░░░░  5/8 jam  [🔄 Ongoing]     │
│          │                                                        │
│          │  ── GRAFIK 7 HARI TERAKHIR ──────────────────────    │
│          │                                                        │
│          │  8 │  ▄  ▄  ▄        ▄  ▄                           │
│          │  6 │  █  █  █  ▄  ▄  █  █                           │
│          │  4 │  █  █  █  █  █  █  █                           │
│          │  2 │  █  █  █  █  █  █  █                           │
│          │  0 └───────────────────────                          │
│          │     Sen Sel Rab Kam Jum Sab Min                      │
│          │                                                        │
└──────────┴────────────────────────────────────────────────────────┘
```

---

## PAGE 3 — MY TODO (LIST)

```
┌──────────────────────────────────────────────────────────────────┐
│ 🏢 TeamFlow                              [Andi] [🔔] [≡]        │
├──────────┬───────────────────────────────────────────────────────┤
│          │                                                        │
│  [🏠]    │  ✅ MY TODO — Senin, 2 Jun 2025                      │
│  [✅] ←  │                                                        │
│  [📋]    │  Sisa jam hari ini: ░░░░░░████  5/8 jam terpakai     │
│  [📈]    │                                                        │
│  [👥]    │  [ + Tambah Todo Baru ]  [ 🔍 Filter ▼ ]            │
│  [⚙️]    │                                                        │
│          │  ┌─────────────────────────────────────────────────┐  │
│          │  │ 🔄 SEDANG BERJALAN                              │  │
│          │  │─────────────────────────────────────────────────│  │
│          │  │ Desain UI Halaman Login          ⏱ 00:45:12    │  │
│          │  │ Mulai: 08:00  │  Est: 1 jam                     │  │
│          │  │ [⏸ PAUSE]              [✅ SELESAI]             │  │
│          │  └─────────────────────────────────────────────────┘  │
│          │                                                        │
│          │  ── MENUNGGU APPROVAL ────────────────────────────    │
│          │  ┌─────────────────────────────────────────────────┐  │
│          │  │ ⏳ Review API Endpoint        Est: 1.5 jam      │  │
│          │  │ Diajukan: 08:45  │  Batas approve: 09:00        │  │
│          │  └─────────────────────────────────────────────────┘  │
│          │                                                        │
│          │  ── ANTRIAN ───────────────────────────────────────    │
│          │  ┌─────────────────────────────────────────────────┐  │
│          │  │ 🟡 Fix Bug Login Flow          Est: 0.5 jam     │  │
│          │  │ ✅ Approved  │  [▶ START]                       │  │
│          │  └─────────────────────────────────────────────────┘  │
│          │  ┌─────────────────────────────────────────────────┐  │
│          │  │ 🔴 Testing Payment Module      Est: 2 jam       │  │
│          │  │ ❌ Rejected — "Terlalu lama, pecah jadi 2"      │  │
│          │  │ [✏️ Edit & Resubmit]                            │  │
│          │  └─────────────────────────────────────────────────┘  │
│          │                                                        │
│          │  ── SELESAI HARI INI ───────────────────────────────   │
│          │  ✅ Setup Database Schema  1 jam   08:00–09:00        │
│          │  ✅ Dokumentasi API        0.5 jam  09:15–09:45       │
└──────────┴────────────────────────────────────────────────────────┘
```

---

## PAGE 3B — FORM TAMBAH TODO (Modal / Slide-in Panel)

```
┌──────────────────────────────────────────┐
│  ✏️ Tambah Todo Baru              [✕]   │
├──────────────────────────────────────────┤
│                                          │
│  Judul *                                 │
│  ┌──────────────────────────────────┐   │
│  │  Desain halaman dashboard...     │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Deskripsi                               │
│  ┌──────────────────────────────────┐   │
│  │                                  │   │
│  │  Buat wireframe dan implementasi │   │
│  │  komponen React...               │   │
│  │                                  │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Estimasi Waktu *                        │
│  ┌────────────────┐                      │
│  │  [ 0.5 jam ▼] │  (0.5 / 1 / 1.5 / 2)│
│  └────────────────┘                      │
│                                          │
│  ⚠️  Sisa jam hari ini: 3 jam            │
│  ✅  Dalam batas normal (≤ 8 jam/hari)   │
│                                          │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  ℹ️  Todo akan dikirim ke CEO untuk      │
│      approval. Auto-approve jika CEO     │
│      belum approve sebelum 09:00.        │
│                                          │
│  [ BATAL ]          [ 📤 AJUKAN ]        │
└──────────────────────────────────────────┘
```

---

## PAGE 4 — TODO DETAIL + TIMER

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Kembali ke My Todo                                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  🔄 SEDANG BERJALAN                          [✅ Approved]       │
│                                                                    │
│  Desain UI Halaman Login                                          │
│  ─────────────────────────────────────────────────────────────   │
│  📝 Membuat komponen form login dengan validasi, responsive       │
│     layout, dan integrasi dengan auth API.                        │
│                                                                    │
│  📅 Dibuat     :  Senin, 2 Jun 2025 — 07:45                      │
│  ▶️  Mulai      :  08:00                                          │
│  ⏱  Estimasi   :  1 jam                                          │
│  🏁 Target Selesai: 09:00                                         │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │                   00 : 47 : 23                              │ │
│  │                  SEDANG BERJALAN                            │ │
│  │                                                             │ │
│  │   Progress: ████████████████████░░░░  79%                  │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────┐          ┌──────────────────────────────────┐  │
│  │  ⏸  PAUSE   │          │        ✅  TANDAI SELESAI        │  │
│  └──────────────┘          └──────────────────────────────────┘  │
│                                                                    │
│  ── RIWAYAT SESI ───────────────────────────────────────────     │
│  ▶ 08:00 → 08:30  (30 menit)                                     │
│  ⏸ 08:30 → 08:45  (Pause — mengerjakan hal lain)                 │
│  ▶ 08:45 → Sekarang (47 menit berjalan)                          │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## PAGE 5 — APPROVAL QUEUE (CEO Only)

```
┌──────────────────────────────────────────────────────────────────┐
│ 🏢 TeamFlow                    [CEO: Budi]  [🔔 2 pending]      │
├──────────┬───────────────────────────────────────────────────────┤
│          │                                                        │
│  [🏠]    │  📋 APPROVAL QUEUE                                    │
│  [✅]    │                                                        │
│  [📋] ←  │  ⏰ Batas waktu approve: 09:00 pagi                   │
│  [📈]    │  🕐 Sekarang: 08:32 — Tersisa 28 menit               │
│  [👥]    │                                                        │
│  [⚙️]    │  ── MENUNGGU APPROVAL (2) ──────────────────────────  │
│          │                                                        │
│          │  ┌─────────────────────────────────────────────────┐  │
│          │  │ 👤 Andi Pratama                  08:45 diajukan │  │
│          │  │─────────────────────────────────────────────────│  │
│          │  │ 📌 Review API Endpoint           Est: 1.5 jam   │  │
│          │  │ "Review dokumentasi dan testing endpoint        │  │
│          │  │  autentikasi user sebelum deploy ke staging."   │  │
│          │  │                                                  │  │
│          │  │ Jam dipakai hari ini: 5/8 jam                   │  │
│          │  │ Dengan ini: 6.5/8 jam ✅                        │  │
│          │  │                                                  │  │
│          │  │ Catatan (opsional):                             │  │
│          │  │ ┌──────────────────────────────────────────┐   │  │
│          │  │ │                                          │   │  │
│          │  │ └──────────────────────────────────────────┘   │  │
│          │  │                                                  │  │
│          │  │  [ ❌ TOLAK ]           [ ✅ APPROVE ]         │  │
│          │  └─────────────────────────────────────────────────┘  │
│          │                                                        │
│          │  ┌─────────────────────────────────────────────────┐  │
│          │  │ 👤 Citra Dewi                    08:50 diajukan │  │
│          │  │─────────────────────────────────────────────────│  │
│          │  │ 📌 Overtime: Lanjut Testing      Est: 1 jam    │  │
│          │  │ "Testing sudah 8 jam tapi belum selesai."      │  │
│          │  │                                                  │  │
│          │  │ ⚠️  OVERTIME REQUEST — Sudah 8/8 jam            │  │
│          │  │ Dengan ini: 9/8 jam (PERLU APPROVAL KHUSUS)    │  │
│          │  │                                                  │  │
│          │  │  [ ❌ TOLAK ]           [ ✅ APPROVE OVERTIME ] │  │
│          │  └─────────────────────────────────────────────────┘  │
│          │                                                        │
│          │  ── SUDAH DIPROSES HARI INI ────────────────────────  │
│          │  ✅ Deni — Fix bug login    08:10  Approved           │
│          │  ❌ Eka — Redesign navbar   08:30  Ditolak            │
└──────────┴────────────────────────────────────────────────────────┘
```

---

## PAGE 6 — USER MANAGEMENT (CEO/Admin)

```
┌──────────────────────────────────────────────────────────────────┐
│ 🏢 TeamFlow                                     [CEO: Budi]      │
├──────────┬───────────────────────────────────────────────────────┤
│          │                                                        │
│  [🏠]    │  👥 USER MANAGEMENT                                   │
│  [✅]    │                                                        │
│  [📋]    │  [ + Tambah User ]    [ 🔍 Cari nama/email... ]      │
│  [📈]    │                                                        │
│  [👥] ←  │  ┌────┬──────────────┬────────────┬──────┬────────┐  │
│  [⚙️]    │  │ #  │ Nama         │ Email      │ Role │ Status │  │
│          │  ├────┼──────────────┼────────────┼──────┼────────┤  │
│          │  │ 1  │ Budi Santoso │ budi@...   │ CEO  │ 🟢 Aktif│ │
│          │  │ 2  │ Andi Pratama │ andi@...   │Member│ 🟢 Aktif│ │
│          │  │ 3  │ Citra Dewi   │ citra@...  │Member│ 🟢 Aktif│ │
│          │  │ 4  │ Deni Hasan   │ deni@...   │Member│ 🔴 Non │ │
│          │  │ 5  │ Eka Putri    │ eka@...    │Member│ 🟢 Aktif│ │
│          │  └────┴──────────────┴────────────┴──────┴────────┘  │
│          │                    [✏️ Edit]  [🗑️ Hapus] per baris    │
│          │                                                        │
│          │  ── FORM EDIT / TAMBAH USER (inline) ──────────────   │
│          │  ┌─────────────────────────────────────────────────┐  │
│          │  │ Nama  [____________________]                    │  │
│          │  │ Email [____________________]                    │  │
│          │  │ Role  [Member ▼]                                │  │
│          │  │ Status [Aktif ▼]                                │  │
│          │  │ Password Baru [____________] (kosong = tidak    │  │
│          │  │                               diubah)           │  │
│          │  │              [ BATAL ]  [ SIMPAN ]              │  │
│          │  └─────────────────────────────────────────────────┘  │
└──────────┴────────────────────────────────────────────────────────┘
```

---

## PAGE 7 — LAPORAN HARIAN

```
┌──────────────────────────────────────────────────────────────────┐
│ 🏢 TeamFlow                                                       │
├──────────┬───────────────────────────────────────────────────────┤
│          │                                                        │
│  [🏠]    │  📈 LAPORAN HARIAN                                    │
│  [✅]    │                                                        │
│  [📋]    │  Tampilkan:  [Semua ▼]  Periode: [Minggu ini ▼]      │
│  [📈] ←  │  Filter user: [Semua ▼]                               │
│  [👥]    │                                                        │
│  [⚙️]    │  ── RINGKASAN MINGGU INI ──────────────────────────   │
│          │                                                        │
│          │       Sen  Sel  Rab  Kam  Jum                         │
│          │  Andi  8    7    8    6    8    = 37 jam               │
│          │  Citra 8    8    5    8    8    = 37 jam               │
│          │  Deni  6    7    8    8    7    = 36 jam               │
│          │  Eka   8    8    8    7    6    = 37 jam               │
│          │                                                        │
│          │  ── DETAIL HARI INI: SENIN ────────────────────────   │
│          │                                                        │
│          │  👤 Andi Pratama — 6/8 jam                            │
│          │  ┌─────────────────────────────────────────────────┐  │
│          │  │ 08:00 Setup DB Schema          ████  1 jam  ✅  │  │
│          │  │ 09:15 Dokumentasi API          ██    0.5 jam ✅  │  │
│          │  │ 10:00 Desain UI Login          ████  1 jam  🔄  │  │
│          │  │ [pause] 08:30-08:45 (15 menit)                  │  │
│          │  └─────────────────────────────────────────────────┘  │
│          │                                                        │
│          │  👤 Citra Dewi — 2/8 jam                              │
│          │  ┌─────────────────────────────────────────────────┐  │
│          │  │ 08:00 Testing Login Module     ████  2 jam  ✅  │  │
│          │  │ ⏸  Sedang Pause                                 │  │
│          │  └─────────────────────────────────────────────────┘  │
└──────────┴────────────────────────────────────────────────────────┘
```

---

## PAGE 8 — SETTINGS / PROFILE

```
┌──────────────────────────────────────────────────────────────────┐
│ 🏢 TeamFlow                                                       │
├──────────┬───────────────────────────────────────────────────────┤
│          │                                                        │
│  [🏠]    │  ⚙️  SETTINGS & PROFILE                              │
│  [✅]    │                                                        │
│  [📋]    │  ── PROFIL SAYA ────────────────────────────────────  │
│  [📈]    │  ┌──────────┐                                         │
│  [👥]    │  │ [Avatar] │  Andi Pratama                           │
│  [⚙️] ←  │  │  👤      │  andi@company.com  │  Member            │
│          │  └──────────┘  [ Ganti Foto ]                         │
│          │                                                        │
│          │  Nama  [Andi Pratama_________]                        │
│          │  Email [andi@company.com_____]                        │
│          │  Password Lama   [____________]                        │
│          │  Password Baru   [____________]                        │
│          │  Konfirmasi      [____________]                        │
│          │                          [ SIMPAN PERUBAHAN ]         │
│          │                                                        │
│          │  ── PREFERENSI NOTIFIKASI ────────────────────────    │
│          │  🔔 Notifikasi todo approved     [ON  ●────]          │
│          │  🔔 Notifikasi todo rejected     [ON  ●────]          │
│          │  🔔 Reminder 30 menit sebelum    [OFF ────○]          │
│          │     batas jam harian                                   │
│          │                                                        │
│          │  ── ZONA WAKTU ─────────────────────────────────────  │
│          │  [Asia/Jakarta (WIB) ▼]                               │
│          │                                                        │
│          │  ────────────────────────────────────────────────     │
│          │  [ 🚪 KELUAR / LOGOUT ]                               │
│          │                                                        │
└──────────┴────────────────────────────────────────────────────────┘
```

---

## 🔄 BUSINESS LOGIC FLOW

```mermaid
flowchart TD
    A([Member buat Todo]) --> B[Isi: Judul, Deskripsi, Estimasi]
    B --> C{Total jam hari ini\n≤ 8 jam?}
    C -->|Ya ≤ 8 jam| D[Status: Menunggu Approval]
    C -->|Tidak > 8 jam| E[⚠️ Overtime Request\nStatus: Menunggu Approval Khusus]
    D --> F{CEO Approve\nsebelum 09:00?}
    E --> F
    F -->|Ya, Approve| G[Status: Approved — Siap Dikerjakan]
    F -->|Tidak, Reject| H[Status: Rejected\nMember revisi/hapus]
    F -->|Tidak ada aksi\nsetelah 09:00| I[⚡ AUTO APPROVE\nStatus: Approved]
    G --> J([Member klik START])
    J --> K[Timer berjalan\nStatus: Ongoing]
    K --> L{Member klik?}
    L -->|PAUSE| M[Timer berhenti\nBisa start todo lain]
    M -->|Resume| K
    L -->|SELESAI| N[✅ Todo Selesai\nWaktu tercatat]

    style I fill:#ff9800,color:#fff
    style N fill:#4caf50,color:#fff
    style H fill:#f44336,color:#fff
```

---

## ⏱️ ATURAN WAKTU

```mermaid
flowchart LR
    A[Todo dibuat] --> B{Jam berapa\nsekarang?}
    B -->|Sebelum 09:00| C[Kirim notif ke CEO]
    B -->|Setelah 09:00| D[⚡ Langsung Auto-Approve]
    C --> E{CEO aksi\nsebelum 09:00?}
    E -->|Approve| F[✅ Approved]
    E -->|Reject| G[❌ Rejected]
    E -->|Tidak ada aksi| H[⚡ Auto-Approve\npada 09:00]

    style D fill:#ff9800,color:#000
    style H fill:#ff9800,color:#000
```

---

## 📐 RINGKASAN KOMPONEN UTAMA

| Komponen | Keterangan |
|----------|-----------|
| **Sidebar Navigasi** | Tetap di semua halaman, ikon + label |
| **Header Bar** | Logo, notifikasi, avatar user |
| **Progress Bar Jam** | Visual sisa jam hari ini |
| **Timer Countdown** | Live timer di halaman detail todo |
| **Approval Card** | Card dengan tombol approve/reject + catatan |
| **Activity Bar Chart** | Grafik jam kerja per hari |
| **Status Badge** | Pending / Approved / Rejected / Ongoing / Paused / Done |
| **Toast Notification** | Pop-up saat status berubah |
