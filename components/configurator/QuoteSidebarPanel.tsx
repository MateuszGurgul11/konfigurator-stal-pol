"use client";

import { useMemo, useRef } from "react";
import { ImagePlus, Undo2, Trash2, Check, X } from "lucide-react";
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

  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-[#e30311] px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white">
          Wycena na rzucie
        </p>
        <p className="mt-1 text-[11px] text-white/85">
          1. Wgraj plan działki · 2. Ustaw skalę (2 kliknięcia) · 3. Zaznacz obwód
          działki · 4. Zamknij obrys i sprawdź cenę
        </p>
      </div>

      <div>
        <SectionLabel>Rzut działki</SectionLabel>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#555] bg-white px-4 py-3 text-sm font-semibold text-[#303638] transition-colors hover:bg-[#f5f5f5]"
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
            <SectionLabel>Kalibracja skali</SectionLabel>
            <div className="space-y-3 rounded-lg border border-[#333] bg-[#222] p-4">
              <p className="text-[11px] leading-relaxed text-[#888]">
                Kliknij 2 punkty na znanej linii (np. bok działki 20 m), potem wpisz
                jej długość w metrach.
              </p>
              <button
                type="button"
                onClick={() => setQuoteDrawMode("calibrate")}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-xs font-semibold",
                  quoteDrawMode === "calibrate"
                    ? "border-[#e30311] bg-[#2a0e10] text-white"
                    : "border-[#444] text-[#aaa]",
                )}
              >
                Tryb: kalibracja skali
              </button>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666]">
                Długość linii odniesienia (m)
              </label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={quoteCalibrationLengthM}
                onChange={(e) =>
                  setQuoteCalibrationLengthM(Number(e.target.value))
                }
                className="w-full rounded-lg border border-[#444] bg-[#1A1A18] px-3 py-2 text-sm text-white"
              />
              {quotePxPerMeter ? (
                <p className="text-xs font-semibold text-[#4ade80]">
                  Skala ustawiona ({quotePxPerMeter.toFixed(1)} px/m) — tryb
                  obrysu aktywny
                </p>
              ) : (
                <p className="text-xs text-[#666]">
                  {quoteCalibrationLine
                    ? "Wpisz długość linii w metrach"
                    : "Kliknij 2 punkty na rzucie"}
                </p>
              )}
            </div>
          </div>

          <div>
            <SectionLabel>Obrys ogrodzenia</SectionLabel>
            <div className="space-y-2 rounded-lg border border-[#333] bg-[#222] p-4">
              <p className="text-[11px] leading-relaxed text-[#888]">
                Klikaj kolejne punkty na obwodzie działki — tam ma przebiegać płot
                (min. 3). Kliknij × na kropce lub w liście poniżej, aby usunąć punkt.
              </p>
              <p className="text-[10px] leading-relaxed text-[#666]">
                Po zaznaczeniu wszystkich narożników kliknij Zamknij obrys.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!quotePxPerMeter}
                  onClick={() => setQuoteDrawMode("fence")}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-2 text-[10px] font-bold uppercase tracking-wide disabled:opacity-40",
                    quoteDrawMode === "fence"
                      ? "border-[#e30311] bg-[#2a0e10] text-white"
                      : "border-[#444] text-[#aaa]",
                  )}
                >
                  Rysuj obrys
                </button>
                <button
                  type="button"
                  disabled={quoteFencePoints.length === 0}
                  onClick={undoQuoteFencePoint}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#444] text-[#aaa] disabled:opacity-40"
                  title="Cofnij punkt"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={quoteFencePoints.length === 0}
                  onClick={clearQuoteFence}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#444] text-[#aaa] disabled:opacity-40"
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
                        className="flex items-center gap-1 rounded-md border border-[#444] bg-[#1A1A18] px-2 py-1 text-[11px] font-semibold text-[#ccc] transition-colors hover:border-[#e30311] hover:text-white"
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
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e30311] py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white"
                >
                  <Check className="h-4 w-4" />
                  Zamknij obrys
                </button>
              )}
              {quoteFenceClosed && quotePerimeterM && (
                <p className="text-sm font-bold text-white">
                  Obwód: {quotePerimeterM.toFixed(1)} m bieżących
                </p>
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
