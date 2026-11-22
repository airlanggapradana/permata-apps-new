---
id: site-features
title: Peta Fitur dan Navigasi PERMATA
source: docs/rag/site-features.md
topic: fitur-navigasi
lang: id
---

# Peta Fitur dan Navigasi PERMATA

## Tentang PERMATA
PERMATA (Platform Integrasi Pendidikan Resiliensi Mental & Pendampingan Anak dalam Konteks Kebencanaan) adalah platform pendampingan berbasis kearifan lokal Nusantara untuk kesiapsiagaan bencana, respons psikososial, dan pemulihan pascabencana. Konteks budaya utama yang digunakan adalah Aceh (Meuseuraya, Saweu Syedara) dan Sumatera Barat/Minangkabau (Mambangkik Batang Tarandam, Badunsanak).

## Rute Utama
- `/` — Halaman utama (Landing Page). Pengenalan visi PERMATA dan akses cepat ke Dashboard serta Jurnal Hikmah.
- `/dashboard` — Dashboard Resiliensi. Menampilkan Pohon Harapan (Hope Tree), progres/XP, target harian, kartu fitur utama, dan Game Center.
- `/jurnal` dan `/journal` — Jurnal Hikmah. Ruang refleksi emosional harian: pilih suasana hati, tulis cerita, simpan, dan dapatkan refleksi berbasis budaya. Riwayat refleksi tersimpan.
- `/ai-companion` — AI Mental Support Companion (Sahabat Dengar). Percakapan pendampingan empatik pascabencana berbasis AI dengan protokol keamanan/krisis dan respons yang menyesuaikan konteks budaya.
- `/mood-food` — Mood + Food AI Analyzer. Unggah/tangkap foto makanan atau minuman, tulis mood/gejala/catatan, lalu dapatkan analisis psiko-nutrisi yang relevan dengan pemulihan emosi.
- `/tele-screening` — Tele-Screening & Triage (DASS-21). Skrining mandiri 21 pertanyaan untuk memetakan tingkat depresi, kecemasan, dan stres dengan kategori tingkat keparahan dan rekomendasi tindak lanjut.
- `/safety-passport` — Safety Passport (Kartu Keselamatan Keluarga). Kelola kontak darurat, anggota keluarga, titik kumpul, kebutuhan darurat, dan catatan penting untuk kesiapan keluarga.
- `/offline-survival` — Offline Survival Mode & PWA. Panduan darurat yang dapat diakses tanpa koneksi internet dan tanpa login: keselamatan fisik, prinsip PFA, grounding, napas tenang, go-bag, nomor darurat, dan ekspor kartu keselamatan.
- `/login` dan `/register` — Autentikasi akun pengguna (registrasi, masuk, sesi).
- `/roleplay` — Roleplay Psikoedukasi. Empat cerita bercabang terkurasi untuk melatih empati: menemani teman di posko, rindu rumah/sekolah, mengikuti pendamping setelah guncangan, serta memeriksa kabar. Konteks Aceh/Kalimantan, avatar Rafi/Lala dengan ekspresi sesuai adegan, layar percakapan ringkas, serta refleksi “Jejak pilihanmu” dari pilihan aktual pemain. Umpan balik lembut tanpa skor gagal, jeda, napas pelan, grounding, dan panduan mencari orang dewasa tepercaya. Tidak memakai AI atau input teks bebas.

## Game Center (Resiliensi & Edukasi)
- `/game-quake` — Sigap Bencana. Petualangan rumah simulasi (Phaser 3) untuk belajar respons aman saat dan setelah gempa melalui tiga pertanyaan/situasi berurutan, lalu mencapai pintu keluar. Kontrol keyboard/tombol layar, jeda, musik opsional. Pengguna login dapat menyimpan hasil; penyelesaian pertama memberi hingga 20 XP/hari (sesuai aturan aplikasi).
- `/game-healing` — Tas Siaga Bencana (Pick & Drop). Kenali dan pilih enam perlengkapan penting ke dalam tas. Mode latihan santai tanpa timer atau tantangan 60 detik, kontrol sentuh/mouse (kamera tangan opsional). Pilihan kurang tepat mendapat petunjuk. Hasil pengguna login tersimpan; penyelesaian pertama memberi 20 XP/hari.
- `/game-breath` — Napas Tenang (Breathing Calm). Latihan napas dengan pilihan ritme (Ringan/Santai) dan 5 atau 8 putaran, panduan tarik/hembus tanpa menahan napas, jeda/lanjut, jeda otomatis saat pindah tab. Kamera opsional sebagai cermin/percobaan deteksi lokal (tidak menentukan XP). Hadiah maksimal 15 XP/hari dibagi dengan target napas dashboard.
- `/game-siagaminang` — Siaga Minang. Petualangan platform klasik bertema Minangkabau: kumpulkan 10 perlengkapan, lewati tiga checkpoint, capai tujuan. Kontrol keyboard/tombol layar, jeda, musik opsional. Jika jatuh kembali ke pos terakhir. Pengguna login menyimpan hasil; penyelesaian pertama memberi 20 XP/hari.
- `/game-adventure` — Adventure Budaya. Simulasi naratif mitigasi bencana berbasis kearifan lokal.
- `/roleplay` — Roleplay Psikoedukasi. Tamu dapat memainkan seluruh cerita. Pengguna login mendapat maksimal 20 XP roleplay per hari untuk seluruh skenario, berdasarkan hari Asia/Makassar. Progres lokal disimpan maksimal tujuh hari bila penyimpanan browser diizinkan. Gunakan “Simpan untuk offline” saat terhubung; cerita bisa dimainkan offline setelah paket tersimpan. Penyimpanan hasil offline ke akun dilakukan saat ringkasan dibuka kembali dengan akun yang sama dan koneksi tersedia; XP dihitung pada hari penyimpanan ke server. Mode AI, CMS skenario, dan fasilitator belum tersedia.

Alamat lama `/PickAndDrop.html`, `/Breathing.html`, dan `/SiagaMinang.html` mengarah ke permainan dalam aplikasi.

## Fitur Pendukung di Dashboard
- Pohon Harapan (Hope Tree) dan progres XP/resiliensi.
- Target harian (daily goals), termasuk jurnal, latihan napas, dan aktivitas penenang lain sesuai tampilan dashboard.
- Akses cepat ke Tele-Screening, AI Companion, Mood + Food, dan modul dukungan budaya (Aceh/Sumbar).

## Catatan Penggunaan
- Beberapa fitur (seperti penyimpanan progres/XP, jurnal tersinkron, safety passport) memerlukan akun/login dan koneksi sesuai implementasi.
- Fitur AI chat, jurnal AI, dan mood-food memerlukan kunci AI yang dikonfigurasi; bila tidak tersedia, aplikasi menyediakan respons/fallback lokal yang aman.
