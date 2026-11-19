# PERMATA — Platform Resiliensi Mental & Pendampingan Anak Kebencanaan

**PERMATA** (_Platform Integrasi Pendidikan Resiliensi Mental & Pendampingan Anak dalam Konteks Kebencanaan_) adalah ekosistem aplikasi web dan REST API berbasis kearifan lokal Nusantara untuk mendukung kesiapsiagaan bencana, respons darurat psikososial (_Psychological First Aid_), serta pertumbuhan pascatrauma (_Post-Traumatic Growth_).

Repositori ini dikelola sebagai **Turborepo Monorepo** menggunakan **pnpm** dengan aplikasi web **Next.js 16** (`apps/web`) dan layanan backend **Express + TypeScript + Prisma** (`apps/api`).

---

## Ringkasan Fitur

### Aplikasi Web (`apps/web`)

- **Geo-Cultural Tagging (`CultureContext`)**: Penyesuaian tema visual, istilah budaya, dan konteks refleksi secara dinamis antara **Aceh** (_Meuseuraya_ / _Saweu Syedara_) dan **Sumatera Barat** (_Mambangkik Batang Tarandam_ / _Badunsanak_).
- **Landing Page (`/`) & Dashboard Resiliensi (`/dashboard`)**: Pusat aktivitas pengguna yang menampilkan progres **Hope Tree** (Pohon Harapan), target harian (_daily goals_ & XP), serta navigasi cepat ke modul pemulihan dan game edukatif.
- **Autentikasi & Akun (`/login`, `/register`)**: Registrasi, login, dan pengelolaan sesi pengguna melalui `/api/auth/*`.
- **Safety Passport (`/safety-passport`)**: Pengelolaan kartu keselamatan darurat berisi kontak darurat, daftar anggota keluarga, titik kumpul, dan kebutuhan mendesak.
- **Offline Survival Mode & PWA (`/offline-survival`)**: Mode darurat berbasis Progressive Web App (`public/sw.js`, `public/manifest.webmanifest`) yang dapat diakses tanpa koneksi internet dan tanpa login, mencakup panduan keselamatan fisik, prinsip _Psychological First Aid_ (PFA), teknik _grounding_, daftar perlengkapan _go-bag_, nomor darurat, serta ekspor kartu keselamatan HTML standalone.
- **Jurnal Hikmah (`/jurnal`, `/journal`)**: Ruang refleksi emosional harian, pelacakan aktivitas menenangkan (_breathing_ & hidrasi), dan riwayat refleksi.
- **Tele-Screening & Triage (`/tele-screening`)**: Skrining mandiri menggunakan instrumen **DASS-21** (_Depression, Anxiety, and Stress Scale_) beserta kategori tingkat keparahan dan rekomendasi tindak lanjut.
- **AI Mental Support Companion (`/ai-companion`)**: Asisten percakapan berbasis Google Gemini (`POST /api/chat`) dengan _guardrails_ keamanan, respons fallback berbasis budaya lokal, dan deteksi krisis otomatis.
- **Mood + Food AI Analyzer (`/mood-food`)**: Analisis multimodal gambar makanan dan suasana hati berbasis Google Gemini (`POST /api/mood-food`) untuk melihat keterkaitan nutrisi dan regulasi emosi.
- **Game Center Resiliensi (6 Modul)**:
  - **Sigap Bencana (`/game-quake`)**: Petualangan rumah berbasis **Phaser 3**, karakter beranimasi, tiga pertanyaan dengan petunjuk dan percobaan ulang, kontrol keyboard/HP, jeda otomatis, serta musik opsional. Hasil tersimpan di PostgreSQL; hadiah maksimal **20 XP/hari**. [Walkthrough dan task](GUIDE.md#walkthrough-sigap-bencana).
  - **Tas Siaga Bencana (`/game-healing`)**: Kenali enam perlengkapan utama dalam latihan santai atau tantangan 60 detik, dengan kontrol sentuh/mouse dan kamera tangan opsional. Hasil tersimpan di PostgreSQL; penyelesaian pertama memberi **20 XP/hari**. [Walkthrough dan kontrol](GUIDE.md#walkthrough-tas-siaga-bencana).
  - **Napas Tenang (`/game-breath`)**: Latihan napas dengan pilihan ritme dan putaran, jeda/lanjutkan, serta kamera opsional sebagai cermin atau percobaan deteksi gerakan dada/perut. Hasil deteksi merupakan perkiraan lokal dan tidak menentukan XP. Hadiah maksimal **15 XP/hari** dibagi dengan target napas dashboard. [Walkthrough](GUIDE.md#walkthrough-napas-tenang), [mode deteksi kamera](GUIDE.md#percobaan-deteksi-kamera).
  - **Siaga Minang (`/game-siagaminang`)**: Petualangan klasik layar penuh, karakter beranimasi halus, latar Minangkabau berlapis, 10 perlengkapan, tiga checkpoint, kontrol keyboard/sentuh, dan musik yang bisa dimatikan. Hasil tersimpan di PostgreSQL; penyelesaian pertama memberi **20 XP/hari**. [Walkthrough, kontrol, dan task](GUIDE.md#walkthrough-siaga-minang).
  - **Adventure Budaya (`/game-adventure`)**: Simulasi naratif mitigasi bencana berbasis kearifan lokal.
  - **Roleplay Psikoedukasi (`/roleplay`)**: Modul pengantar skenario pengambilan keputusan dan pertumbuhan psikologis.

Alamat lama `/PickAndDrop.html`, `/Breathing.html`, dan `/SiagaMinang.html` mengarah ke permainan di dalam aplikasi.

### Layanan Backend API (`apps/api`)

- **Autentikasi, RBAC, & Persetujuan Orang Tua (`/api/v1/auth`, `/api/v1/users`, `/api/v1/children`)**: Autentikasi JWT (access + refresh token), hashing password Argon2id, kontrol akses berbasis peran, serta pengelolaan profil anak dan _parental consent_.
- **Kesiapsiagaan Bencana (`/api/v1/simulations`, `/api/v1/assessments`, `/api/v1/safety-passport`)**: Skenario simulasi bercabang, asesmen pra/pasca-edukasi, serta data paspor keselamatan keluarga.
- **Tanggap Darurat & Offline Sync (`/api/v1/disaster-incidents`, `/api/v1/support`, `/api/v1/offline`)**: Manajemen insiden bencana, layanan _SafeConnect_ (PFA), paket konten luring, dan sinkronisasi antrean data lapangan.
- **Pemulihan Jangka Panjang (`/api/v1/recovery-journal`, `/api/v1/growth`, `/api/v1/care-circle`, `/api/v1/grief-journey`)**: Jurnal pemulihan dengan kontrol visibilitas, tonggak _Hope Tree_, kolaborasi _Care Circle_, dan aktivitas adaptasi duka.
- **AI Guardrails, Analitik & Tata Kelola (`/api/v1/ai`, `/api/v1/dashboard`, `/api/v1/content`, `/api/v1/regions`, `/api/v1/media`, `/api/v1/organizations`, `/api/v1/admin`, `/api/v1/audit`)**: Manajemen konten budaya, analitik komunitas, penyimpanan media, dan pencatatan audit log.
- **Dokumentasi API Interaktif**: Tersedia melalui Swagger UI di `/api/docs` (spesifikasi JSON di `/api/docs.json`) dan endpoint status di `/health` serta `/api/v1/health`.

---

## Tech Stack

| Lapisan                   | Teknologi                                                                                                                                      |
| :------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **Monorepo & Tooling**    | pnpm (`12.18.0`), Turborepo, TypeScript, ESLint, Prettier                                                                                      |
| **Frontend (`apps/web`)** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion, Lucide React, Phaser 3, OGL, PWA Service Worker                             |
| **Backend (`apps/api`)**  | Express.js, Prisma 7 (`@prisma/adapter-pg`), Zod, Argon2, JWT, Helmet, Rate Limiter, Winston, Swagger (`swagger-jsdoc` & `swagger-ui-express`) |
| **Database & Storage**    | PostgreSQL (`pg`, `@neondatabase/serverless`), S3-compatible / `files-sdk`                                                                     |
| **AI**                    | Google Gemini (`@google/generative-ai`, default model `gemini-2.5-flash`)                                                                      |
| **Testing**               | Vitest, Supertest (`apps/api/tests`), Node.js test runner (`apps/web/tests`)                                                                   |

---

## Struktur Monorepo

```text
permata-apps-new/
├── apps/
│   ├── web/                          # Aplikasi Frontend Next.js 16 (@permata/web)
│   │   ├── public/                   # Aset statis, audio, tiles Phaser, redirect game lama, manifest & sw.js
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
│       │   ├── migrations/           # Migrasi skema dan penyimpanan sesi game
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
├── docs/
│   ├── rag/                          # Korpus pengetahuan terkurasi untuk RAG chat web
│   ├── AI_Rules.txt                  # Panduan/guardrails AI
│   └── PRD Permata.md                # Dokumen kebutuhan produk
├── scripts/
│   └── rag-index.mjs                 # Indeks idempotent korpus RAG ke pgvector (`pnpm rag:index`)
├── .env.example                      # Template environment variables monorepo
├── compose.dev.yml                   # PostgreSQL lokal (pgvector) & pgAdmin untuk pengembangan
├── pnpm-workspace.yaml               # Definisi workspace pnpm
├── turbo.json                        # Pipeline task Turborepo
├── vercel.json                       # Konfigurasi deployment 1 proyek Vercel Services
└── package.json                      # Skrip root monorepo
```

---

## Memulai di Lokal

### Prasyarat

- **Node.js** 22 LTS (disarankan untuk Next.js 16 dan Prisma 7)
- **pnpm** (`12.x` disarankan — sesuaikan dengan field `packageManager` pada `package.json`)
- **PostgreSQL** (lokal atau layanan cloud seperti Neon)
- **Google Gemini API Key** (untuk fitur AI Companion dan Mood + Food Analyzer)

### 1. Clone & Instalasi Dependensi

```bash
git clone https://github.com/airlanggapradana/permata-apps-new.git
cd permata-apps-new
pnpm install
```

### 2. Konfigurasi Environment Variables

Salin template environment variables sesuai kebutuhan:

- Root / referensi umum: `.env.example`
- Frontend (`apps/web`): salin `apps/web/.env.example` menjadi `apps/web/.env.local`
- Backend (`apps/api`): salin `apps/api/.env.example` menjadi `apps/api/.env`

Variabel utama yang perlu diisi:

| Variabel                                  | Lokasi                                  | Keterangan                                                                                                     |
| :---------------------------------------- | :-------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                            | `apps/api/.env` & `apps/web/.env.local` | Connection string PostgreSQL                                                                                   |
| `AUTH_SESSION_SECRET`                     | `apps/web/.env.local`                   | Secret acak minimal 32 karakter untuk sesi login web                                                           |
| `ACCESS_TOKEN_SECRET`                     | `apps/api/.env`                         | Secret JWT minimal 32 karakter                                                                                 |
| `REFRESH_TOKEN_SECRET`                    | `apps/api/.env`                         | Secret Refresh Token minimal 32 karakter                                                                       |
| `GEMINI_API_KEY`                          | `apps/web/.env.local`                   | API key Google Gemini untuk rute `/api/chat` & `/api/mood-food`                                                |
| `AI_PROVIDER` / `AI_API_KEY` / `AI_MODEL` | `apps/api/.env`                         | Konfigurasi AI backend (`gemini`, API key, `gemini-2.5-flash`)                                                 |
| `NEXT_PUBLIC_API_URL` / `BACKEND_API_URL` | `apps/web/.env.local`                   | Opsional di lokal; saat development `next.config.ts` otomatis mem-proxy `/api/v1/*` ke `http://localhost:4000` |
| `RAG_EMBEDDING_MODEL` / `RAG_EMBEDDING_DIM` / `RAG_TOP_K` | `.env`, `apps/web/.env.local`, `apps/api/.env` | Konfigurasi RAG AI Companion (default `gemini-embedding-001`, `768`, `4`) |

### Contoh PostgreSQL Lokal

Buat database `permata` melalui pgAdmin atau `createdb`, lalu samakan
`DATABASE_URL` pada konfigurasi frontend dan backend. Contoh user `postgres`,
password `postgres`, dan port `5433`:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/permata
```

Port contoh template adalah `5432`; gunakan `5433` bila itu port PostgreSQL yang
terdaftar di pgAdmin. Frontend membaca `apps/web/.env.local`, sedangkan backend
dan Prisma membaca `apps/api/.env`. Ganti placeholder JWT dan session secret
dengan nilai acak lokal. File konfigurasi lokal diabaikan Git; PostgreSQL lokal
tidak memerlukan akun Neon.

### 3. Setup Database (Prisma)

Jalankan perintah berikut dari root repositori untuk generate Prisma client, menerapkan skema/migrasi, dan mengisi data awal:

```bash
pnpm db:generate
pnpm db:deploy
pnpm db:seed
```

_(Gunakan `pnpm db:migrate` jika ingin membuat/menjalankan migrasi development secara bertahap.)_

Untuk **RAG AI Companion** (`/api/chat`), gunakan PostgreSQL dengan ekstensi pgvector (lokal: `docker compose -f compose.dev.yml up -d` memakai image `pgvector/pgvector:pg18`). Setelah migrasi diterapkan, indeks korpus terkurasi `docs/rag/`:

```bash
pnpm rag:index
```

Perintah ini idempotent dan membutuhkan `DATABASE_URL` serta `GEMINI_API_KEY`/`AI_API_KEY`. Jika tabel pgvector/korpus belum tersedia, chat tetap berjalan dengan fallback aman tanpa konteks RAG.

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

| Perintah                               | Fungsi                                                   |
| :------------------------------------- | :------------------------------------------------------- |
| `pnpm dev`                             | Menjalankan dev server semua workspace melalui Turborepo |
| `pnpm --filter @permata/web dev:turbo` | Menjalankan frontend Next.js dengan Turbopack            |
| `pnpm build`                           | Build seluruh package dan aplikasi dalam monorepo        |
| `pnpm lint`                            | Menjalankan linter di seluruh workspace                  |
| `pnpm test`                            | Menjalankan test suite (Vitest pada `@permata/api`)      |
| `pnpm format`                          | Memformat kode `.ts`, `.tsx`, dan `.md` dengan Prettier  |
| `pnpm db:generate`                     | Generate Prisma Client pada `@permata/api`               |
| `pnpm db:migrate`                      | Menjalankan `prisma migrate dev` pada `@permata/api`     |
| `pnpm db:push`                         | Sinkronisasi skema Prisma ke database (`prisma db push`) |
| `pnpm db:deploy`                       | Menerapkan migrasi produksi (`prisma migrate deploy`)    |
| `pnpm db:seed`                         | Mengisi data awal database melalui `prisma/seed.ts`      |
| `pnpm rag:index`                       | Mengindeks korpus `docs/rag/` ke pgvector (idempotent)  |

---

## Pengujian (Testing)

Suite pengujian backend berada di `apps/api/tests/` (mencakup pengujian autentikasi, izin akses/RBAC, middleware, AI guardrails, dan dashboard) menggunakan **Vitest** dan **Supertest**:

```bash
pnpm test
```

Tes game dan cache offline frontend dapat dijalankan setelah frontend serta
PostgreSQL lokal tersedia:

```bash
pnpm --filter @permata/web test:game
pnpm --filter @permata/web test:offline
```

Panduan kontrol, walkthrough, dan task setiap game tersedia di [GUIDE.md](GUIDE.md).

Atau jalankan langsung pada package API:

```bash
pnpm --filter @permata/api test
```

---

## Deployment ke Vercel (1 Proyek — Vercel Services)

Repositori ini dikonfigurasi untuk men-deploy **Frontend (`apps/web`)** dan **Backend (`apps/api`)** dalam **satu proyek Vercel** menggunakan **Vercel Services** pada [vercel.json](vercel.json):

- **Service `frontend` (`apps/web`)**: Melayani halaman Next.js dan API internal (`/api/chat`, `/api/mood-food`, `/api/auth/*`, dll.) serta terhubung ke backend melalui _service binding_ `BACKEND_INTERNAL_URL`.
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
- [docs/PRD Permata.md](docs/PRD%20Permata.md) — Dokumen _Product Requirements_ sistem PERMATA.
- [packages/ui](packages/ui) dan [packages/config-tailwind](packages/config-tailwind) — Komponen UI dan konfigurasi visual bersama.
