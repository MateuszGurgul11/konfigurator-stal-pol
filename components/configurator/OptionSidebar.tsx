"use client";

import { useMemo, useRef, useState } from "react";
import { Check, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CatalogCollections,
  ConfiguratorSelection,
  Color,
  FootingHeight,
  FootingMaterial,
  Height,
  Panel,
  Post,
  SpacerOption,
} from "@/lib/types";
import {
  type ConfiguratorTab,
  type WicketHingeSide,
  clampWicketInsertAfter,
  formatWicketInsertAfterLabel,
  getNextConfiguratorTab,
  getWicketLayoutPanelCount,
  MAX_PREVIEW_PANELS,
  MIN_PREVIEW_PANELS,
  resolveQuotePerimeterM,
  useConfiguratorStore,
} from "@/lib/configurator/state";
import { ConfiguratorTabs } from "./ConfiguratorTabs";
import { BackgroundPicker } from "./BackgroundPicker";
import { QuoteSidebarPanel } from "./QuoteSidebarPanel";
import { PdfDocument } from "./PdfDocument";
import { calculateQuote } from "@/lib/pricing/calculateQuote";
import { generateConfiguratorPdf } from "@/lib/pdf/generateConfiguratorPdf";
import { resolveSurchargePerPanel } from "@/lib/pricing/surcharges";
import { resolvePanelWidthCm } from "@/lib/pricing/variant-prices";
import {
  formatElementPriceSubtitle,
  pickBramaElementForPattern,
  pickFurtkaElementForPattern,
  resolveDrivewayGateKind,
  resolveElement,
  resolveFencePatternId,
} from "@/lib/pricing/element-prices";
import type { DrivewayGateKind, OpeningInfillPatternId } from "@/lib/types";

type Props = {
  catalog: CatalogCollections;
  selection: ConfiguratorSelection;
  activeTab: ConfiguratorTab;
  onSelect: (partial: Partial<ConfiguratorSelection>) => void;
  onTabChange: (tab: ConfiguratorTab) => void;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d6d6d2]">
      {children}
    </p>
  );
}

function ModelCard({
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
        "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all",
        selected
          ? "border-[#e30311] bg-[#2a0e10]"
          : "border-[#333] bg-[#222] hover:border-[#444] hover:bg-[#282828]",
      )}
    >
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
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold",
            selected ? "text-white" : "text-[#f6f6f4]",
          )}
        >
          {title}
        </p>
        <p className="text-[11px] text-[#d6d6d2]">{subtitle}</p>
      </div>
    </button>
  );
}

function formatSurchargePerPanel(
  perPanel?: number,
  perMeter?: number,
  panelWidthCm = 250,
): string {
  const amount = resolveSurchargePerPanel(perPanel, perMeter, panelWidthCm);
  if (amount === 0) return "w cenie bazowej";
  return `+${amount} PLN/panel`;
}

function formatHeightMultiplier(value?: number): string {
  if (value == null || value === 1) return "×1,00";
  return `×${value.toFixed(2)}`;
}

function OpeningInsertAfterPicker({
  label,
  hint,
  insertAfter,
  panelCount,
  drivewayGateEnabled,
  onChange,
}: {
  label: string;
  hint: string;
  insertAfter: number;
  panelCount: number;
  drivewayGateEnabled: boolean;
  onChange: (insertAfter: number) => void;
}) {
  const layoutPanelCount = getWicketLayoutPanelCount(
    panelCount,
    drivewayGateEnabled,
  );
  const clamped = clampWicketInsertAfter(
    insertAfter,
    panelCount,
    drivewayGateEnabled,
  );
  const min = -1;
  const max = Math.max(-1, layoutPanelCount - 1);
  const slotCount = Math.max(1, layoutPanelCount + 1);

  return (
    <div className="mt-4">
      <SectionLabel>{label}</SectionLabel>
      <div className="space-y-3 rounded-xl border border-[#333] bg-[#222] p-4">
        <p className="text-[11px] leading-relaxed text-[#eeeeea]">{hint}</p>
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={clamped}
          disabled={layoutPanelCount <= 0 && max < 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-[#e30311]"
          aria-label={label}
        />
        <div className="flex items-center justify-between gap-2 text-[11px] text-[#e8e8e4]">
          <span>Początek</span>
          <span className="font-semibold text-white">
            {formatWicketInsertAfterLabel(clamped, layoutPanelCount)}
          </span>
          <span>Koniec</span>
        </div>
        <p className="text-[10px] text-[#d6d6d2]">
          {slotCount} {slotCount === 1 ? "pozycja" : "pozycje dostępne"}
        </p>
      </div>
    </div>
  );
}

function WicketHingeSidePicker({
  value,
  onChange,
}: {
  value: WicketHingeSide;
  onChange: (side: WicketHingeSide) => void;
}) {
  const options: { side: WicketHingeSide; label: string }[] = [
    { side: "left", label: "Zawiasy po lewej" },
    { side: "right", label: "Zawiasy po prawej" },
  ];

  return (
    <div className="mt-4">
      <SectionLabel>Strona zawiasów</SectionLabel>
      <div className="grid grid-cols-1 gap-2">
        {options.map(({ side, label }) => (
          <button
            key={side}
            type="button"
            onClick={() => onChange(side)}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition-all",
              value === side
                ? "border-[#e30311] bg-[#2a0e10] text-white"
                : "border-[#333] bg-[#222] text-[#e8e8e4] hover:border-[#444]",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DrivewayGateKindPicker({
  catalog,
  selectedElementId,
  patternId,
  onSelectKind,
}: {
  catalog: CatalogCollections;
  selectedElementId: string | null;
  patternId: OpeningInfillPatternId;
  onSelectKind: (kind: DrivewayGateKind) => void;
}) {
  const selectedKind = selectedElementId
    ? resolveDrivewayGateKind(resolveElement(catalog, "brama", selectedElementId))
    : null;
  const options: { kind: DrivewayGateKind; label: string }[] = [
    { kind: "double-leaf", label: "Brama dwuskrzydłowa" },
    { kind: "sliding", label: "Brama przesuwna" },
  ];

  return (
    <div className="mt-3 grid grid-cols-1 gap-2">
      {options.map(({ kind, label }) => {
        const elementId = pickBramaElementForPattern(catalog, kind, patternId);
        const element = elementId
          ? catalog.elements.find((e) => e.id === elementId)
          : undefined;
        return (
          <button
            key={kind}
            type="button"
            disabled={!elementId}
            onClick={() => elementId && onSelectKind(kind)}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-left transition-all",
              selectedKind === kind
                ? "border-[#e30311] bg-[#2a0e10] text-white"
                : "border-[#333] bg-[#222] text-[#e8e8e4] hover:border-[#444]",
            )}
          >
            <span className="text-sm font-semibold">{label}</span>
            {element && (
              <span
                className={cn(
                  "mt-0.5 block text-[11px]",
                  selectedKind === kind ? "text-[#f0c0c3]" : "text-[#d6d6d2]",
                )}
              >
                {formatElementPriceSubtitle(element)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function OptionSidebar({
  catalog,
  selection,
  activeTab,
  onSelect,
  onTabChange,
}: Props) {
  const selectedHeight = catalog.heights.find(
    (h) => h.id === selection.heightId,
  );
  const selectedColor = catalog.colors.find((c) => c.id === selection.colorId);
  const selectedPanel = catalog.panels.find((p) => p.id === selection.panelId);
  const selectedPost = catalog.posts.find((p) => p.id === selection.postId);
  const selectedSpacer = catalog.spacerOptions.find(
    (s) => s.id === selection.spacerId,
  );
  const bramaEnabled = useConfiguratorStore((s) => s.bramaEnabled);
  const bramaElementId = useConfiguratorStore((s) => s.bramaElementId);
  const bramaOccupiedSpanM = useConfiguratorStore((s) => s.bramaOccupiedSpanM);
  const furtkaEnabled = useConfiguratorStore((s) => s.furtkaEnabled);
  const furtkaElementId = useConfiguratorStore((s) => s.furtkaElementId);
  const furtkaPosition = useConfiguratorStore((s) => s.furtkaPosition);
  const furtkaInsertAfter = useConfiguratorStore((s) => s.furtkaInsertAfter);
  const furtkaHingeSide = useConfiguratorStore((s) => s.furtkaHingeSide);
  const footingEnabled = useConfiguratorStore((s) => s.footingEnabled);
  const footingHeightId = useConfiguratorStore((s) => s.footingHeightId);
  const footingMaterialId = useConfiguratorStore((s) => s.footingMaterialId);
  const setBramaElementId = useConfiguratorStore((s) => s.setBramaElementId);
  const bramaInsertAfter = useConfiguratorStore((s) => s.bramaInsertAfter);
  const setBramaInsertAfter = useConfiguratorStore((s) => s.setBramaInsertAfter);
  const setFurtkaElementId = useConfiguratorStore((s) => s.setFurtkaElementId);
  const setFurtkaInsertAfter = useConfiguratorStore((s) => s.setFurtkaInsertAfter);
  const setFurtkaHingeSide = useConfiguratorStore((s) => s.setFurtkaHingeSide);
  const setFootingEnabled = useConfiguratorStore((s) => s.setFootingEnabled);
  const setFootingHeightId = useConfiguratorStore((s) => s.setFootingHeightId);
  const setFootingMaterialId = useConfiguratorStore((s) => s.setFootingMaterialId);
  const previewPanelCount = useConfiguratorStore((s) => s.previewPanelCount);
  const setPreviewPanelCount = useConfiguratorStore((s) => s.setPreviewPanelCount);
  const pricing = useConfiguratorStore((s) => s.pricing);
  const panelWidthCm = resolvePanelWidthCm(selectedPanel, pricing);
  const quotePerimeterM = useConfiguratorStore((s) => s.quotePerimeterM);
  const manualQuotePerimeterM = useConfiguratorStore((s) => s.manualQuotePerimeterM);
  const quoteFenceScope = useConfiguratorStore((s) => s.quoteFenceScope);
  const manualQuoteFrontLengthM = useConfiguratorStore(
    (s) => s.manualQuoteFrontLengthM,
  );
  const quoteFenceClosed = useConfiguratorStore((s) => s.quoteFenceClosed);
  const scope = useConfiguratorStore((s) => s.scope);
  const resetScope = useConfiguratorStore((s) => s.resetScope);

  const selectedFootingHeight = catalog.footingHeights.find(
    (h) => h.id === footingHeightId,
  );
  const selectedFootingMaterial = catalog.footingMaterials.find(
    (m) => m.id === footingMaterialId,
  );

  const wicketHingeSideLabels: Record<WicketHingeSide, string> = {
    left: "zawiasy lewe",
    right: "zawiasy prawe",
  };

  // Wzór wypełnienia bramy/furtki dziedziczony z modelu płotu.
  const fencePatternId = useMemo(
    () => resolveFencePatternId(catalog, selection.panelId),
    [catalog, selection.panelId],
  );

  const effectiveQuotePerimeterM = useMemo(
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
        perimeterM: effectiveQuotePerimeterM,
        fenceEnabled: scope.fence,
        bramaEnabled,
        bramaElementId,
        bramaOccupiedSpanM,
        furtkaEnabled,
        furtkaElementId,
        furtkaPositionLabel: formatWicketInsertAfterLabel(
          clampWicketInsertAfter(
            furtkaInsertAfter,
            previewPanelCount,
            Boolean(bramaElementId),
          ),
          getWicketLayoutPanelCount(previewPanelCount, Boolean(bramaElementId)),
        ),
        furtkaHingeSideLabel: furtkaEnabled
          ? wicketHingeSideLabels[furtkaHingeSide]
          : undefined,
        footingEnabled,
        footingHeightId,
        footingMaterialId,
        fallbackPanelCount: previewPanelCount,
      }),
    [
      catalog,
      selection,
      pricing,
      effectiveQuotePerimeterM,
      scope.fence,
      bramaEnabled,
      bramaElementId,
      bramaOccupiedSpanM,
      furtkaEnabled,
      furtkaElementId,
      furtkaInsertAfter,
      furtkaHingeSide,
      footingEnabled,
      footingHeightId,
      footingMaterialId,
      previewPanelCount,
    ],
  );

  const nextTab = getNextConfiguratorTab(activeTab, scope);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  async function handleDownloadPdf() {
    if (!pdfContainerRef.current) return;
    setIsGeneratingPdf(true);
    try {
      await generateConfiguratorPdf(pdfContainerRef.current);
    } catch (error) {
      console.error("[PDF] Nie udało się wygenerować pliku:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[#2A2A26] px-5 py-4 max-lg:px-4 max-lg:landscape:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-lg font-bold text-white max-lg:text-base">
              Konfigurator Ogrodzenia
            </h1>
            <p className="mt-0.5 text-[11px] text-[#d6d6d2]">
              STAL-POL | Ogrodzenia stalowe
            </p>
          </div>
          <button
            type="button"
            onClick={resetScope}
            className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#e8e8e4] underline-offset-2 hover:text-[#e30311] hover:underline"
          >
            Zmień zakres
          </button>
        </div>
      </div>

      <ConfiguratorTabs active={activeTab} scope={scope} onChange={onTabChange} />

      <div className="mobile-drawer-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 scrollbar-dark max-lg:px-4 max-lg:landscape:py-3">
        {activeTab === "model" && (
          <div className="space-y-6">
            <div>
              <SectionLabel>Wybór modelu</SectionLabel>
              <div className="flex flex-col gap-2">
                {catalog.panels.map((panel: Panel) => (
                  <ModelCard
                    key={panel.id}
                    selected={selection.panelId === panel.id}
                    title={panel.name}
                    subtitle={`Wzór: ${panel.patternId.replace("pattern-", "")} · ${formatSurchargePerPanel(panel.priceSurchargePerPanel, panel.priceSurchargePerMeter, resolvePanelWidthCm(panel, pricing))}`}
                    onClick={() => onSelect({ panelId: panel.id })}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Kolor (RAL)</SectionLabel>
              <div className="mb-4 flex flex-wrap gap-3">
                {catalog.colors.map((color: Color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => onSelect({ colorId: color.id })}
                    title={`${color.name} · ${formatSurchargePerPanel(color.priceSurchargePerPanel, color.priceSurchargePerMeter, panelWidthCm)}`}
                    className={cn(
                      "h-12 w-12 rounded-lg border-2 transition-all",
                      selection.colorId === color.id
                        ? "border-[#e30311] ring-2 ring-[#e30311]/40 ring-offset-2 ring-offset-[#1A1A18] scale-110"
                        : "border-[#444] hover:border-[#666]",
                    )}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
              {selectedColor && (
                <p className="text-sm text-[#e8e8e4]">
                  Wybrany:{" "}
                  <span className="font-semibold text-white">
                    {selectedColor.name}
                  </span>{" "}
                  <span className="font-mono text-[#d6d6d2]">{selectedColor.hex}</span>
                  <span className="ml-2 text-[#e30311]">
                    {formatSurchargePerPanel(selectedColor.priceSurchargePerPanel, selectedColor.priceSurchargePerMeter, panelWidthCm)}
                  </span>
                </p>
              )}
            </div>

            <div>
              <SectionLabel>Wykończenie powierzchni</SectionLabel>
              <div className="flex flex-col gap-2">
                {catalog.spacerOptions.map((spacer: SpacerOption) => (
                  <ModelCard
                    key={spacer.id}
                    selected={selection.spacerId === spacer.id}
                    title={spacer.name}
                    subtitle={formatSurchargePerPanel(spacer.priceSurchargePerPanel, spacer.priceSurchargePerMeter, panelWidthCm)}
                    onClick={() => onSelect({ spacerId: spacer.id })}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Podmurówka</SectionLabel>
              <div className="flex flex-col gap-2">
                <ModelCard
                  selected={!footingEnabled}
                  title="Bez podmurówki"
                  subtitle="Panele kończą się nad podłożem"
                  onClick={() => setFootingEnabled(false)}
                />
                <ModelCard
                  selected={footingEnabled}
                  title="Z podmurówką"
                  subtitle={`od ${pricing.footingPriceNet.toLocaleString("pl-PL")} PLN/panel`}
                  onClick={() => setFootingEnabled(true)}
                />
              </div>
              {footingEnabled && (
                <>
                  <div className="mt-4">
                    <SectionLabel>Wysokość podmurówki</SectionLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {catalog.footingHeights.map((fh: FootingHeight) => (
                        <button
                          key={fh.id}
                          type="button"
                          onClick={() => setFootingHeightId(fh.id)}
                          className={cn(
                            "rounded-lg border px-3 py-3 text-center transition-all",
                            footingHeightId === fh.id
                              ? "border-[#e30311] bg-[#2a0e10] text-white"
                              : "border-[#333] bg-[#222] text-[#e8e8e4] hover:border-[#444]",
                          )}
                        >
                          <span className="block font-heading text-lg font-bold">
                            {fh.label}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-[#e8e8e4]">
                            {formatSurchargePerPanel(
                              fh.priceSurchargePerPanel,
                              undefined,
                              panelWidthCm,
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <SectionLabel>Materiał / kolor</SectionLabel>
                    <div className="mb-3 flex flex-wrap gap-3">
                      {catalog.footingMaterials.map((mat: FootingMaterial) => (
                        <button
                          key={mat.id}
                          type="button"
                          onClick={() => setFootingMaterialId(mat.id)}
                          title={`${mat.name} · ${formatSurchargePerPanel(mat.priceSurchargePerPanel, undefined, panelWidthCm)}`}
                          className={cn(
                            "h-12 w-12 rounded-lg border-2 transition-all",
                            footingMaterialId === mat.id
                              ? "border-[#e30311] ring-2 ring-[#e30311]/40 ring-offset-2 ring-offset-[#1A1A18] scale-110"
                              : "border-[#444] hover:border-[#666]",
                          )}
                          style={{ backgroundColor: mat.hex }}
                        />
                      ))}
                    </div>
                    {selectedFootingMaterial && (
                      <p className="text-sm text-[#e8e8e4]">
                        Wybrany:{" "}
                        <span className="font-semibold text-white">
                          {selectedFootingMaterial.name}
                        </span>
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "dimensions" && (
          <div>
            <SectionLabel>Szerokość podglądu — panele</SectionLabel>
            <div className="mb-6 rounded-lg border border-[#333] bg-[#222] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  {previewPanelCount} paneli
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#d6d6d2]">
                  {MIN_PREVIEW_PANELS}–{MAX_PREVIEW_PANELS}
                </span>
              </div>
              <input
                type="range"
                min={MIN_PREVIEW_PANELS}
                max={MAX_PREVIEW_PANELS}
                value={previewPanelCount}
                onChange={(e) => setPreviewPanelCount(Number(e.target.value))}
                className="w-full accent-[#e30311]"
              />
              <p className="mt-2 text-[10px] leading-relaxed text-[#d6d6d2] max-lg:landscape:hidden">
                Przeciągnij boczne uchwyty płotu w podglądzie, aby szybko
                dodać lub usunąć panele.
              </p>
            </div>

            <SectionLabel>Wysokość — presety</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {catalog.heights.map((height: Height) => (
                <button
                  key={height.id}
                  type="button"
                  onClick={() => onSelect({ heightId: height.id })}
                  className={cn(
                    "rounded-lg border px-3 py-3 text-center transition-all",
                    selection.heightId === height.id
                      ? "border-[#e30311] bg-[#2a0e10] text-white"
                      : "border-[#333] bg-[#222] text-[#e8e8e4] hover:border-[#444]",
                  )}
                >
                  <span className="block font-heading text-lg font-bold">
                    {height.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[#e8e8e4]">
                    {formatHeightMultiplier(height.priceMultiplier)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "gates" && (
          <div className="space-y-6">
            {scope.gate && (
            <div>
              <SectionLabel>Brama wjazdowa</SectionLabel>
              <div className="flex flex-col gap-2">
                <ModelCard
                  selected={!bramaElementId}
                  title="Bez bramy"
                  subtitle="Ciągłe ogrodzenie panelowe"
                  onClick={() => setBramaElementId(null)}
                />
              </div>
              <DrivewayGateKindPicker
                catalog={catalog}
                selectedElementId={bramaElementId}
                patternId={fencePatternId}
                onSelectKind={(kind) => {
                  const id = pickBramaElementForPattern(
                    catalog,
                    kind,
                    fencePatternId,
                  );
                  if (id) setBramaElementId(id);
                }}
              />
              <p className="mt-3 text-[11px] leading-relaxed text-[#e8e8e4]">
                Wypełnienie bramy odpowiada wybranemu{" "}
                <strong className="text-[#f6f6f4]">modelowi ogrodzenia</strong>.
              </p>
              {bramaElementId && scope.fence && (
                <OpeningInsertAfterPicker
                  label="Pozycja bramy"
                  hint="Przesuń bramę między panelami — zajmuje szerokość 2 paneli."
                  insertAfter={bramaInsertAfter}
                  panelCount={previewPanelCount}
                  drivewayGateEnabled
                  onChange={setBramaInsertAfter}
                />
              )}
              {bramaElementId && scope.fence && (
                <p className="mt-2 text-[11px] leading-relaxed text-[#e8e8e4]">
                  Możesz też przesuwać bramę strzałkami na podglądzie. Na zakładce{" "}
                  <strong className="text-[#f6f6f4]">Wymiary działki</strong> uchwyty{" "}
                  <strong className="text-[#f6f6f4]">B1/B2</strong> doprecyzują szerokość
                  na rzucie.
                </p>
              )}
              {bramaElementId && !scope.fence && (
                <p className="mt-3 text-[11px] leading-relaxed text-[#e8e8e4]">
                  Cena bramy jest stała netto — nie zależy od liczby paneli.
                </p>
              )}
            </div>
            )}

            {scope.wicket && (
            <div>
              <SectionLabel>Furtka</SectionLabel>
              {(() => {
                const matchedFurtkaId = pickFurtkaElementForPattern(
                  catalog,
                  fencePatternId,
                );
                const matchedFurtka = matchedFurtkaId
                  ? resolveElement(catalog, "furtka", matchedFurtkaId)
                  : undefined;
                return (
                  <div className="flex flex-col gap-2">
                    <ModelCard
                      selected={!furtkaElementId}
                      title="Bez furtki"
                      subtitle="Ciągłe ogrodzenie panelowe"
                      onClick={() => setFurtkaElementId(null)}
                    />
                    {matchedFurtka ? (
                      <ModelCard
                        selected={Boolean(furtkaElementId)}
                        title="Furtka"
                        subtitle={formatElementPriceSubtitle(matchedFurtka)}
                        onClick={() => setFurtkaElementId(matchedFurtka.id)}
                      />
                    ) : (
                      <p className="mt-2 text-[11px] text-[#e8e8e4]">
                        Brak aktywnych furtek w katalogu — dodaj je w panelu admina.
                      </p>
                    )}
                  </div>
                );
              })()}
              <p className="mt-3 text-[11px] leading-relaxed text-[#e8e8e4]">
                Wypełnienie furtki odpowiada wybranemu{" "}
                <strong className="text-[#f6f6f4]">modelowi ogrodzenia</strong>.
              </p>
              {furtkaEnabled && (
                <WicketHingeSidePicker
                  value={furtkaHingeSide}
                  onChange={setFurtkaHingeSide}
                />
              )}
              {furtkaEnabled && scope.fence && (
                <OpeningInsertAfterPicker
                  label="Pozycja furtki"
                  hint="Przesuń furtkę między panelami — dowolne miejsce na ogrodzeniu."
                  insertAfter={furtkaInsertAfter}
                  panelCount={previewPanelCount}
                  drivewayGateEnabled={Boolean(bramaElementId)}
                  onChange={setFurtkaInsertAfter}
                />
              )}
              {furtkaEnabled && scope.fence && (
                <p className="mt-3 text-[11px] leading-relaxed text-[#e8e8e4]">
                  Możesz też przesuwać furtkę strzałkami na podglądzie. Na zakładce{" "}
                  <strong className="text-[#f6f6f4]">Wymiary działki</strong> marker{" "}
                  <strong className="text-[#f6f6f4]">F</strong> na rzucie doprecyzuje
                  miejsce na działce.
                </p>
              )}
            </div>
            )}

            {scope.fence && (
            <div>
              <SectionLabel>Wybór słupka</SectionLabel>
              <div className="flex flex-col gap-2">
                {catalog.posts.map((post: Post) => (
                  <ModelCard
                    key={post.id}
                    selected={selection.postId === post.id}
                    title={post.name}
                    subtitle={`Szerokość ${post.widthCm} cm · ${formatSurchargePerPanel(post.priceSurchargePerPanel, post.priceSurchargePerMeter, panelWidthCm)}`}
                    onClick={() => onSelect({ postId: post.id })}
                  />
                ))}
              </div>
            </div>
            )}
          </div>
        )}

        {activeTab === "quote" && (
          <QuoteSidebarPanel catalog={catalog} selection={selection} />
        )}

        {activeTab === "review" && (
          <div className="space-y-6">
            <div>
              <SectionLabel>Tło podglądu</SectionLabel>
              <BackgroundPicker />
            </div>

            <div className="space-y-4">
              <SectionLabel>Twoja konfiguracja</SectionLabel>
            {[
              ...(scope.fence
                ? [
                    { label: "Model panelu", value: selectedPanel?.name },
                    { label: "Kolor", value: selectedColor?.name },
                    { label: "Wykończenie", value: selectedSpacer?.name },
                    { label: "Wysokość", value: selectedHeight?.label },
                    {
                      label: "Panele w podglądzie",
                      value: `${previewPanelCount} szt.`,
                    },
                    { label: "Słupek", value: selectedPost?.name },
                    {
                      label: "Podmurówka",
                      value: footingEnabled
                        ? [selectedFootingHeight?.label, selectedFootingMaterial?.name]
                            .filter(Boolean)
                            .join(" · ") || "Tak"
                        : "Nie",
                    },
                  ]
                : []),
              ...(scope.gate
                ? [
                    {
                      label: "Brama wjazdowa",
                      value:
                        quote.configurationItems.find(
                          (i) => i.label === "Brama wjazdowa",
                        )?.value ?? "Nie",
                    },
                  ]
                : []),
              ...(scope.wicket
                ? [
                    {
                      label: "Furtka",
                      value:
                        quote.configurationItems.find((i) => i.label === "Furtka")
                          ?.value ?? "Nie",
                    },
                  ]
                : []),
              ...(scope.fence
                ? [
                    {
                      label: "Długość z rzutu",
                      value:
                        effectiveQuotePerimeterM != null
                          ? `${effectiveQuotePerimeterM.toFixed(1)} m bieżących`
                          : "—",
                    },
                    {
                      label: "Stawka za panel",
                      value: `${quote.pricePerPanelNet.toLocaleString("pl-PL")} PLN/panel`,
                    },
                    {
                      label: "Liczba paneli",
                      value: `${quote.panelUnits} szt.`,
                    },
                  ]
                : []),
              {
                label: "Wycena orientacyjna",
                value: `${Math.round(quote.totalNet).toLocaleString("pl-PL")} PLN netto`,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-[#2A2A26] py-2.5"
              >
                <span className="text-[11px] uppercase tracking-wider text-[#d6d6d2]">
                  {label}
                </span>
                <span className="text-sm font-semibold text-white">
                  {value ?? "—"}
                </span>
              </div>
            ))}
            {selectedColor && (
              <div className="flex items-center gap-3 rounded-lg bg-[#222] p-3">
                <span
                  className="h-10 w-10 rounded-lg border border-[#444]"
                  style={{ backgroundColor: selectedColor.hex }}
                />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {selectedColor.name}
                  </p>
                  <p className="font-mono text-xs text-[#d6d6d2]">
                    {selectedColor.hex}
                  </p>
                </div>
              </div>
            )}
            <div className="rounded-lg border border-[#333] bg-[#222] p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#d6d6d2]">
                Składniki ceny
              </p>
              <div className="space-y-1.5">
                {quote.breakdown.map((row, index) => (
                  <div
                    key={`${row.label}-${index}`}
                    className="flex justify-between gap-2 text-[11px]"
                  >
                    <span className="text-[#e8e8e4]">{row.label}</span>
                    {row.amount > 0 ? (
                      <span className="font-semibold text-white">
                        {Math.round(row.amount).toLocaleString("pl-PL")} PLN
                      </span>
                    ) : (
                      <span className="text-[#d6d6d2]">{row.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            </div>

            <PdfDocument
              ref={pdfContainerRef}
              catalog={catalog}
              selection={selection}
              pricing={pricing}
              scope={scope}
              quote={quote}
              selectedPanel={selectedPanel}
              selectedColor={selectedColor}
              selectedSpacer={selectedSpacer}
              selectedHeight={selectedHeight}
              selectedPost={selectedPost}
              selectedFootingHeight={selectedFootingHeight}
              selectedFootingMaterial={selectedFootingMaterial}
              previewPanelCount={previewPanelCount}
              effectiveQuotePerimeterM={effectiveQuotePerimeterM}
              footingEnabled={footingEnabled}
              bramaEnabled={bramaEnabled}
              bramaElementId={bramaElementId}
              furtkaEnabled={furtkaEnabled}
              furtkaElementId={furtkaElementId}
              furtkaPosition={furtkaPosition}
              furtkaInsertAfter={furtkaInsertAfter}
              bramaInsertAfter={bramaInsertAfter}
              furtkaHingeSide={furtkaHingeSide}
              footingHeightId={footingHeightId}
              footingMaterialId={footingMaterialId}
            />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[#2A2A26] bg-[#1A1A18] px-5 py-4 max-lg:landscape:px-4 max-lg:landscape:py-2">
        <div className="mb-3 max-lg:landscape:mb-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#d6d6d2]">
              Wycena orientacyjna
            </span>
            <span className="font-heading text-xl font-bold text-white max-lg:landscape:text-lg">
              {Math.round(quote.totalNet).toLocaleString("pl-PL")}{" "}
              <span className="text-sm font-semibold text-[#e8e8e4] max-lg:landscape:text-xs">
                PLN netto
              </span>
            </span>
          </div>
          <p className="mt-1 text-right text-[10px] text-[#d6d6d2] max-lg:landscape:hidden">
            {quote.pricePerPanelNet.toLocaleString("pl-PL")} PLN/panel ·{" "}
            {quote.panelUnits} paneli · {quote.perimeterM.toFixed(1)} m bieżących
          </p>
        </div>
        {activeTab === "review" ? (
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleDownloadPdf}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg bg-[#e30311] py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors max-lg:landscape:py-2.5",
              isGeneratingPdf ? "cursor-wait opacity-60" : "hover:bg-[#c9020f]",
            )}
          >
            <FileDown className="h-4 w-4" />
            {isGeneratingPdf ? "Generowanie PDF…" : "Pobierz PDF"}
          </button>
        ) : (
          <button
            type="button"
            disabled={!nextTab}
            onClick={() => nextTab && onTabChange(nextTab)}
            className={cn(
              "w-full rounded-lg bg-[#e30311] py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors max-lg:landscape:py-2.5",
              nextTab ? "hover:bg-[#c9020f]" : "cursor-not-allowed opacity-50",
            )}
          >
            Przejdź dalej
          </button>
        )}
      </div>
    </div>
  );
}
