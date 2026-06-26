import type { PricingSettings } from "@/lib/types";

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  basePricePerMeterNet: 300,
  panelWidthCm: 200,
  currency: "PLN",
};

export const PANEL_PRICE_BY_PATTERN: Record<string, number> = {
  "pattern-solid": 0,
  "pattern-lines": 25,
  "pattern-grid": 35,
  "pattern-brick": 45,
};

export const COLOR_PRICE_BY_NAME: Record<string, number> = {
  "Szary naturalny": 0,
  Piaskowy: 20,
  Antracyt: 25,
  Grafit: 30,
  Biały: 40,
  "Czerwony cegła": 50,
};

export const HEIGHT_MULTIPLIER_BY_VALUE_M: Record<number, number> = {
  1: 0.8,
  1.5: 0.92,
  1.75: 1,
  2: 1.12,
  2.25: 1.22,
};

export const POST_PRICE_BY_SLUG: Record<string, number> = {
  standard: 0,
  dekor: 20,
};

export const SPACER_PRICE_BY_NAME: Record<string, number> = {
  "Bez dystansu (pełne)": 0,
  "Z dystansem (ażurowe)": 40,
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
