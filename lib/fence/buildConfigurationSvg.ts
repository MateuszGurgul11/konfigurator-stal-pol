import type { PatternId } from "@/lib/fence/patterns";
import { buildFenceSvg } from "@/lib/fence/renderFence";
import {
  type GatePosition,
  type ProductScope,
  type WicketHingeSide,
  clampWicketInsertAfter,
  getWicketInsertAfterIndex,
} from "@/lib/configurator/state";
import {
  isDrivewayGateConfigured,
  resolveDrivewayGateKind,
  resolveElement,
} from "@/lib/pricing/element-prices";
import { getWicketWidthCm, resolvePanelWidthCm } from "@/lib/pricing/variant-prices";
import type {
  CatalogCollections,
  ConfiguratorSelection,
  PricingSettings,
} from "@/lib/types";

export type ConfigurationSvgInput = {
  catalog: CatalogCollections;
  selection: ConfiguratorSelection;
  pricing: PricingSettings;
  scope: ProductScope;
  bramaEnabled: boolean;
  bramaElementId: string | null;
  furtkaEnabled: boolean;
  furtkaElementId: string | null;
  furtkaPosition: GatePosition;
  furtkaInsertAfter?: number;
  bramaInsertAfter?: number;
  furtkaHingeSide: WicketHingeSide;
  footingEnabled: boolean;
  footingHeightId: string | null;
  footingMaterialId: string | null;
};

type PdfPanelLayout = {
  panelCount: number;
  drivewayGateEnabled: boolean;
  wicketInsertAfter?: number;
  drivewayGateInsertAfter?: number;
};

function resolvePdfPanelLayout(input: ConfigurationSvgInput): PdfPanelLayout {
  const hasDrivewayGate =
    input.scope.gate &&
    input.bramaEnabled &&
    isDrivewayGateConfigured(input.bramaElementId);
  const hasWicket =
    input.scope.wicket &&
    input.furtkaEnabled &&
    Boolean(input.furtkaElementId);

  if (!input.scope.fence) {
    return {
      panelCount: hasDrivewayGate ? 2 : 0,
      drivewayGateEnabled: hasDrivewayGate,
      wicketInsertAfter: hasWicket ? -1 : undefined,
      drivewayGateInsertAfter: hasDrivewayGate ? -1 : undefined,
    };
  }

  let panelCount = 4;

  if (hasDrivewayGate && hasWicket) {
    panelCount = 5;
  } else if (hasDrivewayGate) {
    panelCount = 5;
  } else if (hasWicket) {
    panelCount = 3;
  }

  const wicketInsertAfter = hasWicket
    ? clampWicketInsertAfter(
        input.furtkaInsertAfter ??
          getWicketInsertAfterIndex(input.furtkaPosition, panelCount, {
            drivewayGateEnabled: hasDrivewayGate,
          }),
        panelCount,
        hasDrivewayGate,
      )
    : undefined;

  const drivewayGateInsertAfter = hasDrivewayGate
    ? clampWicketInsertAfter(
        input.bramaInsertAfter ?? -1,
        panelCount,
        true,
      )
    : undefined;

  return {
    panelCount,
    drivewayGateEnabled: hasDrivewayGate,
    wicketInsertAfter,
    drivewayGateInsertAfter,
  };
}

export function buildConfigurationSvg(
  input: ConfigurationSvgInput,
): string | null {
  const { catalog, selection, pricing } = input;

  const post = catalog.posts.find((p) => p.id === selection.postId);
  const panel = catalog.panels.find((p) => p.id === selection.panelId);
  const spacer = catalog.spacerOptions.find((s) => s.id === selection.spacerId);
  const height = catalog.heights.find((h) => h.id === selection.heightId);
  const color = catalog.colors.find((c) => c.id === selection.colorId);

  if (!post || !panel || !spacer || !height || !color) return null;

  const panelWidthCm = resolvePanelWidthCm(panel, pricing);

  const { panelCount, drivewayGateEnabled, wicketInsertAfter, drivewayGateInsertAfter } =
    resolvePdfPanelLayout(input);

  const bramaElement = drivewayGateEnabled
    ? resolveElement(catalog, "brama", input.bramaElementId)
    : undefined;
  const drivewayGateKind = bramaElement
    ? resolveDrivewayGateKind(bramaElement)
    : undefined;

  const footingHeight = catalog.footingHeights.find(
    (h) => h.id === input.footingHeightId,
  );
  const footingMaterial = catalog.footingMaterials.find(
    (m) => m.id === input.footingMaterialId,
  );

  return buildFenceSvg({
    heightM: height.valueM,
    patternId: panel.patternId as PatternId,
    colorHex: color.hex,
    postWidthCm: post.widthCm,
    hasSpacer: spacer.hasSpacer,
    openness: spacer.openness,
    panelCount,
    panelWidthCm,
    wicketWidthCm: getWicketWidthCm(panelWidthCm),
    wicketInsertAfter,
    drivewayGateEnabled,
    drivewayGateKind,
    drivewayGateInsertAfter,
    drivewayGateInfillPatternId: panel.patternId as PatternId,
    footingEnabled: input.footingEnabled,
    footingHeightCm: footingHeight?.heightCm ?? 20,
    footingColorHex: footingMaterial?.hex ?? "#9ca3af",
    wicketHingeSide: input.furtkaHingeSide,
    transparent: false,
  });
}
