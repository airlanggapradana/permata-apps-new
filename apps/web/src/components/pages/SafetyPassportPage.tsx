"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  HeartPulse,
  Lock,
  MapPin,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AnimatedSection } from "@/components/PageMotion";

interface PassportContact {
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

interface PassportFamilyMember {
  name: string;
  relationship: string;
  phoneNumber: string;
}

interface PassportMeetingPoint {
  name: string;
  address: string;
  description: string;
}

interface PassportEmergencyNeed {
  needType: string;
  description: string;
}

interface PassportData {
  id: string;
  passportCode: string;
  status: string;
  updatedAt: string;
  childDisplayName: string;
  medicalNotes: string;
  specialNeeds: string;
  contacts: PassportContact[];
  familyMembers: PassportFamilyMember[];
  meetingPoints: PassportMeetingPoint[];
  emergencyNeeds: PassportEmergencyNeed[];
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

export default function SafetyPassportPage() {
  const { user, isLoading: authLoading, refreshAuth } = useAuth();

  const [passport, setPassport] = useState<PassportData | null>(null);
  const [loadingPassport, setLoadingPassport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const loadPassport = useCallback(async () => {
    setLoadingPassport(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/safety-passport", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success || !data.passport) {
        throw new Error(data.error || "Gagal memuat My Safety Passport.");
      }
      const p = data.passport;
      setPassport({
        id: p.id,
        passportCode: p.passportCode || "",
        status: p.status || "ACTIVE",
        updatedAt: p.updatedAt || "",
        childDisplayName: p.childDisplayName || "",
        medicalNotes: p.medicalNotes || "",
        specialNeeds: p.specialNeeds || "",
        contacts: Array.isArray(p.contacts)
          ? p.contacts.map((c: Partial<PassportContact>) => ({
              name: c.name || "",
              phone: c.phone || "",
              relationship: c.relationship || "",
              isPrimary: Boolean(c.isPrimary),
            }))
          : [],
        familyMembers: Array.isArray(p.familyMembers)
          ? p.familyMembers.map((m: Partial<PassportFamilyMember>) => ({
              name: m.name || "",
              relationship: m.relationship || "",
              phoneNumber: m.phoneNumber || "",
            }))
          : [],
        meetingPoints: Array.isArray(p.meetingPoints)
          ? p.meetingPoints.map((pt: Partial<PassportMeetingPoint>) => ({
              name: pt.name || "",
              address: pt.address || "",
              description: pt.description || "",
            }))
          : [],
        emergencyNeeds: Array.isArray(p.emergencyNeeds)
          ? p.emergencyNeeds.map((n: Partial<PassportEmergencyNeed>) => ({
              needType: n.needType || "Obat Rutin",
              description: n.description || "",
            }))
          : [],
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal memuat My Safety Passport.",
      );
    } finally {
      setLoadingPassport(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      if (!authLoading && user) {
        void loadPassport();
      } else if (!authLoading && !user) {
        setPassport(null);
      }
    });
    return () => {
      active = false;
    };
  }, [authLoading, user, loadPassport]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passport) return;
    setSaving(true);
    setErrorMsg(null);
    setSaveFeedback(null);

    try {
      const res = await fetch("/api/safety-passport", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passport),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan My Safety Passport.");
      }
      setSaveFeedback(
        data.message ||
          "My Safety Passport berhasil diperbarui dan dilindungi.",
      );
      await refreshAuth();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan My Safety Passport.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-[calc(100dvh-5rem)] bg-canvas text-fg py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-surface border border-line rounded-xl p-6 sm:p-8 text-center text-sm text-fg-muted">
          Memeriksa sesi akun Anda...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-[calc(100dvh-5rem)] bg-canvas text-fg py-8 sm:py-16 px-4 sm:px-6">
        <AnimatedSection index={0}>
          <div className="max-w-xl mx-auto bg-surface border border-line rounded-xl p-5 sm:p-8 shadow-sm space-y-6">
          <div className="w-12 h-12 rounded-md bg-tint text-fg-brand flex items-center justify-center">
            <Lock size={24} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-semibold text-fg tracking-tight">
              My Safety Passport Dilindungi Akun
            </h1>
            <p className="text-sm sm:text-base text-fg-muted leading-relaxed">
              My Safety Passport menyimpan data pribadi sensitif seperti kontak
              orang tua, anggota keluarga, titik kumpul, dan catatan medis anak.
              Untuk menjaga privasi dan mencegah percampuran data antar
              pengguna, masuk ke akun Anda terlebih dahulu.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/login?next=/safety-passport"
              className={`flex-1 inline-flex items-center justify-center min-h-11 px-5 rounded-md bg-action hover:bg-action-hover text-white text-sm font-medium transition-colors ${focusRing}`}
            >
              Masuk ke Akun
            </Link>
            <Link
              href="/register?next=/safety-passport"
              className={`flex-1 inline-flex items-center justify-center min-h-11 px-5 rounded-md bg-surface border border-line-strong hover:bg-sunken text-fg text-sm font-medium transition-colors ${focusRing}`}
            >
              Daftar Akun Baru
            </Link>
          </div>

          <div className="pt-4 border-t border-line text-xs text-fg-muted">
            Jika Anda membutuhkan panduan keselamatan umum tanpa login saat
            kondisi darurat, buka{" "}
            <Link
              href="/offline-survival"
              className={`font-medium text-fg-brand hover:underline ${focusRing}`}
            >
              Offline Survival Mode
            </Link>
            .
          </div>
          </div>
        </AnimatedSection>
      </main>
    );
  }

  return (
    <main className="min-h-screen-safe bg-canvas text-fg py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <AnimatedSection index={0}>
          <section className="bg-surface border border-line rounded-xl p-4 sm:p-6 lg:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="inline-flex items-center gap-2 max-w-full px-3 py-1 rounded-full bg-tint border border-[var(--brand-200)] text-fg-brand text-xs font-medium">
              <ShieldCheck size={14} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
              <span className="truncate">Akses Pribadi Terautentikasi: {user.email}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-fg tracking-tight">
              My Safety Passport
            </h1>
            <p className="text-sm text-fg-muted max-w-[65ch]">
              Kelola kontak wali, anggota keluarga, titik kumpul, dan kebutuhan
              darurat anak secara privat di akun Anda.
            </p>
          </div>

          {passport?.passportCode && (
            <div className="bg-sunken border border-line rounded-lg px-4 py-3 shrink-0 space-y-1">
              <div className="text-xs font-medium text-fg-subtle">
                Kode Paspor Keselamatan
              </div>
              <div className="text-base font-semibold text-fg tracking-wide">
                {passport.passportCode}
              </div>
              <div className="text-xs text-fg-muted">
                Status: {passport.status}
              </div>
            </div>
          )}
          </section>
        </AnimatedSection>

        {loadingPassport && (
          <div className="bg-surface border border-line rounded-lg p-8 text-center text-sm text-fg-muted">
            Memuat data My Safety Passport milik Anda...
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="bg-surface border border-line border-l-4 border-l-danger rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-2.5 text-sm text-fg">
              <AlertCircle
                size={18}
                strokeWidth={1.75}
                className="text-danger shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={loadPassport}
              className={`min-h-11 px-4 rounded-md border border-line-strong bg-surface hover:bg-sunken text-sm font-medium text-fg shrink-0 ${focusRing}`}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {passport && !loadingPassport && (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Section 1: Identitas Profil Anak */}
            <AnimatedSection index={1}>
              <section className="bg-surface border border-line rounded-lg p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-semibold text-fg">
                Identitas Pemilik Paspor
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="passport-child-name"
                    className="block text-sm font-medium text-fg"
                  >
                    Nama Anak / Pemilik Profil
                  </label>
                  <input
                    id="passport-child-name"
                    type="text"
                    value={passport.childDisplayName}
                    onChange={(e) =>
                      setPassport({
                        ...passport,
                        childDisplayName: e.target.value,
                      })
                    }
                    placeholder="Nama anak atau pemilik akun"
                    className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-4 text-sm text-fg placeholder:text-fg-subtle ${focusRing}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="passport-special-needs"
                    className="block text-sm font-medium text-fg"
                  >
                    Kebutuhan Pendampingan Khusus (Opsional)
                  </label>
                  <input
                    id="passport-special-needs"
                    type="text"
                    value={passport.specialNeeds}
                    onChange={(e) =>
                      setPassport({ ...passport, specialNeeds: e.target.value })
                    }
                    placeholder="Contoh: Butuh pendamping tenang di keramaian"
                    className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-4 text-sm text-fg placeholder:text-fg-subtle ${focusRing}`}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="passport-medical-notes"
                  className="block text-sm font-medium text-fg"
                >
                  Catatan Medis, Golongan Darah, &amp; Alergi
                </label>
                <textarea
                  id="passport-medical-notes"
                  rows={3}
                  value={passport.medicalNotes}
                  onChange={(e) =>
                    setPassport({ ...passport, medicalNotes: e.target.value })
                  }
                  placeholder="Contoh: Golongan darah O, alergi kacang, asma ringan"
                  className={`w-full bg-surface border border-line-input rounded-md p-3.5 text-sm text-fg placeholder:text-fg-subtle ${focusRing}`}
                />
              </div>
              </section>
            </AnimatedSection>

            {/* Section 2: Kontak Orang Tua / Wali */}
            <AnimatedSection index={2}>
              <section className="bg-surface border border-line rounded-lg p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Phone
                    size={18}
                    strokeWidth={1.75}
                    className="text-fg-brand"
                    aria-hidden="true"
                  />
                  <h2 className="text-lg font-semibold text-fg">
                    Kontak Orang Tua, Wali, &amp; Dewasa Tepercaya
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPassport({
                      ...passport,
                      contacts: [
                        ...passport.contacts,
                        {
                          name: "",
                          phone: "",
                          relationship: "Orang Tua / Wali",
                          isPrimary: passport.contacts.length === 0,
                        },
                      ],
                    })
                  }
                  className={`inline-flex items-center gap-1.5 min-h-11 px-4 rounded-md bg-tint hover:bg-[var(--brand-100)] text-fg-brand text-sm font-medium transition-colors ${focusRing}`}
                >
                  <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>Tambah Kontak</span>
                </button>
              </div>

              {passport.contacts.length === 0 ? (
                <p className="text-sm text-fg-muted bg-sunken border border-line rounded-md p-4">
                  Belum ada kontak wali yang tersimpan. Tekan Tambah Kontak
                  untuk mencatat kontak darurat utama Anda.
                </p>
              ) : (
                <div className="space-y-3">
                  {passport.contacts.map((contact, idx) => (
                    <div
                      key={idx}
                      className="bg-sunken border border-line rounded-md p-4 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label
                            htmlFor={`contact-name-${idx}`}
                            className="block text-xs font-medium text-fg-muted"
                          >
                            Nama Kontak
                          </label>
                          <input
                            id={`contact-name-${idx}`}
                            type="text"
                            value={contact.name}
                            onChange={(e) => {
                              const next = [...passport.contacts];
                              next[idx] = {
                                ...next[idx],
                                name: e.target.value,
                              };
                              setPassport({ ...passport, contacts: next });
                            }}
                            placeholder="Nama wali"
                            className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-3 text-sm text-fg ${focusRing}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor={`contact-phone-${idx}`}
                            className="block text-xs font-medium text-fg-muted"
                          >
                            Nomor Telepon
                          </label>
                          <input
                            id={`contact-phone-${idx}`}
                            type="tel"
                            inputMode="tel"
                            value={contact.phone}
                            onChange={(e) => {
                              const next = [...passport.contacts];
                              next[idx] = {
                                ...next[idx],
                                phone: e.target.value,
                              };
                              setPassport({ ...passport, contacts: next });
                            }}
                            placeholder="08xx-xxxx-xxxx"
                            className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-3 text-base sm:text-sm text-fg ${focusRing}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor={`contact-rel-${idx}`}
                            className="block text-xs font-medium text-fg-muted"
                          >
                            Hubungan
                          </label>
                          <input
                            id={`contact-rel-${idx}`}
                            type="text"
                            value={contact.relationship}
                            onChange={(e) => {
                              const next = [...passport.contacts];
                              next[idx] = {
                                ...next[idx],
                                relationship: e.target.value,
                              };
                              setPassport({ ...passport, contacts: next });
                            }}
                            placeholder="Ibu / Ayah / Paman / Guru"
                            className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-3 text-sm text-fg ${focusRing}`}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="inline-flex items-center gap-2 min-h-11 text-sm text-fg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={contact.isPrimary}
                            onChange={(e) => {
                              const next = passport.contacts.map((c, cIdx) => ({
                                ...c,
                                isPrimary:
                                  cIdx === idx ? e.target.checked : false,
                              }));
                              setPassport({ ...passport, contacts: next });
                            }}
                            className={`w-4 h-4 accent-action rounded ${focusRing}`}
                          />
                          <span>Tandai sebagai kontak utama</span>
                        </label>

                        <div className="flex flex-wrap items-center gap-2">
                          {contact.phone.trim() && (
                            <a
                              href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                              className={`inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-md bg-action hover:bg-action-hover text-white text-xs font-semibold transition-colors ${focusRing}`}
                            >
                              <Phone size={14} strokeWidth={2} aria-hidden="true" />
                              <span>Hubungi</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setPassport({
                                ...passport,
                                contacts: passport.contacts.filter(
                                  (_, cIdx) => cIdx !== idx,
                                ),
                              })
                            }
                            className={`inline-flex items-center gap-1.5 min-h-11 px-3 rounded-md text-xs font-medium text-fg-muted hover:text-danger hover:bg-surface ${focusRing}`}
                          >
                            <Trash2
                              size={15}
                              strokeWidth={1.75}
                              aria-hidden="true"
                            />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </section>
            </AnimatedSection>

            {/* Section 3: Anggota Keluarga & Titik Kumpul */}
            <AnimatedSection index={3}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Anggota Keluarga */}
              <section className="bg-surface border border-line rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users
                      size={18}
                      strokeWidth={1.75}
                      className="text-fg-brand"
                      aria-hidden="true"
                    />
                    <h2 className="text-lg font-semibold text-fg">
                      Anggota Keluarga
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPassport({
                        ...passport,
                        familyMembers: [
                          ...passport.familyMembers,
                          { name: "", relationship: "", phoneNumber: "" },
                        ],
                      })
                    }
                    className={`inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-md bg-tint hover:bg-[var(--brand-100)] text-fg-brand text-sm font-medium ${focusRing}`}
                  >
                    <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
                    <span>Tambah</span>
                  </button>
                </div>

                {passport.familyMembers.length === 0 ? (
                  <p className="text-sm text-fg-muted bg-sunken border border-line rounded-md p-4">
                    Belum ada anggota keluarga tercatat.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {passport.familyMembers.map((member, idx) => (
                      <div
                        key={idx}
                        className="bg-sunken border border-line rounded-md p-3.5 space-y-2.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <label
                              htmlFor={`fam-name-${idx}`}
                              className="block text-xs font-medium text-fg-muted"
                            >
                              Nama
                            </label>
                            <input
                              id={`fam-name-${idx}`}
                              type="text"
                              value={member.name}
                              onChange={(e) => {
                                const next = [...passport.familyMembers];
                                next[idx] = {
                                  ...next[idx],
                                  name: e.target.value,
                                };
                                setPassport({
                                  ...passport,
                                  familyMembers: next,
                                });
                              }}
                              placeholder="Nama anggota keluarga"
                              className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-3 text-sm text-fg ${focusRing}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label
                              htmlFor={`fam-rel-${idx}`}
                              className="block text-xs font-medium text-fg-muted"
                            >
                              Hubungan
                            </label>
                            <input
                              id={`fam-rel-${idx}`}
                              type="text"
                              value={member.relationship}
                              onChange={(e) => {
                                const next = [...passport.familyMembers];
                                next[idx] = {
                                  ...next[idx],
                                  relationship: e.target.value,
                                };
                                setPassport({
                                  ...passport,
                                  familyMembers: next,
                                });
                              }}
                              placeholder="Kakak / Adik / Nenek"
                              className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-3 text-sm text-fg ${focusRing}`}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="tel"
                            inputMode="tel"
                            aria-label={`Nomor telepon ${member.name || "anggota keluarga"}`}
                            value={member.phoneNumber}
                            onChange={(e) => {
                              const next = [...passport.familyMembers];
                              next[idx] = {
                                ...next[idx],
                                phoneNumber: e.target.value,
                              };
                              setPassport({
                                ...passport,
                                familyMembers: next,
                              });
                            }}
                            placeholder="Nomor telepon (opsional)"
                            className={`flex-1 min-w-0 min-h-11 bg-surface border border-line-input rounded-md px-3 text-base sm:text-sm text-fg ${focusRing}`}
                          />
                          {member.phoneNumber.trim() && (
                            <a
                              href={`tel:${member.phoneNumber.replace(/[^+\d]/g, "")}`}
                              aria-label={`Hubungi ${member.name || "anggota keluarga"}`}
                              className={`min-h-11 min-w-11 inline-flex items-center justify-center rounded-md bg-action hover:bg-action-hover text-white shrink-0 ${focusRing}`}
                            >
                              <Phone size={16} strokeWidth={1.75} aria-hidden="true" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setPassport({
                                ...passport,
                                familyMembers: passport.familyMembers.filter(
                                  (_, mIdx) => mIdx !== idx,
                                ),
                              })
                            }
                            aria-label="Hapus anggota keluarga"
                            className={`min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-fg-muted hover:text-danger hover:bg-surface ${focusRing}`}
                          >
                            <Trash2
                              size={16}
                              strokeWidth={1.75}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Titik Kumpul Keluarga */}
              <section className="bg-surface border border-line rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin
                      size={18}
                      strokeWidth={1.75}
                      className="text-fg-brand"
                      aria-hidden="true"
                    />
                    <h2 className="text-lg font-semibold text-fg">
                      Titik Kumpul Keluarga
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPassport({
                        ...passport,
                        meetingPoints: [
                          ...passport.meetingPoints,
                          { name: "", address: "", description: "" },
                        ],
                      })
                    }
                    className={`inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-md bg-tint hover:bg-[var(--brand-100)] text-fg-brand text-sm font-medium ${focusRing}`}
                  >
                    <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
                    <span>Tambah</span>
                  </button>
                </div>

                {passport.meetingPoints.length === 0 ? (
                  <p className="text-sm text-fg-muted bg-sunken border border-line rounded-md p-4">
                    Belum ada titik kumpul keluarga yang ditetapkan.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {passport.meetingPoints.map((point, idx) => (
                      <div
                        key={idx}
                        className="bg-sunken border border-line rounded-md p-3.5 space-y-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            aria-label={`Nama titik kumpul ${idx + 1}`}
                            value={point.name}
                            onChange={(e) => {
                              const next = [...passport.meetingPoints];
                              next[idx] = {
                                ...next[idx],
                                name: e.target.value,
                              };
                              setPassport({
                                ...passport,
                                meetingPoints: next,
                              });
                            }}
                            placeholder="Contoh: Lapangan Meunasah / Halaman Sekolah"
                            className={`flex-1 min-w-0 min-h-11 bg-surface border border-line-input rounded-md px-3 text-base sm:text-sm text-fg ${focusRing}`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPassport({
                                ...passport,
                                meetingPoints: passport.meetingPoints.filter(
                                  (_, pIdx) => pIdx !== idx,
                                ),
                              })
                            }
                            aria-label="Hapus titik kumpul"
                            className={`min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-fg-muted hover:text-danger hover:bg-surface ${focusRing}`}
                          >
                            <Trash2
                              size={16}
                              strokeWidth={1.75}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                        <input
                          type="text"
                          aria-label={`Alamat atau patokan titik kumpul ${idx + 1}`}
                          value={point.address}
                          onChange={(e) => {
                            const next = [...passport.meetingPoints];
                            next[idx] = {
                              ...next[idx],
                              address: e.target.value,
                            };
                            setPassport({
                              ...passport,
                              meetingPoints: next,
                            });
                          }}
                          placeholder="Alamat atau patokan lokasi aman"
                          className={`w-full min-h-11 bg-surface border border-line-input rounded-md px-3 text-sm text-fg ${focusRing}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
              </div>
            </AnimatedSection>

            {/* Section 4: Kebutuhan Darurat */}
            <AnimatedSection index={4}>
              <section className="bg-surface border border-line rounded-lg p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <HeartPulse
                    size={18}
                    strokeWidth={1.75}
                    className="text-fg-brand"
                    aria-hidden="true"
                  />
                  <h2 className="text-lg font-semibold text-fg">
                    Kebutuhan Darurat Anak
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPassport({
                      ...passport,
                      emergencyNeeds: [
                        ...passport.emergencyNeeds,
                        { needType: "Obat Rutin", description: "" },
                      ],
                    })
                  }
                  className={`inline-flex items-center gap-1.5 min-h-11 px-4 rounded-md bg-tint hover:bg-[var(--brand-100)] text-fg-brand text-sm font-medium ${focusRing}`}
                >
                  <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>Tambah Kebutuhan</span>
                </button>
              </div>

              {passport.emergencyNeeds.length === 0 ? (
                <p className="text-sm text-fg-muted bg-sunken border border-line rounded-md p-4">
                  Belum ada kebutuhan darurat tercatat (misalnya obat asma,
                  kacamata cadangan, atau susu khusus).
                </p>
              ) : (
                <div className="space-y-3">
                  {passport.emergencyNeeds.map((need, idx) => (
                    <div
                      key={idx}
                      className="bg-sunken border border-line rounded-md p-3.5 flex flex-col sm:flex-row gap-2.5"
                    >
                      <select
                        aria-label={`Jenis kebutuhan darurat ${idx + 1}`}
                        value={need.needType}
                        onChange={(e) => {
                          const next = [...passport.emergencyNeeds];
                          next[idx] = {
                            ...next[idx],
                            needType: e.target.value,
                          };
                          setPassport({ ...passport, emergencyNeeds: next });
                        }}
                        className={`sm:w-48 min-h-11 bg-surface border border-line-input rounded-md px-3 text-sm text-fg ${focusRing}`}
                      >
                        <option value="Obat Rutin">Obat Rutin</option>
                        <option value="Alergi">Alergi</option>
                        <option value="Alat Bantu">Alat Bantu</option>
                        <option value="Nutrisi Khusus">Nutrisi Khusus</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                      <input
                        type="text"
                        aria-label={`Keterangan kebutuhan darurat ${idx + 1}`}
                        value={need.description}
                        onChange={(e) => {
                          const next = [...passport.emergencyNeeds];
                          next[idx] = {
                            ...next[idx],
                            description: e.target.value,
                          };
                          setPassport({ ...passport, emergencyNeeds: next });
                        }}
                        placeholder="Deskripsi kebutuhan secara jelas"
                        className={`flex-1 min-h-11 bg-surface border border-line-input rounded-md px-3 text-sm text-fg ${focusRing}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPassport({
                            ...passport,
                            emergencyNeeds: passport.emergencyNeeds.filter(
                              (_, nIdx) => nIdx !== idx,
                            ),
                          })
                        }
                        aria-label="Hapus kebutuhan darurat"
                        className={`min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-fg-muted hover:text-danger hover:bg-surface ${focusRing}`}
                      >
                        <Trash2
                          size={16}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              </section>
            </AnimatedSection>

            {/* Save Bar */}
            <AnimatedSection index={5}>
              <div className="bg-surface border border-line rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-fg-muted">
                {saveFeedback ? (
                  <span
                    role="status"
                    className="inline-flex items-center gap-2 text-success font-medium"
                  >
                    <CheckCircle2
                      size={16}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span>{saveFeedback}</span>
                  </span>
                ) : (
                  <span>
                    Setiap perubahan disimpan hanya ke akun {user.email}.
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                aria-busy={saving}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-md bg-action hover:bg-action-hover disabled:bg-sunken disabled:text-neutral-400 text-white text-sm font-medium transition-colors shrink-0 ${focusRing}`}
              >
                <Save size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>
                  {saving
                    ? "Menyimpan perubahan..."
                    : "Simpan My Safety Passport"}
                </span>
              </button>
              </div>
            </AnimatedSection>
          </form>
        )}
      </div>
    </main>
  );
}
