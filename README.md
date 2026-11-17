# PERMATA — Platform Resiliensi Mental & Pendampingan Anak Kebencanaan

**PERMATA** (*Platform Integrasi Pendidikan Resiliensi Mental & Pendampingan Anak dalam Konteks Kebencanaan*) adalah ekosistem aplikasi web dan REST API berbasis kearifan lokal Nusantara untuk mendukung kesiapsiagaan bencana, respons darurat psikososial (*Psychological First Aid*), serta pertumbuhan pascatrauma (*Post-Traumatic Growth*).

Repositori ini dikelola sebagai **Turborepo Monorepo** menggunakan **pnpm** dengan aplikasi web **Next.js 16** (`apps/web`) dan layanan backend **Express + TypeScript + Prisma** (`apps/api`).

---

## Ringkasan Fitur

### Aplikasi Web (`apps/web`)
- **Geo-Cultural Tagging (`CultureContext`)**: Penyesuaian tema visual, istilah budaya, dan konteks refleksi secara dinamis antara **Aceh** (*Meuseuraya* / *Saweu Syedara*) dan **Sumatera Barat** (*Mambangkik Batang Tarandam* / *Badunsanak*).
- **Landing Page (`/`) & Dashboard Resiliensi (`/dashboard`)**: Pusat aktivitas pengguna yang menampilkan progres **Hope Tree** (Pohon Harapan), target harian (*daily goals* & XP), serta navigasi cepat ke modul pemulihan dan game edukatif.
- **Autentikasi & Akun (`/login`, `/register`)**: Registrasi, login, dan pengelolaan sesi pengguna melalui `/api/auth/*`.
- **Safety Passport (`/safety-passport`)**: Pengelolaan kartu keselamatan darurat berisi kontak darurat, daftar anggota keluarga, titik kumpul, dan kebutuhan mendesak.
- **Offline Survival Mode & PWA (`/offline-survival`)**: Mode darurat berbasis Progressive Web App (`public/sw.js`, `public/manifest.webmanifest`) yang dapat diakses tanpa koneksi internet dan tanpa login, mencakup panduan keselamatan fisik, prinsip *Psychological First Aid* (PFA), teknik *grounding*, daftar perlengkapan *go-bag*, nomor darurat, serta ekspor kartu keselamatan HTML standalone.
- **Jurnal Hikmah (`/jurnal`, `/journal`)**: Ruang refleksi emosional harian, pelacakan aktivitas menenangkan (*breathing* & hidrasi), dan riwayat refleksi.
- **Tele-Screening & Triage (`/tele-screening`)**: Skrining mandiri menggunakan instrumen **DASS-21** (*Depression, Anxiety, and Stress Scale*) beserta kategori tingkat keparahan dan rekomendasi tindak lanjut.
- **AI Mental Support Companion (`/ai-companion`)**: Asisten percakapan berbasis Google Gemini (`POST /api/chat`) dengan *guardrails* keamanan, respons fallback berbasis budaya lokal, dan deteksi krisis otomatis.
- **Mood + Food AI Analyzer (`/mood-food`)**: Analisis multimodal gambar makanan dan suasana hati berbasis Google Gemini (`POST /api/mood-food`) untuk melihat keterkaitan nutrisi dan regulasi emosi.
- **Game Center Resiliensi (6 Modul)**:
  - **Sigap Bencana (`/game-quake`)**: Game simulasi evakuasi gempa berbasis **Phaser 3** dengan tilemap Tiled dan efek audio.
  - **Pinch & Drop Emergency Bag (`/game-healing`)**: Simulasi memilah barang wajib tas siaga bencana (`/PickAndDrop.html`).
  - **Breathing Calm (`/game-breath`)**: Panduan latihan pernapasan berirama untuk meredakan kepanikan (`/Breathing.html`).
  - **Siaga Minang (`/game-siagaminang`)**: Game ketangkasan kesiapsiagaan bencana (`/SiagaMinang.html`).
  - **Adventure Budaya (`/game-adventure`)**: Simulasi naratif mitigasi bencana berbasis kearifan lokal.
  - **Roleplay Psikoedukasi (`/roleplay`)**: Modul pengantar skenario pengambilan keputusan dan pertumbuhan psikologis.

### Layanan Backend API (`apps/api`)
- **Autentikasi, RBAC, & Persetujuan Orang Tua (`/api/v1/auth`, `/api/v1/users`, `/api/v1/children`)**: Autentikasi JWT (access + refresh token), hashing password Argon2id, kontrol akses berbasis peran, serta pengelolaan profil anak dan *parental consent*.
- **Kesiapsiagaan Bencana (`/api/v1/simulations`, `/api/v1/assessments`, `/api/v1/safety-passport`)**: Skenario simulasi bercabang, asesmen pra/pasca-edukasi, serta data paspor keselamatan keluarga.
- **Tanggap Darurat & Offline Sync (`/api/v1/disaster-incidents`, `/api/v1/support`, `/api/v1/offline`)**: Manajemen insiden bencana, layanan *SafeConnect* (PFA), paket konten luring, dan sinkronisasi antrean data lapangan.
- **Pemulihan Jangka Panjang (`/api/v1/recovery-journal`, `/api/v1/growth`, `/api/v1/care-circle`, `/api/v1/grief-journey`)**: Jurnal pemulihan dengan kontrol visibilitas, tonggak *Hope Tree*, kolaborasi *Care Circle*, dan aktivitas adaptasi duka.
- **AI Guardrails, Analitik & Tata Kelola (`/api/v1/ai`, `/api/v1/dashboard`, `/api/v1/content`, `/api/v1/regions`, `/api/v1/media`, `/api/v1/organizations`, `/api/v1/admin`, `/api/v1/audit`)**: Manajemen konten budaya, analitik komunitas, penyimpanan media, dan pencatatan audit log.
- **Dokumentasi API Interaktif**: Tersedia melalui Swagger UI di `/api/docs` (spesifikasi JSON di `/api/docs.json`) dan endpoint status di `/health` serta `/api/v1/health`.

---

## Tech Stack

| Lapisan | Teknologi |
| :--- | :--- |
| **Monorepo & Tooling** | pnpm (`12.18.0`), Turborepo, TypeScript, ESLint, Prettier |
| **Frontend (`apps/web`)** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion, Lucide React, Phaser 3, OGL, PWA Service Worker |
| **Backend (`apps/api`)** | Express.js, Prisma 7 (`@prisma/adapter-pg`), Zod, Argon2, JWT, Helmet, Rate Limiter, Winston, Swagger (`swagger-jsdoc` & `swagger-ui-express`) |
| **Database & Storage** | PostgreSQL (`pg`, `@neondatabase/serverless`), S3-compatible / `files-sdk` |
| **AI** | Google Gemini (`@google/generative-ai`, default model `gemini-2.5-flash`) |
| **Testing** | Vitest, Supertest (`apps/api/tests`) |

---

## Struktur Monorepo

```text
permata-apps-new/
├── apps/
│   ├── web/                          # Aplikasi Frontend Next.js 16 (@permata/web)
│   │   ├── public/                   # Aset statis, audio, tiles Phaser, game HTML, manifest & sw.js
│   │   ├── src/
│   │   │   ├── app/                  # Halaman App Router & API Route Handlers Next.js
│   │   │   ├── components/           # Komponen halaman, UI kit, Navbar, OfflineRuntime
│   │   │   ├── context/              # AuthContext & CultureContext (Aceh / Sumbar)
│   │   │   ├── data/                 # Data instrumen DASS-21 & konten Offline Survival
│   │   │   ├── game/                 # Konfigurasi & scene Phaser 3
│   │   │   ├── lib/                  # Utilitas DB, auth sesi, AI guardrails, storage, offline cache
│   │   │   └── utils/                # Helper API & kalkulasi skor DASS-21
│   │   └── next.config.ts            # Konfigurasi Next.js & proxy rewrite ke backend API
│   └── api/                          # Layanan Backend Express (@permata/api)
│       ├── prisma/
│       │   ├── schema.prisma         # Skema database PostgreSQL (Prisma 7)
│       │   └── seed.ts               # Data awal peran (roles), jenis bencana, dll.
│       ├── scripts/
│       │   └── prepare-vercel.cjs    # Bundling backend untuk deployment Vercel Services
│       ├── src/
│       │   ├── common/               # Error types, response helpers, tipe bersama
│       │   ├── config/               # Env validation, database, logger, storage
│       │   ├── middlewares/          # Auth, rate limiter, request ID, validation, error handler
│       │   ├── modules/              # Modul fitur REST API (/api/v1/*)
│       │   ├── app.ts                # Konfigurasi Express & Swagger
│       │   └── server.ts             # Entrypoint server HTTP
│       └── tests/                    # Unit & integration tests (Vitest + Supertest)
├── packages/
│   ├── ui/                           # Shared UI library (@permata/ui)
│   └── config-tailwind/              # Shared Tailwind config (@permata/config-tailwind)
├── .env.example                      # Template environment variables monorepo
├── pnpm-workspace.yaml               # Definisi workspace pnpm
├── turbo.json                        # Pipeline task Turborepo
├── vercel.json                       # Konfigurasi deployment 1 proyek Vercel Services
└── package.json                      # Skrip root monorepo
```

---

## Memulai di Lokal

### Prasyarat
- **Node.js** `>= 18`
- **pnpm** (`12.x` disarankan — sesuaikan dengan field `packageManager` pada `package.json`)
- **PostgreSQL** (lokal atau layanan cloud seperti Neon)
- **Google Gemini API Key** (untuk fitur AI Companion dan Mood + Food Analyzer)

### 1. Clone & Instalasi Dependensi

```bash
git clone https://github.com/yuandaeka/permata-apps-new.git
cd permata-apps-new
pnpm install
```

### 2. Konfigurasi Environment Variables

Salin template environment variables sesuai kebutuhan:
- Root / referensi umum: `.env.example`
- Frontend (`apps/web`): salin `apps/web/.env.example` menjadi `apps/web/.env.local`
- Backend (`apps/api`): salin `apps/api/.env.example` menjadi `apps/api/.env`

Variabel utama yang perlu diisi:

| Variabel | Lokasi | Keterangan |
| :--- | :--- | :--- |
| `DATABASE_URL` | `apps/api/.env` & `apps/web/.env.local` | Connection string PostgreSQL |
| `ACCESS_TOKEN_SECRET` | `apps/api/.env` | Secret JWT minimal 32 karakter |
| `REFRESH_TOKEN_SECRET` | `apps/api/.env` | Secret Refresh Token minimal 32 karakter |
| `GEMINI_API_KEY` | `apps/web/.env.local` | API key Google Gemini untuk rute `/api/chat` & `/api/mood-food` |
| `AI_PROVIDER` / `AI_API_KEY` / `AI_MODEL` | `apps/api/.env` | Konfigurasi AI backend (`gemini`, API key, `gemini-2.5-flash`) |
| `NEXT_PUBLIC_API_URL` / `BACKEND_API_URL` | `apps/web/.env.local` | Opsional di lokal; saat development `next.config.ts` otomatis mem-proxy `/api/v1/*` ke `http://localhost:4000` |

### 3. Setup Database (Prisma)

Jalankan perintah berikut dari root repositori untuk generate Prisma client, menerapkan skema/migrasi, dan mengisi data awal:

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

*(Gunakan `pnpm db:migrate` jika ingin membuat/menjalankan migrasi development secara bertahap.)*

### 4. Menjalankan Aplikasi

Jalankan seluruh service sekaligus melalui Turborepo:

```bash
pnpm dev
```

Atau jalankan secara terpisah per workspace:

```bash
# Frontend Next.js (http://localhost:3000)
pnpm --filter @permata/web dev

# Backend Express API (http://localhost:4000)
pnpm --filter @permata/api dev
```

Akses setelah berjalan:
- **Frontend Web**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000`
- **Swagger API Docs**: `http://localhost:4000/api/docs` (atau `http://localhost:3000/api/docs` via proxy Next.js)

---

## Daftar Perintah Penting

| Perintah | Fungsi |
| :--- | :--- |
| `pnpm dev` | Menjalankan dev server semua workspace melalui Turborepo |
| `pnpm --filter @permata/web dev:turbo` | Menjalankan frontend Next.js dengan Turbopack |
| `pnpm build` | Build seluruh package dan aplikasi dalam monorepo |
| `pnpm lint` | Menjalankan linter di seluruh workspace |
| `pnpm test` | Menjalankan test suite (Vitest pada `@permata/api`) |
| `pnpm format` | Memformat kode `.ts`, `.tsx`, dan `.md` dengan Prettier |
| `pnpm db:generate` | Generate Prisma Client pada `@permata/api` |
| `pnpm db:migrate` | Menjalankan `prisma migrate dev` pada `@permata/api` |
| `pnpm db:push` | Sinkronisasi skema Prisma ke database (`prisma db push`) |
| `pnpm db:deploy` | Menerapkan migrasi produksi (`prisma migrate deploy`) |
| `pnpm db:seed` | Mengisi data awal database melalui `prisma/seed.ts` |

---

## Pengujian (Testing)

Suite pengujian backend berada di `apps/api/tests/` (mencakup pengujian autentikasi, izin akses/RBAC, middleware, AI guardrails, dan dashboard) menggunakan **Vitest** dan **Supertest**:

```bash
pnpm test
```

Atau jalankan langsung pada package API:

```bash
pnpm --filter @permata/api test
```

---

## Deployment ke Vercel (1 Proyek — Vercel Services)

Repositori ini dikonfigurasi untuk men-deploy **Frontend (`apps/web`)** dan **Backend (`apps/api`)** dalam **satu proyek Vercel** menggunakan **Vercel Services** pada [vercel.json](vercel.json):

- **Service `frontend` (`apps/web`)**: Melayani halaman Next.js dan API internal (`/api/chat`, `/api/mood-food`, `/api/auth/*`, dll.) serta terhubung ke backend melalui *service binding* `BACKEND_INTERNAL_URL`.
- **Service `backend` (`apps/api`)**: Dibundle oleh `apps/api/scripts/prepare-vercel.cjs` dan melayani endpoint `/api/v1/*`, `/api/docs`, `/api/docs.json`, dan `/health`.

### Langkah Singkat Deployment
1. Import repositori ini di **Vercel Dashboard** dengan **Root Directory** tetap pada root (`.`).
2. Tambahkan Environment Variables yang diperlukan pada pengaturan proyek Vercel:
   - `DATABASE_URL`
   - `ACCESS_TOKEN_SECRET` (minimal 32 karakter)
   - `REFRESH_TOKEN_SECRET` (minimal 32 karakter)
   - `GEMINI_API_KEY`
   - `AI_PROVIDER=gemini`
   - `AI_API_KEY`
   - `AI_MODEL=gemini-2.5-flash`
3. Deploy melalui dashboard atau Vercel CLI (`vercel --prod`).

---

## Dokumentasi Tambahan

- [GUIDE.md](GUIDE.md) — Panduan penggunaan fitur antarmuka web dan modul backend secara rinci.
- [PRD Permata.md](PRD%20Permata.md) — Dokumen *Product Requirements* sistem PERMATA.
- [Design_System.md](Design_System.md) & [PERMATA_Design_System_v2.md](PERMATA_Design_System_v2.md) — Panduan desain visual dan sistem komponen.
