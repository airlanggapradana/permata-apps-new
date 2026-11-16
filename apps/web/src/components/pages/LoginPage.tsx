"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, login, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-canvas text-fg py-10 sm:py-16 px-4 sm:px-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="bg-surface border border-line rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="w-11 h-11 rounded-md bg-tint text-fg-brand flex items-center justify-center">
              <Lock size={22} strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-fg tracking-tight">
              Masuk ke Akun PERMATA
            </h1>
            <p className="text-sm text-fg-muted leading-relaxed">
              Akses ruang pribadi Anda untuk melindungi My Safety Passport dan
              menyimpan perkembangan Pohon Harapan secara terpisah.
            </p>
          </div>

          {!authLoading && user ? (
            <div className="bg-tint border border-[var(--brand-200)] rounded-lg p-5 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={20}
                  strokeWidth={1.75}
                  className="text-success shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold text-fg">
                    Anda sudah masuk sebagai {user.fullName}
                  </p>
                  <p className="text-xs text-fg-muted break-all">{user.email}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Link
                  href="/dashboard"
                  className={`flex-1 inline-flex items-center justify-center min-h-11 px-4 rounded-md bg-action hover:bg-action-hover text-white text-sm font-medium transition-colors ${focusRing}`}
                >
                  Ke Dashboard
                </Link>
                <Link
                  href="/safety-passport"
                  className={`flex-1 inline-flex items-center justify-center min-h-11 px-4 rounded-md bg-surface border border-line-strong hover:bg-sunken text-fg text-sm font-medium transition-colors ${focusRing}`}
                >
                  My Safety Passport
                </Link>
              </div>
              <button
                type="button"
                onClick={logout}
                className={`w-full min-h-11 px-4 rounded-md text-sm font-medium text-fg-muted hover:text-danger hover:bg-surface transition-colors ${focusRing}`}
              >
                Keluar dari akun ini
              </button>
            </div>
          ) : (
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
                  htmlFor="login-email"
                  className="block text-sm font-medium text-fg"
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
                  placeholder="nama@contoh.com"
                  className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-4 text-sm text-fg placeholder:text-fg-subtle ${focusRing}`}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-fg"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi Anda"
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

              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className={`w-full min-h-11 px-4 rounded-md bg-action hover:bg-action-hover disabled:bg-sunken disabled:text-neutral-400 text-white text-sm font-medium transition-colors ${focusRing}`}
              >
                {submitting ? "Memproses masuk..." : "Masuk ke Akun"}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-line space-y-3 text-sm">
            <p className="text-fg-muted">
              Belum memiliki akun pribadi?{" "}
              <Link
                href="/register"
                className={`font-medium text-fg-brand hover:underline ${focusRing}`}
              >
                Daftar akun baru
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
                Data jurnal, Pohon Harapan, dan My Safety Passport terpisah per
                akun agar privasi setiap pengguna dan keluarga terjaga.
              </span>
            </div>
          </div>
        </div>

        {/* Emergency fallback without login */}
        <div className="bg-surface border border-line rounded-lg p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <WifiOff
              size={18}
              strokeWidth={1.75}
              className="text-fg-brand shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs sm:text-sm text-fg-muted">
              Butuh panduan darurat segera tanpa masuk akun?
            </span>
          </div>
          <Link
            href="/offline-survival"
            className={`inline-flex items-center justify-center min-h-11 px-3.5 rounded-md bg-tint hover:bg-[var(--brand-100)] text-fg-brand text-xs sm:text-sm font-medium shrink-0 transition-colors ${focusRing}`}
          >
            Siaga Offline
          </Link>
        </div>
      </div>
    </main>
  );
}
