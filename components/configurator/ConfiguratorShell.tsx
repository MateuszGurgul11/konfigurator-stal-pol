"use client";

import { useEffect } from "react";
import Link from "next/link";
import { fetchActiveCatalog, fetchPricing, isApiConfigured } from "@/lib/api/client";
import { useConfiguratorStore } from "@/lib/configurator/state";
import { useMounted } from "@/lib/hooks/use-mounted";
import { ConfiguratorHeader } from "./ConfiguratorHeader";
import { OptionSidebar } from "./OptionSidebar";
import { FencePreview } from "./FencePreview";
import { OpeningsOnlyPreview } from "./OpeningsOnlyPreview";
import { ProductScopeStep } from "./ProductScopeStep";
import { QuotePlanCanvas } from "./QuotePlanCanvas";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarProps = {
  catalog: NonNullable<ReturnType<typeof useConfiguratorStore.getState>["catalog"]>;
  selection: ReturnType<typeof useConfiguratorStore.getState>["selection"];
  activeTab: ReturnType<typeof useConfiguratorStore.getState>["activeTab"];
  onSelect: ReturnType<typeof useConfiguratorStore.getState>["setSelection"];
  onTabChange: ReturnType<typeof useConfiguratorStore.getState>["setActiveTab"];
};

/** Oryginalny panel boczny — tylko desktop (lg+). */
function DesktopSidebar({
  catalog,
  selection,
  activeTab,
  onSelect,
  onTabChange,
}: SidebarProps) {
  const sidebarOpen = useConfiguratorStore((s) => s.sidebarOpen);

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col bg-[#1A1A18] transition-all duration-300 ease-out lg:flex lg:border-r lg:border-[#2A2A26]",
        sidebarOpen
          ? "lg:w-[400px] xl:w-[420px]"
          : "w-0 overflow-hidden border-r-0 lg:w-0",
      )}
    >
      <div
        className={cn(
          "flex h-full w-full min-w-[400px] flex-col xl:min-w-[420px]",
          !sidebarOpen && "pointer-events-none opacity-0",
        )}
      >
        <OptionSidebar
          catalog={catalog}
          selection={selection}
          activeTab={activeTab}
          onSelect={onSelect}
          onTabChange={onTabChange}
        />
      </div>
    </aside>
  );
}

/** Drawer z opcjami — tylko mobile/tablet (<lg). */
function MobileOptionsDrawer({
  catalog,
  selection,
  activeTab,
  onSelect,
  onTabChange,
}: SidebarProps) {
  const sidebarOpen = useConfiguratorStore((s) => s.sidebarOpen);
  const setSidebarOpen = useConfiguratorStore((s) => s.setSidebarOpen);

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Zamknij panel opcji"
          className="fixed inset-0 z-40 bg-black/50 max-lg:landscape:hidden lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed z-50 flex max-h-[100dvh] flex-col overflow-hidden bg-[#1A1A18] shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          "inset-y-0 left-0 w-[min(400px,calc(100%-3rem))]",
          "max-lg:landscape:inset-0 max-lg:landscape:w-full",
          sidebarOpen
            ? "pointer-events-auto translate-x-0"
            : "pointer-events-none -translate-x-full",
        )}
        aria-hidden={!sidebarOpen}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#2A2A26] px-4 py-3 max-lg:landscape:py-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white">
            Opcje
          </p>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[#888] transition-colors hover:bg-[#222] hover:text-white"
            aria-label="Wróć do podglądu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overscroll-contain pb-safe max-lg:landscape:pb-2">
          <OptionSidebar
            catalog={catalog}
            selection={selection}
            activeTab={activeTab}
            onSelect={onSelect}
            onTabChange={onTabChange}
          />
        </div>
      </aside>
    </>
  );
}

function LoadingView() {
  return (
    <div className="flex flex-1 items-center justify-center bg-[#1A1A18]">
      <Loader2 className="h-10 w-10 animate-spin text-[#e30311]" />
    </div>
  );
}

export function ConfiguratorShell() {
  const mounted = useMounted();
  const {
    catalog,
    loading,
    error,
    selection,
    activeTab,
    setCatalog,
    setLoading,
    setError,
    initSelection,
    setSelection,
    setActiveTab,
    setPricing,
    scopeConfirmed,
    scope,
    quoteAdvancedView,
    setSidebarOpen,
  } = useConfiguratorStore();

  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    if (!mq.matches) setSidebarOpen(false);
  }, [mounted, setSidebarOpen]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [data, pricingData] = await Promise.all([
          fetchActiveCatalog(),
          fetchPricing(),
        ]);
        if (cancelled) return;
        setPricing(pricingData);
        if (
          !data.elements.length ||
          !data.posts.length ||
          !data.panels.length ||
          !data.spacerOptions.length ||
          !data.heights.length ||
          !data.colors.length
        ) {
          setError(
            "Katalog jest pusty. Zaloguj się do panelu admina i wgraj dane przykładowe (seed STAL-POL).",
          );
        } else {
          setCatalog(data);
          initSelection(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Nie udało się załadować katalogu.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [setCatalog, setLoading, setError, initSelection, setPricing]);

  const showDemoBanner = mounted && !isApiConfigured();
  const showLoading = !mounted || loading;
  const showError = mounted && !loading && error;
  const showConfigurator = mounted && !loading && !error && catalog;
  const showScopeStep = showConfigurator && !scopeConfirmed;

  const sidebarProps = {
    catalog: catalog!,
    selection,
    activeTab,
    onSelect: setSelection,
    onTabChange: setActiveTab,
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white max-lg:h-dvh">
        <ConfiguratorHeader />

        {showDemoBanner && (
          <div className="shrink-0 border-b border-amber-200/20 bg-amber-950/40 px-5 py-2 text-center max-lg:px-4">
            <p className="text-[11px] text-amber-400/90 max-lg:text-[10px]">
              API niedostępne — wyświetlane są dane demo. Sprawdź backend na
              Render i zmienną NEXT_PUBLIC_API_URL (lokalnie) lub proxy /api
              (produkcja Vercel).{" "}
              <Link href="/admin" className="underline hover:text-amber-300">
                Panel admina
              </Link>
            </p>
          </div>
        )}

        {showLoading && <LoadingView />}

        {showError && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-[#1A1A18] px-6 text-center max-lg:px-4">
            <p className="max-w-md text-sm text-[#ff6b6b]">{error}</p>
            <Link
              href="/admin"
              className="rounded-lg bg-[#e30311] px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-[#c9020f]"
            >
              Przejdź do panelu admina
            </Link>
          </div>
        )}

        {showScopeStep && <ProductScopeStep />}

        {showConfigurator && scopeConfirmed && catalog && (
          <div className="flex min-h-0 flex-1 flex-col max-lg:landscape:min-h-0 lg:flex-row">
            <DesktopSidebar {...sidebarProps} />

            <section className="min-h-[360px] flex-1 overflow-hidden max-lg:min-h-0">
              {activeTab === "quote" && quoteAdvancedView ? (
                <QuotePlanCanvas />
              ) : scope.fence ? (
                <FencePreview catalog={catalog} selection={selection} />
              ) : (
                <OpeningsOnlyPreview catalog={catalog} />
              )}
            </section>

            <MobileOptionsDrawer {...sidebarProps} />
          </div>
        )}
    </div>
  );
}
