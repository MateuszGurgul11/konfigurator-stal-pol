import type {
  CatalogCollections,
  ConfiguratorSelection,
  PricingSettings,
  QuoteBreakdown,
  QuoteConfigurationItem,
  QuoteResult,
} from "@/lib/types";
import { DEFAULT_PRICING_SETTINGS } from "@/lib/pricing/defaults";
import {
  getWicketWidthCm,
} from "@/lib/pricing/variant-prices";
import { resolveElement, resolveElementPriceNet } from "@/lib/pricing/element-prices";
import { resolveSurchargePerPanel } from "@/lib/pricing/surcharges";
import { MIN_PREVIEW_PANELS } from "@/lib/configurator/state";

type QuoteInput = {
  catalog: CatalogCollections;
  selection: ConfiguratorSelection;
  pricing?: PricingSettings | null;
  perimeterM?: number | null;
  fenceEnabled?: boolean;
  bramaEnabled?: boolean;
  bramaElementId?: string | null;
  bramaOccupiedSpanM?: number | null;
  furtkaEnabled?: boolean;
  furtkaElementId?: string | null;
  furtkaPositionLabel?: string;
  furtkaHingeSideLabel?: string;
  footingEnabled?: boolean;
  footingHeightId?: string | null;
  footingMaterialId?: string | null;
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

function formatPerPanel(amount: number): string {
  if (amount === 0) return "w cenie bazowej";
  return `+${amount.toLocaleString("pl-PL")} PLN/panel`;
}

function formatBramaValue(
  enabled: boolean,
  elementName: string | undefined,
  spanM: number,
): string {
  if (!enabled) return "Nie";
  const label = elementName ?? "Brama";
  if (spanM <= 0) return `${label} · cena stała`;
  return `${label} · ${spanM.toFixed(1)} m na rzucie`;
}

function formatFurtkaValue(
  enabled: boolean,
  elementName: string | undefined,
  positionLabel?: string,
  hingeSideLabel?: string,
): string {
  if (!enabled) return "Nie";
  const label = elementName ?? "Furtka";
  const parts = [label, positionLabel, hingeSideLabel].filter(Boolean);
  return parts.length > 1 ? parts.join(" · ") : `${label} · cena stała`;
}

function formatFootingValue(
  enabled: boolean,
  heightLabel?: string,
  materialName?: string,
): string {
  if (!enabled) return "Nie";
  const parts = [heightLabel, materialName].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Tak";
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  const settings = pickPricing(input.pricing);
  const { catalog, selection } = input;
  const panelWidthCm = settings.panelWidthCm;
  const panelWidthM = panelWidthCm / 100;
  const fenceEnabled = input.fenceEnabled ?? true;

  const post = catalog.posts.find((p) => p.id === selection.postId);
  const panel = catalog.panels.find((p) => p.id === selection.panelId);
  const spacer = catalog.spacerOptions.find((s) => s.id === selection.spacerId);
  const height = catalog.heights.find((h) => h.id === selection.heightId);
  const color = catalog.colors.find((c) => c.id === selection.colorId);
  const footingHeight = catalog.footingHeights?.find(
    (h) => h.id === input.footingHeightId,
  );
  const footingMaterial = catalog.footingMaterials?.find(
    (m) => m.id === input.footingMaterialId,
  );

  const panelCount = input.fallbackPanelCount ?? MIN_PREVIEW_PANELS;
  const perimeterM =
    input.perimeterM && input.perimeterM > 0
      ? input.perimeterM
      : estimatePerimeterFromPanels(panelCount, panelWidthCm);

  const panelSurcharge = resolveSurchargePerPanel(
    panel?.priceSurchargePerPanel,
    panel?.priceSurchargePerMeter,
    panelWidthCm,
  );
  const colorSurcharge = resolveSurchargePerPanel(
    color?.priceSurchargePerPanel,
    color?.priceSurchargePerMeter,
    panelWidthCm,
  );
  const postSurcharge = resolveSurchargePerPanel(
    post?.priceSurchargePerPanel,
    post?.priceSurchargePerMeter,
    panelWidthCm,
  );
  const spacerSurcharge = resolveSurchargePerPanel(
    spacer?.priceSurchargePerPanel,
    spacer?.priceSurchargePerMeter,
    panelWidthCm,
  );
  const heightMultiplier = height?.priceMultiplier ?? 1;

  const surchargesPerPanel =
    panelSurcharge + colorSurcharge + postSurcharge + spacerSurcharge;
  const pricePerPanelNet =
    (settings.panelPriceNet + surchargesPerPanel) * heightMultiplier;

  const bramaEnabled = input.bramaEnabled ?? Boolean(input.bramaElementId);
  const furtkaEnabled = input.furtkaEnabled ?? Boolean(input.furtkaElementId);
  const footingEnabled = input.footingEnabled ?? false;
  const bramaElement = bramaEnabled
    ? resolveElement(catalog, "brama", input.bramaElementId)
    : undefined;
  const furtkaElement = furtkaEnabled
    ? resolveElement(catalog, "furtka", input.furtkaElementId)
    : undefined;

  const bramaSpanRawM =
    bramaEnabled && input.bramaOccupiedSpanM != null
      ? Math.max(0, input.bramaOccupiedSpanM)
      : null;
  const bramaPanels =
    bramaEnabled && bramaSpanRawM && bramaSpanRawM > 0
      ? Math.max(1, Math.ceil(bramaSpanRawM / panelWidthM))
      : 0;
  const bramaSpanUsedM = bramaPanels * panelWidthM;
  const furtkaSpanUsedM = furtkaEnabled
    ? getWicketWidthCm(settings.panelWidthCm) / 100
    : 0;
  const openingSpanM = bramaSpanUsedM + furtkaSpanUsedM;

  let panelUnits = 0;
  let fenceSubtotal = 0;

  if (fenceEnabled) {
    panelUnits = Math.max(
      MIN_PREVIEW_PANELS,
      Math.ceil((perimeterM - openingSpanM) / panelWidthM),
    );
    fenceSubtotal = panelUnits * pricePerPanelNet;
  }

  const footingHeightSurcharge = footingHeight?.priceSurchargePerPanel ?? 0;
  const footingMaterialSurcharge = footingMaterial?.priceSurchargePerPanel ?? 0;
  const footingPerPanel =
    settings.footingPriceNet +
    footingHeightSurcharge +
    footingMaterialSurcharge;
  const footingPrice =
    fenceEnabled && footingEnabled ? panelUnits * footingPerPanel : 0;

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
  const bramaPrice = bramaEnabled ? bramaUnitPrice : 0;
  const furtkaPrice = furtkaEnabled ? furtkaUnitPrice : 0;
  const totalNet = fenceSubtotal + footingPrice + bramaPrice + furtkaPrice;

  const estimatedPanels = panelUnits;
  const pricePerMeterNet = pricePerPanelNet / panelWidthM;

  const configurationItems: QuoteConfigurationItem[] = [];

  if (fenceEnabled) {
    configurationItems.push(
      { label: "Panel", value: panel?.name ?? "—" },
      { label: "Kolor", value: color?.name ?? "—" },
      { label: "Wysokość", value: height?.label ?? "—" },
      { label: "Słupek", value: post?.name ?? "—" },
      { label: "Wykończenie", value: spacer?.name ?? "—" },
      {
        label: "Podmurówka",
        value: formatFootingValue(
          footingEnabled,
          footingHeight?.label,
          footingMaterial?.name,
        ),
      },
    );
  }

  configurationItems.push(
    {
      label: "Brama wjazdowa",
      value: formatBramaValue(
        bramaEnabled,
        bramaElement?.name,
        bramaSpanUsedM,
      ),
    },
    {
      label: "Furtka",
      value: formatFurtkaValue(
        furtkaEnabled,
        furtkaElement?.name,
        input.furtkaPositionLabel,
        input.furtkaHingeSideLabel,
      ),
    },
  );

  const breakdown: QuoteBreakdown[] = [];

  if (fenceEnabled) {
    breakdown.push({
      label: "Cena bazowa panelu",
      value: `${settings.panelPriceNet.toLocaleString("pl-PL")} PLN/panel`,
      amount: panelUnits * settings.panelPriceNet * heightMultiplier,
    });

    if (panel && panelSurcharge > 0) {
      breakdown.push({
        label: `Panel · ${panel.name}`,
        value: formatPerPanel(panelSurcharge),
        amount: panelUnits * panelSurcharge * heightMultiplier,
      });
    }

    if (color && colorSurcharge > 0) {
      breakdown.push({
        label: `Kolor · ${color.name}`,
        value: formatPerPanel(colorSurcharge),
        amount: panelUnits * colorSurcharge * heightMultiplier,
      });
    }

    if (post && postSurcharge > 0) {
      breakdown.push({
        label: `Słupek · ${post.name}`,
        value: formatPerPanel(postSurcharge),
        amount: panelUnits * postSurcharge * heightMultiplier,
      });
    }

    if (spacer && spacerSurcharge > 0) {
      breakdown.push({
        label: `Wykończenie · ${spacer.name}`,
        value: formatPerPanel(spacerSurcharge),
        amount: panelUnits * spacerSurcharge * heightMultiplier,
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
      value: `${pricePerPanelNet.toLocaleString("pl-PL")} PLN/panel × ${panelUnits} paneli`,
      amount: fenceSubtotal,
    });
  }

  if (footingEnabled && fenceEnabled) {
    breakdown.push({
      label: "Podmurówka — stawka bazowa",
      value: `${settings.footingPriceNet.toLocaleString("pl-PL")} PLN/panel`,
      amount: panelUnits * settings.footingPriceNet,
    });
    if (footingHeight && footingHeightSurcharge > 0) {
      breakdown.push({
        label: `Podmurówka · wysokość ${footingHeight.label}`,
        value: formatPerPanel(footingHeightSurcharge),
        amount: panelUnits * footingHeightSurcharge,
      });
    }
    if (footingMaterial && footingMaterialSurcharge > 0) {
      breakdown.push({
        label: `Podmurówka · ${footingMaterial.name}`,
        value: formatPerPanel(footingMaterialSurcharge),
        amount: panelUnits * footingMaterialSurcharge,
      });
    }
    if (footingPrice > 0) {
      breakdown.push({
        label: "Podmurówka",
        value: `${footingPerPanel.toLocaleString("pl-PL")} PLN/panel × ${panelUnits} paneli`,
        amount: footingPrice,
      });
    }
  }

  if (bramaEnabled) {
    breakdown.push({
      label: bramaElement?.name
        ? `Brama · ${bramaElement.name}`
        : "Brama wjazdowa",
      value: `${bramaUnitPrice.toLocaleString("pl-PL")} PLN netto`,
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
    perimeterM: fenceEnabled ? perimeterM : 0,
    estimatedPanels,
    panelUnits,
    pricePerPanelNet: fenceEnabled ? pricePerPanelNet : 0,
    pricePerMeterNet: fenceEnabled ? pricePerMeterNet : 0,
    fenceSubtotal,
    footingPrice,
    bramaPrice,
    furtkaPrice,
    totalNet,
    currency: settings.currency,
    breakdown,
    configurationItems,
    hasMeasuredPerimeter: Boolean(
      fenceEnabled && input.perimeterM && input.perimeterM > 0,
    ),
  };
}
