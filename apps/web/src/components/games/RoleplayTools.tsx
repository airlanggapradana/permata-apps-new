"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { X, Wind, Hand, HeartHandshake } from "lucide-react";
import { GROUNDING_STEPS } from "@/data/offlineSurvivalData";

const button =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-action disabled:opacity-60";
export type RoleplayTool = "breath" | "grounding" | "help" | "pause";

export function RoleplayDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="roleplay-dialog-title"
      className="mb-0 mt-auto sm:m-auto max-h-[90dvh] w-full sm:w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-t-3xl rounded-b-none sm:rounded-3xl border border-line bg-surface p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] text-fg shadow-lg backdrop:bg-black/40 sm:p-8"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 id="roleplay-dialog-title" className="text-xl font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup jendela"
          className={`${button} -mr-2 -mt-2 px-3 text-fg-muted`}
        >
          <X size={22} aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function BreathingTool() {
  const [step, setStep] = useState(0);
  const complete = step >= 6;
  return (
    <div className="space-y-5">
      <p className="text-base leading-relaxed text-fg-muted">
        Ikuti ritmemu sendiri. Tarik dan hembuskan napas dengan lembut, tanpa
        menahannya. Kamu boleh berhenti kapan saja.
      </p>
      <div className="rounded-2xl bg-tint p-7 text-center" aria-live="polite">
        <Wind
          size={40}
          className="mx-auto mb-4 text-fg-brand"
          aria-hidden="true"
        />
        <p className="text-2xl font-semibold text-fg-brand">
          {complete
            ? "Terima kasih sudah mencoba"
            : step % 2 === 0
              ? "Tarik napas pelan"
              : "Hembuskan pelan"}
        </p>
        <p className="mt-2 text-sm text-fg-muted">
          {complete
            ? "Kamu bisa kembali ke cerita saat siap."
            : `Putaran ${Math.floor(step / 2) + 1} dari 3 · lanjutkan saat siap`}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setStep(complete ? 0 : step + 1)}
        className={`${button} w-full bg-action text-white hover:bg-action-hover`}
      >
        {complete ? "Ulangi latihan" : "Lanjutkan napas"}
      </button>
    </div>
  );
}

function GroundingTool() {
  const [step, setStep] = useState(0);
  const current = GROUNDING_STEPS[step];
  return (
    <div className="space-y-5">
      <p className="text-base leading-relaxed text-fg-muted">
        Amati sekitarmu dari tempat yang nyaman. Cukup pikirkan jawabannya; kamu
        tidak perlu mengetik atau membagikannya. Setiap langkah boleh dilewati.
      </p>
      <div className="rounded-2xl bg-tint p-6" aria-live="polite">
        <Hand size={32} className="mb-4 text-fg-brand" aria-hidden="true" />
        {current ? (
          <>
            <p className="text-xl font-semibold text-fg-brand">
              {current.count} · {current.sense}
            </p>
            <p className="mt-3 text-base text-fg-muted">{current.prompt}</p>
          </>
        ) : (
          <p className="text-xl font-semibold text-fg-brand">
            Latihan selesai. Kembali ke cerita saat kamu siap.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => setStep(current ? step + 1 : 0)}
        className={`${button} w-full bg-action text-white hover:bg-action-hover`}
      >
        {current ? "Lanjut atau lewati langkah" : "Ulangi latihan"}
      </button>
    </div>
  );
}

export default function RoleplayTools({
  tool,
  onClose,
  onLeave,
}: {
  tool: RoleplayTool;
  onClose: () => void;
  onLeave: () => void;
}) {
  const titles = {
    breath: "Napas pelan, sesukamu",
    grounding: "Kenali sekitar · 5–4–3–2–1",
    help: "Cari orang dewasa tepercaya",
    pause: "Cerita boleh menunggu",
  };
  return (
    <RoleplayDialog title={titles[tool]} onClose={onClose}>
      {tool === "breath" && <BreathingTool />}
      {tool === "grounding" && <GroundingTool />}
      {tool === "help" && (
        <div className="space-y-5 text-base leading-relaxed">
          <HeartHandshake
            size={36}
            className="text-fg-brand"
            aria-hidden="true"
          />
          <p>
            Kamu boleh berhenti bermain dan menemui orang tua, wali, guru, atau
            relawan pendamping yang kamu percaya.
          </p>
          <div className="rounded-2xl bg-tint p-5">
            <p className="font-semibold text-fg-brand">Kamu bisa mengatakan:</p>
            <p className="mt-2">
              “Aku ingin ditemani sebentar. Boleh duduk bersamaku?”
            </p>
          </div>
          <p className="text-fg-muted">
            Jika orang pertama belum dapat menemani, cari orang dewasa tepercaya
            lain. Untuk keadaan mendesak, minta bantuan orang dewasa di dekatmu
            segera.
          </p>
          <Link
            href="/safety-passport"
            className={`${button} w-full border border-line-strong text-fg-brand`}
          >
            Lihat kontak di Kartu Keselamatan
          </Link>
        </div>
      )}
      {tool === "pause" && (
        <div className="space-y-5">
          <p className="text-base leading-relaxed text-fg-muted">
            Istirahat selama yang kamu perlukan. Jika penyimpanan perangkat
            tersedia, adegan yang sudah dilalui tetap tersimpan selama tujuh
            hari.
          </p>
          <button
            type="button"
            onClick={onLeave}
            className={`${button} w-full border border-line-strong text-fg-brand`}
          >
            Kembali ke pilihan cerita
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={onClose}
        className={`${button} mt-5 w-full ${tool === "pause" ? "bg-action text-white hover:bg-action-hover" : "bg-sunken text-fg hover:bg-tint"}`}
      >
        {tool === "pause" ? "Lanjutkan cerita" : "Kembali ke cerita"}
      </button>
    </RoleplayDialog>
  );
}
