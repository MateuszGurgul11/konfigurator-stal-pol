import type { PricingSettings } from "@/lib/types";

export const DEFAULT_PANEL_PRICE_NET = 120;
export const DEFAULT_FOOTING_PRICE_NET = 50;

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  basePricePerMeterNet: 48,
  panelPriceNet: DEFAULT_PANEL_PRICE_NET,
  footingPriceNet: DEFAULT_FOOTING_PRICE_NET,
  panelWidthCm: 250,
  currency: "PLN",
};

/** Standardowa szerokość furtki panelowej (cm). */
export const WICKET_WIDTH_CM = 150;

/** Proporcja furtki do panelu przy domyślnej szerokości panelu (150/250). */
export const WICKET_PANEL_WIDTH_RATIO = WICKET_WIDTH_CM / DEFAULT_PRICING_SETTINGS.panelWidthCm;

export function getWicketWidthCm(_panelWidthCm?: number): number {
  return WICKET_WIDTH_CM;
}

export const PANEL_PRICE_BY_PATTERN: Record<string, number> = {
  "pattern-3d": 0,
  "pattern-palisade": 50,
  "pattern-panel-horizontal": 38,
};

export const COLOR_PRICE_BY_NAME: Record<string, number> = {
  "Ocynk naturalny": 0,
  "RAL 6005 zielony": 20,
  "RAL 7016 grafit": 20,
  "RAL 9005 czarny": 20,
  "RAL 9002 biały": 25,
};

export const HEIGHT_MULTIPLIER_BY_VALUE_M: Record<number, number> = {
  1.53: 1,
  1.8: 1.08,
  2: 1.15,
};

export const POST_PRICE_BY_SLUG: Record<string, number> = {
  standard: 0,
  reinforced: 30,
};

export const SPACER_PRICE_BY_NAME: Record<string, number> = {
  Ocynk: 0,
  "Malowanie proszkowe RAL": 38,
};

export const FOOTING_HEIGHT_SURCHARGE_BY_CM: Record<number, number> = {
  20: 0,
  30: 15,
  40: 30,
};

export const FOOTING_MATERIAL_SURCHARGE_BY_NAME: Record<string, number> = {
  "Beton szary": 0,
  "Klinkier czerwony": 25,
  "Stal malowana RAL": 18,
};

export function panelPriceForPattern(patternId: string): number {
  return PANEL_PRICE_BY_PATTERN[patternId] ?? 0;
}

export function colorPriceForName(name: string): number {
  return COLOR_PRICE_BY_NAME[name] ?? 0;
}

export function heightMultiplierForValueM(valueM: number): number {
  return HEIGHT_MULTIPLIER_BY_VALUE_M[valueM] ?? 1;
}

export function postPriceForSlug(slug: string): number {
  return POST_PRICE_BY_SLUG[slug] ?? 0;
}

export function spacerPriceForName(name: string): number {
  return SPACER_PRICE_BY_NAME[name] ?? 0;
}

export function footingHeightSurchargeForCm(heightCm: number): number {
  return FOOTING_HEIGHT_SURCHARGE_BY_CM[heightCm] ?? 0;
}

export function footingMaterialSurchargeForName(name: string): number {
  return FOOTING_MATERIAL_SURCHARGE_BY_NAME[name] ?? 0;
}
