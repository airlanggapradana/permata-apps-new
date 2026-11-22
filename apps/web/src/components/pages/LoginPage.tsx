"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  EyeOff,
  GraduationCap,
  HandHeart,
  Leaf,
  PenLine,
  PhoneCall,
  ShieldCheck,
  ShieldUser,
  UserCog,
  Users,
  Wifi,
  WifiOff,
  BrainCircuit,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AnimatedSection } from "@/components/PageMotion";
import acehBackground from "@/assets/localization/aceh/background.png";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

const inputBase =
  "w-full px-3.5 py-2.5 rounded-[0.5rem] border border-outline-variant/80 bg-surface-container-lowest text-[14px] text-on-surface placeholder:text-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none transition-all";

function getSafeNextPath(): string {
  if (typeof window === "undefined") return "/dashboard";
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("next");
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/dashboard";
  }
  return raw;
}

const subscribeOnlineStatus = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

type RoleKey =
  | "anak"
  | "orangtua"
  | "guru"
  | "relawan"
  | "profesional"
  | "pejabat"
  | "program"
  | "konten"
  | "superadmin";

type RoleConfig = {
  key: RoleKey;
  label: string;
  code: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  placeholder: string;
  pwdHelper: string;
};

/*
 * Pilihan peran hanya memandu teks bantuan di halaman ini. Peran akun yang sebenarnya
 * ditentukan server dari akun yang masuk, jadi tidak ikut dikirim saat login.
 */
const ROLES: RoleConfig[] = [
  {
    key: "anak",
    label: "Anak / Siswa",
    code: "CHILD",
    icon: GraduationCap,
    title: "Masuk Ruang Belajar Mandiri & Jurnal Hikmah",
    desc: "Halo Sahabat! Masukkan email akunmu, atau tanyakan kepada Guru Posko jika lupa kata sandi kamu.",
    placeholder: "nama@contoh.com",
    pwdHelper: "Gunakan kata sandi yang kamu buat saat mendaftar di posko.",
  },
  {
    key: "orangtua",
    label: "Orang Tua / Wali",
    code: "PARENT_GUARDIAN",
    icon: Users,
    title: "Portal Pemantauan Kesiapsiagaan & Persetujuan Orang Tua",
    desc: "Akses perkembangan jurnal resiliensi ananda dan catatan tindak lanjut dari fasilitator psikososial.",
    placeholder: "email@wali.id",
    pwdHelper: "Masukkan kata sandi akun wali yang Anda buat saat mendaftar.",
  },
  {
    key: "guru",
    label: "Guru / Konselor",
    code: "TEACHER_COUNSELOR",
    icon: BookOpen,
    title: "Dasbor Guru & Manajemen Kelas Care Circle Posko",
    desc: "Pantau kesehatan emosional kelas darurat, input absensi, dan rujuk kasus anak dengan tanda kecemasan tinggi.",
    placeholder: "nama@sekolah.sch.id",
    pwdHelper: "Gunakan kata sandi akun portal pendidikan Anda.",
  },
  {
    key: "relawan",
    label: "Relawan",
    code: "VOLUNTEER",
    icon: HandHeart,
    title: "Konsol Relawan PFA & Triase SafeConnect 119",
    desc: "Akses penugasan lapangan, log kasus trauma kritis, dan komunikasi koordinasi posko gabungan BNPB/Kemensos.",
    placeholder: "nama@relawan.id",
    pwdHelper:
      "Wajib menggunakan kata sandi akun petugas tanggap darurat Anda.",
  },
  {
    key: "profesional",
    label: "Tenaga Profesional",
    code: "PROFESSIONAL",
    icon: Brain,
    title: "Ruang Kerja Psikolog & Tenaga Kesehatan Jiwa",
    desc: "Tinjau hasil skrining DASS-21, tindak lanjuti rujukan, dan dampingi anak dengan kebutuhan pemulihan lanjutan.",
    placeholder: "nama@praktik.id",
    pwdHelper: "Gunakan kata sandi akun profesional Anda.",
  },
  {
    key: "pejabat",
    label: "Pejabat Berwenang",
    code: "AUTHORIZED_OFFICER",
    icon: ShieldUser,
    title: "Portal Pejabat Berwenang & Pengawasan Wilayah",
    desc: "Pantau ringkasan kesiapsiagaan wilayah dan tinjau laporan agregat tanpa membuka identitas anak.",
    placeholder: "nama@instansi.go.id",
    pwdHelper: "Gunakan kata sandi akun instansi Anda.",
  },
  {
    key: "program",
    label: "Pengelola Program",
    code: "PROGRAM_MANAGER",
    icon: ClipboardCheck,
    title: "Konsol Pengelola Program Pendampingan",
    desc: "Kelola jadwal pendampingan, sebaran fasilitator, dan capaian program di tiap posko.",
    placeholder: "nama@program.id",
    pwdHelper: "Gunakan kata sandi akun pengelola program Anda.",
  },
  {
    key: "konten",
    label: "Admin Konten",
    code: "CONTENT_ADMIN",
    icon: PenLine,
    title: "Studio Konten Edukasi & Kearifan Lokal",
    desc: "Susun materi edukasi, cerita budaya, dan panduan kesiapsiagaan yang tampil di aplikasi.",
    placeholder: "nama@konten.id",
    pwdHelper: "Gunakan kata sandi akun admin konten Anda.",
  },
  {
    key: "superadmin",
    label: "Super Admin",
    code: "SUPER_ADMIN",
    icon: UserCog,
    title: "Konsol Super Admin PERMATA",
    desc: "Kelola akun, hak akses, dan konfigurasi sistem. Seluruh aktivitas tercatat dalam jejak audit.",
    placeholder: "admin@permata.id",
    pwdHelper: "Gunakan kata sandi akun super admin Anda.",
  },
];

const FEATURE_PILLS: { icon: LucideIcon; label: string }[] = [
  { icon: BadgeCheck, label: "Psikolog Profesional & PFA" },
  { icon: Leaf, label: "Pendekatan Holistik & Budaya" },
  { icon: ShieldCheck, label: "Enkripsi PII UU PDP Ramah Anak" },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, login, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roleKey, setRoleKey] = useState<RoleKey>("anak");

  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    () => navigator.onLine,
    () => true,
  );

  const role = ROLES.find((r) => r.key === roleKey) ?? ROLES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage("Masukkan alamat email yang valid.");
      return;
    }
    if (!password) {
      setErrorMessage("Kata sandi wajib diisi.");
      return;
    }

    setSubmitting(true);
    const result = await login(trimmedEmail, password);
    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error || "Email atau kata sandi salah.");
      return;
    }

    router.push(getSafeNextPath());
  };

  const loggedIn = !authLoading && !!user;

  return (
    <main className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-surface-container-lowest text-on-surface">
      {/* LEFT: brand panel */}
      <div className="relative min-h-[280px] sm:min-h-[400px] lg:min-h-screen flex flex-col justify-between p-6 sm:p-8 lg:p-14 overflow-hidden bg-primary-container text-on-primary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={acehBackground.src}
          alt="Anak-anak Nusantara berdiri bersama di tengah desa yang pulih pascabencana"
          className="absolute inset-0 w-full h-full object-cover object-center saturate-90"
        />
        <div
          className="absolute inset-0 bg-primary/85 backdrop-blur-[2px]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-primary via-primary-container/75 to-primary/90"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <Link
            href="/"
            className={`inline-flex items-center gap-3 group ${focusRing}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/permata-logo.webp"
              alt="Logo PERMATA"
              width={40}
              height={40}
              className="w-10 h-10 object-contain shrink-0 brightness-0 invert drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)] transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3"
            />
            <span className="flex flex-col">
              <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-white leading-none">
                PERMATA
              </span>
              <span className="text-[11px] text-primary-fixed-dim font-medium mt-1">
                Resiliensi Jiwa &amp; PFA Anak
              </span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 my-auto py-8 lg:py-12 max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/15 backdrop-blur-md text-secondary-fixed text-[12px] font-semibold mb-4 border border-secondary-fixed/20">
            <BrainCircuit size={15} strokeWidth={2} aria-hidden="true" />
            Sistem Resiliensi Psikososial Tanggap Bencana
          </div>
          <h2 className="text-[30px] lg:text-[42px] font-bold text-white leading-tight tracking-tight mb-4">
            Pulihkan Senyum &amp; Resiliensi Jiwa Anak Pascabencana
          </h2>
          <p className="text-primary-fixed-dim leading-relaxed mb-6 text-[15px] lg:text-[16px]">
            Platform pendampingan psikososial berbasis kearifan budaya lokal
            untuk mengembalikan harapan dan keceriaan anak.
          </p>
          <div className="hidden sm:flex flex-wrap gap-2.5">
            {FEATURE_PILLS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-lowest/10 backdrop-blur-sm border border-white/10 text-white text-[12px] font-medium"
              >
                <Icon
                  size={16}
                  strokeWidth={2}
                  className="text-secondary-fixed"
                  aria-hidden="true"
                />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 hidden sm:flex flex-wrap items-center justify-between gap-2 text-[11px] text-primary-fixed-dim tracking-wider uppercase font-semibold border-t border-white/10 pt-4">
          <span>PERMATA NUSANTARA</span>
          <span className="italic font-normal lowercase tracking-normal text-secondary-fixed">
            &quot;Mambangkik Batang Tarandam&quot;
          </span>
        </div>
      </div>

      {/* RIGHT: auth panel */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 bg-surface-container-lowest">
        <AnimatedSection index={1} className="w-full max-w-[440px] py-6">
          <div className="mb-6">
            <h1 className="text-[28px] font-bold text-on-surface tracking-tight">
              Selamat Datang!{" "}
              <span aria-hidden="true" className="inline-block">
                👋
              </span>
            </h1>
            <p className="text-[14px] leading-[22px] text-on-surface-variant mt-1">
              {loggedIn
                ? "Sesi Anda masih aktif. Lanjutkan ke ruang pendampingan atau keluar dari akun ini."
                : "Masuk untuk mengakses layanan PERMATA Nusantara."}
            </p>
          </div>

          {loggedIn && user ? (
            <div className="rounded-[0.75rem] bg-surface-container-low p-4 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={22}
                  strokeWidth={1.75}
                  className="text-secondary shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold text-primary">
                    Anda sudah masuk sebagai {user.fullName}
                  </p>
                  <p className="text-xs text-on-surface-variant break-all">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Link
                  href="/dashboard"
                  className={`flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-[0.75rem] bg-primary-container hover:bg-primary text-white text-[15px] font-semibold shadow-sm transition-all active:scale-[0.99] ${focusRing}`}
                >
                  Ke Dashboard
                  <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
                </Link>
                <Link
                  href="/safety-passport"
                  className={`flex-1 inline-flex items-center justify-center py-3 px-4 rounded-[0.75rem] border border-outline-variant hover:bg-surface-container text-on-surface text-[14px] font-semibold transition-all ${focusRing}`}
                >
                  My Safety Passport
                </Link>
              </div>
              <button
                type="button"
                onClick={logout}
                className={`w-full min-h-11 px-4 rounded-[0.75rem] text-sm font-medium text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors ${focusRing}`}
              >
                Keluar dari akun ini
              </button>
            </div>
          ) : (
            <>
              {/* Role selector */}
              <div className="mb-4">
                <span
                  id="role-group-label"
                  className="block font-semibold text-[12px] text-on-surface mb-2 uppercase tracking-wide"
                >
                  Pilih Peran Akun:
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="role-group-label"
                  className="grid grid-cols-3 gap-1.5 p-1 rounded-[0.75rem] bg-surface-container-low"
                >
                  {ROLES.map((r) => {
                    const active = r.key === roleKey;
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setRoleKey(r.key)}
                        className={`flex flex-col items-center justify-center p-2 rounded-[0.5rem] transition-all text-center min-w-0 ${focusRing} ${
                          active
                            ? "bg-primary-container text-on-primary shadow-sm"
                            : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
                        }`}
                      >
                        <Icon
                          size={18}
                          strokeWidth={2}
                          className={`mb-1 ${active ? "" : "text-secondary"}`}
                          aria-hidden="true"
                        />
                        <span className="text-[11px] font-semibold leading-tight">
                          {r.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p
                  className="mt-2 text-[12px] leading-snug text-on-surface-variant"
                  aria-live="polite"
                >
                  <span className="font-semibold text-on-surface">
                    {role.title}.
                  </span>{" "}
                  {role.desc}
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col gap-3.5"
              >
                {errorMessage && (
                  <div
                    role="alert"
                    className="bg-error-container text-on-error-container rounded-[0.5rem] p-3.5 flex items-start gap-2.5 text-sm"
                  >
                    <AlertCircle
                      size={18}
                      strokeWidth={1.75}
                      className="shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="login-email"
                    className="text-[13px] font-medium text-on-surface"
                  >
                    Alamat Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role.placeholder}
                    className={inputBase}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="login-password"
                    className="text-[13px] font-medium text-on-surface"
                  >
                    Kata Sandi
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi Anda"
                      aria-describedby="login-password-help"
                      className={`${inputBase} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword
                          ? "Sembunyikan kata sandi"
                          : "Tampilkan kata sandi"
                      }
                      className={`absolute right-2 p-1 rounded-[0.5rem] text-on-surface-variant hover:text-on-surface ${focusRing}`}
                    >
                      {showPassword ? (
                        <EyeOff
                          size={18}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye size={18} strokeWidth={1.75} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <p
                    id="login-password-help"
                    className="text-[12px] text-on-surface-variant"
                  >
                    {role.pwdHelper}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span
                    className={`text-[12px] font-medium flex items-center gap-1 ${
                      isOnline ? "text-secondary" : "text-error"
                    }`}
                  >
                    {isOnline ? (
                      <Wifi size={14} strokeWidth={2} aria-hidden="true" />
                    ) : (
                      <WifiOff size={14} strokeWidth={2} aria-hidden="true" />
                    )}
                    {isOnline ? "Koneksi Stabil" : "Tidak Ada Koneksi"}
                  </span>
                  <Link
                    href="/offline-survival"
                    className={`text-[12px] text-secondary font-semibold hover:underline flex items-center gap-1 ${focusRing}`}
                  >
                    <WifiOff size={14} strokeWidth={2} aria-hidden="true" />
                    Siaga Posko Offline
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  aria-busy={submitting}
                  className={`w-full mt-1 py-3 px-4 rounded-[0.75rem] bg-primary-container hover:bg-primary disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] ${focusRing}`}
                >
                  <span>
                    {submitting ? "Memproses masuk..." : "Masuk Sekarang"}
                  </span>
                  {!submitting && (
                    <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
                  )}
                </button>

                <p className="text-center py-1 text-[13px] text-on-surface-variant">
                  Belum punya akun?{" "}
                  <Link
                    href="/register"
                    className={`font-semibold text-secondary hover:underline ${focusRing}`}
                  >
                    Daftar di sini
                  </Link>
                </p>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-outline-variant/50" />
                  <span className="flex-shrink mx-3 text-[12px] text-outline">
                    atau
                  </span>
                  <div className="flex-grow border-t border-outline-variant/50" />
                </div>

                <Link
                  href="/"
                  className={`w-full py-2.5 px-4 rounded-[0.75rem] border border-outline-variant hover:bg-surface-container text-on-surface font-semibold text-[14px] flex items-center justify-center gap-2 transition-all ${focusRing}`}
                >
                  <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
                  <span>Kembali ke Beranda</span>
                </Link>
              </form>
            </>
          )}

          {/* Emergency support card */}
          <div className="mt-6 p-3.5 rounded-[0.75rem] bg-[#fff7ed] border border-[#ffedd5] flex items-start gap-3 text-left">
            <PhoneCall
              size={20}
              strokeWidth={2}
              className="text-[#c2410c] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex flex-col text-[12px]">
              <span className="font-bold text-[#9a3412]">
                Butuh bantuan segera?
              </span>
              <span className="text-[#7c2d12] mt-0.5">
                Hotline 24 Jam:{" "}
                <a
                  href="tel:119"
                  className={`font-semibold underline-offset-2 hover:underline ${focusRing}`}
                >
                  119 (SafeConnect)
                </a>{" "}
                | Darurat:{" "}
                <a
                  href="tel:112"
                  className={`font-semibold underline-offset-2 hover:underline ${focusRing}`}
                >
                  112
                </a>
              </span>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </main>
  );
}
