import type { PricingSettings } from "@/lib/types";

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  basePricePerMeterNet: 48,
  panelWidthCm: 250,
  currency: "PLN",
};

export const PANEL_PRICE_BY_PATTERN: Record<string, number> = {
  "pattern-3d": 0,
  "pattern-palisade": 20,
  "pattern-panel-horizontal": 15,
};

export const COLOR_PRICE_BY_NAME: Record<string, number> = {
  "Ocynk naturalny": 0,
  "RAL 6005 zielony": 8,
  "RAL 7016 grafit": 8,
  "RAL 9005 czarny": 8,
  "RAL 9002 biały": 10,
};

export const HEIGHT_MULTIPLIER_BY_VALUE_M: Record<number, number> = {
  1.53: 1,
  1.8: 1.08,
  2: 1.15,
};

export const POST_PRICE_BY_SLUG: Record<string, number> = {
  standard: 0,
  reinforced: 12,
};

export const SPACER_PRICE_BY_NAME: Record<string, number> = {
  Ocynk: 0,
  "Malowanie proszkowe RAL": 15,
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
