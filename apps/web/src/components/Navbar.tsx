"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { useCulture } from "@/context/CultureContext";
import { useAuth } from "@/context/AuthContext";

/*
 * Navbar tunggal untuk seluruh halaman.
 * Tautan memakai "/#id" agar tujuannya tetap valid dari halaman mana pun;
 * ThemedContent meneruskan hash tersebut ke scroll setelah halaman berganti.
 *
 * Di landing page navbar berupa kapsul melayang di atas hero (bukan bilah putih
 * yang menabrak foto latar). Selama masih di atas hero kapsul berkaca gelap
 * dengan teks putih; setelah hero lewat, atau saat menu seluler terbuka, kapsul
 * berganti ke kaca terang dengan teks gelap. Halaman lain memakai bilah biasa.
 */
const NAV_LINKS = [
  { href: "/#programs", label: "Modul" },
  { href: "/#calculator", label: "Pohon Harapan" },
  { href: "/safety-passport", label: "Safety Passport" },
  { href: "/offline-survival", label: "Siaga Offline" },
];

const LOCATIONS = [
  { key: "aceh", label: "Aceh", note: "Meuseuraya" },
  { key: "sumbar", label: "Sumatera Barat", note: "Mambangkik Batang Tarandam" },
] as const;

type Tone = "light" | "dark";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";
const focusRingOnDark =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const ease = "ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

function PinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-3.5 h-3.5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function LocationOption({
  loc,
  active,
  onPick,
}: {
  loc: (typeof LOCATIONS)[number];
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      className={`group w-full flex items-center gap-3 text-left rounded-xl px-3 min-h-14 transition-colors duration-200 ${focusRing} ${active ? "bg-brand-50" : "hover:bg-slate-50"
        }`}
    >
      <span
        className={`flex w-9 h-9 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${active
          ? "bg-brand-800 text-white"
          : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
          }`}
      >
        <PinIcon />
      </span>
      <span className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-semibold text-slate-900">{loc.label}</span>
        <span className="text-xs text-slate-600 truncate">{loc.note}</span>
      </span>
      <svg
        className={`w-4 h-4 shrink-0 text-brand-800 transition-all duration-300 ${ease} ${active ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m5 12 5 5L20 7" />
      </svg>
    </button>
  );
}

/*
 * Pengganti tombol Aceh/Sumbar. Fungsinya tetap mengganti budaya lewat
 * useCulture, tapi dibungkus satu tombol "Lokasi".
 * inline=true dipakai di menu seluler (daftar mengembang di tempat).
 */
function LocationMenu({
  inline = false,
  tone = "light",
  onSelect,
}: {
  inline?: boolean;
  tone?: Tone;
  onSelect?: () => void;
}) {
  const { culture, setCulture } = useCulture();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pick = (key: (typeof LOCATIONS)[number]["key"]) => {
    setCulture(key);
    setOpen(false);
    onSelect?.();
  };

  const options = LOCATIONS.map((loc) => (
    <LocationOption
      key={loc.key}
      loc={loc}
      active={culture === loc.key}
      onPick={() => pick(loc.key)}
    />
  ));

  const triggerTone =
    tone === "dark"
      ? open
        ? "border-white/60 bg-white/20 text-white"
        : "border-white/30 bg-white/10 text-white hover:border-white/50 hover:bg-white/20"
      : open
        ? "border-brand-800 bg-brand-50 text-brand-900"
        : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50";

  return (
    <div ref={rootRef} className={inline ? "w-full" : "relative"}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={inline ? "location-inline" : "location-panel"}
        className={`inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-full border text-sm font-semibold transition-colors duration-200 ${tone === "dark" ? focusRingOnDark : focusRing} ${inline ? "w-full" : ""
          } ${triggerTone}`}
      >
        <PinIcon />
        Lokasi
        <ChevronIcon
          className={`transition-transform duration-300 ${ease} ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      {inline ? (
        <div
          id="location-inline"
          inert={!open}
          className={`grid transition-[grid-template-rows] duration-300 ${ease} ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-1 pt-2">{options}</div>
          </div>
        </div>
      ) : (
        <div
          id="location-panel"
          inert={!open}
          className={`absolute right-0 top-full mt-3 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 transition-[opacity,transform,visibility] duration-250 ${ease} ${open
            ? "visible opacity-100 translate-y-0 scale-100"
            : "invisible opacity-0 -translate-y-1 scale-95"
            }`}
        >
          {options}
        </div>
      )}
    </div>
  );
}

export default function Navbar({
  currentPath = "/",
}: {
  currentPath?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [overHero, setOverHero] = useState(true);
  const progressRef = useRef<HTMLSpanElement>(null);
  const { user, isLoading: authLoading, logout } = useAuth();

  const isLanding = currentPath === "/";
  // Gelap hanya saat kapsul masih menumpang di atas foto hero dan menu seluler tertutup.
  const tone: Tone = isLanding && overHero && !menuOpen ? "dark" : "light";
  const dark = tone === "dark";
  const ring = dark ? focusRingOnDark : focusRing;

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

  // Header menyusut saat scroll + garis progres baca di tepi bawah.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(y > 8);
      // Hero setinggi satu layar; ganti ke kapsul terang sebelum hero benar-benar habis.
      setOverHero(y < window.innerHeight - 96);
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0
          })`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const ctaClass = `group inline-flex items-center justify-center gap-2 min-h-11 text-sm font-semibold px-5 rounded-full transition-colors duration-200 ${ring} ${dark
    ? "bg-white text-brand-900 hover:bg-brand-50"
    : "bg-brand-900 hover:bg-brand-950 text-white"
    }`;

  const ctaArrow = (
    <svg
      className={`w-4 h-4 transition-transform duration-300 ${ease} group-hover:translate-x-0.5`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );

  const secondaryBtn = dark
    ? "border-white/30 bg-white/10 hover:bg-white/20 text-white"
    : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800";

  // Landing: kapsul melayang. Halaman lain: bilah menempel di atas seperti sebelumnya.
  const headerClass = isLanding
    ? "fixed inset-x-0 top-0 z-50 px-3 sm:px-6 pt-3 pointer-events-none"
    : `sticky top-0 z-50 border-b backdrop-blur-md transition-[background-color,box-shadow,border-color] duration-300 ${scrolled
      ? "bg-white/80 border-slate-200/80 shadow-sm shadow-slate-900/5"
      : "bg-white/95 border-slate-200"
    }`;

  const shellClass = isLanding
    ? `pointer-events-auto relative max-w-7xl mx-auto rounded-[2rem] border backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 ${dark
      ? "bg-slate-950/35 border-white/15 shadow-lg shadow-black/20"
      : "bg-white/85 border-slate-200/80 shadow-lg shadow-slate-900/10"
    }`
    : "";

  const rowClass = isLanding
    ? "h-16 pl-4 pr-2.5 sm:pl-5 sm:pr-3 flex items-center justify-between gap-4"
    : `max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 transition-[height] duration-300 ${ease} ${scrolled ? "h-16" : "h-20"
    }`;

  const navLinkTone = (isActive: boolean) =>
    dark
      ? `text-white/90 hover:text-white after:bg-white ${isActive ? "text-white after:scale-x-100" : ""}`
      : `hover:text-brand-800 after:bg-brand-700 ${isActive ? "text-brand-800 after:scale-x-100" : ""}`;

  return (
    <header className={headerClass}>
      <div className={shellClass}>
        <div className={rowClass}>
          <Link
            href="/"
            onClick={closeMenu}
            className={`group flex items-center gap-3 shrink-0 rounded-sm ${ring}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/permata-logo.webp"
              alt="Logo PERMATA"
              width={40}
              height={40}
              className={`w-10 h-10 object-contain shrink-0 transition-[transform,filter] duration-500 ${ease} group-hover:scale-105 group-hover:-rotate-3 ${dark ? "brightness-0 invert" : ""
                }`}
            />
            <div className="flex flex-col">
              <span
                className={`text-lg sm:text-xl font-extrabold tracking-tight leading-none transition-colors duration-300 ${dark ? "text-white" : "text-slate-900"
                  }`}
              >
                PERMATA
              </span>
              <span
                className={`text-[11px] font-medium mt-1 transition-colors duration-300 ${dark ? "text-white/75" : "text-slate-600"
                  }`}
              >
                Resiliensi Jiwa &amp; PFA Anak
              </span>
            </div>
          </Link>

          <nav
            aria-label="Navigasi utama"
            className={`hidden lg:flex items-center gap-8 text-sm font-semibold transition-colors duration-300 ${dark ? "text-white/90" : "text-slate-700"
              }`}
          >
            {NAV_LINKS.map((link) => {
              const isActive = currentPath === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative py-2 rounded-sm transition-colors duration-200 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:transition-transform after:duration-300 hover:after:scale-x-100 motion-reduce:after:transition-none ${ring} ${navLinkTone(isActive)}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <LocationMenu tone={tone} />
            {!authLoading && user ? (
              <div
                className={`flex items-center gap-2 pl-2 border-l ${dark ? "border-white/25" : "border-slate-200"
                  }`}
              >
                <Link
                  href="/dashboard"
                  aria-current={currentPath === "/dashboard" ? "page" : undefined}
                  className={`inline-flex items-center gap-2 min-h-11 text-sm font-semibold pl-2 pr-4 rounded-full transition-colors duration-200 shadow-sm ${ring} ${dark
                    ? "bg-white text-brand-900 hover:bg-brand-50"
                    : "bg-brand-900 hover:bg-brand-950 text-white"
                    }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${dark ? "bg-brand-100 text-brand-800" : "bg-brand-700 text-white"
                      }`}
                  >
                    <User size={15} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span>{user.childName}</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className={`inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-full border text-xs font-semibold transition-colors ${ring} ${dark
                    ? "border-white/30 bg-white/10 hover:bg-white/20 text-white"
                    : "border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-red-600"
                    }`}
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
                  className={`inline-flex items-center min-h-11 px-4 rounded-full border text-sm font-semibold transition-colors ${ring} ${secondaryBtn}`}
                >
                  Masuk
                </Link>
                <Link
                  href="/dashboard"
                  aria-current={currentPath === "/dashboard" ? "page" : undefined}
                  className={ctaClass}
                >
                  Dashboard
                  {ctaArrow}
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className={`lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-full border transition-colors ${ring} ${dark
              ? "border-white/30 text-white hover:bg-white/15"
              : "border-slate-300 text-slate-800 hover:bg-slate-100"
              }`}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="relative block w-5 h-4" aria-hidden="true">
              <span
                className={`absolute left-0 w-full h-0.5 rounded-full bg-current transition-all duration-300 ${ease} ${menuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                  }`}
              />
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 rounded-full bg-current transition-opacity duration-200 ${menuOpen ? "opacity-0" : "opacity-100"
                  }`}
              />
              <span
                className={`absolute left-0 w-full h-0.5 rounded-full bg-current transition-all duration-300 ${ease} ${menuOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                  }`}
              />
            </span>
          </button>
        </div>

        <div
          id="mobile-menu"
          inert={!menuOpen}
          className={`lg:hidden grid transition-[grid-template-rows] duration-300 ${ease} ${menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
        >
          <div className="overflow-hidden">
            <div
              className={`border-t border-slate-200 px-4 sm:px-6 py-4 flex flex-col gap-1 ${isLanding ? "" : "bg-white"
                }`}
            >
              <nav
                aria-label="Navigasi utama (seluler)"
                className="flex flex-col"
              >
                {NAV_LINKS.map((link, i) => {
                  const isActive = currentPath === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      aria-current={isActive ? "page" : undefined}
                      style={{ transitionDelay: menuOpen ? `${80 + i * 60}ms` : "0ms" }}
                      className={`flex items-center min-h-12 text-base font-medium rounded-sm transition-all duration-400 ${ease} ${focusRing} ${menuOpen
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-2"
                        } ${isActive ? "text-brand-800 font-semibold" : "text-slate-800 hover:text-brand-700"}`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              <div
                style={{ transitionDelay: menuOpen ? "260ms" : "0ms" }}
                className={`flex flex-col gap-3 pt-4 mt-2 border-t border-slate-200 transition-all duration-400 ${ease} ${menuOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2"
                  }`}
              >
                <LocationMenu inline />
                {!authLoading && user ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href="/dashboard"
                      onClick={closeMenu}
                      aria-current={currentPath === "/dashboard" ? "page" : undefined}
                      className={`inline-flex items-center gap-2 min-h-11 bg-brand-900 hover:bg-brand-950 text-white text-sm font-semibold px-4 rounded-full transition-colors duration-200 ${focusRing}`}
                    >
                      Dashboard ({user.childName})
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        logout();
                      }}
                      className={`inline-flex items-center min-h-11 px-4 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium ${focusRing}`}
                    >
                      Keluar
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href="/login"
                      onClick={closeMenu}
                      aria-current={currentPath === "/login" ? "page" : undefined}
                      className={`inline-flex items-center min-h-11 px-4 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold ${focusRing}`}
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={closeMenu}
                      aria-current={currentPath === "/dashboard" ? "page" : undefined}
                      className={ctaClass}
                    >
                      Akses Dashboard
                      {ctaArrow}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {!isLanding && (
          <span
            ref={progressRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-brand-700 to-brand-900"
          />
        )}
      </div>
    </header>
  );
}
