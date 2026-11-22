# Rancangan Fitur Roleplay Psikoedukasi PERMATA

Dokumen ini memetakan fitur-fitur **Roleplay Psikoedukasi** yang realistis dan selaras untuk diterapkan pada aplikasi **PERMATA** berdasarkan arsitektur, modul, dan aset yang sudah ada saat ini (`apps/web`, `apps/api`, serta pedoman produk dan desain).

> **Status implementasi tahap 1 (23 November 2026):** Empat cerita terkurasi, varian Aceh/Kalimantan, umpan balik empatik, jeda, napas pelan/grounding, mode tamu, ringkasan, dan XP harian di `apps/web` telah diimplementasikan. Paket offline menyertakan halaman dan aset aplikasi; hasil lokal dapat disimpan ke akun yang sama saat kembali terhubung. Batas XP adalah 20 per fitur per hari (`Asia/Makassar`), berdasarkan hari penyimpanan ke server. Tidak ada input teks bebas. Integrasi simulasi Express, CMS/fasilitator, dan dialog AI tetap merupakan tahap lanjutan. Baseline di bawah merekam keadaan sebelum implementasi. Peninjauan pakar dan budaya pada checklist rilis tetap perlu dilakukan.

> **Penyempurnaan pengalaman:** Layar percakapan pada ponsel diringkas menjadi satu kartu, dengan konteks lengkap yang dapat dibuka. Avatar Rafi/Lala menampilkan ekspresi dan gestur sesuai adegan serta respons. Ringkasan “Jejak pilihanmu” memuat hingga tiga contoh pilihan aktual, termasuk respons yang disesuaikan setelah umpan balik. Metadata presentasi diturunkan dari ID adegan/pilihan yang sama, sehingga versi skenario, progres tersimpan, dan aturan XP tetap kompatibel.

---

## 1. Kondisi Aplikasi Saat Ini (Baseline)

Berdasarkan penelusuran repositori saat ini, fondasi untuk modul Roleplay Psikoedukasi sebenarnya sudah tersebar di beberapa bagian:

| Komponen Saat Ini | Lokasi di Kode / Dokumen | Status & Kesiapan |
| :--- | :--- | :--- |
| Halaman `/roleplay` | `apps/web/src/app/roleplay/page.tsx`, `apps/web/src/components/pages/RoleplayPsy.tsx` | Masih berupa halaman placeholder **"Segera Hadir"**. |
| Kartu di Landing Page & Dashboard | `apps/web/src/components/pages/LandingPage.tsx`, `apps/web/src/components/pages/Dashboard.tsx` | Sudah mendefinisikan tujuan fitur: *"Simulasi percakapan emosi dan melatih empati kepada teman yang takut/berduka di pengungsian"*. |
| Engine Game & XP Harian Web | `apps/web/src/app/api/games/*`, `apps/web/src/lib/auth.ts` (`getUserTreeStats`), `apps/web/src/lib/treeProgress.ts` | Sudah memiliki tabel `GameAttempt` & `GameDailyReward` dengan batas XP harian (`Asia/Makassar`) yang terhubung ke **Pohon Harapan (`HopeTree`)**. |
| Modul Simulasi Bercabang Backend | `apps/api/src/modules/prevention/simulations.*`, `apps/api/prisma/schema.prisma` | Sudah memiliki model `SimulationScenario`, `ScenarioVersion`, `ScenarioStep`, `ScenarioOption`, `SimulationAttempt`, `SimulationResponse`, dan endpoint `/api/v1/simulations`. |
| Konteks Budaya (`CultureContext`) | `apps/web/src/context/CultureContext.tsx`, `apps/web/src/components/Navbar.tsx` | Sudah aktif mendukung konteks **`aceh`** (*Meuseuraya*) dan **`kalimantan`** (*Handep / Gotong Royong Dayak*). |
| Persona & Guardrail AI | `apps/web/src/lib/aiPersonas.ts`, `apps/web/src/lib/aiRules.ts`, `apps/web/src/app/api/chat/route.ts` | Sudah memiliki 4 persona (**OPI**, **SAFI**, **AMI**, **CICI**) serta `preflightGuardrail` & deteksi krisis sebelum memanggil Gemini. |
| Materi PFA & Grounding Offline | `apps/web/src/data/offlineSurvivalData.ts`, `docs/rag/pfa-coping-safety.md` | Sudah memiliki prinsip PFA, skenario psikologis, langkah *grounding* 5-4-3-2-1, dan dukungan PWA offline. |
| Pedoman Etis & Desain | `docs/PRD Permata.md`, `PERMATA_Design_System_v2.md` | Menetapkan prinsip *trauma-informed*: tanpa label gagal/diagnosis, tidak memaksa cerita trauma pribadi, ramah gerak (`prefers-reduced-motion`), dan kontras WCAG AA. |

---

## 2. Prinsip Utama Roleplay Psikoedukasi di PERMATA

Agar konsisten dengan `docs/PRD Permata.md` dan `PERMATA_Design_System_v2.md`, seluruh fitur roleplay wajib mematuhi prinsip berikut:

1. **Bukan Alat Diagnosis & Tanpa Hukuman (*Non-Punitive*)**: Tidak ada skor "gagal", tidak ada nyawa (*HP/lives*) yang habis, dan tidak ada pengurangan XP jika anak memilih respons yang kurang tepat.
2. **Mekanisme Coba Lagi yang Edukatif (*Gentle Redirection*)**: Pilihan yang kurang suportif (misalnya menyuruh teman langsung diam atau meremehkan rasa takutnya) memunculkan penjelasan lembut mengenai dampaknya terhadap perasaan lawan bicara, lalu memberi kesempatan memilih respons lain.
3. **Berjarak Aman (*Third-Person Safe Distance*)**: Anak berperan mendampingi tokoh fiktif (teman sebaya atau adik di posko/sekolah) sehingga tidak dipaksa membuka ulang pengalaman traumatis dirinya sendiri.
4. **Penilaian Berbasis Konten Terkurasi**: Evaluasi keselamatan dan langkah psikososial (*Psychological First Aid*) berasal dari skenario yang dikurasi, bukan dinilai secara bebas oleh AI tanpa batas.
5. **Menjaga Privasi & Keselamatan Anak**: Input teks bebas (jika ada) wajib melewati `preflightGuardrail` untuk mendeteksi indikasi krisis (eskalasi ke orang dewasa tepercaya / layanan 119) serta redaksi PII.

---

## 3. Daftar Fitur yang Dapat Diterapkan

### 3.1. Simulasi Cerita & Dialog Bercabang Terkurasi (*Core Feature*)

Mengganti placeholder `/roleplay` menjadi pengalaman **cerita interaktif berbasis kartu dialog** dengan alur 4–6 adegan per skenario.

- **Pilihan Paket Skenario Awal** (relevan dengan konteks bencana Nusantara):
  1. **Menemani Teman yang Takut di Posko** *(Fokus: Empati & PFA Look-Listen-Link)* — Melatih anak menyapa teman yang gemetar mendengar suara petir/gempa susulan, mendengarkan tanpa memaksa cerita, dan mengajaknya menemui relawan/orang dewasa.
  2. **Menghadapi Rasa Rindu Rumah & Sekolah** *(Fokus: Validasi Emosi & Grief Adaptation)* — Mengajak anak mengenali bahwa sedih/rindu itu wajar, dan mempraktikkan cara menyalurkannya melalui cerita atau gambar.
  3. **Saat Kepanikan Muncul di Kelas / Rumah** *(Fokus: Regulasi Diri & Pengambilan Keputusan)* — Memilih langkah tenang saat guncangan terasa (*drop-cover-hold*) sambil menenangkan adik atau teman sebangku.
  4. **Menyikapi Kabar Simpang Siur di Pengungsian** *(Fokus: Literasi Emosi & Keamanan Informasi)* — Memilih untuk tidak ikut menyebarkan rumor menakutkan dan mengajak teman memverifikasi informasi ke petugas/guru.
- **Tampilan Antarmuka**:
  - Kartu adegan berisi ilustrasi/ikon suasana, nama & ekspresi tokoh, teks situasi singkat, dan 2–3 pilihan dialog/tindakan.
  - Tombol opsi memiliki area sentuh minimal `44px` dengan dukungan navigasi keyboard (`Tab` + `Enter`).
  - Penjelasan empatik langsung muncul saat opsi dipilih, mengikuti gaya umpan balik di **Sigap Bencana** (`/game-quake`) dan **Tas Siaga** (`/game-healing`).

### 3.2. Adaptasi Geo-Kultural Otomatis (`CultureContext`)

Memanfaatkan `useCulture()` (`aceh` | `kalimantan`, dan siap diperluas jika mode Sumbar/Minang diaktifkan kembali) untuk menyesuaikan nuansa cerita tanpa menduplikasi logika engine:

- **Mode Aceh (*Meuseuraya*)**: Latar posko di halaman *Meunasah* atau balai gampong, nama tokoh lokal (mis. Cut, Teuku/Rafi), serta sisipan nilai gotong royong *Meuseuraya* dan *Saweu Syedara*.
- **Mode Kalimantan (*Handep*)**: Latar kebersamaan di *Rumah Betang* / balai warga tepi sungai, nilai *Handep* (tolong-menolong), dan analogi keteguhan kayu ulin.
- **Fallback Bahasa & Konteks**: Jika skenario belum memiliki varian wilayah tertentu, sistem otomatis memakai teks netral Bahasa Indonesia yang sudah terkurasi.

### 3.3. Mini-Alat Regulasi Emosi di Dalam Adegan (*In-Scene Coping Tools*)

Di titik kritis skenario (misalnya saat tokoh merasa sesak atau panik), anak tidak hanya memilih dialog, tetapi juga dapat **mempraktikkan teknik menenangkan diri secara langsung** sebagai bagian dari alur roleplay:

- **Kartu Napas Tenang Mini**: Memandu 2–3 siklus tarik-hembus lembut (selaras dengan ritme di `/game-breath`, tanpa menahan napas).
- **Latihan Grounding 5-4-3-2-1 Interaktif**: Menggunakan data dari `GROUNDING_STEPS` di `apps/web/src/data/offlineSurvivalData.ts` (sebutkan benda yang dilihat, disentuh, didengar di sekitar).
- **Tombol "Cari Orang Dewasa Tepercaya"**: Membuka daftar peran pendamping (orang tua, guru, relawan) dan dapat menautkan pengingat ke data **Safety Passport** (`/safety-passport`) milik pengguna jika sudah diisi.

### 3.4. Mode Latihan Dialog AI Terpandu dengan Persona PERMATA *(Opsional / Tahap Lanjut)*

Memanfaatkan infrastruktur `apps/web/src/app/api/chat/route.ts` dan 4 persona di `apps/web/src/lib/aiPersonas.ts`:

- **Dua Peran Simulasi**:
  - **AI sebagai Pelatih/Pendamping (`AMI` / `OPI`)**: Anak berlatih menjawab situasi ("Kira-kira apa yang bisa kamu katakan ke temanmu yang lagi sedih?"), lalu AI memberi penguatan positif dan saran kalimat alternatif yang lembut.
  - **AI sebagai Tokoh Cerita Terstruktur**: AI memerankan teman sebaya yang cemas dalam batasan skrip aman (maksimal 3–5 giliran percakapan) dengan tombol pilihan cepat (*quick-reply chips*) sebagai bantuan bila anak bingung mengetik.
- **Pengaman Ketat**:
  - Wajib melewati `preflightGuardrail(input, "chat")` sebelum memanggil Gemini.
  - Jika AI tidak tersedia (`!GEMINI_API_KEY` atau offline), mode ini otomatis jatuh ke skenario bercabang statis terkurasi sehingga halaman tetap berfungsi penuh.

### 3.5. Ringkasan Hikmah, Kontribusi XP Pohon Harapan, & Jembatan ke Modul Pemulihan

Di akhir setiap sesi roleplay, sistem menampilkan layar penutup yang hangat (tanpa peringkat kompetitif):

- **Kartu Hikmah & Refleksi**: Merangkum keterampilan sosial-emosional yang baru saja dilatih (mis. *Mendengarkan Aktif*, *Validasi Emosi*, *Mencari Bantuan Orang Dewasa*).
- **Hadiah XP Harian ke `HopeTree`**:
  - Mengikuti pola `GameAttempt` + `GameDailyReward` yang sudah berjalan pada `sigap-bencana`, `emergency-bag`, `siaga-minang`, dan `breathing` (mis. `+20 XP` pada penyelesaian pertama per hari berdasarkan zona waktu `Asia/Makassar`).
  - Memperbarui perhitungan `gameXp` di `getUserTreeStats()` (`apps/web/src/lib/auth.ts`) sehingga Pohon Harapan di `/dashboard` otomatis ikut bertumbuh.
- **Tautan Tindak Lanjut 1-Klik**:
  - *"Tulis Perasaanmu di Jurnal Hikmah"* → mengarah ke `/jurnal` dengan *prompt* pemantik ringan (opsional).
  - *"Lanjut Latihan Napas Tenang"* → mengarah ke `/game-breath`.
  - *"Lihat Pohon Harapan"* → mengarah ke `/dashboard`.

### 3.6. Mode Tamu & Dukungan Offline (PWA / Siaga Tanpa Sinyal)

Mengingat PERMATA ditujukan untuk konteks kebencanaan di mana sinyal internet sering terputus:

- **Dapat Dimainkan Sebagai Tamu**: Pengunjung tanpa login tetap dapat memainkan seluruh skenario; pengingat lembut untuk login hanya muncul jika ingin menyimpan progres XP ke PostgreSQL (konsisten dengan game lain di Game Center).
- **Paket Roleplay Offline**: Konten skenario bercabang berbasis JSON terkurasi sangat ringan sehingga dapat disimpan di cache Service Worker (`apps/web/public/sw.js`) dan diakses dari `/offline-survival` maupun `/roleplay` saat offline.
- **Sinkronisasi Tertunda**: Saat terhubung ke backend `apps/api`, progres penyelesaian dapat memanfaatkan mekanisme `/api/v1/offline/sync` jika pengguna sudah login.

### 3.7. Fitur Pendamping untuk Guru, Relawan PFA, & Admin Konten *(Berbasis RBAC `apps/api`)*

Memanfaatkan sistem peran yang sudah didefinisikan di `apps/api/prisma/seed.ts` dan `apps/api/src/modules/`:

- **Mode Fasilitator / Diskusi Kelas (`GURU`, `RELAWAN`)**:
  - Tampilan ringkas skenario untuk diproyeksikan atau dibacakan bersama anak-anak di kelas/tenda ramah anak, disertai panduan pertanyaan diskusi (*talking points*) untuk fasilitator.
- **Kurasi & Versioning Skenario (`CONTENT_ADMIN`, `SUPER_ADMIN`)**:
  - Memanfaatkan tabel `SimulationScenario` dan `ScenarioVersion` di `apps/api/prisma/schema.prisma` agar psikolog atau tim kurikulum dapat memperbarui dialog tanpa merusak riwayat percobaan sebelumnya.
- **Statistik Agregat Komunitas (`PROGRAM_MANAGER`)**:
  - Menampilkan jumlah sesi selesai per topik skenario pada **Community Resilience Dashboard** (`/api/v1/dashboard`) dengan aturan *small-cell suppression* (`< 5` anak disembunyikan) tanpa pernah membuka pilihan jawaban individual anak ke publik.

---

## 4. Peta Integrasi Teknis pada Arsitektur Saat Ini

Aplikasi PERMATA saat ini memiliki dua permukaan API yang saling melengkapi (`apps/web/src/app/api/*` dan `apps/api/src/modules/*`). Berikut rancangan integrasi bertahap yang paling sesuai dengan pola kode yang sudah ada:

### Tahap 1 — Implementasi Cepat di `apps/web` (Selaras dengan 4 Game Lainnya)

1. **Definisi Data & Logika Domain**:
   - Tambahkan `apps/web/src/lib/games/roleplay.ts` berisi daftar skenario terkurasi, node langkah (*step*), opsi, umpan balik empatik, varian budaya (`aceh` / `kalimantan`), serta konstanta `ROLEPLAY_GAME_ID = "roleplay-psikoedukasi"` dan `ROLEPLAY_XP = 20`.
   - Buat unit test logika alur (memastikan semua skenario memiliki jalur selesai tanpa *dead-end* dan validasi server konsisten) di `apps/web/tests/`.
2. **Endpoint Persistensi & XP Harian**:
   - Tambahkan `apps/web/src/app/api/games/roleplay/route.ts` mengikuti pola `apps/web/src/app/api/games/sigap-bencana/route.ts` (`action: "start"` dan `action: "finish"`).
   - Simpan ke `GameAttempt` dan `GameDailyReward` di PostgreSQL agar langsung terhitung oleh `getUserTreeStats()` tanpa perlu mengubah tabel `HopeTree` yang sudah ada.
3. **Antarmuka `/roleplay`**:
   - Perbarui `apps/web/src/components/pages/RoleplayPsy.tsx` menggunakan token desain `PERMATA_Design_System_v2.md` (`bg-canvas`, `bg-surface`, `bg-emphasis`, `bg-action`, `border-line`, `focusRing`), dukungan `prefers-reduced-motion`, dan opsi audio efek lembut (mati secara default).
   - Perbarui status fitur pada `GUIDE.md` dan `docs/rag/site-features.md` dari *"Segera Hadir"* menjadi aktif.

### Tahap 2 — Sinkronisasi dengan Modul Backend `apps/api`

1. **Pemanfaatan Model `SimulationScenario` & `ScenarioStep`**:
   - Saat ini `ScenarioStep` di `apps/api/prisma/schema.prisma` berjalan berurutan berdasarkan `order`/`orderIndex`. Untuk mendukung percabangan roleplay yang lebih kaya, dapat ditambahkan field opsional pada `ScenarioOption` / `ScenarioStep` (mis. `nextStepOrder` atau `emotionTag`, atau disimpan sementara dalam metadata JSON terstruktur).
   - Tambahkan kategori/tag tipe simulasi (mis. `DISASTER_DRILL` vs `PSYCHOEDUCATION_ROLEPLAY`) agar simulasi kebencanaan fisik dan roleplay psikoedukasi terkelola rapi melalui `/api/v1/simulations`.
2. **Integrasi ke Pemulihan (`Recovery`)**:
   - Hubungkan ringkasan penyelesaian roleplay dengan pencatatan opsional ke `GrowthReflection` (`/api/v1/growth`) pada aspek *Relating to Others* atau *Personal Strength*.

### Tahap 3 — Mode Dialog AI & Paket Offline Terkurasi

1. Tambahkan mode latihan dialog interaktif opsional di `/roleplay` yang memanggil `/api/chat` dengan *system instruction* khusus mode roleplay (dibatasi `preflightGuardrail` dan *max turns*).
2. Daftarkan aset JSON skenario roleplay ke dalam manifest `OfflineContentPackage` (`/api/v1/offline`) dan cache PWA (`sw.js`).

---

## 5. Checklist Kepatuhan Keamanan, Aksesibilitas, & Etika

Sebelum fitur Roleplay Psikoedukasi dirilis ke pengguna, pastikan hal-hal berikut terpenuhi:

- [ ] **Verifikasi Pakar**: Naskah dialog, respons empatik, dan materi PFA telah ditinjau oleh psikolog anak / praktisi PFA serta tokoh budaya lokal (Aceh & Kalimantan).
- [ ] **Tanpa Bahasa Menghakimi**: Tidak ada indikator warna merah menyala atau kata *"Salah!"* / *"Gagal!"* pada pilihan emosi; gunakan umpan balik reflektif dengan warna netral/hangat.
- [ ] **Jaring Pengaman Krisis**: Bila ada input teks bebas, `detectCrisisInput` selalu berjalan lebih dulu sebelum logika lain dan menampilkan arahan bantuan manusia / SafeConnect 119.
- [ ] **Aksesibilitas**: Kontras teks minimal 4,5:1 (WCAG AA), target sentuh ≥ 44×44 px, navigasi penuh dengan keyboard, dan animasi tunduk pada `prefers-reduced-motion`.
- [ ] **Perlindungan Data Anak**: Tamu bisa bermain tanpa mengirim data pribadi; bagi pengguna login, hanya ringkasan pilihan dan durasi yang disimpan untuk progres belajar dan tidak diekspos ke pengguna lain.
