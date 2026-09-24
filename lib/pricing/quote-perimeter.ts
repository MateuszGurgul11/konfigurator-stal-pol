export function estimatePerimeterFromPanels(
  panelCount: number,
  panelWidthCm: number,
): number {
  return panelCount * (panelWidthCm / 100);
}

/** Zgodne z DEFAULT_PREVIEW_PANELS w state — bez importu cyklicznego. */
const DEFAULT_MANUAL_PANEL_COUNT = 5;

export function defaultManualQuotePerimeterM(panelWidthCm: number): number {
  return estimatePerimeterFromPanels(DEFAULT_MANUAL_PANEL_COUNT, panelWidthCm);
}

export function sumSideLengthsM(sides: number[]): number {
  return sides.reduce((sum, len) => {
    const n = Number(len);
    return sum + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
}

export type ManualQuoteSide = {
  id: string;
  lengthM: number;
};

export function createManualQuoteSide(lengthM = 0): ManualQuoteSide {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `side-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    lengthM,
  };
}

export function sumManualQuoteSidesM(sides: ManualQuoteSide[]): number {
  return sumSideLengthsM(sides.map((s) => s.lengthM));
}

export function sideLengthLabel(index: number): string {
  return String.fromCharCode(65 + (index % 26));
}

export type QuoteFenceScope = "full-perimeter" | "front-only";

export function resolveQuotePerimeterM(params: {
  quoteFenceClosed: boolean;
  quotePerimeterM: number | null;
  quoteFenceScope: QuoteFenceScope;
  manualQuotePerimeterM: number;
  manualQuoteFrontLengthM: number;
}): number | null {
  if (
    params.quoteFenceClosed &&
    params.quotePerimeterM != null &&
    params.quotePerimeterM > 0
  ) {
    return params.quotePerimeterM;
  }
  const manualValue =
    params.quoteFenceScope === "front-only"
      ? params.manualQuoteFrontLengthM
      : params.manualQuotePerimeterM;
  if (manualValue > 0) {
    return manualValue;
  }
  return null;
}
