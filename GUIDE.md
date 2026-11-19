# Panduan Lengkap Fitur Aplikasi PERMATA (`GUIDE.md`)

**PERMATA (Platform Integrasi Pendidikan Resiliensi Mental & Pendampingan Anak dalam Konteks Kebencanaan)** adalah ekosistem aplikasi berbasis kearifan lokal Nusantara yang dirancang untuk mendampingi kesiapsiagaan bencana, respons darurat psikososial (*Psychological First Aid*), serta pertumbuhan pascatrauma (*Post-Traumatic Growth*).

Dokumen ini memuat panduan penggunaan untuk setiap fitur yang tersedia pada **Aplikasi Web (`apps/web`)** maupun **Layanan Backend API (`apps/api`)**.

---

## Daftar Isi

1. [Arsitektur Singkat & Cara Menjalankan Aplikasi](#1-arsitektur-singkat--cara-menjalankan-aplikasi)
2. [Panduan Fitur Antarmuka Web (`apps/web`)](#2-panduan-fitur-antarmuka-web-appsweb)
   - [2.1. Navigasi Utama & Geo-Cultural Tagging (Aceh / Sumbar)](#21-navigasi-utama--geo-cultural-tagging-aceh--sumbar)
   - [2.2. Halaman Utama / Landing Page (`/`)](#22-halaman-utama--landing-page-)
   - [2.3. Dashboard Resiliensi (`/dashboard`)](#23-dashboard-resiliensi-dashboard)
   - [2.4. Jurnal Hikmah (`/jurnal`)](#24-jurnal-hikmah-jurnal)
   - [2.5. Tele-Screening & Triage (`/tele-screening`)](#25-tele-screening--triage-tele-screening)
   - [2.6. AI Mental Support Companion (`/ai-companion`)](#26-ai-mental-support-companion-ai-companion)
   - [2.7. Mood + Food AI Analyzer (`/mood-food`)](#27-mood--food-ai-analyzer-mood-food)
   - [2.8. Game Center Resiliensi (6 Modul Permainan & Simulasi)](#28-game-center-resiliensi-6-modul-permainan--simulasi)
3. [Panduan Fitur Layanan Backend API (`apps/api`)](#3-panduan-fitur-layanan-backend-api-appsapi)
   - [3.1. Autentikasi, RBAC, & Persetujuan Orang Tua (`/api/v1/auth`, `/api/v1/children`)](#31-autentikasi-rbac--persetujuan-orang-tua-apiv1auth-apiv1children)
   - [3.2. Pilar 1: Kesiapsiagaan Bencana & Safety Passport](#32-pilar-1-kesiapsiagaan-bencana--safety-passport)
   - [3.3. Pilar 2: Respons Bencana, SafeConnect (PFA), & Sinkronisasi Offline](#33-pilar-2-respons-bencana-safeconnect-pfa--sinkronisasi-offline)
   - [3.4. Pilar 3: Pemulihan Jangka Panjang, Care Circle, & Grief Journey](#34-pilar-3-pemulihan-jangka-panjang-care-circle--grief-journey)
   - [3.5. Pilar 4: AI Guardrails, Dashboard Resiliensi Komunitas, & Audit](#35-pilar-4-ai-guardrails-dashboard-resiliensi-komunitas--audit)
4. [Daftar Rute & Endpoint Cepat](#4-daftar-rute--endpoint-cepat)

---

## 1. Arsitektur Singkat & Cara Menjalankan Aplikasi

Proyek PERMATA dikelola dalam monorepo menggunakan `pnpm` dan `turbo`:
- **`apps/web`**: Aplikasi frontend berbasis Next.js, React 19, Tailwind CSS, Framer Motion, Phaser 3, dan Google Gemini AI.
- **`apps/api`**: Layanan REST API berbasis Express, TypeScript, Prisma 7 (PostgreSQL), Redis/BullMQ, dan OpenAPI/Swagger.

### Menjalankan Aplikasi di Mode Development

1. **Instalasi dependensi** (dari root repositori):
   ```powershell
   pnpm install
   ```
2. **Menjalankan Frontend Web (`apps/web`)**:
   ```powershell
   pnpm --filter @permata/web dev
   ```
   Buka `http://localhost:3000` di browser.
3. **Menjalankan Backend API (`apps/api`)**:
   Pastikan file `apps/api/.env` sudah dikonfigurasi, lalu jalankan:
   ```powershell
   pnpm --filter @permata/api dev
   ```
   Server API berjalan di `http://localhost:4000` dan dokumentasi interaktif Swagger tersedia di `http://localhost:4000/api/docs`.

---

### Pemeriksaan cache offline saat pengembangan

JavaScript, CSS, dan halaman game memakai versi jaringan terbaru saat online, lalu memakai salinan tersimpan bila koneksi terputus. Ini mencegah error **hydration mismatch** akibat HTML terbaru dipasangkan dengan JavaScript lama ketika kode berubah. Script service worker diperbarui tanpa memakai cache HTTP; cache aplikasi lain tetap dipertahankan.

Jalankan pengujian perilaku cache dari root repository:

```powershell
pnpm --filter @permata/web test:offline
```

Setelah pembaruan kode, muat ulang tab yang sudah terbuka agar memakai kode terbaru. Pengujian mencakup pembaruan aset online, fallback offline, penulisan cache yang gagal, serta pengecualian API dan origin lain.

## 2. Panduan Fitur Antarmuka Web (`apps/web`)

### 2.1. Navigasi Utama & Geo-Cultural Tagging (Aceh / Sumbar)
- **Lokasi di Antarmuka**: Bilah navigasi atas (*Navbar*) yang selalu terlihat di seluruh halaman.
- **Fungsi Utama**:
  - **Menu Cepat**: Berpindah instan ke halaman **Home** (`/`), **Dashboard** (`/dashboard`), dan **Jurnal** (`/jurnal`).
  - **Tombol `LOKASI: ACEH` / `LOKASI: SUMBAR`**: Mengaktifkan fitur *Geo-Cultural Tagging* yang mengubah tema warna, istilah budaya, dan pendekatan refleksi di seluruh aplikasi:
    - **Mode Aceh**: Menggunakan palet warna hijau *Meunasah* (`#1B4332`) dengan aksen emas, mengangkat nilai *Meuseuraya* (gotong royong) dan forum dukungan sebaya *Saweu Syedara*.
    - **Mode Sumbar (Sumatera Barat)**: Menggunakan palet warna merah marun *Rumah Gadang* (`#7B0000`) dengan aksen kuning emas, mengangkat filosofi *Mambangkik Batang Tarandam* (semangat bangkit dari keterpurukan) dan *Badunsanak*.

---

### 2.2. Halaman Utama / Landing Page (`/`)
- **Fungsi Utama**: Memperkenalkan visi PERMATA dalam mendekonstruksi pendekatan klinis menjadi metode humanis berbasis kearifan lokal Nusantara.
- **Cara Menggunakan**:
  1. Klik tombol **`Mulai Pemulihan`** untuk langsung masuk ke halaman **Dashboard Resiliensi** (`/dashboard`).
  2. Klik kartu **`AI Jurnal Hikmah`** di bagian tengah halaman untuk langsung membuka fitur refleksi jurnal (`/jurnal`).
  3. Gunakan tautan pada bagian *Footer* untuk berpindah ke halaman utama lainnya.

---

### 2.3. Dashboard Resiliensi (`/dashboard`)
Halaman pusat kendali pengguna yang terbagi menjadi 4 area utama:

1. **Kartu Fitur Utama (4 Modul Inti)**:
   - **Saweu Syedara / Badunsanak**: Informasi ruang dukungan sebaya terkurasi dan anonim sesuai budaya yang aktif.
   - **Tele-Screening & Triage**: Membuka halaman deteksi risiko psikologis mandiri (`/tele-screening`).
   - **AI Mental Support Companion (ChatBot)**: Membuka ruang percakapan dengan asisten pendamping mental berbasis AI (`/ai-companion`).
   - **Mood + Food AI Analyzer**: Membuka fitur analisis emosi dan nutrisi dari foto makanan (`/mood-food`).
2. **Panel Progress Resiliensi & Pohon Harapan (*Hope Tree*)**:
   - Menampilkan visualisasi interaktif **Hope Tree** (Pohon Harapan) yang merepresentasikan tingkat ketangguhan pengguna beserta bilah persentase resiliensi.
3. **Target Harian (*Daily Goals*)**:
   - Daftar aktivitas pemulihan harian yang memberikan poin pengalaman (*XP*):
     - **Jurnal Hikmah (`+50 XP Refleksi`)**: Klik judulnya untuk membuka `/jurnal`.
     - **Latihan Napas (`+30 XP Tenang`)**: Klik judulnya untuk membuka `/game-breath`.
     - **Meditasi Budaya (`+40 XP Fokus`)**: Klik judulnya untuk membuka `/game-healing`.
   - Kotak centang (*checkbox*) di sisi kanan setiap target dapat dicentang langsung untuk menandai aktivitas yang sudah diselesaikan hari ini.
4. **Game Center Resiliensi**:
   - Menyediakan 6 kartu permainan edukatif dan simulasi kesiapsiagaan bencana.

---

### 2.4. Jurnal Hikmah (`/jurnal`)
- **Fungsi Utama**: Ruang aman untuk menuliskan perasaan, pengalaman, atau rasa syukur harian serta mendapatkan umpan balik reflektif berbasis kearifan lokal.
- **Langkah Penggunaan**:
  1. **Pilih Suasana Hati (*Mood Selector*)**: Klik salah satu dari 5 indikator perasaan saat ini:
     - `😢 Cemas/Takut` (Skor 1)
     - `😔 Sedih` (Skor 2)
     - `😐 Tenang/Biasa` (Skor 3)
     - `🙂 Bersyukur` (Skor 4)
     - `🌟 Penuh Harapan` (Skor 5)
  2. **Tulis Cerita Refleksi**: Ketikkan perasaan atau pengalaman hari ini pada kolom teks yang tersedia.
  3. **Simpan & Analisis Makna (AI)**: Klik tombol **`Simpan & Analisis Makna (AI)`**.
  4. **Lihat Hasil Refleksi & Riwayat**:
     - Sistem akan menampilkan kartu **Refleksi Pertumbuhan Jiwa** yang disesuaikan dengan budaya aktif (*Meuseuraya* untuk Aceh atau *Mambangkik Batang Tarandam* untuk Sumbar).
     - Catatan otomatis tersimpan di penyimpanan lokal browser (`localStorage`) dan tampil pada daftar **Riwayat Refleksi** di bagian bawah halaman.

---

### 2.5. Tele-Screening & Triage (`/tele-screening`)
- **Fungsi Utama**: Skrining mandiri kondisi emosional menggunakan instrumen **DASS-21 (*Depression, Anxiety, and Stress Scale - 21 Items*)** untuk mendeteksi tingkat depresi, kecemasan, dan stres secara dini.
- **Langkah Penggunaan**:
  1. Baca setiap pernyataan yang muncul di layar (total **21 pertanyaan**).
  2. Pilih salah satu dari 4 skala frekuensi yang paling menggambarkan kondisi Anda:
     - `Tidak pernah` (Skor 0)
     - `Kadang-kadang` (Skor 1)
     - `Sering` (Skor 2)
     - `Hampir selalu` (Skor 3)
  3. Pantau kemajuan pengisian melalui bilah progres (*progress bar*) di bagian atas kartu.
  4. Setelah pertanyaan ke-21 dijawab, sistem otomatis menghitung skor dan menampilkan **Hasil Tele-Screening**:
     - Kategori warna untuk **Depression**, **Anxiety**, dan **Stress** (*Normal*, *Mild*, *Moderate*, *Severe*, hingga *Extremely Severe*).
     - Pesan motivasi dan rekomendasi tindak lanjut (termasuk imbauan berkonsultasi dengan tenaga profesional bila terdeteksi tingkat *Severe* / *Extremely Severe*).
  5. Klik **`Selesai & Kembali ke Dashboard`** untuk kembali ke halaman utama dashboard.

---

### 2.6. AI Mental Support Companion (`/ai-companion`)
- **Fungsi Utama**: Chatbot pendamping dukungan emosional berbasis Google Gemini (`gemini-2.5-flash`) yang dilengkapi dengan **Sistem Deteksi Krisis (*Crisis Detection*)**.
- **Langkah Penggunaan**:
  1. Ketikkan keluh kesah, kecemasan, atau cerita Anda pada kolom input `"Tulis perasaan Anda..."` di bagian bawah.
  2. Tekan tombol **`Enter`** atau klik tombol kirim (ikon pesawat kertas).
  3. **Mekanisme Keamanan & Respons**:
     - **Percakapan Reguler**: Pesan dikirim ke endpoint `/api/chat` untuk direspons secara empatik dan suportif oleh asisten AI. Bila migrasi pgvector sudah diterapkan dan korpus `docs/rag/` telah diindeks (`pnpm rag:index`), respons dapat diperkaya konteks rujukan fitur/panduan PERMATA; jika indeks/kunci DB/AI tidak tersedia, chat tetap berjalan dengan fallback aman tanpa RAG.
     - **Intersepsi Krisis Otomatis**: Jika pesan pengguna mengandung kata kunci indikasi bahaya darurat (*"bunuh diri"*, *"ingin mati"*, *"tidak ingin hidup"*, *"hopeless"*, *"self harm"*), sistem **langsung memotong alur** dan menampilkan pesan darurat berisi nomor **Hotline Kesehatan Mental 119** agar pengguna segera mendapatkan pertolongan manusia.

---

### 2.7. Mood + Food AI Analyzer (`/mood-food`)
- **Fungsi Utama**: Menganalisis hubungan antara kondisi emosi pengguna dan makanan yang dikonsumsi menggunakan kemampuan multimodal (teks + gambar/PDF) dari Google Gemini AI (`/api/mood-food`).
- **Langkah Penggunaan**:
  1. **Pilih Mood Kamu**: Klik salah satu tombol suasana hati (`😢 Sedih`, `😡 Marah`, atau `😄 Bahagia`).
  2. **Unggah Foto Makanan atau Ambil Gambar**:
     - Klik **`Choose File`** untuk memilih foto makanan (`image/*`) atau dokumen menu (`.pdf`) dari perangkat Anda.
     - Atau klik **`Take Photo`** untuk mengambil foto makanan langsung menggunakan kamera perangkat.
  3. Pastikan pratinjau (*preview*) foto telah muncul di layar.
  4. Klik tombol **`Analyze Now`**.
  5. **Hasil Analisis AI**: Sistem akan menampilkan penjelasan ringkas mengenai:
     - Perkiraan kandungan gizi utama dari makanan di foto.
     - Dampak makanan tersebut terhadap suasana hati yang sedang Anda rasakan.
     - Saran makanan atau minuman sehat tambahan untuk membantu menstabilkan emosi.

---

### 2.8. Game Center Resiliensi (6 Modul Permainan & Simulasi)

Seluruh permainan dapat diakses melalui bagian **Game Center Resiliensi** di halaman `/dashboard`:

| No | Nama Modul | Rute URL | Panduan & Tujuan Permainan |
| :--- | :--- | :--- | :--- |
| 1 | **Sigap Bencana** | `/game-quake` | Jelajahi rumah simulasi dengan **Phaser 3**, pelajari tiga situasi melalui pertanyaan yang bisa dicoba lagi, lalu capai pintu keluar. Keyboard atau tombol layar HP, jeda otomatis, musik opsional, dan ringkasan hasil. Pengguna yang login menyimpan sesi ke PostgreSQL; penyelesaian pertama memberi **20 XP/hari**. |
| 2 | **Tas Siaga Bencana (Pick & Drop)** | `/game-healing` | Pilih **Latihan santai** tanpa timer atau **Tantangan 60 detik**, lalu klik **Mulai Bermain**. Ketuk barang lalu tas, atau seret barang ke tas. Kamera pelacak tangan bersifat opsional. Pilihan kurang tepat memberi petunjuk dan kesempatan mencoba lagi. Hasil pengguna yang login tersimpan di PostgreSQL; penyelesaian pertama setiap hari memberi **20 XP** ke Pohon Harapan. |
| 3 | **Napas Tenang (Breathing Calm)** | `/game-breath` | Pilih ritme **Ringan** (3 detik tarik / 3 detik hembuskan) atau **Santai** (4 / 4), serta 5 atau 8 putaran. Klik **Mulai Latihan** untuk mengikuti lingkaran tanpa menahan napas. Bisa dijeda kapan saja; kamera opsional sebagai cermin. Hasil tersimpan untuk pengguna yang login, dengan maksimal **15 XP/hari** bersama target latihan napas di dashboard. |
| 4 | **Siaga Minang** | `/game-siagaminang` | Klik **Mulai Petualangan**, jelajahi arena klasik layar penuh, kumpulkan 10 perlengkapan dari empat jenis, lewati tiga checkpoint, lalu capai titik akhir. Kontrol keyboard atau tombol layar HP. Jika jatuh, kembali ke pos terakhir tanpa kehilangan barang. Pengguna yang login menyimpan hasil ke PostgreSQL; penyelesaian pertama mendapat **20 XP/hari**. |
| 5 | **Adventure Budaya** | `/game-adventure` | Klik tombol **`Mainkan Sekarang`** untuk membuka roleplay naratif mitigasi bencana berbasis kearifan lokal Nusantara (*Knock The Drought Out*). |
| 6 | **Roleplay Psikoedukasi** | `/roleplay` | Modul simulasi pengambilan keputusan dan *Growth Path* psikologis (saat ini berstatus *Coming Soon* pada antarmuka web dan didukung oleh modul skenario bercabang di backend API). |

> **Catatan Navigasi**: Gunakan tautan **`Kembali ke Dashboard`** untuk kembali ke `/dashboard`. Pada Tas Siaga Bencana, tautan tersedia di bagian atas halaman dan tombol **`Lihat Pohon Harapan`** tersedia setelah bermain. Alamat lama `/PickAndDrop.html` otomatis membuka permainan yang baru.

#### Walkthrough Tas Siaga Bencana

1. Buka `/game-healing` dari kartu **Tas Siaga Bencana** di Game Center.
2. Pilih **Latihan santai** (pilihan awal, tanpa timer) atau **Tantangan 60 detik**. Kontrol **Sentuh / mouse** langsung tersedia; kamera hanya diminta setelah permainan dimulai dengan kontrol kamera.
3. Klik **Mulai Bermain**. Ketuk/klik barang lalu tas, atau seret barang ke tas. Keyboard juga bisa digunakan dengan Tab dan Enter.
4. Temukan air minum, senter, makanan siap santap, kotak P3K, jas hujan, dan masker. Barang tambahan memberi petunjuk tanpa mengakhiri permainan atau mengurangi poin.
5. Setelah tas lengkap, waktu habis, atau memilih **Akhiri latihan**, baca ringkasan kegunaan keenam perlengkapan. Kamera berhenti saat keluar dari permainan atau dimatikan.
6. Untuk pengguna yang login, hasil tersimpan di PostgreSQL. Penyelesaian pertama memberikan **20 XP per hari**, dihitung berdasarkan zona waktu **Asia/Makassar**. Pengulangan tetap bisa dimainkan tanpa hadiah ganda. Hasil yang belum lengkap tersimpan tanpa XP.
7. Jika penyimpanan gagal, gunakan **Coba Simpan Lagi**. Setelah tersimpan, pilih **Main Lagi** atau **Lihat Pohon Harapan**. Tamu bisa bermain; login sebelum sesi berikutnya untuk menyimpan progres.

Implementasi tahap pertama selesai: materi berbahasa Indonesia, umpan balik ramah, mode latihan/tantangan, kontrol tanpa kamera, kamera opsional, penyimpanan sesi, batas XP harian, dan pembaruan kartu Game Center.

Untuk menjalankan pengujian integrasi, siapkan PostgreSQL lokal dengan migration terbaru dan jalankan frontend, lalu dari root repository:

```powershell
pnpm --filter @permata/web test:game
```

Pengujian membuat akun sementara dan membersihkannya setelah selesai. Cakupannya mencakup autentikasi, kepemilikan sesi, validasi hasil, penyimpanan sesi belum lengkap, batas waktu tantangan, penyimpanan ulang, hadiah bersamaan, pergantian hari, dan kontribusi XP di dashboard.

#### Walkthrough Napas Tenang

1. Buka **Napas Tenang** dari Game Center atau target harian **Latihan Napas**. Alamat lama `/Breathing.html` mengarah ke `/game-breath`.
2. Pilih ritme **Ringan** atau **Santai**, lalu 5 atau 8 putaran. Perkiraan durasi 30–64 detik ditampilkan sebelum mulai. Semua latihan bisa diikuti tanpa kamera dan tanpa login.
3. Klik **Mulai Latihan**. Lingkaran membesar untuk **Tarik napas** dan mengecil untuk **Hembuskan napas**. Tidak ada fase menahan napas. Ikuti senyamanmu tanpa memaksakan hitungan; kamu boleh bernapas biasa dan berhenti kapan saja.
4. Gunakan **Jeda** dan **Lanjutkan** sesuai kebutuhan. Saat pindah tab, latihan dijeda otomatis; waktu jeda tidak menambah durasi atau putaran. Pengaturan perangkat untuk mengurangi animasi dihormati dengan lingkaran diam dan instruksi teks.
5. Kamera mati secara default. Klik **Nyalakan Kamera** saat latihan berjalan jika ingin menggunakan cermin. Untuk mencoba perkiraan pola gerakan dada/perut, pilih **Deteksi kamera (percobaan)** sebelum mulai. Video diproses di perangkat, tanpa perekaman atau unggahan. Izin ditolak tidak menghalangi latihan.
6. Kamera dimatikan saat jeda, pindah tab, selesai, atau meninggalkan halaman. Setelah melanjutkan, kamera tetap mati sampai dinyalakan lagi.
7. Setelah seluruh putaran atau **Akhiri Latihan**, lihat waktu aktif dan jumlah putaran. Tidak ada skor kegagalan. Pengguna yang login menyimpan sesi selesai maupun sesi yang diakhiri lebih awal ke PostgreSQL.
8. Penyelesaian pertama mendapat **15 XP/hari** (Asia/Makassar) dan menandai target napas harian di dashboard. Hadiah ini memakai pencatatan yang sama dengan checkbox dashboard, sehingga dua tab, pengulangan, atau penggunaan kedua jalur tidak menggandakan XP. Sesi yang diakhiri lebih awal tersimpan tanpa XP.
9. Jika koneksi gagal, klik **Coba Simpan Lagi**. Pilih **Latihan Lagi** atau **Lihat Pohon Harapan** setelah hasil tersimpan.

Task implementasi Napas Tenang:

- [x] Nama dan bahasa konsisten pada halaman, landing page, serta kartu dashboard.
- [x] Panduan lingkaran yang halus, pilihan ritme dan jumlah putaran.
- [x] Jeda/lanjutkan dan jeda otomatis saat pindah tab.
- [x] Kamera opsional, penanganan izin ditolak, serta penghentian stream.
- [x] Ringkasan waktu dan putaran, latihan lagi, serta navigasi dashboard.
- [x] Penyimpanan sesi dan hadiah harian bersama dashboard.
- [x] Pengujian integrasi PostgreSQL untuk validasi, kepemilikan, hadiah bersamaan, dan pergantian hari.
- [x] Uji browser HP/desktop: timer, jeda/lanjutkan, perpindahan tab, pengurangan animasi, kamera ditolak, izin kamera terlambat, penyimpanan ulang, dan progres dashboard.

Perintah `pnpm --filter @permata/web test:game` menjalankan tes Tas Siaga, Napas Tenang, analisis kamera, Siaga Minang, serta Sigap Bencana. Tes integrasi membutuhkan frontend dan PostgreSQL lokal yang sudah berjalan. Untuk RAG AI Companion, pastikan migrasi pgvector diterapkan dan korpus `docs/rag/` diindeks dengan `pnpm rag:index` (membutuhkan `DATABASE_URL` dan `GEMINI_API_KEY`/`AI_API_KEY`).

Materi umum kenyamanan bernapas mengacu pada [panduan NHS](https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/): bernapas dengan nyaman tanpa memaksakan kedalaman atau hitungan. Pilihan ritme dan jumlah putaran dalam aplikasi adalah pengaturan antarmuka latihan.

#### Percobaan deteksi kamera

1. Centang **Deteksi kamera (percobaan)**, lalu klik **Mulai Latihan**. Saat pertama disiapkan, deteksi memerlukan internet untuk memuat model posisi tubuh. Kamera hanya diminta setelah tombol mulai ditekan.
2. Pastikan bahu hingga perut terlihat, dengan cahaya merata dari depan dan kamera diam. Tidak perlu mengangkat bahu atau membesarkan napas untuk kamera.
3. Tunggu kalibrasi gambar stabil sekitar tiga detik. Waktu latihan belum berjalan selama persiapan. Gambar gelap, detail yang kurang jelas, posisi tubuh yang tidak terlihat, atau gerakan besar akan meminta penyesuaian. **Mulai Tanpa Deteksi** selalu tersedia.
4. Hitungan dimulai setelah kalibrasi. Panduan tarik/hembuskan juga ditampilkan di panel kamera agar tetap terlihat pada HP. Analisis mencari beberapa siklus gerakan dada/perut yang berulang dan konsisten; wajah atau tubuh yang terlihat saja tidak cukup menghasilkan deteksi.
5. Status **Pola gerakan berulang terdeteksi** disertai keyakinan sedang dan kemiripan periode gerakan dengan ritme panduan. **Pola napas belum terbaca** berarti bukti gerakan belum cukup, bukan kegagalan pemain. Jangan memaksakan napas untuk memperoleh deteksi.
6. Hasil menampilkan ringkasan perkiraan siklus yang teramati selama sesi. Gambar, titik posisi tubuh, dan ringkasan deteksi tidak dikirim ke API atau disimpan dalam database. XP tetap berdasarkan penyelesaian latihan, dengan batas harian yang sama.
7. Saat jeda, pindah tab, selesai, atau keluar, kamera dan pemrosesan deteksi berhenti. Setelah dilanjutkan, kamera perlu dinyalakan kembali jika masih ingin dipakai.

Task deteksi kamera:

- [x] Pilihan mode, persetujuan kamera melalui tombol mulai, dan panduan posisi.
- [x] Kalibrasi serta pemeriksaan pencahayaan, detail gambar, dan pergerakan tubuh.
- [x] Analisis gerakan lokal dan pembandingan periode dengan panduan.
- [x] Status hasil yang menyatakan perkiraan tanpa menentukan kelulusan atau XP.
- [x] Tes gambar diam, perubahan cahaya, translasi/zoom bersama, gerakan besar, pola berulang, dan penghitungan siklus.
- [x] Uji browser kalibrasi, pembacaan gambar sintetis, penghentian kamera, serta kelanjutan mode tanpa deteksi.

**Batas percobaan:** analisis gerakan gambar tidak membuktikan orang mengikuti napas, tidak mengukur kondisi kesehatan, dan bisa dipengaruhi pakaian, pencahayaan, kamera, serta gerakan lain. Label keyakinan adalah indikator heuristik, bukan probabilitas yang sudah divalidasi. Implementasi sudah diuji dengan video/gambar sintetis; akurasinya pada napas manusia belum divalidasi. MediaPipe dipakai untuk menentukan area tubuh, sedangkan pola dibaca dari perubahan gambar dada/perut, bukan sekadar naik-turun bahu. Rujukan: [MediaPipe Pose](https://chuoling.github.io/mediapipe/solutions/pose.html).

---

#### Walkthrough Siaga Minang

1. Buka kartu **Siaga Minang** di Game Center, baca petunjuk, lalu klik **Mulai Petualangan**. Alamat lama `/SiagaMinang.html` mengarah ke `/game-siagaminang`.
2. Berlatih bergerak dan melompat di area awal. Jalur dan penempatan barang tetap, sehingga semua rintangan dan perlengkapan dapat dijangkau. Tidak ada batas waktu.
3. Kumpulkan **10 perlengkapan**: tiga air minum, tiga makanan siap santap, dua kotak P3K, dan dua senter. Sentuh barang menggunakan karakter untuk mengambilnya otomatis; beberapa berada di atas papan kayu yang harus dilompati. Penjelasan kegunaan muncul saat jenis barang pertama kali ditemukan. HUD menghitung semua barang, sedangkan menu jeda menampilkan jumlah per jenis.
4. Lewati **Pos 1**, **Pos 2**, dan **Pos 3**. Jika jatuh, karakter kembali ke checkpoint terakhir; perlengkapan yang sudah terkumpul tetap dibawa selama sesi.
5. Jika perlu istirahat, tekan **Jeda** atau **Esc**. Hitungan, gerakan, dan input berhenti; berpindah tab atau meninggalkan jendela juga menjeda permainan. **Lanjutkan** memulai kembali tanpa mempertahankan tombol yang sebelumnya ditekan.
6. Dari menu jeda, gunakan **Kembali ke Awal** atau kembali ke pos yang telah dibuka untuk mencari barang yang terlewat. Pos yang belum dilewati tetap terkunci. Perjalanan tidak perlu diulang dari nol.
7. Melodi klasik dimulai setelah menekan **Mulai Petualangan**, jika browser mengizinkan audio. Gunakan **Matikan Suara** / **Nyalakan Suara** sesuai kebutuhan. Musik dan efek berhenti saat jeda atau keluar.
8. Capai Rumah Gadang di titik akhir setelah mengumpulkan **10 perlengkapan** dan melewati ketiga pos. Jika belum lengkap, petunjuk barang yang kurang ditampilkan; pemain tetap bisa kembali mencarinya.
9. Lihat ringkasan perlengkapan, pos, waktu aktif, dan penjelasan barang. **Akhiri Perjalanan** dari menu jeda juga menghasilkan ringkasan yang ramah tanpa hadiah XP.
10. Untuk pengguna yang login, hasil dan detail checkpoint disimpan ke PostgreSQL saat perjalanan ditamatkan atau diakhiri. Penyelesaian pertama setiap hari memberi **20 XP** (Asia/Makassar); pengulangan dan pengiriman hasil bersamaan tidak menggandakan hadiah. Penyimpanan yang gagal bisa diulang lewat **Coba Simpan Lagi**.
11. Pilih **Main Lagi** atau **Lihat Pohon Harapan**. Tamu bisa memainkan seluruh jalur; login sebelum sesi berikutnya untuk menyimpan hasil. Checkpoint mempertahankan progres selama halaman sesi tetap terbuka, bukan pemulihan otomatis setelah menutup atau memuat ulang tab.

| Aksi | Laptop / PC | HP / tablet |
| :--- | :--- | :--- |
| Bergerak kiri | Panah kiri / A | Tahan **◀** |
| Bergerak kanan | Panah kanan / D | Tahan **▶** |
| Melompat | Spasi / panah atas / W | Ketuk **Lompat** |
| Jeda / lanjut | Esc atau tombol di layar | Tombol **Jeda** / **Lanjutkan** |

Tombol arah berada di kiri dan lompat di kanan, mendukung dua jari sekaligus. Pelepasan, pembatalan sentuhan, dan kehilangan pointer capture membersihkan input agar karakter tidak terus berjalan. Kamera tidak diperlukan.

Task implementasi Siaga Minang:

- [x] Nama dan bahasa Indonesia konsisten pada halaman dan kartu Game Center.
- [x] Pertahankan identitas klasik merah–hitam–emas dan melodi game lama; gambar ulang karakter, perlengkapan, serta Rumah Gadang dengan bentuk dan detail yang lebih rapi.
- [x] Animasi sendi tangan/kaki, transisi diam–lari–lompat, kedipan, gerak mendarat, dan bayangan karakter.
- [x] Interpolasi posisi antar-tick fisika agar pergerakan halus pada layar dengan refresh rate tinggi; perpindahan checkpoint langsung menuju pos.
- [x] Latar pegunungan berlapis, terasering, kelapa, langit, serta tekstur rumput dan platform; dukungan pengurangan animasi mengikuti pengaturan perangkat.
- [x] Ilustrasi halaman pembuka, panel dan tombol senada, serta bar progres perlengkapan.
- [x] Arena layar penuh dengan HUD dan tombol yang menyesuaikan desktop, HP tegak, serta HP mendatar.
- [x] Jalur terencana, 10 perlengkapan dari empat jenis, papan kayu, tiga checkpoint, dan petunjuk barang yang kurang.
- [x] Gerakan dengan timestep tetap, lompatan yang dapat diulang, serta pergerakan layar halus.
- [x] Kontrol keyboard dan tombol layar besar dengan dukungan multi-sentuh.
- [x] Checkpoint, jeda otomatis, pilihan kembali ke pos, serta musik dan efek yang bisa dimatikan.
- [x] Ringkasan hasil, penyimpanan sesi, serta hadiah maksimal 20 XP/hari.
- [x] Tes logika membuktikan jalur bisa ditamatkan dan progres terjaga saat jatuh.
- [x] Tes integrasi kepemilikan, validasi hasil, metadata sesi, hadiah bersamaan, dan pergantian hari.
- [x] Uji browser HP/desktop: tamat lewat kontrol asli, dua jari, pembatalan sentuhan, checkpoint, jeda/perpindahan tab, suara opsional, penyimpanan ulang, dan progres dashboard.
- [x] Uji gambar dan tata letak pada lima ukuran layar; simulasi frame 60/120/144 Hz memeriksa kecepatan yang konsisten, interpolasi posisi, serta gambar yang berhenti saat jeda.

Sebelum menjalankan versi ini pada database lain, jalankan `pnpm db:deploy` untuk menambahkan kolom metadata sesi, lalu `pnpm db:generate` agar Prisma Client sesuai skema. Migration mempertahankan sesi lama dengan metadata kosong.

#### Walkthrough Sigap Bencana

1. Buka **Sigap Bencana** di Game Center (`/game-quake`), baca petunjuk, lalu tekan **Mulai Latihan**. Tamu bisa memainkan seluruh jalur; login sebelum mulai untuk menyimpan hasil.
2. Bergerak ke kanan di rumah simulasi. Datangi penanda **1** di ruang tamu untuk membaca situasi ketika guncangan terasa. Permainan dan waktu aktif berhenti selama pertanyaan terbuka.
3. Pilih jawaban. Pilihan yang keliru menampilkan penjelasan dan bisa dicoba lagi; pilihan tepat membuka **Lanjutkan Perjalanan**. Tidak ada pengurangan XP karena mencoba kembali.
4. Lanjutkan melewati kotak kayu dengan tombol **Lompat**. Kunjungi penanda **2** di koridor untuk mempelajari pilihan setelah guncangan berhenti, lalu penanda **3** dekat pintu untuk mempelajari titik kumpul. Melompat adalah kontrol petualangan virtual; materi respons gempa dijelaskan pada pertanyaan.
5. Gunakan **Jeda** atau **Esc** untuk beristirahat. Perpindahan tab atau jendela juga menjeda perjalanan. Menu jeda menyediakan **Kembali ke Ruang Terakhir** tanpa menghapus langkah yang sudah dipelajari, serta **Akhiri Latihan** untuk selesai lebih awal tanpa hadiah penyelesaian.
6. Musik mati saat awal. Gunakan **Nyalakan Suara** / **Matikan Suara** sesuai kebutuhan. Musik berhenti selama jeda, pertanyaan, hasil, atau setelah meninggalkan halaman.
7. Setelah ketiga pertanyaan selesai, capai pintu bertanda **KELUAR**. Ringkasan menampilkan langkah yang dipelajari, waktu aktif, dan penjelasan materi. Pengguna yang login menyimpan jawaban, ruangan, jumlah percobaan keliru, dan hasil ke PostgreSQL.
8. Penyelesaian pertama setiap hari memperoleh **20 XP** untuk Pohon Harapan (Asia/Makassar). Pengulangan atau pengiriman hasil bersamaan tidak menggandakan hadiah. Jika koneksi gagal, gunakan **Coba Simpan Lagi**. Pilih **Main Lagi** atau **Lihat Pohon Harapan** setelah selesai.

| Aksi | Laptop / PC | HP / tablet |
| :--- | :--- | :--- |
| Bergerak | A/D atau panah kiri/kanan | Tahan tombol arah kiri bawah |
| Melompat | Spasi, W, atau panah atas | Ketuk **Lompat** di kanan bawah |
| Menjawab | Klik pilihan, atau Tab lalu Enter | Ketuk pilihan |
| Jeda / lanjut | Esc atau tombol layar | **Jeda** / **Lanjutkan** |

Tombol layar mendukung dua jari dan membersihkan input saat sentuhan dibatalkan atau pointer capture hilang. Langkah yang dipelajari dipertahankan selama sesi halaman terbuka; memuat ulang halaman memulai perjalanan baru. Materi mengacu pada [Antisipasi Gempa Bumi BMKG](https://www.bmkg.go.id/gempabumi/mitigasi/antisipasi-gempabumi) dan [Materi Edukasi InaEEWS BMKG](https://inaeews.bmkg.go.id/materi-edukasi).

Task implementasi Sigap Bencana:

- [x] Perbaiki titik pertanyaan dan pintu keluar yang tidak terjangkau pada implementasi lama.
- [x] Bangun jalur rumah dengan ruang tamu, koridor, area pintu, serta rintangan kayu yang dapat dilewati.
- [x] Karakter beranimasi, kamera mengikuti dengan halus, dan dukungan pengurangan animasi.
- [x] Tiga pertanyaan berurutan dengan penjelasan, percobaan ulang, serta ringkasan materi.
- [x] Kontrol keyboard/sentuh, jeda otomatis, pilihan kembali ke ruang terakhir, dan musik opsional.
- [x] Simpan sesi, periksa jawaban dan durasi di server, serta batasi hadiah 20 XP/hari.
- [x] Samakan nama dan deskripsi game di dashboard dan landing page.
- [x] Tes jalur sampai tamat, pertanyaan tidak bisa dilewati, kontrol, kepemilikan sesi, hasil parsial, dan hadiah bersamaan.
- [x] Uji browser sampai tamat, dua jari, pembatalan input, jeda, penyimpanan ulang, dan progres dashboard.
- [x] Uji musik saat jeda/pertanyaan/navigasi, lompatan lewat Enter, serta perubahan ukuran layar tanpa mengulang sesi.

## 3. Panduan Fitur Layanan Backend API (`apps/api`)

Selain antarmuka web di atas, PERMATA memiliki layanan backend komprehensif (`apps/api`) yang mengimplementasikan seluruh spesifikasi teknis di dalam `docs/PRD Permata.md`. Dokumentasi penuh skema request/response dapat diuji langsung melalui **Swagger UI** di `http://localhost:4000/api/docs`.

### 3.1. Autentikasi, RBAC, & Persetujuan Orang Tua (`/api/v1/auth`, `/api/v1/children`)
- **7 Peran Pengguna (*Role-Based Access Control*)**:
  - `ANAK`: Mengakses simulasi, jurnal pemulihan, pohon harapan, dan pendampingan.
  - `ORANG_TUA`: Mengelola profil anak, memberikan *Parental Consent*, dan memantau kesiapsiagaan keluarga.
  - `GURU`: Memantau kesiapsiagaan kelas dan berkolaborasi di *Care Circle*.
  - `RELAWAN` & `TENAGA_PSIKOSOSIAL`: Menangani sesi *SafeConnect* (PFA), triase, dan eskalasi rujukan.
  - `ADMIN_LEMBAGA` & `SUPER_ADMIN`: Mengelola organisasi, insiden bencana, konten kearifan lokal, dan audit log.
- **Fitur Utama**:
  - Registrasi & Login dengan hashing password **Argon2id**, rotasi *Refresh Token*, dan pencabutan sesi (*Session Revocation*).
  - **Parental Consent Gate**: Akun anak membutuhkan persetujuan orang tua/wali (`POST /api/v1/children/:id/consent`) sebelum diizinkan mengakses fitur pengumpulan data sensitif.

### 3.2. Pilar 1: Kesiapsiagaan Bencana & Safety Passport
- **Simulasi Bercabang (`/api/v1/simulations`)**:
  - Menyediakan skenario bencana interaktif (gempa bumi, tsunami, banjir, erupsi gunung berapi, tanah longsor) dengan pilihan tindakan bercabang (*branching steps*) dan perhitungan skor otomatis.
- **Asesmen Pra/Pasca-Edukasi (`/api/v1/assessments`)**:
  - Mengukur peningkatan pemahaman kesiapsiagaan anak melalui perbandingan nilai *pre-test* dan *post-test*.
- **Safety Passport (`/api/v1/safety-passport`)**:
  - Mencatat lencana (*badges*) yang diperoleh anak, level kesiapsiagaan, serta **Family Preparedness Checklist** (daftar cek kesiapan darurat keluarga seperti titik kumpul dan tas siaga).

### 3.3. Pilar 2: Respons Bencana, SafeConnect (PFA), & Sinkronisasi Offline
- **Manajemen Insiden Bencana (`/api/v1/disaster-incidents`)**:
  - Mengaktifkan status tanggap darurat wilayah dan menyajikan panduan keselamatan darurat yang relevan.
- **SafeConnect & Psychological First Aid (`/api/v1/support`)**:
  - **Request Support**: Anak atau orang tua dapat mengirim permintaan bantuan darurat psikososial.
  - **Emotional & Physical Check-in**: Pencatatan kondisi emosi dan kebutuhan fisik mendesak di lokasi pengungsian.
  - **Triase, Sesi Pendampingan, & Eskalasi Rujukan**: Fasilitator mencatat hasil sesi PFA dan membuat rujukan (*Referral*) ke psikolog/tenaga medis bila ditemukan tanda distres berat.
- **Mode Offline & Sinkronisasi (`/api/v1/offline`)**:
  - Mengunduh paket panduan darurat luar jaringan (`GET /api/v1/offline/bundles`) untuk kondisi tanpa sinyal dan menyinkronkan antrean data lapangan saat jaringan kembali tersedia (`POST /api/v1/offline/sync`).

### 3.4. Pilar 3: Pemulihan Jangka Panjang, Care Circle, & Grief Journey
- **Recovery Journal (`/api/v1/recovery-journal`)**:
  - Jurnal pemulihan dengan fitur **Visibility Settings** (anak dapat mengatur apakah jurnal bersifat pribadi atau boleh dilihat oleh orang tua/pendamping).
- **Post-Traumatic Growth Tree (`/api/v1/growth`)**:
  - Mencatat tonggak pemulihan (*milestones*) dan menumbuhkan level pohon harapan tanpa mekanisme hukuman (*no punitive streak*).
- **Care Circle (`/api/v1/care-circle`)**:
  - Ruang kolaborasi aman bagi orang tua, guru, dan fasilitator untuk berbagi catatan perkembangan dan rencana dukungan anak.
- **Grief & Adaptation Journey (`/api/v1/grief-journey`)**:
  - Modul aktivitas reflektif bertahap untuk mendampingi anak dalam memproses rasa kehilangan dan beradaptasi dengan situasi baru pascabencana.

### 3.5. Pilar 4: AI Guardrails, Dashboard Resiliensi Komunitas, & Audit
- **AI Companion dengan Guardrails Ketat (`/api/v1/ai`)**:
  - **Redaksi PII Otomatis**: Menghapus NIK, nomor telepon, alamat email, dan koordinat/alamat rumah sebelum teks dikirim ke penyedia AI eksternal.
  - **Pre-LLM Crisis Interception**: Menghentikan pemanggilan model AI jika terdeteksi kata kunci menyakiti diri sendiri dan otomatis membuat peringatan risiko (*Risk Flag*).
- **Community Resilience Dashboard (`/api/v1/dashboard`)**:
  - Menyajikan metrik kesiapsiagaan dan pemulihan tingkat daerah/sekolah.
  - **Small-Cell Suppression (`< 5`)**: Jika jumlah responden dalam suatu kelompok agregasi kurang dari 5 anak, metrik otomatis disembunyikan (`suppressed: true`) untuk mencegah identifikasi ulang (*re-identification*).
- **Audit Logging (`/api/v1/audit`)**:
  - Mencatat setiap akses baca/tulis pada data sensitif (jurnal anak, riwayat PFA, rujukan, dan perubahan persetujuan orang tua).

---

## 4. Daftar Rute & Endpoint Cepat

### Rute Halaman Web (`apps/web` - Port `3000`)

| Rute URL | Nama Halaman | File Komponen Utama |
| :--- | :--- | :--- |
| `/` | Landing Page | `apps/web/src/components/pages/LandingPage.tsx` |
| `/dashboard` | Dashboard Resiliensi | `apps/web/src/components/pages/Dashboard.tsx` |
| `/jurnal` | Jurnal Hikmah | `apps/web/src/components/pages/Journal.tsx` |
| `/tele-screening` | Tele-Screening & Triage (DASS-21) | `apps/web/src/components/pages/TeleScreening.tsx` |
| `/ai-companion` | AI Mental Support Companion | `apps/web/src/components/pages/AiCompanion.tsx` |
| `/mood-food` | Mood + Food AI Analyzer | `apps/web/src/components/pages/MoodFoodAnalyzer.tsx` |
| `/game-quake` | Game Sigap Bencana (Phaser 3) | `apps/web/src/components/pages/GameQuake.tsx` |
| `/game-healing` | Tas Siaga Bencana (Pick & Drop) | `apps/web/src/components/pages/GameHealing.tsx` |
| `/game-breath` | Napas Tenang (Breathing Calm) | `apps/web/src/components/pages/GameBreathing.tsx` |
| `/game-siagaminang` | Game Siaga Minang | `apps/web/src/components/pages/GameSiagaMinang.tsx` |
| `/game-adventure` | Game Adventure Budaya | `apps/web/src/components/pages/GameAdventure.tsx` |
| `/roleplay` | Roleplay Psikoedukasi | `apps/web/src/components/pages/RoleplayPsy.tsx` |

### Rute API Internal Next.js (`apps/web`)

| Method & Endpoint | Fungsi | File Route |
| :--- | :--- | :--- |
| `POST /api/chat` | Endpoint chatbot AI Mental Support Companion | `apps/web/src/app/api/chat/route.ts` |
| `POST /api/mood-food` | Endpoint analisis multimodal Mood + Food | `apps/web/src/app/api/mood-food/route.ts` |
| `POST /api/games/emergency-bag` | Memulai sesi (`action: start`) atau menyimpan hasil Tas Siaga (`action: finish`); membutuhkan login | `apps/web/src/app/api/games/emergency-bag/route.ts` |
| `POST /api/games/breathing` | Memulai sesi Napas Tenang (`action: start`, `mode: gentle:5`, `gentle:8`, `steady:5`, atau `steady:8`) dan menyimpan durasi aktif (`action: finish`, `attemptId`, `activeMs`); membutuhkan login | `apps/web/src/app/api/games/breathing/route.ts` |
| `POST /api/games/siaga-minang` | Memulai sesi (`action: start`, `mode: practice`) dan menyimpan hasil perjalanan (`action: finish`, `attemptId`, `items`, `checkpoints`, `reachedGoal`, `falls`, `activeMs`); hadiah dihitung server | `apps/web/src/app/api/games/siaga-minang/route.ts` |
| `POST /api/games/sigap-bencana` | Memulai sesi (`action: start`, `mode: practice`) dan menyimpan hasil (`action: finish`, `attemptId`, `answers`, `rooms`, `reachedExit`, `mistakes`, `activeMs`); jawaban, durasi, serta hadiah 20 XP/hari diperiksa server | `apps/web/src/app/api/games/sigap-bencana/route.ts` |
| `POST /api/journal/breathe` | Menandai latihan napas yang dilaporkan dari dashboard, berbagi batas hadiah harian dengan Napas Tenang | `apps/web/src/app/api/journal/breathe/route.ts` |

### Grup Endpoint Backend Utama (`apps/api` - Port `4000`)

| Prefix Endpoint | Modul |
| :--- | :--- |
| `/api/v1/auth` & `/api/v1/users` | Autentikasi JWT, sesi, profil pengguna |
| `/api/v1/children` & `/api/v1/organizations` | Profil anak, *Parental Consent*, sekolah/lembaga |
| `/api/v1/simulations`, `/api/v1/assessments`, `/api/v1/safety-passport` | Pilar 1: Edukasi & kesiapsiagaan bencana |
| `/api/v1/disaster-incidents`, `/api/v1/support`, `/api/v1/offline` | Pilar 2: Tanggap darurat, *SafeConnect* (PFA), sinkronisasi offline |
| `/api/v1/recovery-journal`, `/api/v1/growth`, `/api/v1/care-circle`, `/api/v1/grief-journey` | Pilar 3: Pemulihan jangka panjang & pertumbuhan pascatrauma |
| `/api/v1/ai`, `/api/v1/dashboard`, `/api/v1/content`, `/api/v1/regions`, `/api/v1/media`, `/api/v1/admin`, `/api/v1/audit` | Pilar 4: AI Guardrails, analitik komunitas, CMS kearifan lokal, & audit |

