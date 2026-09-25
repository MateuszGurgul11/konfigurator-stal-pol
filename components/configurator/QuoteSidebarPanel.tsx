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
  ArrowLeft,
  Map,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateQuote, formatQuotePanelsBreakdown } from "@/lib/pricing/calculateQuote";
import {
  ACCEPTED_BG_TYPES,
  MAX_BG_SIZE,
  validateBackgroundFile,
} from "@/lib/configurator/backgrounds";
import {
  MAX_MANUAL_QUOTE_SIDES,
  MAX_PREVIEW_PANELS,
  resolveQuotePerimeterM,
  sideLengthLabel,
  clampWicketInsertAfter,
  formatWicketInsertAfterLabel,
  getWicketLayoutPanelCount,
  useConfiguratorStore,
} from "@/lib/configurator/state";
import type { CatalogCollections, ConfiguratorSelection, Height } from "@/lib/types";
import { DecimalInput } from "./DecimalInput";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#d6d6d2]">
      {children}
    </p>
  );
}

function formatHeightMultiplier(value?: number): string {
  if (value == null || value === 1) return "×1,00";
  return `×${value.toFixed(2)}`;
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
    idle: "border-[#3a3a36] bg-[#1f1f1d] text-[#e4e4e0]",
    active: "border-[#e30311]/50 bg-[#2a0e10] text-[#ff8a90]",
    done: "border-[#1f7a4a]/60 bg-[#0e2a1a] text-[#4ade80]",
  };
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white transition-shadow",
            status?.tone === "done"
              ? "bg-[#1f7a4a] shadow-[0_0_0_3px_rgba(31,122,74,0.18)]"
              : "bg-[#e30311] shadow-[0_0_0_3px_rgba(227,3,17,0.16)]",
          )}
        >
          {status?.tone === "done" ? <Check className="h-3.5 w-3.5" /> : index}
        </span>
        <span className="text-[14px] font-bold uppercase tracking-wide text-white">
          {title}
        </span>
      </div>
      {status && (
        <span
          className={cn(
            "flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wide",
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

function ScopeCard({
  selected,
  title,
  subtitle,
  onClick,
}: {
  selected: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-0 w-full flex-col items-start gap-1 rounded-lg border px-3 py-3 text-left transition-all",
        selected
          ? "border-[#e30311] bg-[#2a0e10]"
          : "border-[#333] bg-[#222] hover:border-[#444] hover:bg-[#282828]",
      )}
    >
      <div className="flex w-full items-center gap-2">
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
            selected
              ? "border-[#e30311] bg-[#e30311]"
              : "border-[#555] bg-transparent",
          )}
        >
          {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </div>
        <span className="min-w-0 text-[14px] font-bold leading-snug text-white">
          {title}
        </span>
      </div>
      <span className="min-w-0 pl-7 text-[14px] leading-relaxed break-words text-[#e8e8e4]">
        {subtitle}
      </span>
    </button>
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
  const manualQuotePerimeterM = useConfiguratorStore((s) => s.manualQuotePerimeterM);
  const manualQuoteSides = useConfiguratorStore((s) => s.manualQuoteSides);
  const quoteFenceScope = useConfiguratorStore((s) => s.quoteFenceScope);
  const manualQuoteFrontLengthM = useConfiguratorStore(
    (s) => s.manualQuoteFrontLengthM,
  );
  const quoteAdvancedView = useConfiguratorStore((s) => s.quoteAdvancedView);
  const scope = useConfiguratorStore((s) => s.scope);
  const bramaEnabled = useConfiguratorStore((s) => s.bramaEnabled);
  const bramaElementId = useConfiguratorStore((s) => s.bramaElementId);
  const bramaOccupiedSpanM = useConfiguratorStore((s) => s.bramaOccupiedSpanM);
  const furtkaEnabled = useConfiguratorStore((s) => s.furtkaEnabled);
  const furtkaElementId = useConfiguratorStore((s) => s.furtkaElementId);
  const furtkaInsertAfter = useConfiguratorStore((s) => s.furtkaInsertAfter);
  const previewPanelCount = useConfiguratorStore((s) => s.previewPanelCount);
  const footingEnabled = useConfiguratorStore((s) => s.footingEnabled);
  const footingHeightId = useConfiguratorStore((s) => s.footingHeightId);
  const footingMaterialId = useConfiguratorStore((s) => s.footingMaterialId);
  const pricing = useConfiguratorStore((s) => s.pricing);

  const setQuotePlanImage = useConfiguratorStore((s) => s.setQuotePlanImage);
  const setQuoteCalibrationLengthM = useConfiguratorStore(
    (s) => s.setQuoteCalibrationLengthM,
  );
  const confirmQuoteCalibration = useConfiguratorStore(
    (s) => s.confirmQuoteCalibration,
  );
  const setQuoteDrawMode = useConfiguratorStore((s) => s.setQuoteDrawMode);
  const setManualQuoteSideLength = useConfiguratorStore(
    (s) => s.setManualQuoteSideLength,
  );
  const addManualQuoteSide = useConfiguratorStore((s) => s.addManualQuoteSide);
  const removeManualQuoteSide = useConfiguratorStore(
    (s) => s.removeManualQuoteSide,
  );
  const setQuoteFenceScope = useConfiguratorStore((s) => s.setQuoteFenceScope);
  const setManualQuoteFrontLengthM = useConfiguratorStore(
    (s) => s.setManualQuoteFrontLengthM,
  );
  const setQuoteAdvancedView = useConfiguratorStore((s) => s.setQuoteAdvancedView);
  const undoQuoteFencePoint = useConfiguratorStore((s) => s.undoQuoteFencePoint);
  const removeQuoteFencePointAt = useConfiguratorStore(
    (s) => s.removeQuoteFencePointAt,
  );
  const clearQuoteFence = useConfiguratorStore((s) => s.clearQuoteFence);
  const closeQuoteFence = useConfiguratorStore((s) => s.closeQuoteFence);
  const applyQuoteToPreview = useConfiguratorStore((s) => s.applyQuoteToPreview);
  const setSelection = useConfiguratorStore((s) => s.setSelection);

  const furtkaPositionLabel = formatWicketInsertAfterLabel(
    clampWicketInsertAfter(
      furtkaInsertAfter,
      previewPanelCount,
      Boolean(bramaElementId),
    ),
    getWicketLayoutPanelCount(previewPanelCount, Boolean(bramaElementId)),
  );

  const effectivePerimeterM = useMemo(
    () =>
      resolveQuotePerimeterM({
        quoteFenceClosed,
        quotePerimeterM,
        quoteFenceScope,
        manualQuotePerimeterM,
        manualQuoteFrontLengthM,
      }),
    [
      quoteFenceClosed,
      quotePerimeterM,
      quoteFenceScope,
      manualQuotePerimeterM,
      manualQuoteFrontLengthM,
    ],
  );

  const quote = useMemo(
    () =>
      calculateQuote({
        catalog,
        selection,
        pricing,
        perimeterM: effectivePerimeterM,
        fenceEnabled: scope.fence,
        bramaEnabled,
        bramaElementId,
        bramaOccupiedSpanM,
        furtkaEnabled,
        furtkaElementId,
        furtkaPositionLabel,
        footingEnabled,
        footingHeightId,
        footingMaterialId,
        fallbackPanelCount: previewPanelCount,
      }),
    [
      catalog,
      selection,
      pricing,
      effectivePerimeterM,
      scope.fence,
      bramaEnabled,
      bramaElementId,
      bramaOccupiedSpanM,
      furtkaEnabled,
      furtkaElementId,
      furtkaPositionLabel,
      footingEnabled,
      footingHeightId,
      footingMaterialId,
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

  const canApplyToPreview =
    scope.fence && effectivePerimeterM != null && effectivePerimeterM > 0;

  const scaleAccepted = Boolean(quotePxPerMeter && !quoteCalibrationLine);

  const calibrationStatus: StepStatus = scaleAccepted
    ? { label: "Skala OK", tone: "done" }
    : quoteCalibrationLine
      ? { label: "Do akceptacji", tone: "active" }
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
      {scope.fence && (
        <div>
          <SectionLabel>Wysokość ogrodzenia</SectionLabel>
          <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
            {catalog.heights.map((height: Height) => (
              <button
                key={height.id}
                type="button"
                onClick={() => setSelection({ heightId: height.id })}
                className={cn(
                  "rounded-lg border px-3 py-3 text-center transition-all",
                  selection.heightId === height.id
                    ? "border-[#e30311] bg-[#2a0e10] text-white"
                    : "border-[#333] bg-[#222] text-[#e8e8e4] hover:border-[#444]",
                )}
              >
                <span className="block font-sans text-base font-semibold tabular-nums tracking-tight">
                  {height.label}
                </span>
                <span className="mt-0.5 block text-[14px] text-[#e8e8e4]">
                  {formatHeightMultiplier(height.priceMultiplier)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {quoteAdvancedView ? (
        <button
          type="button"
          onClick={() => setQuoteAdvancedView(false)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#3a3a36] bg-[#222] py-2.5 text-[14px] font-bold uppercase tracking-[0.12em] text-[#f6f6f4] transition-colors hover:border-[#555] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Wróć do prostego widoku
        </button>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl bg-[#222] px-4 py-3.5 ring-1 ring-[#333]">
            <p className="text-[14px] font-bold uppercase tracking-[0.08em] text-[#e30311]">
              Wycena orientacyjna
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-[#eeeeea]">
              Wybierz zakres i podaj wymiar — policzymy liczbę paneli i cenę
              netto. W podglądzie po prawej zobaczysz ogrodzenie.
            </p>
          </div>

          {scope.fence && (
            <>
              <div>
                <SectionLabel>Co chcesz wycenić?</SectionLabel>
                <div className="grid min-w-0 grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                  <ScopeCard
                    selected={quoteFenceScope === "full-perimeter"}
                    title="A · Całe ogrodzenie"
                    subtitle="Obwód całej działki"
                    onClick={() => setQuoteFenceScope("full-perimeter")}
                  />
                  <ScopeCard
                    selected={quoteFenceScope === "front-only"}
                    title="B · Tylko front"
                    subtitle="Jeden bok przy ulicy"
                    onClick={() => setQuoteFenceScope("front-only")}
                  />
                </div>
              </div>

              {quoteFenceScope === "full-perimeter" ? (
                <div>
                  <SectionLabel>Długości boków działki</SectionLabel>
                  <div className={cn(CARD_CLASS, "space-y-3")}>
                    <p className="text-[14px] leading-relaxed text-[#eeeeea]">
                      Wpisz długość każdego boku (A + B + C…). Obwód to suma
                      wszystkich boków.
                    </p>
                    <div className="space-y-2">
                      {manualQuoteSides.map((side, index) => {
                        const label = sideLengthLabel(index);
                        return (
                          <div
                            key={side.id}
                            className="flex items-center gap-2"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#3a3a36] bg-[#161614] text-xs font-bold text-[#f6f6f4]">
                              {label}
                            </span>
                            <div className="min-w-0 flex-1">
                              <DecimalInput
                                value={side.lengthM}
                                min={0}
                                aria-label={`Długość boku ${label}`}
                                onChange={(value) =>
                                  setManualQuoteSideLength(side.id, value)
                                }
                                suffix={
                                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#d6d6d2]">
                                    m
                                  </span>
                                }
                              />
                            </div>
                            {manualQuoteSides.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeManualQuoteSide(side.id)}
                                aria-label={`Usuń bok ${label}`}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#3a3a36] text-[#e8e8e4] transition-colors hover:border-[#e30311]/50 hover:bg-[#2a0e10] hover:text-[#ff8a90]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {manualQuoteSides.length < MAX_MANUAL_QUOTE_SIDES && (
                      <button
                        type="button"
                        onClick={addManualQuoteSide}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#555] bg-[#1a1a18] py-2.5 text-[14px] font-bold uppercase tracking-[0.1em] text-[#f6f6f4] transition-colors hover:border-[#e30311]/60 hover:bg-[#2a0e10] hover:text-white"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Dodaj kolejny bok
                      </button>
                    )}
                    <div className="flex items-center justify-between rounded-lg border border-[#3a3a36] bg-[#161614] px-3 py-2.5 text-sm">
                      <span className="text-[#e8e8e4]">
                        Suma{" "}
                        {manualQuoteSides.length > 1
                          ? `(${manualQuoteSides
                              .map((_, i) => sideLengthLabel(i))
                              .join(" + ")})`
                          : ""}
                      </span>
                      <span className="font-semibold text-white">
                        {manualQuotePerimeterM.toFixed(1)} m bież.
                      </span>
                    </div>
                    {quoteFenceClosed && quotePerimeterM && (
                      <p className="text-[14px] leading-relaxed text-[#e8e8e4]">
                        Na rzucie zmierzono{" "}
                        <strong className="text-[#f6f6f4]">
                          {quotePerimeterM.toFixed(1)} m
                        </strong>{" "}
                        — ta wartość ma pierwszeństwo w kalkulacji.
                      </p>
                    )}
                    <div className="flex items-start justify-between gap-3 rounded-lg border border-[#3a3a36] bg-[#161614] px-3 py-2.5 text-sm">
                      <span className="shrink-0 text-[#e8e8e4]">Szac. panele</span>
                      <span className="text-right font-semibold leading-snug text-white">
                        {formatQuotePanelsBreakdown(quote)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <SectionLabel>Długość frontu przy ulicy</SectionLabel>
                  <div className={cn(CARD_CLASS, "space-y-3")}>
                    <p className="text-[14px] leading-relaxed text-[#eeeeea]">
                      Szerokość działki od jednej granicy do drugiej przy
                      drodze.
                    </p>
                    <DecimalInput
                      value={manualQuoteFrontLengthM}
                      onChange={setManualQuoteFrontLengthM}
                      suffix={
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#d6d6d2]">
                          m
                        </span>
                      }
                    />
                    <div className="flex items-start justify-between gap-3 rounded-lg border border-[#3a3a36] bg-[#161614] px-3 py-2.5 text-sm">
                      <span className="shrink-0 text-[#e8e8e4]">Szac. panele</span>
                      <span className="text-right font-semibold leading-snug text-white">
                        {formatQuotePanelsBreakdown(quote)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {quoteAdvancedView && (
        <>
          <div className="overflow-hidden rounded-xl bg-[#e30311] px-4 py-3.5">
            <p className="text-[14px] font-bold uppercase tracking-[0.08em] text-white">
              Wycena na rzucie
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-white/85">
              Wgraj plan działki, ustaw skalę i obrysuj teren — cena policzy się
              automatycznie.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {["Rzut", "Skala", "Obrys", "Cena"].map((label, i) => (
                <span
                  key={label}
                  className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white/95"
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
                  ? "border-[#3a3a36] bg-[#222] text-[#f6f6f4] hover:border-[#555] hover:bg-[#2a2a28]"
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
                <StepHeader
                  index={1}
                  title="Kalibracja skali"
                  status={calibrationStatus}
                />
                <div className={cn(CARD_CLASS, "space-y-3")}>
                  <p className="text-[14px] leading-relaxed text-[#eeeeea]">
                    Kliknij 2 punkty na znanym odcinku (np. bok działki 20 m), a
                    potem wpisz jego długość w metrach.
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
                          : "bg-[#161614] text-[#e8e8e4]",
                      )}
                    >
                      <Ruler className="h-4 w-4" />
                    </span>
                    <span className="flex flex-col">
                      <span
                        className={cn(
                          "text-sm font-bold",
                          quoteDrawMode === "calibrate"
                            ? "text-white"
                            : "text-[#f4f4f0]",
                        )}
                      >
                        Narysuj linię skali
                      </span>
                      <span className="text-[14px] text-[#e0e0dc]">
                        2 kliknięcia na rzucie
                      </span>
                    </span>
                  </button>

                  <div>
                    <label className="mb-1.5 block text-[14px] font-bold uppercase tracking-wider text-[#e0e0dc]">
                      Długość linii odniesienia
                    </label>
                    <DecimalInput
                      value={quoteCalibrationLengthM}
                      onChange={setQuoteCalibrationLengthM}
                      suffix={
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#d6d6d2]">
                          m
                        </span>
                      }
                    />
                  </div>

                  <button
                    type="button"
                    disabled={
                      !quoteCalibrationLine ||
                      quoteCalibrationLengthM <= 0 ||
                      !quotePxPerMeter
                    }
                    onClick={() => confirmQuoteCalibration()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e30311] px-3 py-2.5 text-[14px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#c9020f] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#e30311]"
                  >
                    Zaakceptuj kalibrację
                  </button>

                  {scaleAccepted ? (
                    <div className="flex items-center gap-3 rounded-lg border border-[#1f7a4a]/40 bg-[#0e2a1a] px-3 py-2.5">
                      <Gauge className="h-5 w-5 shrink-0 text-[#4ade80]" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#4ade80]">
                          Skala ustawiona — rysuj obrys
                        </p>
                        <p className="text-sm font-bold text-white">
                          {quotePxPerMeter!.toFixed(1)}{" "}
                          <span className="text-[14px] font-medium text-[#e8e8e4]">
                            px / metr
                          </span>
                        </p>
                      </div>
                      <span className="ml-auto shrink-0 rounded-md bg-[#1f7a4a]/25 px-2 py-1 text-xs font-bold uppercase tracking-wide text-[#4ade80]">
                        Obrys aktywny
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-[#3a3a36] bg-[#161614] px-3 py-2.5 text-[14px] text-[#e8e8e4]">
                      <span className="flex h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#e30311]" />
                      {quoteCalibrationLine
                        ? "Wpisz długość i zaakceptuj"
                        : "Kliknij 2 punkty na rzucie, aby wyznaczyć skalę"}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <StepHeader
                  index={2}
                  title="Obrys ogrodzenia"
                  status={fenceStatus}
                />
                <div className={cn(CARD_CLASS, "space-y-3")}>
                  <p className="text-[14px] leading-relaxed text-[#eeeeea]">
                    Klikaj kolejne narożniki działki (min. 3) — tam ma przebiegać
                    płot. Kliknij × na kropce lub w liście poniżej, aby usunąć
                    punkt.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!scaleAccepted}
                      onClick={() => setQuoteDrawMode("fence")}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-[14px] font-bold uppercase tracking-wide transition-colors disabled:opacity-40",
                        quoteDrawMode === "fence"
                          ? "border-[#e30311] bg-[#2a0e10] text-white"
                          : "border-[#3a3a36] text-[#f0f0ec] hover:border-[#555] hover:bg-[#222]",
                      )}
                    >
                      <PencilLine className="h-4 w-4" />
                      Rysuj obrys
                    </button>
                    <button
                      type="button"
                      disabled={quoteFencePoints.length === 0}
                      onClick={undoQuoteFencePoint}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#3a3a36] text-[#f0f0ec] transition-colors hover:border-[#555] hover:text-white disabled:opacity-40 disabled:hover:border-[#3a3a36]"
                      title="Cofnij punkt"
                    >
                      <Undo2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={quoteFencePoints.length === 0}
                      onClick={clearQuoteFence}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#3a3a36] text-[#f0f0ec] transition-colors hover:border-[#e30311] hover:text-[#e30311] disabled:opacity-40 disabled:hover:border-[#3a3a36] disabled:hover:text-[#f0f0ec]"
                      title="Wyczyść obrys"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {quoteFencePoints.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[14px] font-bold uppercase tracking-wider text-[#d6d6d2]">
                        Punkty obrysu
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {quoteFencePoints.map((_, index) => (
                          <button
                            key={`point-${index}`}
                            type="button"
                            onClick={() => removeQuoteFencePointAt(index)}
                            className="flex items-center gap-1 rounded-md border border-[#3a3a36] bg-[#161614] px-2 py-1 text-[14px] font-semibold text-[#f6f6f4] transition-colors hover:border-[#e30311] hover:text-white"
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
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e30311] py-2.5 text-[14px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#c9020f]"
                    >
                      <Check className="h-4 w-4" />
                      Zamknij obrys
                    </button>
                  )}
                  {quoteFenceClosed && quotePerimeterM && (
                    <div className="flex items-center gap-3 rounded-lg border border-[#e30311]/30 bg-[#2a0e10] px-3 py-3">
                      <Spline className="h-5 w-5 shrink-0 text-[#e30311]" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#e8e8e4]">
                          Obwód działki
                        </p>
                        <p className="font-sans text-base font-semibold tabular-nums leading-none tracking-tight text-white">
                          {quotePerimeterM.toFixed(1)}{" "}
                          <span className="text-xs font-medium text-[#e8e8e4]">
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
        </>
      )}

      {canApplyToPreview && (
        <button
          type="button"
          onClick={applyQuoteToPreview}
          className="w-full rounded-lg border border-[#e30311]/40 bg-[#2a0e10] py-3 text-[14px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#3a1012]"
        >
          Zastosuj do podglądu ({previewPanelsFromQuote} paneli)
        </button>
      )}

      {!quoteAdvancedView && (
        <button
          type="button"
          onClick={() => setQuoteAdvancedView(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#3a3a36] bg-[#161614] py-3 text-[14px] font-bold uppercase tracking-[0.12em] text-[#f6f6f4] transition-colors hover:border-[#555] hover:text-white"
        >
          <Map className="h-4 w-4 text-[#e30311]" />
          Zaawansowany widok
        </button>
      )}
    </div>
  );
}
