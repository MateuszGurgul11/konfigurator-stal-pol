"use client";

import { useIsMobilePortrait } from "@/lib/hooks/use-media-query";
import { useMounted } from "@/lib/hooks/use-mounted";
import { cn } from "@/lib/utils";

function PhoneRotateIcon() {
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg
        className="absolute -right-2 top-1/2 h-10 w-10 -translate-y-1/2 text-[#e30311]/80 rotate-phone-arrows"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden
      >
        <path
          d="M28 8a12 12 0 1 1-8.5 20.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M22 6l6 2-2 6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="rotate-phone-device relative h-[4.5rem] w-[2.25rem] rounded-[0.65rem] border-[3px] border-white/90 bg-[#2A2A26] shadow-lg shadow-black/40">
        <div className="absolute left-1/2 top-1.5 h-1 w-6 -translate-x-1/2 rounded-full bg-white/25" />
        <div className="absolute inset-x-1.5 top-4 bottom-3 rounded-[0.2rem] bg-[#e30311]/20" />
      </div>
    </div>
  );
}

export function RotateDeviceOverlay() {
  const mounted = useMounted();
  const isMobilePortrait = useIsMobilePortrait();

  if (!mounted || !isMobilePortrait) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[#1A1A18] px-8 text-center lg:hidden",
        "rotate-overlay-enter pt-safe pb-safe",
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rotate-device-title"
      aria-describedby="rotate-device-desc"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#e30311]">
        STAL-POL
      </p>

      <PhoneRotateIcon />

      <div className="max-w-xs space-y-2">
        <h2
          id="rotate-device-title"
          className="font-heading text-xl font-bold text-white"
        >
          Obróć telefon do poziomu
        </h2>
        <p id="rotate-device-desc" className="text-sm leading-relaxed text-[#888]">
          Konfigurator działa w orientacji poziomej. Przekręć urządzenie, aby
          kontynuować.
        </p>
      </div>
    </div>
  );
}
