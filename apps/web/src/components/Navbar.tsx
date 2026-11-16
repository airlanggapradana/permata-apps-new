"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { useCulture } from "@/context/CultureContext";
import { useAuth } from "@/context/AuthContext";

/*
 * Navbar tunggal untuk seluruh halaman, mengikuti header landing page.
 * Tautan memakai "/#id" agar tujuannya tetap valid dari halaman mana pun;
 * ThemedContent meneruskan hash tersebut ke scroll setelah halaman berganti.
 */
const NAV_LINKS = [
  { href: "/#programs", label: "Modul" },
  { href: "/#calculator", label: "Pohon Harapan" },
  { href: "/safety-passport", label: "Safety Passport" },
  { href: "/offline-survival", label: "Siaga Offline" },
];

const CULTURES = [
  { key: "aceh", label: "Aceh" },
  { key: "sumbar", label: "Sumbar" },
] as const;

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";

function CultureSwitcher({ className = "" }: { className?: string }) {
  const { culture, setCulture } = useCulture();

  return (
    <div
      className={`flex items-center bg-sunken border border-line p-1 rounded-full text-xs font-semibold ${className}`}
      role="group"
      aria-label="Pilihan Kearifan Budaya"
    >
      {CULTURES.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => setCulture(c.key)}
          aria-pressed={culture === c.key}
          className={`min-h-11 min-w-11 px-4 rounded-full transition-colors duration-200 ${focusRing} ${
            culture === c.key
              ? "bg-action text-white"
              : "text-fg-muted hover:text-fg"
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

export default function Navbar({
  currentPath = "/",
}: {
  currentPath?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isLoading: authLoading, logout } = useAuth();

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [currentPath]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-line shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        <Link
          href="/"
          onClick={closeMenu}
          className={`flex items-center gap-3 shrink-0 rounded-sm ${focusRing}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/permata-logo.webp"
            alt="Logo PERMATA"
            width={40}
            height={40}
            className="w-10 h-10 object-contain shrink-0"
          />
          <div className="flex flex-col">
            <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-fg leading-none">
              PERMATA
            </span>
            <span className="text-xs font-medium text-fg-muted mt-1">
              Resiliensi Jiwa &amp; PFA Anak
            </span>
          </div>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="hidden lg:flex items-center gap-4 text-sm font-semibold text-fg-muted"
        >
          {NAV_LINKS.map((link) => {
            const isActive = currentPath === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`px-3 py-2 rounded-md transition-colors ${focusRing} ${
                  isActive
                    ? "bg-tint text-fg-brand"
                    : "hover:text-fg-brand"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          <CultureSwitcher />
          {!authLoading && user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-line">
              <Link
                href="/dashboard"
                aria-current={currentPath === "/dashboard" ? "page" : undefined}
                className={`inline-flex items-center gap-2 min-h-11 bg-emphasis hover:bg-action-hover text-white text-sm font-semibold pl-2 pr-4 rounded-full transition-colors duration-200 shadow-xs ${focusRing}`}
              >
                <span className="w-7 h-7 rounded-full bg-action flex items-center justify-center text-white shrink-0">
                  <User size={15} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span>{user.childName}</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className={`inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-full border border-line-strong bg-surface hover:bg-sunken text-fg-muted hover:text-danger text-xs font-semibold transition-colors ${focusRing}`}
              >
                <LogOut size={15} strokeWidth={1.75} aria-hidden="true" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                aria-current={currentPath === "/login" ? "page" : undefined}
                className={`inline-flex items-center min-h-11 px-4 rounded-full border border-line-strong bg-surface hover:bg-sunken text-fg text-sm font-semibold transition-colors ${focusRing}`}
              >
                Masuk
              </Link>
              <Link
                href="/dashboard"
                aria-current={currentPath === "/dashboard" ? "page" : undefined}
                className={`inline-flex items-center min-h-11 bg-action hover:bg-action-hover text-white text-sm font-semibold px-4 rounded-full transition-colors duration-200 ${focusRing}`}
              >
                Dashboard
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className={`lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-md border border-line-strong text-fg hover:bg-sunken ${focusRing}`}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden border-t border-line bg-surface px-4 sm:px-6 py-4 flex flex-col gap-1"
        >
          <nav aria-label="Navigasi utama (seluler)" className="flex flex-col">
            {NAV_LINKS.map((link) => {
              const isActive = currentPath === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center min-h-11 px-3 text-sm font-medium rounded-md ${focusRing} ${
                    isActive
                      ? "bg-tint text-fg-brand font-semibold"
                      : "text-fg hover:text-fg-brand"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-line">
            <CultureSwitcher />
            <div className="flex flex-wrap items-center gap-2">
              {!authLoading && user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    aria-current={currentPath === "/dashboard" ? "page" : undefined}
                    className={`inline-flex items-center min-h-11 bg-action hover:bg-action-hover text-white text-sm font-semibold px-4 rounded-full transition-colors duration-200 ${focusRing}`}
                  >
                    Dashboard ({user.childName})
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      logout();
                    }}
                    className={`inline-flex items-center min-h-11 px-4 rounded-full border border-line-strong bg-surface hover:bg-sunken text-fg text-sm font-medium ${focusRing}`}
                  >
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    aria-current={currentPath === "/login" ? "page" : undefined}
                    className={`inline-flex items-center min-h-11 px-4 rounded-full border border-line-strong bg-surface hover:bg-sunken text-fg text-sm font-semibold ${focusRing}`}
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    aria-current={currentPath === "/dashboard" ? "page" : undefined}
                    className={`inline-flex items-center min-h-11 bg-action hover:bg-action-hover text-white text-sm font-semibold px-4 rounded-full transition-colors duration-200 ${focusRing}`}
                  >
                    Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
