"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AnimatedSection } from "@/components/PageMotion";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

const ROLE_OPTIONS = [
  { value: "CHILD", label: "Anak atau Remaja" },
  { value: "PARENT_GUARDIAN", label: "Orang Tua atau Wali" },
  { value: "TEACHER_COUNSELOR", label: "Guru atau Konselor" },
  { value: "VOLUNTEER", label: "Relawan Lapangan" },
] as const;

// Akun yang baru terdaftar selalu memulai dari skrining pertama.
const FIRST_SCREENING_PATH = "/tele-screening";

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
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    <main className="min-h-[calc(100vh-5rem)] bg-canvas text-fg py-10 sm:py-16 px-4 sm:px-6">
      <div className="max-w-md mx-auto">
        <AnimatedSection index={0}>
          <div className="bg-surface border border-line rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="w-11 h-11 rounded-md bg-tint text-fg-brand flex items-center justify-center">
              <UserPlus size={22} strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-fg tracking-tight">
              Buat Akun Pribadi
            </h1>
            <p className="text-sm text-fg-muted leading-relaxed">
              Setiap akun memiliki profil Pohon Harapan, Jurnal Hikmah, dan My
              Safety Passport tersendiri yang terisolasi dari pengguna lain.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="bg-surface border border-line border-l-4 border-l-danger rounded-md p-3.5 flex items-start gap-2.5 text-sm text-fg"
              >
                <AlertCircle
                  size={18}
                  strokeWidth={1.75}
                  className="text-danger shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="reg-fullname"
                className="block text-sm font-medium text-fg"
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
                placeholder="Nama lengkap Anda"
                className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-4 text-sm text-fg placeholder:text-fg-subtle ${focusRing}`}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-nickname"
                className="block text-sm font-medium text-fg"
              >
                Nama Panggilan untuk Profil &amp; Pohon Harapan (Opsional)
              </label>
              <input
                id="reg-nickname"
                type="text"
                value={childDisplayName}
                onChange={(e) => setChildDisplayName(e.target.value)}
                placeholder="Contoh: Rayyan atau Aisyah"
                className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-4 text-sm text-fg placeholder:text-fg-subtle ${focusRing}`}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-role"
                className="block text-sm font-medium text-fg"
              >
                Peran Pengguna
              </label>
              <select
                id="reg-role"
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value)}
                className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-4 text-sm text-fg ${focusRing}`}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-email"
                className="block text-sm font-medium text-fg"
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
                className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-4 text-sm text-fg placeholder:text-fg-subtle ${focusRing}`}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-password"
                className="block text-sm font-medium text-fg"
              >
                Kata Sandi (minimal 8 karakter)
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className={`w-full min-h-11 bg-surface border border-line-input rounded-md pl-4 pr-12 text-sm text-fg placeholder:text-fg-subtle ${focusRing}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                  className={`absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-md text-fg-muted hover:text-fg ${focusRing}`}
                >
                  {showPassword ? (
                    <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <Eye size={18} strokeWidth={1.75} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-confirm-password"
                className="block text-sm font-medium text-fg"
              >
                Konfirmasi Kata Sandi
              </label>
              <input
                id="reg-confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi Anda"
                className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-4 text-sm text-fg placeholder:text-fg-subtle ${focusRing}`}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className={`w-full min-h-11 px-4 rounded-md bg-action hover:bg-action-hover disabled:bg-sunken disabled:text-neutral-400 text-white text-sm font-medium transition-colors ${focusRing}`}
            >
              {submitting ? "Mendaftarkan akun..." : "Daftar & Masuk"}
            </button>
          </form>

          <div className="pt-4 border-t border-line space-y-3 text-sm">
            <p className="text-fg-muted">
              Sudah memiliki akun?{" "}
              <Link
                href="/login"
                className={`font-medium text-fg-brand hover:underline ${focusRing}`}
              >
                Masuk di sini
              </Link>
            </p>
            <div className="bg-sunken border border-line rounded-md p-3.5 flex items-start gap-2.5 text-xs text-fg-muted">
              <ShieldCheck
                size={16}
                strokeWidth={1.75}
                className="text-fg-brand shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>
                Kata sandi Anda disimpan menggunakan hash kriptografis (scrypt)
                dan sesi dilindungi cookie HttpOnly.
              </span>
            </div>
          </div>
          </div>
        </AnimatedSection>
      </div>
    </main>
  );
}
