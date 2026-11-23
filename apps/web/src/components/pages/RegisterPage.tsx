"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  ChevronDown,
  CheckCircle2,
  Eye,
  EyeOff,
  Gavel,
  Info,
  LockKeyhole,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AnimatedSection } from "@/components/PageMotion";
import acehBackground from "@/assets/localization/aceh/background.png";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

const inputBase =
  "w-full min-h-11 px-3.5 py-2.5 rounded-[0.5rem] border border-outline-variant/80 bg-surface-container-lowest text-base sm:text-[14px] text-on-surface placeholder:text-outline focus:border-action focus:ring-1 focus:ring-action focus:outline-none transition-all";

const ROLE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "CHILD", label: "Anak atau Remaja" },
  { value: "PARENT_GUARDIAN", label: "Orang Tua atau Wali" },
  { value: "TEACHER_COUNSELOR", label: "Guru atau Konselor" },
  { value: "VOLUNTEER", label: "Relawan Lapangan" },
];

const FEATURE_PILLS: ReadonlyArray<{ icon: LucideIcon; label: string }> = [
  { icon: ShieldCheck, label: "Isolasi Data Mandiri" },
  { icon: Gavel, label: "Kepatuhan UU PDP No. 27/2022" },
  { icon: Zap, label: "Siaga Offline Ready" },
];

// Akun yang baru terdaftar selalu memulai dari skrining pertama.
const FIRST_SCREENING_PATH = "/tele-screening";

type Strength = {
  percent: number;
  label: string;
  barClass: string;
  textClass: string;
};

function evaluateStrength(value: string): Strength {
  if (value.length === 0) {
    return {
      percent: 0,
      label: "Minimal 8 karakter",
      barClass: "bg-surface-container-highest",
      textClass: "text-outline",
    };
  }
  if (value.length < 8) {
    return {
      percent: 33,
      label: "Terlalu pendek (minimal 8 karakter)",
      barClass: "bg-error",
      textClass: "text-error font-medium",
    };
  }
  if (/[A-Z]/.test(value) && /[0-9]/.test(value)) {
    return {
      percent: 100,
      label: "Sandi Kuat & Terlindungi",
      barClass: "bg-secondary",
      textClass: "text-secondary font-semibold",
    };
  }
  return {
    percent: 66,
    label: "Kekuatan Sedang (tambahkan huruf besar & angka)",
    barClass: "bg-on-tertiary-container",
    textClass: "text-tertiary-container font-medium",
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [childDisplayName, setChildDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [roleCode, setRoleCode] = useState<string>("CHILD");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const strength = evaluateStrength(password);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (fullName.trim().length < 2) {
      setErrorMessage("Nama lengkap minimal 2 karakter.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage("Masukkan alamat email yang valid.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Kata sandi minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak sama.");
      return;
    }

    if (!agreed) {
      setErrorMessage(
        "Setujui Ketentuan Layanan dan Kebijakan Perlindungan Data Pribadi untuk melanjutkan.",
      );
      return;
    }

    setSubmitting(true);
    const result = await register({
      fullName: fullName.trim(),
      email: trimmedEmail,
      password,
      roleCode,
      childDisplayName: childDisplayName.trim() || undefined,
    });
    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error || "Gagal membuat akun baru.");
      return;
    }

    router.push(FIRST_SCREENING_PATH);
  };

  return (
    <main className="w-full min-h-screen-safe grid grid-cols-1 lg:grid-cols-2 bg-surface-container-lowest text-on-surface">
      {/* LEFT: immersive visual + brand messaging */}
      <div className="relative min-h-0 sm:min-h-[360px] lg:min-h-screen-safe flex flex-col justify-between p-5 pt-[max(1.25rem,env(safe-area-inset-top,0px))] sm:p-8 lg:p-14 overflow-hidden bg-emphasis text-on-primary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={acehBackground.src}
          alt="Anak-anak Nusantara berdiri bersama di tengah desa yang pulih pascabencana"
          className="absolute inset-0 w-full h-full object-cover object-center saturate-95"
        />
        <div
          className="absolute inset-0 bg-brand-900/80 backdrop-blur-[2px]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-800/80 to-brand-900/90"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <Link
            href="/"
            className={`inline-flex items-center gap-3 min-h-11 group ${focusRing}`}
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
              <span className="text-[11px] text-white/80 font-medium mt-1">
                Resiliensi Jiwa &amp; PFA Anak
              </span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 my-auto py-4 sm:py-8 lg:py-10 max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/15 backdrop-blur-md text-brand-100 text-[12px] font-semibold mb-3 sm:mb-4 border border-white/20">
            <BrainCircuit size={15} strokeWidth={2} aria-hidden="true" />
            Sistem Resiliensi Psikososial Tanggap Bencana
          </div>
          <h2 className="text-2xl sm:text-[36px] lg:text-[42px] font-bold text-white leading-[1.18] tracking-tight mb-2 sm:mb-4">
            Pulihkan Senyum &amp; Resiliensi Jiwa Anak Pascabencana
          </h2>
          <p className="text-white/85 leading-relaxed mb-0 sm:mb-6 text-sm lg:text-[15.5px]">
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
            &quot;Ubat hatee, ubat badan. Mambangkik batang tarandam&quot;
          </span>
        </div>
      </div>

      {/* RIGHT: registration form */}
      <div className="flex flex-col justify-start items-center px-4 py-6 sm:p-10 lg:p-14 pb-[max(2rem,env(safe-area-inset-bottom,0px))] bg-surface-container-lowest">
        <AnimatedSection index={1} className="w-full max-w-lg py-2 sm:py-6">
          <div className="mb-6">
            <h1 className="text-[28px] font-bold text-on-surface tracking-tight">
              Buat Akun Pribadi{" "}
              <span aria-hidden="true" className="inline-block">
                👋
              </span>
            </h1>
            <p className="text-[14px] leading-relaxed text-on-surface-variant mt-1.5">
              Setiap akun memiliki profil Pohon Harapan, Jurnal Hikmah, dan My
              Safety Passport tersendiri yang terisolasi dari pengguna lain.
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
                className="bg-error-container text-on-error-container border-l-4 border-error rounded-[0.5rem] p-3.5 flex items-start gap-2.5 text-sm"
              >
                <AlertCircle
                  size={18}
                  strokeWidth={1.75}
                  className="text-error shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label
                htmlFor="reg-fullname"
                className="text-[13px] font-medium text-on-surface"
              >
                Nama Lengkap
              </label>
              <input
                id="reg-fullname"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="cth: Airlangga Pradana"
                className={inputBase}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="reg-nickname"
                className="text-[13px] font-medium text-on-surface flex items-center justify-between gap-2"
              >
                <span>Nama Panggilan untuk Profil &amp; Pohon Harapan</span>
                <span className="text-[11px] text-on-surface-variant font-normal shrink-0">
                  (Opsional)
                </span>
              </label>
              <input
                id="reg-nickname"
                type="text"
                value={childDisplayName}
                onChange={(e) => setChildDisplayName(e.target.value)}
                placeholder="Contoh: Rayyan atau Aisyah"
                className={inputBase}
              />
              <span className="text-[12px] text-on-surface-variant flex items-start gap-1 mt-0.5">
                <Info
                  size={14}
                  strokeWidth={2}
                  className="text-secondary shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                Nama panggilan ini akan tampil pada daun Pohon Harapan dan
                sapaan ramah di posko.
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="reg-role"
                className="text-[13px] font-medium text-on-surface"
              >
                Peran Pengguna
              </label>
              <div className="relative">
                <select
                  id="reg-role"
                  value={roleCode}
                  onChange={(e) => setRoleCode(e.target.value)}
                  className={`${inputBase} appearance-none pr-10 cursor-pointer`}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
                  <ChevronDown size={18} strokeWidth={1.75} aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="reg-email"
                className="text-[13px] font-medium text-on-surface"
              >
                Alamat Email
              </label>
              <input
                id="reg-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@contoh.com"
                className={inputBase}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="reg-password"
                  className="text-[13px] font-medium text-on-surface"
                >
                  Kata Sandi (minimal 8 karakter)
                </label>
                <span
                  id="reg-password-strength"
                  aria-live="polite"
                  className={`text-[11px] text-right ${strength.textClass}`}
                >
                  {strength.label}
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  aria-describedby="reg-password-strength"
                  className={`${inputBase} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                  className={`absolute right-0 min-w-11 min-h-11 inline-flex items-center justify-center rounded-[0.5rem] text-on-surface-variant hover:text-on-surface ${focusRing}`}
                >
                  {showPassword ? (
                    <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <Eye size={18} strokeWidth={1.75} aria-hidden="true" />
                  )}
                </button>
              </div>
              <div
                className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden mt-1"
                aria-hidden="true"
              >
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${strength.barClass}`}
                  style={{ width: `${strength.percent}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="reg-confirm-password"
                className="text-[13px] font-medium text-on-surface"
              >
                Konfirmasi Kata Sandi
              </label>
              <div className="relative flex items-center">
                <input
                  id="reg-confirm-password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi Anda"
                  className={`${inputBase} ${passwordsMatch ? "pr-20" : "pr-12"}`}
                />
                {passwordsMatch && (
                  <span
                    className="absolute right-11 flex items-center text-secondary"
                    role="img"
                    aria-label="Kata sandi cocok"
                  >
                    <CheckCircle2
                      size={18}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={
                    showConfirm
                      ? "Sembunyikan konfirmasi sandi"
                      : "Tampilkan konfirmasi sandi"
                  }
                  className={`absolute right-0 min-w-11 min-h-11 inline-flex items-center justify-center rounded-[0.5rem] text-on-surface-variant hover:text-on-surface ${focusRing}`}
                >
                  {showConfirm ? (
                    <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <Eye size={18} strokeWidth={1.75} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-3 min-h-11 py-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className={`mt-0.5 w-5 h-5 rounded accent-action cursor-pointer shrink-0 ${focusRing}`}
                />
                <span className="text-[12.5px] leading-snug text-on-surface-variant">
                  Saya menyetujui{" "}
                  <strong className="text-fg-brand font-semibold">
                    Ketentuan Layanan
                  </strong>{" "}
                  &amp;{" "}
                  <strong className="text-fg-brand font-semibold">
                    Kebijakan Perlindungan Data Pribadi Anak
                  </strong>{" "}
                  sesuai standar{" "}
                  <strong className="text-on-surface font-semibold">
                    UU PDP No. 27/2022
                  </strong>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className={`w-full mt-2 min-h-12 py-3 px-4 rounded-[0.75rem] bg-action hover:bg-action-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] ${focusRing}`}
            >
              <span>
                {submitting ? "Mendaftarkan akun..." : "Daftar & Masuk"}
              </span>
              {!submitting && (
                <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
              )}
            </button>

            <p className="text-center py-1 text-[13px] text-on-surface-variant">
              Sudah memiliki akun?{" "}
              <Link
                href="/login"
                className={`font-semibold text-fg-brand hover:underline inline-flex items-center min-h-11 px-1 ${focusRing}`}
              >
                Masuk di sini
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
              className={`w-full min-h-11 py-2.5 px-4 rounded-[0.75rem] border border-outline-variant hover:bg-surface-container text-on-surface font-semibold text-[14px] flex items-center justify-center gap-2 transition-all ${focusRing}`}
            >
              <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
              <span>Kembali ke Beranda</span>
            </Link>
          </form>

          <div className="mt-5 p-3 rounded-[0.75rem] bg-surface-container-low border border-surface-container-high flex items-start gap-2.5 text-left">
            <LockKeyhole
              size={16}
              strokeWidth={1.75}
              className="text-secondary shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-[11.5px] text-on-surface-variant leading-relaxed">
              Kata sandi Anda disimpan menggunakan hash kriptografis (scrypt)
              dan sesi dilindungi cookie HttpOnly.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </main>
  );
}
