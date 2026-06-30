import type {
  CatalogCollections,
  DrivewayGateKind,
  OpeningElement,
  OpeningElementType,
  OpeningInfillPatternId,
} from "@/lib/types";

export const DEFAULT_BRAMA_PRICE_NET = 1800;
export const DEFAULT_FURTKA_PRICE_NET = 900;

const DEFAULTS: Record<OpeningElementType, number> = {
  brama: DEFAULT_BRAMA_PRICE_NET,
  furtka: DEFAULT_FURTKA_PRICE_NET,
};

export function getElementsByType(
  catalog: CatalogCollections,
  type: OpeningElementType,
  activeOnly = true,
): OpeningElement[] {
  return catalog.elements
    .filter((e) => e.type === type && (!activeOnly || e.active))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function pickDefaultElementId(
  catalog: CatalogCollections,
  type: OpeningElementType,
): string | null {
  return getElementsByType(catalog, type)[0]?.id ?? null;
}

export function resolveElement(
  catalog: CatalogCollections,
  type: OpeningElementType,
  elementId?: string | null,
): OpeningElement | undefined {
  if (elementId) {
    const found = catalog.elements.find((e) => e.id === elementId);
    if (found) return found;
  }
  return getElementsByType(catalog, type)[0];
}

export function resolveElementPriceNet(
  catalog: CatalogCollections,
  type: OpeningElementType,
  elementId?: string | null,
): number {
  const element = resolveElement(catalog, type, elementId);
  if (element?.priceNet != null && element.priceNet >= 0) {
    return element.priceNet;
  }
  return DEFAULTS[type];
}

export function resolveDrivewayGateKind(
  element: OpeningElement | undefined,
): DrivewayGateKind {
  if (element?.gateKind) return element.gateKind;
  const name = element?.name.toLowerCase() ?? "";
  if (name.includes("przesuw")) return "sliding";
  return "double-leaf";
}

export function getBramaElementsByKind(
  catalog: CatalogCollections,
  kind: DrivewayGateKind,
): OpeningElement[] {
  return getElementsByType(catalog, "brama").filter(
    (e) => resolveDrivewayGateKind(e) === kind,
  );
}

export function getBramaElementIdByKind(
  catalog: CatalogCollections,
  kind: DrivewayGateKind,
): string | null {
  return getBramaElementsByKind(catalog, kind)[0]?.id ?? null;
}

export function resolveOpeningInfillPattern(
  element: OpeningElement | undefined,
): OpeningInfillPatternId {
  if (element?.infillPatternId) return element.infillPatternId;
  const name = element?.name.toLowerCase() ?? "";
  if (name.includes("palisad")) return "pattern-palisade";
  if (name.includes("poziom")) return "pattern-panel-horizontal";
  return "pattern-3d";
}

export function isDrivewayGateConfigured(elementId?: string | null): boolean {
  return Boolean(elementId);
}

export function pickBramaElementIdForKind(
  catalog: CatalogCollections,
  kind: DrivewayGateKind,
  currentElementId?: string | null,
): string | null {
  const options = getBramaElementsByKind(catalog, kind);
  if (options.length === 0) return null;
  const current = currentElementId
    ? catalog.elements.find((e) => e.id === currentElementId)
    : undefined;
  const preferredPattern = current
    ? resolveOpeningInfillPattern(current)
    : null;
  if (preferredPattern) {
    const samePattern = options.find(
      (e) => resolveOpeningInfillPattern(e) === preferredPattern,
    );
    if (samePattern) return samePattern.id;
  }
  return options[0]?.id ?? null;
}

/** Wzór wypełnienia bramy/furtki dziedziczony z wybranego modelu płotu. */
export function resolveFencePatternId(
  catalog: CatalogCollections,
  panelId?: string | null,
): OpeningInfillPatternId {
  const panel = panelId
    ? catalog.panels.find((p) => p.id === panelId)
    : undefined;
  const pid = panel?.patternId;
  if (pid === "pattern-palisade") return "pattern-palisade";
  if (pid === "pattern-panel-horizontal") return "pattern-panel-horizontal";
  return "pattern-3d";
}

/** Brama danego rodzaju, której wypełnienie pasuje do modelu płotu. */
export function pickBramaElementForPattern(
  catalog: CatalogCollections,
  kind: DrivewayGateKind,
  patternId: OpeningInfillPatternId,
): string | null {
  const options = getBramaElementsByKind(catalog, kind);
  if (options.length === 0) return null;
  const match = options.find(
    (e) => resolveOpeningInfillPattern(e) === patternId,
  );
  return (match ?? options[0]).id;
}

/** Furtka, której wypełnienie pasuje do modelu płotu. */
export function pickFurtkaElementForPattern(
  catalog: CatalogCollections,
  patternId: OpeningInfillPatternId,
): string | null {
  const options = getElementsByType(catalog, "furtka");
  if (options.length === 0) return null;
  const match = options.find(
    (e) => resolveOpeningInfillPattern(e) === patternId,
  );
  return (match ?? options[0]).id;
}

export function formatElementPriceSubtitle(
  element: OpeningElement,
): string {
  const price = element.priceNet?.toLocaleString("pl-PL") ?? "—";
  if (element.type === "brama") {
    return `${price} PLN / panel`;
  }
  return `${price} PLN jednorazowo`;
}
