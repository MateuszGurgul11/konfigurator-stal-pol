import type {
  CatalogCollections,
  ConfiguratorSelection,
  PricingSettings,
  QuoteBreakdown,
  QuoteConfigurationItem,
  QuoteResult,
} from "@/lib/types";
import { DEFAULT_PRICING_SETTINGS } from "@/lib/pricing/defaults";
import { resolveElement, resolveElementPriceNet } from "@/lib/pricing/element-prices";
import { MIN_PREVIEW_PANELS } from "@/lib/configurator/state";

type QuoteInput = {
  catalog: CatalogCollections;
  selection: ConfiguratorSelection;
  pricing?: PricingSettings | null;
  perimeterM?: number | null;
  bramaEnabled?: boolean;
  bramaElementId?: string | null;
  bramaOccupiedSpanM?: number | null;
  furtkaEnabled?: boolean;
  furtkaElementId?: string | null;
  furtkaPositionLabel?: string;
  fallbackPanelCount?: number;
};

function pickPricing(pricing?: PricingSettings | null): PricingSettings {
  return pricing ?? DEFAULT_PRICING_SETTINGS;
}

function estimatePerimeterFromPanels(
  panelCount: number,
  panelWidthCm: number,
): number {
  return panelCount * (panelWidthCm / 100);
}

function formatPerMeter(amount: number): string {
  if (amount === 0) return "w cenie bazowej";
  return `+${amount.toLocaleString("pl-PL")} PLN/m`;
}

function formatBramaValue(
  enabled: boolean,
  elementName: string | undefined,
  spanM: number,
  panels: number,
): string {
  if (!enabled) return "Nie";
  const label = elementName ?? "Brama";
  if (spanM <= 0) return `${label} · ustaw na rzucie`;
  return `${label} · ${spanM.toFixed(1)} m (${panels} panel${panels === 1 ? "" : "i"})`;
}

function formatFurtkaValue(
  enabled: boolean,
  elementName: string | undefined,
  positionLabel?: string,
): string {
  if (!enabled) return "Nie";
  const label = elementName ?? "Furtka";
  return positionLabel ? `${label} · ${positionLabel}` : `${label} · ustaw na rzucie`;
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  const settings = pickPricing(input.pricing);
  const { catalog, selection } = input;
  const panelWidthM = settings.panelWidthCm / 100;

  const post = catalog.posts.find((p) => p.id === selection.postId);
  const panel = catalog.panels.find((p) => p.id === selection.panelId);
  const spacer = catalog.spacerOptions.find((s) => s.id === selection.spacerId);
  const height = catalog.heights.find((h) => h.id === selection.heightId);
  const color = catalog.colors.find((c) => c.id === selection.colorId);

  const panelCount = input.fallbackPanelCount ?? MIN_PREVIEW_PANELS;
  const perimeterM =
    input.perimeterM && input.perimeterM > 0
      ? input.perimeterM
      : estimatePerimeterFromPanels(panelCount, settings.panelWidthCm);

  const basePerMeter = settings.basePricePerMeterNet;
  const colorSurcharge = color?.priceSurchargePerMeter ?? 0;
  const panelSurcharge = panel?.priceSurchargePerMeter ?? 0;
  const postSurcharge = post?.priceSurchargePerMeter ?? 0;
  const spacerSurcharge = spacer?.priceSurchargePerMeter ?? 0;
  const heightMultiplier = height?.priceMultiplier ?? 1;

  const surchargesPerMeter =
    colorSurcharge + panelSurcharge + postSurcharge + spacerSurcharge;
  const pricePerMeterNet =
    (basePerMeter + surchargesPerMeter) * heightMultiplier;

  const bramaEnabled = input.bramaEnabled ?? Boolean(input.bramaElementId);
  const furtkaEnabled = input.furtkaEnabled ?? Boolean(input.furtkaElementId);
  const bramaElement = bramaEnabled
    ? resolveElement(catalog, "brama", input.bramaElementId)
    : undefined;
  const furtkaElement = furtkaEnabled
    ? resolveElement(catalog, "furtka", input.furtkaElementId)
    : undefined;

  // Brama ma wycenę dopiero po tym, jak użytkownik wyznaczy jej odcinek na obrysie.
  const bramaSpanRawM =
    bramaEnabled && input.bramaOccupiedSpanM != null
      ? Math.max(0, input.bramaOccupiedSpanM)
      : null;
  const bramaPanels =
    bramaEnabled && bramaSpanRawM && bramaSpanRawM > 0
      ? Math.max(1, Math.ceil(bramaSpanRawM / panelWidthM))
      : 0;
  const bramaSpanUsedM = bramaPanels * panelWidthM;
  const furtkaSpanUsedM = furtkaEnabled ? panelWidthM : 0;

  const effectivePerimeterM = Math.max(
    0,
    perimeterM - bramaSpanUsedM - furtkaSpanUsedM,
  );

  const fenceSubtotal = effectivePerimeterM * pricePerMeterNet;
  const bramaUnitPrice = resolveElementPriceNet(
    catalog,
    "brama",
    input.bramaElementId ?? bramaElement?.id,
  );
  const furtkaUnitPrice = resolveElementPriceNet(
    catalog,
    "furtka",
    input.furtkaElementId ?? furtkaElement?.id,
  );
  const bramaPrice = bramaEnabled ? bramaUnitPrice * bramaPanels : 0;
  const furtkaPrice = furtkaEnabled ? furtkaUnitPrice : 0;
  const totalNet = fenceSubtotal + bramaPrice + furtkaPrice;

  const estimatedPanels = Math.max(
    MIN_PREVIEW_PANELS,
    Math.ceil(effectivePerimeterM / panelWidthM),
  );

  const configurationItems: QuoteConfigurationItem[] = [
    { label: "Panel", value: panel?.name ?? "—" },
    { label: "Kolor", value: color?.name ?? "—" },
    { label: "Wysokość", value: height?.label ?? "—" },
    { label: "Słupek", value: post?.name ?? "—" },
    { label: "Dystans", value: spacer?.name ?? "—" },
    {
      label: "Brama wjazdowa",
      value: formatBramaValue(
        bramaEnabled,
        bramaElement?.name,
        bramaSpanUsedM,
        bramaPanels,
      ),
    },
    {
      label: "Furtka",
      value: formatFurtkaValue(
        furtkaEnabled,
        furtkaElement?.name,
        input.furtkaPositionLabel,
      ),
    },
  ];

  const breakdown: QuoteBreakdown[] = [
    {
      label: "Cena bazowa",
      value: `${basePerMeter.toLocaleString("pl-PL")} PLN/m`,
      amount: effectivePerimeterM * basePerMeter * heightMultiplier,
    },
  ];

  if (panel && panelSurcharge > 0) {
    breakdown.push({
      label: `Panel · ${panel.name}`,
      value: formatPerMeter(panelSurcharge),
      amount: effectivePerimeterM * panelSurcharge * heightMultiplier,
    });
  }

  if (color && colorSurcharge > 0) {
    breakdown.push({
      label: `Kolor · ${color.name}`,
      value: formatPerMeter(colorSurcharge),
      amount: effectivePerimeterM * colorSurcharge * heightMultiplier,
    });
  }

  if (post && postSurcharge > 0) {
    breakdown.push({
      label: `Słupek · ${post.name}`,
      value: formatPerMeter(postSurcharge),
      amount: effectivePerimeterM * postSurcharge * heightMultiplier,
    });
  }

  if (spacer && spacerSurcharge > 0) {
    breakdown.push({
      label: `Dystans · ${spacer.name}`,
      value: formatPerMeter(spacerSurcharge),
      amount: effectivePerimeterM * spacerSurcharge * heightMultiplier,
    });
  }

  if (height && heightMultiplier !== 1) {
    breakdown.push({
      label: `Wysokość · ${height.label}`,
      value: `mnożnik × ${heightMultiplier.toFixed(2)}`,
      amount: 0,
    });
  }

  breakdown.push({
    label: "Ogrodzenie",
    value: `${pricePerMeterNet.toLocaleString("pl-PL")} PLN/m × ${effectivePerimeterM.toFixed(1)} m`,
    amount: fenceSubtotal,
  });

  if (bramaEnabled) {
    breakdown.push({
      label: bramaElement?.name
        ? `Brama · ${bramaElement.name}`
        : "Brama wjazdowa",
      value:
        bramaPanels > 1
          ? `${bramaPanels} panele × ${bramaUnitPrice.toLocaleString("pl-PL")} PLN`
          : "1 panel",
      amount: bramaPrice,
    });
  }

  if (furtkaEnabled) {
    breakdown.push({
      label: furtkaElement?.name ? `Furtka · ${furtkaElement.name}` : "Furtka",
      value: "jednorazowo",
      amount: furtkaPrice,
    });
  }

  return {
    perimeterM,
    estimatedPanels,
    pricePerMeterNet,
    fenceSubtotal,
    bramaPrice,
    furtkaPrice,
    totalNet,
    currency: settings.currency,
    breakdown,
    configurationItems,
    hasMeasuredPerimeter: Boolean(input.perimeterM && input.perimeterM > 0),
  };
}
