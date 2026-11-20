"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Baby,
  CheckCircle2,
  ChevronDown,
  CloudOff,
  Eye,
  EyeOff,
  GraduationCap,
  HandHeart,
  House,
  Info,
  Leaf,
  LockKeyhole,
  PhoneCall,
  ScrollText,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AnimatedSection } from "@/components/PageMotion";
import acehBackground from "@/assets/localization/aceh/background.png";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

const inputBase = `w-full min-h-12 bg-surface-container-lowest border border-outline-variant rounded-[0.5rem] px-4 text-sm text-on-surface placeholder:text-outline shadow-sm transition-colors focus:border-secondary ${focusRing}`;

const ROLE_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
  chipLabel: string;
  icon: LucideIcon;
}> = [
  {
    value: "CHILD",
    label: "Anak atau Remaja",
    chipLabel: "Anak / Remaja",
    icon: Baby,
  },
  {
    value: "PARENT_GUARDIAN",
    label: "Orang Tua atau Wali",
    chipLabel: "Orang Tua / Wali",
    icon: Users,
  },
  {
    value: "TEACHER_COUNSELOR",
    label: "Guru atau Konselor",
    chipLabel: "Guru / Konselor",
    icon: GraduationCap,
  },
  {
    value: "VOLUNTEER",
    label: "Relawan Lapangan",
    chipLabel: "Relawan Posko",
    icon: HandHeart,
  },
];

const TRUST_PILLARS: ReadonlyArray<{
  icon: LucideIcon;
  title: string;
  description: string;
  tone: string;
}> = [
  {
    icon: LockKeyhole,
    title: "Isolasi Data Pribadi Mandiri",
    description:
      "Profil catatan emosional dan karya Pohon Harapan tersimpan pada kontainer aman yang terpisah.",
    tone: "bg-primary-container text-secondary-fixed",
  },
  {
    icon: ScrollText,
    title: "Kepatuhan UU PDP No. 27/2022",
    description:
      "Penyaringan PII otomatis mencegah identitas anak terekspos dalam forum terbuka komunitas.",
    tone: "bg-secondary-container text-on-secondary-container",
  },
  {
    icon: CloudOff,
    title: "Sinkronisasi Siaga Offline",
    description:
      "Aplikasi tetap aktif mencatat latihan napas & regulasi emosi saat jaringan posko terputus.",
    tone: "bg-primary-fixed text-on-primary-fixed",
  },
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
      textClass: "text-on-surface-variant",
    };
  }
  if (value.length < 8) {
    return {
      percent: 33,
      label: "Terlalu pendek (minimal 8 karakter)",
      barClass: "bg-error",
      textClass: "text-error",
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
    <div className="bg-background text-on-surface flex flex-col min-h-[calc(100vh-5rem)]">
      <main className="w-full flex-grow">
        <div className="max-w-7xl mx-auto w-full px-margin md:px-margin-tablet lg:px-margin-desktop py-space-md lg:py-space-lg">
          {/* Breadcrumb & status */}
          <AnimatedSection index={0}>
            <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-lg">
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-space-xs text-sm font-medium text-on-surface-variant"
              >
                <Link
                  href="/"
                  className={`hover:text-primary transition-colors flex items-center gap-1 ${focusRing}`}
                >
                  <House size={16} strokeWidth={2} aria-hidden="true" />
                  Beranda
                </Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page" className="text-primary font-semibold">
                  Pendaftaran Akun Terpadu
                </span>
              </nav>
              <div className="inline-flex items-center gap-2 px-space-md py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold shadow-sm">
                <span
                  className="inline-block w-2 h-2 rounded-full bg-secondary"
                  aria-hidden="true"
                />
                Layanan PFA Ramah Anak Aktif di 14 Posko Regional
              </div>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
            {/* LEFT: story & trust pillars */}
            <AnimatedSection
              index={1}
              className="lg:col-span-5 flex flex-col gap-space-lg"
            >
              <div className="bg-surface-container-lowest rounded-md overflow-hidden shadow-sm flex flex-col">
                <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-surface-container-high">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={acehBackground.src}
                    alt="Anak-anak Nusantara berdiri bersama di tengah desa yang pulih pascabencana"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent flex flex-col justify-end p-space-md sm:p-space-lg text-on-primary">
                    <span className="text-xs uppercase tracking-wider text-secondary-fixed font-semibold">
                      Ruang Pulih &amp; Harapan
                    </span>
                    <h2 className="text-2xl leading-8 text-on-primary font-bold mt-1">
                      Tumbuh Bersama, Pulihkan Asa Nusantara
                    </h2>
                  </div>
                </div>

                <div className="p-space-lg flex flex-col gap-space-md">
                  <p className="text-base leading-relaxed text-on-surface-variant">
                    Satu akun aman untuk merawat lentera harapan. Dapatkan akses
                    terisolasi ke{" "}
                    <strong className="text-on-surface font-semibold">
                      Pohon Harapan
                    </strong>{" "}
                    pribadi,{" "}
                    <strong className="text-on-surface font-semibold">
                      Jurnal Hikmah
                    </strong>{" "}
                    reflektif tanpa stigma, serta jejaring pendampingan
                    terpercaya pascabencana.
                  </p>

                  <div className="flex flex-col gap-space-sm pt-2">
                    {TRUST_PILLARS.map(
                      ({ icon: Icon, title, description, tone }) => (
                        <div
                          key={title}
                          className="flex items-start gap-space-md p-space-md rounded-[0.5rem] bg-surface-container-low"
                        >
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tone}`}
                          >
                            <Icon size={18} strokeWidth={2} aria-hidden="true" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-on-surface">
                              {title}
                            </span>
                            <span className="text-sm leading-[22px] text-on-surface-variant">
                              {description}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="p-space-md rounded-md bg-surface-container-high flex flex-col gap-1">
                    <div className="flex items-center gap-space-xs text-tertiary-container text-xs font-semibold">
                      <Leaf size={16} strokeWidth={2} aria-hidden="true" />
                      <span>Petuah Meuseuraya &amp; Resiliensi Jiwa</span>
                    </div>
                    <p className="text-sm leading-[22px] italic text-on-surface mt-1">
                      “Ubat hatee, ubat badan. Mambangkik batang tarandam —
                      Ketika satu hati saling menguatkan, kepulihan meluas bagi
                      seisi negeri.”
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-space-md rounded-md bg-primary text-on-primary flex items-center justify-between gap-space-md shadow-sm">
                <div className="flex items-center gap-space-md">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-on-secondary shrink-0">
                    <PhoneCall size={20} strokeWidth={2} aria-hidden="true" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-secondary-fixed">
                      Perlu Pendampingan Kritis?
                    </span>
                    <span className="text-sm leading-[22px] text-on-primary-container">
                      Talian Siaga SafeConnect 119 bebas pulsa 24 jam.
                    </span>
                  </div>
                </div>
                <a
                  href="tel:119"
                  className={`px-space-md py-1.5 rounded-[0.5rem] bg-surface-container-lowest text-primary text-xs font-semibold hover:bg-secondary-fixed hover:text-on-secondary-fixed transition-colors shrink-0 ${focusRing}`}
                >
                  Hubungi
                </a>
              </div>
            </AnimatedSection>

            {/* RIGHT: registration form */}
            <AnimatedSection index={2} className="lg:col-span-7 flex flex-col">
              <div className="bg-surface-container-lowest rounded-md p-space-lg sm:p-space-xl shadow-md flex flex-col gap-space-lg">
                <div className="flex flex-col gap-space-sm">
                  <div className="w-11 h-11 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                    <UserPlus size={22} strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <h1 className="text-[28px] sm:text-[32px] leading-9 sm:leading-10 font-bold text-on-surface tracking-tight">
                    Buat Akun Pribadi
                  </h1>
                  <p className="text-sm leading-[22px] text-on-surface-variant">
                    Setiap akun memiliki profil Pohon Harapan, Jurnal Hikmah,
                    dan My Safety Passport tersendiri yang terisolasi dari
                    pengguna lain.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="flex flex-col gap-space-md"
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

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="reg-fullname"
                      className="text-sm font-semibold text-on-surface"
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
                      placeholder="Nama lengkap Anda (cth: Airlangga Pradana)"
                      className={inputBase}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="reg-nickname"
                      className="text-sm font-semibold text-on-surface"
                    >
                      Nama Panggilan untuk Profil &amp; Pohon Harapan{" "}
                      <span className="font-normal text-on-surface-variant">
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
                    <span className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <Info
                        size={14}
                        strokeWidth={2}
                        className="text-secondary shrink-0"
                        aria-hidden="true"
                      />
                      Nama panggilan ini akan tampil pada daun Pohon Harapan dan
                      sapaan ramah di posko.
                    </span>
                  </div>

                  <div className="flex flex-col gap-space-xs">
                    <label
                      htmlFor="reg-role"
                      className="text-sm font-semibold text-on-surface"
                    >
                      Peran Pengguna dalam Ekosistem PERMATA
                    </label>
                    <div
                      role="radiogroup"
                      aria-label="Pilih peran pengguna"
                      className="flex flex-wrap gap-2 my-1"
                    >
                      {ROLE_OPTIONS.map(
                        ({ value, chipLabel, icon: Icon }) => {
                          const active = roleCode === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setRoleCode(value)}
                              className={`px-space-md py-1.5 min-h-9 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${focusRing} ${
                                active
                                  ? "bg-primary-container text-on-primary shadow-sm"
                                  : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                              }`}
                            >
                              <Icon
                                size={16}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                              <span>{chipLabel}</span>
                            </button>
                          );
                        },
                      )}
                    </div>
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
                        <ChevronDown
                          size={20}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="reg-email"
                      className="text-sm font-semibold text-on-surface"
                    >
                      Alamat Email
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@contoh.com"
                      className={inputBase}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="reg-password"
                      className="text-sm font-semibold text-on-surface"
                    >
                      Kata Sandi (minimal 8 karakter)
                    </label>
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
                        className={`absolute right-1 w-10 h-10 flex items-center justify-center rounded-[0.5rem] text-on-surface-variant hover:text-on-surface transition-colors ${focusRing}`}
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
                    <div
                      className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1"
                      aria-hidden="true"
                    >
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${strength.barClass}`}
                        style={{ width: `${strength.percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        id="reg-password-strength"
                        aria-live="polite"
                        className={`text-xs ${strength.textClass}`}
                      >
                        {strength.label}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Enkripsi Kriptografis scrypt
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="reg-confirm-password"
                      className="text-sm font-semibold text-on-surface"
                    >
                      Konfirmasi Kata Sandi
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="reg-confirm-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi Anda"
                        className={`${inputBase} pr-12`}
                      />
                      {passwordsMatch && (
                        <span
                          className="absolute right-3 flex items-center text-secondary"
                          role="img"
                          aria-label="Kata sandi cocok"
                        >
                          <CheckCircle2
                            size={20}
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-sm pt-2">
                    <label className="flex items-start gap-space-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className={`mt-1 w-4 h-4 rounded accent-primary cursor-pointer shrink-0 ${focusRing}`}
                      />
                      <span className="text-sm leading-[22px] text-on-surface-variant">
                        Saya menyetujui{" "}
                        <strong className="text-secondary font-medium">
                          Ketentuan Layanan
                        </strong>{" "}
                        dan{" "}
                        <strong className="text-secondary font-medium">
                          Kebijakan Perlindungan Data Pribadi Anak
                        </strong>{" "}
                        sesuai standar{" "}
                        <strong className="text-on-surface">
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
                    className={`w-full mt-2 min-h-12 py-3 px-space-lg rounded-md bg-primary text-on-primary text-base font-semibold shadow-md hover:bg-primary-container active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-space-xs ${focusRing}`}
                  >
                    <span>
                      {submitting ? "Mendaftarkan akun..." : "Daftar & Masuk"}
                    </span>
                    {!submitting && (
                      <ArrowRight
                        size={20}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </form>

                <div className="flex flex-col gap-space-md pt-2">
                  <p className="text-center text-sm text-on-surface-variant">
                    Sudah memiliki akun?{" "}
                    <Link
                      href="/login"
                      className={`text-secondary font-semibold hover:underline ${focusRing}`}
                    >
                      Masuk di sini
                    </Link>
                  </p>
                  <div className="bg-surface-container-low rounded-[0.5rem] p-3.5 flex items-start gap-2.5 text-xs text-on-surface-variant">
                    <LockKeyhole
                      size={16}
                      strokeWidth={1.75}
                      className="text-secondary shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>
                      Kata sandi Anda disimpan menggunakan hash kriptografis
                      (scrypt) dan sesi dilindungi cookie HttpOnly.
                    </span>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </main>
    </div>
  );
}
