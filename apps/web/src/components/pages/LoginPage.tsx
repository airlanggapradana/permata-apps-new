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
  CloudOff,
  Eye,
  EyeOff,
  GraduationCap,
  HandHeart,
  Headset,
  Heart,
  LifeBuoy,
  Lock,
  Mail,
  PenLine,
  PhoneCall,
  ShieldCheck,
  ShieldUser,
  Smile,
  Sprout,
  UserCog,
  Users,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AnimatedSection } from "@/components/PageMotion";
import acehBackground from "@/assets/localization/aceh/background.png";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

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

const TRUST_BADGES: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: "Enkripsi PII Sensor Otomatis" },
  { icon: BadgeCheck, label: "UU PDP Ramah Anak" },
  { icon: CloudOff, label: "Offline Ready (IndexedDB)" },
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
  const RoleBannerIcon = Smile;

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
    <div className="bg-background text-on-surface flex flex-col justify-between min-h-[calc(100vh-5rem)]">
      <main className="w-full flex-grow">
        <div className="max-w-7xl mx-auto w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-md lg:py-space-lg">
          {/* Breadcrumb & status */}
          <AnimatedSection index={0}>
            <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-md">
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className={`text-xs font-semibold tracking-[0.02em] text-secondary hover:underline flex items-center gap-1 ${focusRing}`}
                >
                  <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
                  Kembali ke Beranda
                </Link>
                <span className="text-outline-variant text-xs" aria-hidden="true">
                  •
                </span>
                <span className="text-xs tracking-[0.02em] text-on-surface-variant">
                  Gerbang Autentikasi Psikososial
                </span>
              </div>
            </div>
          </AnimatedSection>

          {/* Two-column card grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
            {/* LEFT: showcase */}
            <AnimatedSection index={1} className="lg:col-span-5 flex">
              <div className="w-full flex flex-col justify-between rounded-md bg-primary-container text-on-primary p-space-md sm:p-space-lg relative overflow-hidden shadow-xl">
              <div
                className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-secondary/20 blur-3xl pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-secondary-fixed/15 blur-3xl pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative z-10 flex-1 flex flex-col gap-space-md">
                <div className="flex flex-col gap-2 shrink-0">
                  <h2 className="text-[26px] sm:text-[32px] leading-tight font-bold tracking-tight text-on-primary">
                    Tumbuh Bersama, Pulihkan Asa Nusantara.
                  </h2>
                  <p className="text-sm leading-relaxed text-primary-fixed-dim">
                    Ruang aman anak dan pendamping psikososial tanggap bencana.
                    Menyulam kembali senyum, kekuatan batin, dan kebersamaan di
                    tanah pascabencana.
                  </p>
                </div>

                <div className="relative flex-1 min-h-72 rounded-md overflow-hidden bg-primary/70 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={acehBackground.src}
                    alt="Anak-anak Aceh merangkul di zona rekonstruksi pascabencana"
                    className="w-full h-72 lg:absolute lg:inset-0 lg:h-full object-cover object-center mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent"
                    aria-hidden="true"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-space-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-primary">
                        <Heart size={18} strokeWidth={2} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold tracking-[0.02em] leading-tight text-on-primary">
                          Anak Tangguh Indonesia
                        </p>
                        <p className="text-[11px] leading-tight text-primary-fixed-dim">
                          14 Wilayah Tanggap &amp; Pulih Bencana
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-lowest/20 backdrop-blur-md text-secondary-fixed text-[11px] font-medium">
                      Aktif
                    </span>
                  </div>
                </div>

                <div className="shrink-0 rounded-md bg-surface-container-lowest/10 backdrop-blur-sm p-space-md">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-[0.5rem] bg-tertiary-fixed text-tertiary flex items-center justify-center shrink-0 shadow-sm">
                      <BookOpen size={18} strokeWidth={2} aria-hidden="true" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-tertiary-fixed tracking-wider uppercase">
                        Hikmah Tradisi Kebersamaan
                      </span>
                      <p className="text-sm italic font-medium text-on-primary">
                        “Peugah hal nyang na, peubuet nyang baik. Mambangkik
                        batang tarandam.”
                      </p>
                      <p className="text-[12px] leading-normal text-primary-fixed-dim">
                        Menjaga kejujuran hati, berbuat kebajikan bersama, serta
                        membangkitkan kembali martabat dan harapan yang sempat
                        terendam duka.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-space-md flex flex-col gap-space-sm shrink-0">
                <div className="grid grid-cols-2 gap-space-xs rounded-md bg-primary/80 p-space-xs">
                  <div className="flex flex-col px-space-xs py-1">
                    <span className="text-xl font-bold leading-tight text-secondary-fixed">
                      1.200+
                    </span>
                    <span className="text-[11px] leading-tight text-primary-fixed-dim">
                      Fasilitator PFA Terlatih
                    </span>
                  </div>
                  <div className="flex flex-col px-space-xs py-1">
                    <span className="text-xl font-bold leading-tight text-secondary-fixed">
                      28.450+
                    </span>
                    <span className="text-[11px] leading-tight text-primary-fixed-dim">
                      Anak Didampingi Aman
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {TRUST_BADGES.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/10 text-primary-fixed-dim text-[11px] font-medium"
                    >
                      <Icon
                        size={14}
                        strokeWidth={2}
                        className="text-secondary-fixed"
                        aria-hidden="true"
                      />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
              </div>
            </AnimatedSection>

            {/* RIGHT: login */}
            <AnimatedSection index={2} className="lg:col-span-7 flex">
              <div className="w-full flex flex-col justify-between bg-surface-container-lowest rounded-md p-space-md sm:p-space-lg lg:p-space-xl shadow-md">
              <div>
                <div className="flex flex-col gap-1 mb-space-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                      Portal Masuk Terpadu
                    </span>
                    <span className="text-[12px] font-medium text-on-surface-variant flex items-center gap-1">
                      {isOnline ? (
                        <Wifi
                          size={15}
                          strokeWidth={2}
                          className="text-secondary"
                          aria-hidden="true"
                        />
                      ) : (
                        <WifiOff
                          size={15}
                          strokeWidth={2}
                          className="text-error"
                          aria-hidden="true"
                        />
                      )}
                      {isOnline ? "Koneksi Stabil" : "Tidak Ada Koneksi"}
                    </span>
                  </div>
                  <h1 className="text-[24px] sm:text-[32px] leading-8 sm:leading-10 font-bold tracking-tight text-primary">
                    Masuk ke Ruang Resiliensi
                  </h1>
                  <p className="text-sm leading-[22px] text-on-surface-variant">
                    {loggedIn
                      ? "Sesi Anda masih aktif. Lanjutkan ke ruang pendampingan atau keluar dari akun ini."
                      : "Pilih peran Anda dan masukkan kredensial untuk melanjutkan sesi pendampingan psikososial."}
                  </p>
                </div>

                {loggedIn && user ? (
                  <div className="rounded-md bg-surface-container-low p-space-md space-y-4">
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
                        className={`flex-1 inline-flex items-center justify-center gap-2 min-h-12 px-4 rounded-md bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold shadow-md transition-all duration-200 ${focusRing}`}
                      >
                        Ke Dashboard
                        <ArrowRight
                          size={18}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      </Link>
                      <Link
                        href="/safety-passport"
                        className={`flex-1 inline-flex items-center justify-center min-h-12 px-4 rounded-md bg-surface-container-high hover:bg-surface-variant text-on-surface text-sm font-semibold transition-all ${focusRing}`}
                      >
                        My Safety Passport
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={logout}
                      className={`w-full min-h-11 px-4 rounded-md text-sm font-medium text-on-surface-variant hover:text-error hover:bg-surface-container-lowest transition-colors ${focusRing}`}
                    >
                      Keluar dari akun ini
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Role selector */}
                    <div className="mb-space-lg">
                      <span
                        id="role-group-label"
                        className="block text-xs font-semibold tracking-[0.02em] text-on-surface mb-2"
                      >
                        Pilih Peran Akun:
                      </span>
                      <div
                        role="radiogroup"
                        aria-labelledby="role-group-label"
                        className="grid grid-cols-2 sm:grid-cols-3 gap-2"
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
                              className={`flex flex-col items-center justify-center p-2.5 rounded-md transition-all duration-200 text-center ${focusRing} ${
                                active
                                  ? "bg-primary-container text-on-primary shadow-sm"
                                  : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                              }`}
                            >
                              <span
                                className={`w-7 h-7 rounded-[0.5rem] flex items-center justify-center mb-1 ${
                                  active
                                    ? "bg-surface-container-lowest/20 text-on-primary"
                                    : "bg-surface-container-high text-secondary"
                                }`}
                              >
                                <Icon
                                  size={18}
                                  strokeWidth={2}
                                  aria-hidden="true"
                                />
                              </span>
                              <span className="text-[12px] font-semibold leading-tight">
                                {r.label}
                              </span>
                              <span
                                className={`text-[10px] leading-none mt-0.5 ${
                                  active
                                    ? "text-primary-fixed-dim"
                                    : "text-on-surface-variant"
                                }`}
                              >
                                {r.code}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Role guidance banner */}
                    <div
                      className="mb-space-md p-space-sm rounded-md bg-surface-container-low flex items-start gap-3"
                      aria-live="polite"
                    >
                      <RoleBannerIcon
                        size={22}
                        strokeWidth={1.75}
                        className="text-secondary shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-primary">
                          {role.title}
                        </span>
                        <p className="text-[13px] leading-normal text-on-surface-variant">
                          {role.desc}
                        </p>
                      </div>
                    </div>

                    {/* Authentication form */}
                    <form
                      onSubmit={handleSubmit}
                      noValidate
                      className="space-y-space-md"
                    >
                      {errorMessage && (
                        <div
                          role="alert"
                          className="bg-error-container text-on-error-container rounded-md p-3.5 flex items-start gap-2.5 text-sm"
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

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="login-email"
                          className="flex items-center justify-between text-sm font-semibold text-on-surface"
                        >
                          <span>Alamat Email</span>
                          <span className="text-[11px] text-secondary font-medium">
                            Contoh: {role.placeholder}
                          </span>
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute left-3.5 flex items-center pointer-events-none text-on-surface-variant">
                            <Mail
                              size={20}
                              strokeWidth={1.75}
                              aria-hidden="true"
                            />
                          </div>
                          <input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={role.placeholder}
                            className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-base pl-11 pr-4 py-3 rounded-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="login-password"
                          className="text-sm font-semibold text-on-surface"
                        >
                          Kata Sandi
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute left-3.5 flex items-center pointer-events-none text-on-surface-variant">
                            <Lock
                              size={20}
                              strokeWidth={1.75}
                              aria-hidden="true"
                            />
                          </div>
                          <input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Masukkan kata sandi Anda"
                            className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-base pl-11 pr-12 py-3 rounded-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={
                              showPassword
                                ? "Sembunyikan kata sandi"
                                : "Tampilkan kata sandi"
                            }
                            className="absolute right-3 p-1 rounded-[0.5rem] text-on-surface-variant hover:text-on-surface focus-visible:outline-2 focus-visible:outline-secondary"
                          >
                            {showPassword ? (
                              <EyeOff
                                size={20}
                                strokeWidth={1.75}
                                aria-hidden="true"
                              />
                            ) : (
                              <Eye
                                size={20}
                                strokeWidth={1.75}
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        </div>
                        <p className="text-[12px] text-on-surface-variant pl-1">
                          {role.pwdHelper}
                        </p>
                      </div>

                      <div className="pt-2 flex flex-col gap-3">
                        <button
                          type="submit"
                          disabled={submitting}
                          aria-busy={submitting}
                          className={`w-full py-3.5 px-6 rounded-md bg-primary hover:bg-primary-container disabled:bg-surface-container-high disabled:text-outline disabled:shadow-none text-on-primary text-[16px] font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] ${focusRing}`}
                        >
                          <span>
                            {submitting
                              ? "Memproses masuk..."
                              : "Masuk Sekarang"}
                          </span>
                          {!submitting && (
                            <ArrowRight
                              size={20}
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>

              <div className="mt-space-md pt-space-md flex flex-col gap-3">
                {/* Offline fallback */}
                <div className="rounded-md bg-tertiary-fixed/40 p-space-sm flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[0.5rem] bg-tertiary-fixed-dim text-tertiary flex items-center justify-center shrink-0">
                    <WifiOff size={18} strokeWidth={2} aria-hidden="true" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold tracking-[0.02em] text-tertiary">
                        Sinyal Posko Bencana Terputus?
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-lowest text-tertiary font-semibold text-[10px]">
                        Mode Siaga
                      </span>
                    </div>
                    <p className="text-[12px] text-tertiary-container mt-0.5 leading-snug">
                      Panduan keselamatan dan audio relaksasi pernapasan tetap
                      dapat dibuka secara luring tanpa koneksi internet maupun
                      masuk akun.
                    </p>
                    <div className="pt-1.5">
                      <Link
                        href="/offline-survival"
                        className={`inline-flex items-center gap-1 text-xs font-bold tracking-[0.02em] text-tertiary hover:underline ${focusRing}`}
                      >
                        Buka Mode Siaga Offline
                        <ArrowRight
                          size={14}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Registration */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left pt-1">
                  <p className="text-[13px] text-on-surface-variant">
                    Belum terdaftar di posko?{" "}
                    <Link
                      href="/register"
                      className={`font-semibold text-secondary hover:underline ${focusRing}`}
                    >
                      Daftar Akun Baru
                    </Link>
                  </p>
                  <p className="text-[12px] text-on-surface-variant flex items-center gap-1">
                    <ShieldCheck
                      size={16}
                      strokeWidth={1.75}
                      className="text-primary shrink-0"
                      aria-hidden="true"
                    />
                    Data tiap akun terpisah demi privasi keluarga
                  </p>
                </div>
              </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Emergency strip */}
          <AnimatedSection index={3}>
            <div className="mt-space-md rounded-md bg-surface-container-low p-space-md flex flex-col md:flex-row items-center justify-between gap-space-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                <LifeBuoy size={22} strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-on-surface">
                  Butuh Bantuan Psikologis Cepat untuk Anak yang Panik atau
                  Syok?
                </p>
                <p className="text-[13px] text-on-surface-variant">
                  Akses tim konselor SafeConnect 119 bebas pulsa atau panggil
                  petugas relawan posko terdekat.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="tel:119"
                className={`px-4 py-2 rounded-md bg-error text-on-error text-sm font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-all ${focusRing}`}
              >
                <PhoneCall size={18} strokeWidth={2} aria-hidden="true" />
                Hubungi 119 Bebas Pulsa
              </a>
            </div>
            </div>
          </AnimatedSection>
        </div>
      </main>

      <AnimatedSection index={4}>
        <footer className="w-full bg-surface-container-low mt-space-xl">
        <div className="bg-primary-container text-on-primary py-space-sm px-margin md:px-margin-tablet lg:px-margin-desktop">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <Headset
                size={20}
                strokeWidth={1.75}
                className="text-secondary-fixed shrink-0"
                aria-hidden="true"
              />
              <span className="text-sm font-semibold text-on-primary">
                SafeConnect 119 - Bantuan PFA Darurat &amp; Konseling Psikologis
                Tanggap Bencana Anak
              </span>
            </div>
            <div className="flex items-center gap-space-xs">
              <span
                className="w-2 h-2 rounded-full bg-secondary-fixed motion-safe:animate-pulse"
                aria-hidden="true"
              />
              <span className="text-xs font-semibold tracking-[0.02em] text-primary-fixed-dim">
                Layanan 24/7 Bebas Pulsa
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-md shadow-[0_1px_8px_rgba(27,67,50,0.03)]">
            <div className="flex items-center gap-space-sm">
              <div className="w-9 h-9 rounded-[0.5rem] bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                <ShieldCheck size={20} strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  Jaminan Privasi &amp; Perlindungan Data Anak
                </p>
                <p className="text-sm text-on-surface-variant">
                  Sesuai UU PDP No. 27/2022. Sensor PII ramah anak melindungi
                  identitas emosional dan catatan pemulihan jiwa.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm text-center sm:text-left pt-space-xs">
            <p className="text-sm text-on-surface-variant">
              © {new Date().getFullYear()} PERMATA Nusantara. Memulihkan Jiwa,
              Meneguhkan Tunas Bangsa.
            </p>
            <p className="text-sm text-tertiary-container italic font-medium">
              &quot;Mambangkik Batang Tarandam • Semangat Meuseuraya&quot;
            </p>
          </div>
        </div>
        </footer>
      </AnimatedSection>
    </div>
  );
}
