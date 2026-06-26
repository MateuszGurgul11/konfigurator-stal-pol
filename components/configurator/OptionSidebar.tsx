"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CatalogCollections,
  ConfiguratorSelection,
  Color,
  Height,
  Panel,
  Post,
  SpacerOption,
} from "@/lib/types";
import {
  type ConfiguratorTab,
  type GatePosition,
  MAX_PREVIEW_PANELS,
  MIN_PREVIEW_PANELS,
  useConfiguratorStore,
} from "@/lib/configurator/state";
import { ConfiguratorTabs } from "./ConfiguratorTabs";
import { BackgroundPicker } from "./BackgroundPicker";
import { QuoteSidebarPanel } from "./QuoteSidebarPanel";
import { calculateQuote } from "@/lib/pricing/calculateQuote";
import {
  formatElementPriceSubtitle,
  getElementsByType,
} from "@/lib/pricing/element-prices";

type Props = {
  catalog: CatalogCollections;
  selection: ConfiguratorSelection;
  activeTab: ConfiguratorTab;
  onSelect: (partial: Partial<ConfiguratorSelection>) => void;
  onTabChange: (tab: ConfiguratorTab) => void;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#666]">
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
            selected ? "text-white" : "text-[#ccc]",
          )}
        >
          {title}
        </p>
        <p className="text-[11px] text-[#666]">{subtitle}</p>
      </div>
    </button>
  );
}

function formatSurchargePerMeter(value?: number): string {
  if (value == null || value === 0) return "w cenie bazowej";
  return `+${value} PLN/m`;
}

function formatHeightMultiplier(value?: number): string {
  if (value == null || value === 1) return "×1,00";
  return `×${value.toFixed(2)}`;
}

function formatOpeningSummary(
  enabled: boolean,
  position: GatePosition,
  labels: Record<GatePosition, string>,
): string {
  return enabled ? `Tak · ${labels[position]}` : "Nie";
}

function OpeningPositionPicker({
  label,
  value,
  onChange,
  labels,
}: {
  label: string;
  value: GatePosition;
  onChange: (position: GatePosition) => void;
  labels: Record<GatePosition, string>;
}) {
  return (
    <div className="mt-4">
      <SectionLabel>{label}</SectionLabel>
      <div className="grid grid-cols-1 gap-2">
        {(["left", "center", "right"] as GatePosition[]).map((pos) => (
          <button
            key={pos}
            type="button"
            onClick={() => onChange(pos)}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition-all",
              value === pos
                ? "border-[#e30311] bg-[#2a0e10] text-white"
                : "border-[#333] bg-[#222] text-[#888] hover:border-[#444]",
            )}
          >
            {labels[pos]}
          </button>
        ))}
      </div>
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
  const setBramaElementId = useConfiguratorStore((s) => s.setBramaElementId);
  const setFurtkaElementId = useConfiguratorStore((s) => s.setFurtkaElementId);
  const previewPanelCount = useConfiguratorStore((s) => s.previewPanelCount);
  const setPreviewPanelCount = useConfiguratorStore((s) => s.setPreviewPanelCount);
  const pricing = useConfiguratorStore((s) => s.pricing);
  const quotePerimeterM = useConfiguratorStore((s) => s.quotePerimeterM);
  const quoteFenceClosed = useConfiguratorStore((s) => s.quoteFenceClosed);

  const openingPositionLabels: Record<GatePosition, string> = {
    left: "Lewa sekcja",
    center: "Środkowa sekcja",
    right: "Prawa sekcja",
  };

  const bramaOptions = useMemo(
    () => getElementsByType(catalog, "brama"),
    [catalog],
  );
  const furtkaOptions = useMemo(
    () => getElementsByType(catalog, "furtka"),
    [catalog],
  );

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

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#2A2A26] px-5 py-4">
        <h1 className="font-heading text-lg font-bold text-white">
          Konfigurator Ogrodzenia
        </h1>
        <p className="mt-0.5 text-[11px] text-[#666]">
          Seria Betonowa | Wielkopolska
        </p>
      </div>

      <ConfiguratorTabs active={activeTab} onChange={onTabChange} />

      <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-dark">
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
                    subtitle={`Wzór: ${panel.patternId.replace("pattern-", "")} · ${formatSurchargePerMeter(panel.priceSurchargePerMeter)}`}
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
                    title={`${color.name} · ${formatSurchargePerMeter(color.priceSurchargePerMeter)}`}
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
                <p className="text-sm text-[#888]">
                  Wybrany:{" "}
                  <span className="font-semibold text-white">
                    {selectedColor.name}
                  </span>{" "}
                  <span className="font-mono text-[#666]">{selectedColor.hex}</span>
                  <span className="ml-2 text-[#e30311]">
                    {formatSurchargePerMeter(selectedColor.priceSurchargePerMeter)}
                  </span>
                </p>
              )}
            </div>

            <div>
              <SectionLabel>Dystans / ażurowość</SectionLabel>
              <div className="flex flex-col gap-2">
                {catalog.spacerOptions.map((spacer: SpacerOption) => (
                  <ModelCard
                    key={spacer.id}
                    selected={selection.spacerId === spacer.id}
                    title={spacer.name}
                    subtitle={
                      spacer.hasSpacer
                        ? `Ażurowość ${Math.round(spacer.openness * 100)}% · ${formatSurchargePerMeter(spacer.priceSurchargePerMeter)}`
                        : `Pełne panele · ${formatSurchargePerMeter(spacer.priceSurchargePerMeter)}`
                    }
                    onClick={() => onSelect({ spacerId: spacer.id })}
                  />
                ))}
              </div>
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
                <span className="text-[10px] uppercase tracking-wider text-[#666]">
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
              <p className="mt-2 text-[10px] leading-relaxed text-[#666]">
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
                      : "border-[#333] bg-[#222] text-[#888] hover:border-[#444]",
                  )}
                >
                  <span className="block font-heading text-lg font-bold">
                    {height.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[#888]">
                    {formatHeightMultiplier(height.priceMultiplier)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "gates" && (
          <div className="space-y-6">
            <div>
              <SectionLabel>Brama wjazdowa</SectionLabel>
              <div className="flex flex-col gap-2">
                <ModelCard
                  selected={!bramaElementId}
                  title="Bez bramy"
                  subtitle="Ciągłe ogrodzenie panelowe"
                  onClick={() => setBramaElementId(null)}
                />
                {bramaOptions.map((element) => (
                  <ModelCard
                    key={element.id}
                    selected={bramaElementId === element.id}
                    title={element.name}
                    subtitle={formatElementPriceSubtitle(element)}
                    onClick={() => setBramaElementId(element.id)}
                  />
                ))}
              </div>
              {bramaOptions.length === 0 && (
                <p className="mt-2 text-[11px] text-[#888]">
                  Brak aktywnych bram w katalogu — dodaj je w panelu admina.
                </p>
              )}
              {bramaEnabled && (
                <p className="mt-3 text-[11px] leading-relaxed text-[#888]">
                  Przejdź do zakładki <strong className="text-[#ccc]">Wycena</strong>,
                  zamknij obrys i przeciągnij uchwyty <strong className="text-[#ccc]">B1/B2</strong>{" "}
                  wzdłuż linii ogrodzenia, aby ustawić szerokość bramy.
                </p>
              )}
            </div>

            <div>
              <SectionLabel>Furtka</SectionLabel>
              <div className="flex flex-col gap-2">
                <ModelCard
                  selected={!furtkaElementId}
                  title="Bez furtki"
                  subtitle="Ciągłe ogrodzenie panelowe"
                  onClick={() => setFurtkaElementId(null)}
                />
                {furtkaOptions.map((element) => (
                  <ModelCard
                    key={element.id}
                    selected={furtkaElementId === element.id}
                    title={element.name}
                    subtitle={formatElementPriceSubtitle(element)}
                    onClick={() => setFurtkaElementId(element.id)}
                  />
                ))}
              </div>
              {furtkaOptions.length === 0 && (
                <p className="mt-2 text-[11px] text-[#888]">
                  Brak aktywnych furtek w katalogu — dodaj je w panelu admina.
                </p>
              )}
              {furtkaEnabled && (
                <p className="mt-3 text-[11px] leading-relaxed text-[#888]">
                  Na zakładce <strong className="text-[#ccc]">Wycena</strong> przeciągnij marker{" "}
                  <strong className="text-[#ccc]">F</strong> wzdłuż obrysu, aby wskazać miejsce
                  furtki (stała szerokość 1 panelu).
                </p>
              )}
            </div>

            <div>
              <SectionLabel>Wybór słupka</SectionLabel>
              <div className="flex flex-col gap-2">
                {catalog.posts.map((post: Post) => (
                  <ModelCard
                    key={post.id}
                    selected={selection.postId === post.id}
                    title={post.name}
                    subtitle={`Szerokość ${post.widthCm} cm · ${formatSurchargePerMeter(post.priceSurchargePerMeter)}`}
                    onClick={() => onSelect({ postId: post.id })}
                  />
                ))}
              </div>
            </div>
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
              { label: "Model panelu", value: selectedPanel?.name },
              { label: "Kolor", value: selectedColor?.name },
              { label: "Dystans", value: selectedSpacer?.name },
              { label: "Wysokość", value: selectedHeight?.label },
              { label: "Panele w podglądzie", value: `${previewPanelCount} szt.` },
              { label: "Słupek", value: selectedPost?.name },
              {
                label: "Brama wjazdowa",
                value:
                  quote.configurationItems.find((i) => i.label === "Brama wjazdowa")
                    ?.value ?? "Nie",
              },
              {
                label: "Furtka",
                value:
                  quote.configurationItems.find((i) => i.label === "Furtka")
                    ?.value ?? "Nie",
              },
              {
                label: "Długość z rzutu",
                value: quoteFenceClosed && quotePerimeterM
                  ? `${quotePerimeterM.toFixed(1)} m bieżących`
                  : "—",
              },
              {
                label: "Stawka za metr",
                value: `${quote.pricePerMeterNet.toLocaleString("pl-PL")} PLN/m`,
              },
              {
                label: "Wycena orientacyjna",
                value: `${Math.round(quote.totalNet).toLocaleString("pl-PL")} PLN netto`,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-[#2A2A26] py-2.5"
              >
                <span className="text-[11px] uppercase tracking-wider text-[#666]">
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
                  <p className="font-mono text-xs text-[#666]">
                    {selectedColor.hex}
                  </p>
                </div>
              </div>
            )}
            <div className="rounded-lg border border-[#333] bg-[#222] p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#666]">
                Składniki ceny
              </p>
              <div className="space-y-1.5">
                {quote.breakdown.map((row, index) => (
                  <div
                    key={`${row.label}-${index}`}
                    className="flex justify-between gap-2 text-[11px]"
                  >
                    <span className="text-[#888]">{row.label}</span>
                    {row.amount > 0 ? (
                      <span className="font-semibold text-white">
                        {Math.round(row.amount).toLocaleString("pl-PL")} PLN
                      </span>
                    ) : (
                      <span className="text-[#666]">{row.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[#2A2A26] bg-[#1A1A18] px-5 py-4">
        <div className="mb-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#666]">
              Wycena orientacyjna
            </span>
            <span className="font-heading text-xl font-bold text-white">
              {Math.round(quote.totalNet).toLocaleString("pl-PL")}{" "}
              <span className="text-sm font-semibold text-[#888]">PLN netto</span>
            </span>
          </div>
          <p className="mt-1 text-right text-[10px] text-[#666]">
            {quote.pricePerMeterNet.toLocaleString("pl-PL")} PLN/m ·{" "}
            {quote.perimeterM.toFixed(1)} m bieżących
          </p>
        </div>
        <button
          type="button"
          className="w-full rounded-lg bg-[#e30311] py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#c9020f]"
        >
          Zapisz konfigurację
        </button>
      </div>
    </div>
  );
}
