"use client";

import { useMemo, useRef } from "react";
import {
  ImagePlus,
  Undo2,
  Trash2,
  Check,
  X,
  Ruler,
  PencilLine,
  Gauge,
  Spline,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateQuote } from "@/lib/pricing/calculateQuote";
import {
  ACCEPTED_BG_TYPES,
  MAX_BG_SIZE,
  validateBackgroundFile,
} from "@/lib/configurator/backgrounds";
import { MAX_PREVIEW_PANELS, useConfiguratorStore } from "@/lib/configurator/state";
import type { CatalogCollections, ConfiguratorSelection } from "@/lib/types";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#666]">
      {children}
    </p>
  );
}

type StepStatus = { label: string; tone: "idle" | "active" | "done" };

function StepHeader({
  index,
  title,
  status,
}: {
  index: number;
  title: string;
  status?: StepStatus;
}) {
  const toneClass: Record<StepStatus["tone"], string> = {
    idle: "border-[#3a3a36] bg-[#1f1f1d] text-[#8a8a85]",
    active: "border-[#e30311]/50 bg-[#2a0e10] text-[#ff8a90]",
    done: "border-[#1f7a4a]/60 bg-[#0e2a1a] text-[#4ade80]",
  };
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white transition-shadow",
            status?.tone === "done"
              ? "bg-[#1f7a4a] shadow-[0_0_0_3px_rgba(31,122,74,0.18)]"
              : "bg-[#e30311] shadow-[0_0_0_3px_rgba(227,3,17,0.16)]",
          )}
        >
          {status?.tone === "done" ? <Check className="h-3.5 w-3.5" /> : index}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white">
          {title}
        </span>
      </div>
      {status && (
        <span
          className={cn(
            "flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
            toneClass[status.tone],
          )}
        >
          {status.label}
        </span>
      )}
    </div>
  );
}

const CARD_CLASS = "rounded-xl border border-[#333] bg-[#222] p-4";

type Props = {
  catalog: CatalogCollections;
  selection: ConfiguratorSelection;
};

export function QuoteSidebarPanel({ catalog, selection }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quotePlanImageUrl = useConfiguratorStore((s) => s.quotePlanImageUrl);
  const quoteDrawMode = useConfiguratorStore((s) => s.quoteDrawMode);
  const quoteCalibrationLine = useConfiguratorStore((s) => s.quoteCalibrationLine);
  const quoteCalibrationLengthM = useConfiguratorStore(
    (s) => s.quoteCalibrationLengthM,
  );
  const quoteFencePoints = useConfiguratorStore((s) => s.quoteFencePoints);
  const quoteFenceClosed = useConfiguratorStore((s) => s.quoteFenceClosed);
  const quotePxPerMeter = useConfiguratorStore((s) => s.quotePxPerMeter);
  const quotePerimeterM = useConfiguratorStore((s) => s.quotePerimeterM);
  const scope = useConfiguratorStore((s) => s.scope);
  const bramaEnabled = useConfiguratorStore((s) => s.bramaEnabled);
  const bramaElementId = useConfiguratorStore((s) => s.bramaElementId);
  const bramaOccupiedSpanM = useConfiguratorStore((s) => s.bramaOccupiedSpanM);
  const furtkaEnabled = useConfiguratorStore((s) => s.furtkaEnabled);
  const furtkaElementId = useConfiguratorStore((s) => s.furtkaElementId);
  const furtkaPosition = useConfiguratorStore((s) => s.furtkaPosition);
  const previewPanelCount = useConfiguratorStore((s) => s.previewPanelCount);
  const pricing = useConfiguratorStore((s) => s.pricing);

  const setQuotePlanImage = useConfiguratorStore((s) => s.setQuotePlanImage);
  const setQuoteCalibrationLengthM = useConfiguratorStore(
    (s) => s.setQuoteCalibrationLengthM,
  );
  const setQuoteDrawMode = useConfiguratorStore((s) => s.setQuoteDrawMode);
  const undoQuoteFencePoint = useConfiguratorStore((s) => s.undoQuoteFencePoint);
  const removeQuoteFencePointAt = useConfiguratorStore(
    (s) => s.removeQuoteFencePointAt,
  );
  const clearQuoteFence = useConfiguratorStore((s) => s.clearQuoteFence);
  const closeQuoteFence = useConfiguratorStore((s) => s.closeQuoteFence);
  const applyQuoteToPreview = useConfiguratorStore((s) => s.applyQuoteToPreview);

  const openingPositionLabels = {
    left: "lewa sekcja",
    center: "środkowa sekcja",
    right: "prawa sekcja",
  } as const;

  const quote = useMemo(
    () =>
      calculateQuote({
        catalog,
        selection,
        pricing,
        perimeterM: quotePerimeterM,
        fenceEnabled: scope.fence,
        bramaEnabled,
        bramaElementId,
        bramaOccupiedSpanM,
        furtkaEnabled,
        furtkaElementId,
        furtkaPositionLabel: openingPositionLabels[furtkaPosition],
        fallbackPanelCount: previewPanelCount,
      }),
    [
      catalog,
      selection,
      pricing,
      quotePerimeterM,
      scope.fence,
      bramaEnabled,
      bramaElementId,
      bramaOccupiedSpanM,
      furtkaEnabled,
      furtkaElementId,
      furtkaPosition,
      previewPanelCount,
    ],
  );

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const error = validateBackgroundFile(file);
    if (error) {
      alert(error);
      return;
    }
    if (!ACCEPTED_BG_TYPES.includes(file.type) || file.size > MAX_BG_SIZE) {
      return;
    }
    setQuotePlanImage(URL.createObjectURL(file));
  }

  const canCloseFence =
    quoteFencePoints.length >= 3 && !quoteFenceClosed && quotePxPerMeter;

  const previewPanelsFromQuote = Math.min(
    quote.estimatedPanels,
    MAX_PREVIEW_PANELS,
  );

  const calibrationStatus: StepStatus = quotePxPerMeter
    ? { label: "Skala OK", tone: "done" }
    : quoteDrawMode === "calibrate"
      ? { label: "Zaznaczasz", tone: "active" }
      : { label: "Do zrobienia", tone: "idle" };

  const fenceStatus: StepStatus = quoteFenceClosed
    ? { label: "Zamknięty", tone: "done" }
    : quoteFencePoints.length > 0
      ? { label: `${quoteFencePoints.length} pkt`, tone: "active" }
      : { label: "Do zrobienia", tone: "idle" };

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl bg-[#e30311] px-4 py-3.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">
          Wycena na rzucie
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-white/85">
          Wgraj plan działki, ustaw skalę i obrysuj teren — cena policzy się
          automatycznie.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1">
          {["Rzut", "Skala", "Obrys", "Cena"].map((label, i) => (
            <span
              key={label}
              className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/95"
            >
              {i + 1}. {label}
            </span>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Rzut działki</SectionLabel>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "group flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors",
            quotePlanImageUrl
              ? "border-[#3a3a36] bg-[#222] text-[#ccc] hover:border-[#555] hover:bg-[#2a2a28]"
              : "border-dashed border-[#e30311]/60 bg-[#2a0e10]/40 text-white hover:bg-[#2a0e10]",
          )}
        >
          <ImagePlus className="h-4 w-4 text-[#e30311]" />
          {quotePlanImageUrl ? "Zmień rzut" : "Prześlij rzut"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {quotePlanImageUrl && (
        <>
          <div>
            <StepHeader index={1} title="Kalibracja skali" status={calibrationStatus} />
            <div className={cn(CARD_CLASS, "space-y-3")}>
              <p className="text-[11px] leading-relaxed text-[#9a9a95]">
                Kliknij 2 punkty na znanym odcinku (np. bok działki 20 m), a potem
                wpisz jego długość w metrach.
              </p>
              <button
                type="button"
                onClick={() => setQuoteDrawMode("calibrate")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  quoteDrawMode === "calibrate"
                    ? "border-[#e30311] bg-[#2a0e10]"
                    : "border-[#3a3a36] hover:border-[#555] hover:bg-[#222]",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                    quoteDrawMode === "calibrate"
                      ? "bg-[#e30311] text-white"
                      : "bg-[#161614] text-[#888]",
                  )}
                >
                  <Ruler className="h-4 w-4" />
                </span>
                <span className="flex flex-col">
                  <span
                    className={cn(
                      "text-xs font-bold",
                      quoteDrawMode === "calibrate" ? "text-white" : "text-[#bbb]",
                    )}
                  >
                    Narysuj linię skali
                  </span>
                  <span className="text-[10px] text-[#777]">
                    2 kliknięcia na rzucie
                  </span>
                </span>
              </button>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#777]">
                  Długość linii odniesienia
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={quoteCalibrationLengthM}
                    onChange={(e) =>
                      setQuoteCalibrationLengthM(Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-[#3a3a36] bg-[#161614] px-3 py-2.5 pr-10 text-sm font-semibold text-white outline-none transition-colors focus:border-[#e30311]"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#666]">
                    m
                  </span>
                </div>
              </div>

              {quotePxPerMeter ? (
                <div className="flex items-center gap-3 rounded-lg border border-[#1f7a4a]/40 bg-[#0e2a1a] px-3 py-2.5">
                  <Gauge className="h-5 w-5 shrink-0 text-[#4ade80]" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#4ade80]/70">
                      Skala ustawiona
                    </p>
                    <p className="text-sm font-bold text-white">
                      {quotePxPerMeter.toFixed(1)}{" "}
                      <span className="text-[11px] font-medium text-[#888]">
                        px / metr
                      </span>
                    </p>
                  </div>
                  <span className="ml-auto shrink-0 rounded-md bg-[#1f7a4a]/25 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#4ade80]">
                    Obrys aktywny
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-[#3a3a36] bg-[#161614] px-3 py-2.5 text-[11px] text-[#888]">
                  <span className="flex h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#e30311]" />
                  {quoteCalibrationLine
                    ? "Wpisz długość linii w metrach powyżej"
                    : "Kliknij 2 punkty na rzucie, aby wyznaczyć skalę"}
                </div>
              )}
            </div>
          </div>

          <div>
            <StepHeader index={2} title="Obrys ogrodzenia" status={fenceStatus} />
            <div className={cn(CARD_CLASS, "space-y-3")}>
              <p className="text-[11px] leading-relaxed text-[#9a9a95]">
                Klikaj kolejne narożniki działki (min. 3) — tam ma przebiegać płot.
                Kliknij × na kropce lub w liście poniżej, aby usunąć punkt.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!quotePxPerMeter}
                  onClick={() => setQuoteDrawMode("fence")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-colors disabled:opacity-40",
                    quoteDrawMode === "fence"
                      ? "border-[#e30311] bg-[#2a0e10] text-white"
                      : "border-[#3a3a36] text-[#aaa] hover:border-[#555] hover:bg-[#222]",
                  )}
                >
                  <PencilLine className="h-4 w-4" />
                  Rysuj obrys
                </button>
                <button
                  type="button"
                  disabled={quoteFencePoints.length === 0}
                  onClick={undoQuoteFencePoint}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#3a3a36] text-[#aaa] transition-colors hover:border-[#555] hover:text-white disabled:opacity-40 disabled:hover:border-[#3a3a36]"
                  title="Cofnij punkt"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={quoteFencePoints.length === 0}
                  onClick={clearQuoteFence}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#3a3a36] text-[#aaa] transition-colors hover:border-[#e30311] hover:text-[#e30311] disabled:opacity-40 disabled:hover:border-[#3a3a36] disabled:hover:text-[#aaa]"
                  title="Wyczyść obrys"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {quoteFencePoints.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#666]">
                    Punkty obrysu
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {quoteFencePoints.map((_, index) => (
                      <button
                        key={`point-${index}`}
                        type="button"
                        onClick={() => removeQuoteFencePointAt(index)}
                        className="flex items-center gap-1 rounded-md border border-[#3a3a36] bg-[#161614] px-2 py-1 text-[11px] font-semibold text-[#ccc] transition-colors hover:border-[#e30311] hover:text-white"
                        title={`Usuń punkt ${index + 1}`}
                      >
                        <span>{index + 1}</span>
                        <X className="h-3 w-3 text-[#e30311]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {canCloseFence && (
                <button
                  type="button"
                  onClick={closeQuoteFence}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e30311] py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#c9020f]"
                >
                  <Check className="h-4 w-4" />
                  Zamknij obrys
                </button>
              )}
              {quoteFenceClosed && quotePerimeterM && (
                <div className="flex items-center gap-3 rounded-lg border border-[#e30311]/30 bg-[#2a0e10] px-3 py-3">
                  <Spline className="h-5 w-5 shrink-0 text-[#e30311]" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#888]">
                      Obwód działki
                    </p>
                    <p className="font-heading text-lg font-bold leading-none text-white">
                      {quotePerimeterM.toFixed(1)}{" "}
                      <span className="text-xs font-medium text-[#888]">
                        m bież.
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div>
        <SectionLabel>Wybrana konfiguracja</SectionLabel>
        <div className="mb-4 space-y-2 rounded-lg border border-[#333] bg-[#222] p-4">
          {quote.configurationItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="text-[#888]">{item.label}</span>
              <span className="text-right font-semibold text-white">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Kalkulacja</SectionLabel>
        <div className="space-y-2 rounded-lg border border-[#333] bg-[#222] p-4">
          <div className="flex justify-between text-xs">
            <span className="text-[#888]">Długość bieżąca</span>
            <span className="font-semibold text-white">
              {quote.perimeterM.toFixed(1)} m
              {!quote.hasMeasuredPerimeter && (
                <span className="ml-1 text-[#666]">(szacunek)</span>
              )}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#888]">Szac. liczba paneli</span>
            <span className="text-right font-semibold text-white">
              {quote.estimatedPanels} szt.
            </span>
          </div>
          {quote.estimatedPanels > MAX_PREVIEW_PANELS && (
            <p className="text-[10px] leading-relaxed text-[#888]">
              Podgląd pokazuje max {MAX_PREVIEW_PANELS} paneli (obecnie:{" "}
              {previewPanelsFromQuote}).
            </p>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-[#888]">Stawka za metr</span>
            <span className="font-semibold text-white">
              {quote.pricePerMeterNet.toLocaleString("pl-PL")} PLN/m
            </span>
          </div>
          <div className="my-2 border-t border-[#333]" />
          {quote.breakdown.map((row, index) => (
            <div
              key={`${row.label}-${index}`}
              className="flex justify-between gap-2 text-[11px]"
            >
              <span className="text-[#888]">
                {row.label}
                {row.value ? (
                  <span className="block text-[10px] text-[#555]">{row.value}</span>
                ) : null}
              </span>
              {row.amount > 0 && (
                <span className="shrink-0 font-semibold text-white">
                  {Math.round(row.amount).toLocaleString("pl-PL")} PLN
                </span>
              )}
            </div>
          ))}
          <div className="mt-2 flex items-baseline justify-between border-t border-[#333] pt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#666]">
              Razem netto
            </span>
            <span className="font-heading text-xl font-bold text-[#e30311]">
              {Math.round(quote.totalNet).toLocaleString("pl-PL")}{" "}
              <span className="text-sm text-[#888]">{quote.currency}</span>
            </span>
          </div>
        </div>
      </div>

      {quoteFenceClosed && quotePerimeterM && (
        <button
          type="button"
          onClick={applyQuoteToPreview}
          className="w-full rounded-lg border border-[#e30311]/40 bg-[#2a0e10] py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#3a1012]"
        >
          Zastosuj do podglądu ({previewPanelsFromQuote} paneli)
        </button>
      )}
    </div>
  );
}
