"use client";

import { useEffect } from "react";
import { useMounted } from "@/lib/hooks/use-mounted";

function syncAppViewportHeight() {
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-vh", `${height}px`);
}

/** Utrzymuje --app-vh zgodne z realnym widocznym viewportem (pasek przeglądarki). */
export function useVisualViewportHeight() {
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;

    syncAppViewportHeight();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", syncAppViewportHeight);
    vv?.addEventListener("scroll", syncAppViewportHeight);
    window.addEventListener("resize", syncAppViewportHeight);
    window.addEventListener("orientationchange", syncAppViewportHeight);

    return () => {
      vv?.removeEventListener("resize", syncAppViewportHeight);
      vv?.removeEventListener("scroll", syncAppViewportHeight);
      window.removeEventListener("resize", syncAppViewportHeight);
      window.removeEventListener("orientationchange", syncAppViewportHeight);
      document.documentElement.style.removeProperty("--app-vh");
    };
  }, [mounted]);
}
