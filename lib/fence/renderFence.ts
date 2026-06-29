import type { PatternId } from "./patterns";
import { getWicketWidthCm } from "@/lib/pricing/variant-prices";
import type { WicketHingeSide } from "@/lib/configurator/state";

export type { WicketHingeSide };

export type FenceRenderParams = {
  heightM: number;
  patternId: PatternId;
  colorHex: string;
  postWidthCm: number;
  hasSpacer: boolean;
  openness: number;
  panelCount?: number;
  panelWidthCm?: number;
  wicketWidthCm?: number;
  /** Indeks panela po którym wstawiamy furtkę (-1 = przed pierwszym). */
  wicketInsertAfter?: number;
  footingEnabled?: boolean;
  footingHeightCm?: number;
  footingColorHex?: string;
  wicketHingeSide?: WicketHingeSide;
  /** Bez tła nieba/trawy — do podglądu na ciemnym tle sceny */
  transparent?: boolean;
  panelTextureUrl?: string | null;
  postTextureUrl?: string | null;
  openingTextureUrl?: string | null;
  textureTileCount?: number;
};

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function drawTexturedStack(
  px: number,
  py: number,
  w: number,
  h: number,
  url: string,
  tileCount: number,
): string {
  const safeUrl = escapeXmlAttr(url);
  const tiles = Math.max(1, tileCount);
  const tileH = h / tiles;
  let out = "";
  for (let i = 0; i < tiles; i++) {
    out += `<image href="${safeUrl}" x="${px.toFixed(1)}" y="${(py + i * tileH).toFixed(1)}" width="${w.toFixed(1)}" height="${tileH.toFixed(1)}" preserveAspectRatio="none"/>`;
  }
  return out;
}

export const BASE_HEIGHT_M = 2.25;
export const VIEW_W = 900;
export const VIEW_H = 440;
const MARGIN_X = 80;
const SECTION_WIDTH = 230;
const DEFAULT_PANEL_WIDTH_CM = 250;

export type ViewWidthOptions = {
  hasWicket?: boolean;
  wicketWidthCm?: number;
  panelWidthCm?: number;
};

export function wicketSectionPx(
  wicketWidthCm: number,
  panelWidthCm: number,
): number {
  return SECTION_WIDTH * (wicketWidthCm / panelWidthCm);
}

export function getViewWidth(
  panelCount: number,
  options?: ViewWidthOptions,
): number {
  const base = MARGIN_X * 2 + panelCount * SECTION_WIDTH;
  if (!options?.hasWicket) return base;
  const panelCm = options.panelWidthCm ?? DEFAULT_PANEL_WIDTH_CM;
  const wicketCm = options.wicketWidthCm ?? getWicketWidthCm(panelCm);
  return base + wicketSectionPx(wicketCm, panelCm);
}

type FenceSegment = { type: "panel" | "wicket" };

export function buildFenceSegments(
  panelCount: number,
  wicketInsertAfter?: number,
): FenceSegment[] {
  const hasWicket = wicketInsertAfter !== undefined;
  const segments: FenceSegment[] = [];
  if (hasWicket && wicketInsertAfter! < 0) {
    segments.push({ type: "wicket" });
  }
  for (let i = 0; i < panelCount; i++) {
    segments.push({ type: "panel" });
    if (hasWicket && wicketInsertAfter === i) {
      segments.push({ type: "wicket" });
    }
  }
  return segments;
}

function segmentWidthWeights(
  segments: FenceSegment[],
  wicketWidthCm: number,
  panelWidthCm: number,
): number[] {
  const wicketPx = wicketSectionPx(wicketWidthCm, panelWidthCm);
  return segments.map((s) => (s.type === "panel" ? SECTION_WIDTH : wicketPx));
}

type FenceGeometry = {
  viewW: number;
  groundY: number;
  fenceH: number;
  fenceY: number;
  postW: number;
  leftPost: number;
  rightPost: number;
  fenceCenterX: number;
  totalW: number;
  panelCount: number;
};

function computeFenceGeometry(
  heightM: number,
  postWidthCm: number,
  panelCount = 3,
  viewOptions?: ViewWidthOptions,
): FenceGeometry {
  const scale = heightM / BASE_HEIGHT_M;
  const groundY = 330;
  const fenceH = Math.round(240 * scale);
  const fenceY = groundY - fenceH;
  const postW = Math.max(10, Math.round((postWidthCm / 20) * 14));
  const viewW = getViewWidth(panelCount, viewOptions);
  const totalW = viewW - MARGIN_X * 2;
  const leftPost = MARGIN_X;
  const rightPost = MARGIN_X + totalW - postW;
  const fenceCenterX = MARGIN_X + totalW / 2;

  return {
    viewW,
    groundY,
    fenceH,
    fenceY,
    postW,
    leftPost,
    rightPost,
    fenceCenterX,
    totalW,
    panelCount,
  };
}

export type FenceAnchor = {
  x: number;
  y: number;
  labelSide: "left" | "right" | "top" | "bottom";
};

export type FenceAnchorPoints = {
  height: FenceAnchor;
  length: FenceAnchor;
  material: FenceAnchor;
  color: FenceAnchor;
};

type PlankLayout = {
  useStacked: boolean;
  plankCount: number;
  slitGap: number;
  plankH: number;
};

function computePlankLayout(
  fenceH: number,
  hasSpacer: boolean,
  openness: number,
): PlankLayout {
  const useStacked = hasSpacer && openness > 0;
  const plankCount = useStacked
    ? Math.min(8, Math.max(4, Math.round(fenceH / 42)))
    : 1;
  const slitGap = useStacked ? 3 + openness * 10 : 0;
  const plankH = (fenceH - slitGap * (plankCount - 1)) / plankCount;
  return { useStacked, plankCount, slitGap, plankH };
}

export function getFenceAnchorPoints(params: {
  heightM: number;
  postWidthCm: number;
  hasSpacer?: boolean;
  openness?: number;
}): FenceAnchorPoints {
  const { groundY, fenceH, fenceY, postW, leftPost, rightPost, fenceCenterX } =
    computeFenceGeometry(params.heightM, params.postWidthCm);
  const { plankH } = computePlankLayout(
    fenceH,
    params.hasSpacer ?? false,
    params.openness ?? 0,
  );

  return {
    height: {
      x: leftPost + postW / 2,
      y: fenceY + fenceH / 2,
      labelSide: "left",
    },
    length: { x: fenceCenterX, y: groundY - 4, labelSide: "bottom" },
    material: {
      x: fenceCenterX,
      y: fenceY + plankH / 2,
      labelSide: "top",
    },
    color: {
      x: rightPost + postW / 2,
      y: fenceY + fenceH / 2,
      labelSide: "right",
    },
  };
}

export type FenceContentBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function getFenceContentBounds(params: {
  heightM: number;
  postWidthCm: number;
  panelCount?: number;
  hasWicket?: boolean;
  wicketWidthCm?: number;
  panelWidthCm?: number;
}): FenceContentBounds {
  const viewOptions: ViewWidthOptions | undefined = params.hasWicket
    ? {
        hasWicket: true,
        wicketWidthCm: params.wicketWidthCm,
        panelWidthCm: params.panelWidthCm,
      }
    : undefined;
  const { groundY, fenceY, postW, leftPost, rightPost } = computeFenceGeometry(
    params.heightM,
    params.postWidthCm,
    params.panelCount ?? 3,
    viewOptions,
  );
  const capTop = fenceY - 6;
  const footingBottom = groundY + 6;

  return {
    x: leftPost - 6,
    y: capTop,
    width: rightPost + postW - leftPost + 12,
    height: footingBottom - capTop,
  };
}

export function anchorToPercent(anchor: FenceAnchor): { left: string; top: string } {
  return {
    left: `${(anchor.x / VIEW_W) * 100}%`,
    top: `${(anchor.y / VIEW_H) * 100}%`,
  };
}

export function anchorToBoundsPercent(
  anchor: FenceAnchor,
  bounds: FenceContentBounds,
): { left: string; top: string } {
  return {
    left: `${((anchor.x - bounds.x) / bounds.width) * 100}%`,
    top: `${((anchor.y - bounds.y) / bounds.height) * 100}%`,
  };
}

function darken(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  const r = Math.max(0, Math.round(parseInt(n.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(n.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(n.slice(4, 6), 16) * (1 - amount)));
  return `rgb(${r},${g},${b})`;
}

function lighten(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  const r = Math.min(255, Math.round(parseInt(n.slice(0, 2), 16) + amount * 255));
  const g = Math.min(255, Math.round(parseInt(n.slice(2, 4), 16) + amount * 255));
  const b = Math.min(255, Math.round(parseInt(n.slice(4, 6), 16) + amount * 255));
  return `rgb(${r},${g},${b})`;
}

function draw3DMeshPanel(
  px: number,
  y: number,
  sectionW: number,
  h: number,
  colorHex: string,
  shadowEdge: string,
  shadowBottom: string,
): string {
  const railH = Math.max(4, h * 0.055);
  const meshY = y + railH;
  const meshH = Math.max(0, h - railH * 2);
  const meshX = px;
  const meshW = sectionW;
  const vPitch = Math.max(3.5, Math.min(5.5, sectionW * 0.028));
  const hPitch = Math.max(16, Math.min(24, meshH * 0.11));
  const stroke = darken(colorHex, 0.28);
  const highlight = lighten(colorHex, 0.1);
  const frameLight = lighten(colorHex, 0.08);
  const wireW = 1.15;

  let out = "";

  out += `<rect x="${px.toFixed(1)}" y="${y.toFixed(1)}" width="${sectionW.toFixed(1)}" height="${railH.toFixed(1)}" fill="${colorHex}" rx="1"/>`;
  out += `<rect x="${px.toFixed(1)}" y="${y.toFixed(1)}" width="${sectionW.toFixed(1)}" height="2" fill="${frameLight}" opacity="0.55"/>`;
  out += `<rect x="${px.toFixed(1)}" y="${(y + h - railH).toFixed(1)}" width="${sectionW.toFixed(1)}" height="${railH.toFixed(1)}" fill="${colorHex}" rx="1"/>`;
  out += `<rect x="${px.toFixed(1)}" y="${(y + h - railH).toFixed(1)}" width="${sectionW.toFixed(1)}" height="2" fill="${shadowBottom}" opacity="0.45"/>`;

  if (meshH > 4 && meshW > 4) {
    const spikeH = Math.max(2, railH * 0.45);
    for (let vx = meshX + vPitch * 0.5; vx < meshX + meshW; vx += vPitch) {
      out += `<line x1="${vx.toFixed(1)}" y1="${(meshY - spikeH).toFixed(1)}" x2="${vx.toFixed(1)}" y2="${(meshY + meshH).toFixed(1)}" stroke="${stroke}" stroke-width="${wireW}" opacity="0.8"/>`;
    }

    for (let hy = meshY + hPitch * 0.5; hy < meshY + meshH; hy += hPitch) {
      out += `<line x1="${meshX.toFixed(1)}" y1="${hy.toFixed(1)}" x2="${(meshX + meshW).toFixed(1)}" y2="${hy.toFixed(1)}" stroke="${stroke}" stroke-width="${wireW * 0.9}" opacity="0.72"/>`;
    }

    const foldDepth = Math.max(4, meshH * 0.04);
    const foldBandH = Math.max(3, meshH * 0.025);
    for (const ratio of [0.22, 0.5, 0.78]) {
      const bandY = meshY + meshH * ratio - foldBandH / 2;
      const segW = vPitch * 2.2;
      for (let sx = meshX; sx < meshX + meshW - 1; sx += segW) {
        const ex = Math.min(meshX + meshW, sx + segW);
        const midX = (sx + ex) / 2;
        const tipY = bandY + foldBandH / 2 + foldDepth;
        out += `<polyline points="${sx.toFixed(1)},${bandY.toFixed(1)} ${midX.toFixed(1)},${tipY.toFixed(1)} ${ex.toFixed(1)},${bandY.toFixed(1)}" fill="none" stroke="${highlight}" stroke-width="${wireW * 1.1}" opacity="0.85"/>`;
      }
    }
  }

  out += `<rect x="${(px + sectionW - 2).toFixed(1)}" y="${y.toFixed(1)}" width="2" height="${h.toFixed(1)}" fill="${shadowEdge}" opacity="0.35"/>`;

  return out;
}

function drawHorizontalPanel(
  px: number,
  y: number,
  sectionW: number,
  h: number,
  openness: number,
  colorHex: string,
  shadowEdge: string,
  shadowBottom: string,
): string {
  const frame = Math.max(3, sectionW * 0.045);
  const innerX = px + frame;
  const innerY = y + frame;
  const innerW = sectionW - frame * 2;
  const innerH = h - frame * 2;
  const highlight = lighten(colorHex, 0.1);
  const slatCount = 7;
  const gapRatio = Math.min(0.35, 0.22 + openness * 0.18);
  const pitch = innerH / slatCount;
  const slatH = pitch * (1 - gapRatio);
  const gap = pitch - slatH;

  let out = "";

  out += `<rect x="${px.toFixed(1)}" y="${y.toFixed(1)}" width="${frame.toFixed(1)}" height="${h.toFixed(1)}" fill="${colorHex}" rx="1"/>`;
  out += `<rect x="${(px + sectionW - frame).toFixed(1)}" y="${y.toFixed(1)}" width="${frame.toFixed(1)}" height="${h.toFixed(1)}" fill="${colorHex}" rx="1"/>`;
  out += `<rect x="${px.toFixed(1)}" y="${y.toFixed(1)}" width="${sectionW.toFixed(1)}" height="${frame.toFixed(1)}" fill="${colorHex}" rx="1"/>`;
  out += `<rect x="${px.toFixed(1)}" y="${(y + h - frame).toFixed(1)}" width="${sectionW.toFixed(1)}" height="${frame.toFixed(1)}" fill="${colorHex}" rx="1"/>`;

  for (let i = 0; i < slatCount; i++) {
    const sy = innerY + i * pitch + gap / 2;
    out += `<rect x="${innerX.toFixed(1)}" y="${sy.toFixed(1)}" width="${innerW.toFixed(1)}" height="${slatH.toFixed(1)}" fill="${colorHex}" rx="1"/>`;
    out += `<rect x="${innerX.toFixed(1)}" y="${sy.toFixed(1)}" width="${innerW.toFixed(1)}" height="1.5" fill="${highlight}" opacity="0.55"/>`;
    out += `<rect x="${innerX.toFixed(1)}" y="${(sy + slatH - 1.5).toFixed(1)}" width="${innerW.toFixed(1)}" height="1.5" fill="${shadowBottom}" opacity="0.4"/>`;
  }

  out += `<rect x="${(px + sectionW - 2).toFixed(1)}" y="${y.toFixed(1)}" width="2" height="${h.toFixed(1)}" fill="${shadowEdge}" opacity="0.35"/>`;

  return out;
}

function drawFootingPlinth(
  x: number,
  fenceBottomY: number,
  w: number,
  heightCm: number,
  colorHex: string,
): string {
  if (w <= 0) return "";
  const refHeightCm = 20;
  const plinthH = Math.max(10, 14 * (heightCm / refHeightCm));
  const plinthY = fenceBottomY - plinthH;
  const base = colorHex;
  const light = lighten(colorHex, 0.12);
  const dark = darken(colorHex, 0.22);
  const inset = Math.max(3, plinthH * 0.28);

  let out = "";
  out += `<rect x="${x.toFixed(1)}" y="${plinthY.toFixed(1)}" width="${w.toFixed(1)}" height="${plinthH.toFixed(1)}" fill="${base}" rx="1"/>`;
  out += `<rect x="${(x + inset).toFixed(1)}" y="${(plinthY + 2).toFixed(1)}" width="${(w - inset * 2).toFixed(1)}" height="${(plinthH - 4).toFixed(1)}" fill="none" stroke="${dark}" stroke-width="1" opacity="0.35"/>`;
  out += `<rect x="${(x + inset + 2).toFixed(1)}" y="${(plinthY + 4).toFixed(1)}" width="${(w - inset * 2 - 4).toFixed(1)}" height="${(plinthH - 8).toFixed(1)}" fill="${light}" opacity="0.25"/>`;
  return out;
}

function drawFootingPlinthSegments(
  fenceBottomY: number,
  segments: { x: number; w: number }[],
  heightCm: number,
  colorHex: string,
): string {
  return segments
    .map((s) => drawFootingPlinth(s.x, fenceBottomY, s.w, heightCm, colorHex))
    .join("\n");
}

function draw3DMeshInfill(
  px: number,
  y: number,
  w: number,
  h: number,
  colorHex: string,
): string {
  const vPitch = Math.max(3, Math.min(5, w * 0.028));
  const hPitch = Math.max(14, Math.min(22, h * 0.11));
  const stroke = darken(colorHex, 0.28);
  const highlight = lighten(colorHex, 0.1);
  const wireW = 1.1;
  let out = "";

  for (let vx = px + vPitch * 0.5; vx < px + w; vx += vPitch) {
    out += `<line x1="${vx.toFixed(1)}" y1="${y.toFixed(1)}" x2="${vx.toFixed(1)}" y2="${(y + h).toFixed(1)}" stroke="${stroke}" stroke-width="${wireW}" opacity="0.8"/>`;
  }
  for (let hy = y + hPitch * 0.5; hy < y + h; hy += hPitch) {
    out += `<line x1="${px.toFixed(1)}" y1="${hy.toFixed(1)}" x2="${(px + w).toFixed(1)}" y2="${hy.toFixed(1)}" stroke="${stroke}" stroke-width="${wireW * 0.9}" opacity="0.72"/>`;
  }
  const foldDepth = Math.max(3, h * 0.04);
  const foldBandH = Math.max(2.5, h * 0.025);
  for (const ratio of [0.22, 0.5, 0.78]) {
    const bandY = y + h * ratio - foldBandH / 2;
    const segW = vPitch * 2.2;
    for (let sx = px; sx < px + w - 1; sx += segW) {
      const ex = Math.min(px + w, sx + segW);
      const midX = (sx + ex) / 2;
      const tipY = bandY + foldBandH / 2 + foldDepth;
      out += `<polyline points="${sx.toFixed(1)},${bandY.toFixed(1)} ${midX.toFixed(1)},${tipY.toFixed(1)} ${ex.toFixed(1)},${bandY.toFixed(1)}" fill="none" stroke="${highlight}" stroke-width="${wireW}" opacity="0.85"/>`;
    }
  }
  return out;
}

function drawHorizontalInfill(
  px: number,
  y: number,
  w: number,
  h: number,
  openness: number,
  colorHex: string,
  shadowEdge: string,
  shadowBottom: string,
): string {
  const slatCount = 7;
  const gapRatio = Math.min(0.35, 0.22 + openness * 0.18);
  const pitch = h / slatCount;
  const slatH = pitch * (1 - gapRatio);
  const slatGap = pitch - slatH;
  const highlight = lighten(colorHex, 0.1);
  let out = "";
  for (let i = 0; i < slatCount; i++) {
    const sy = y + i * pitch + slatGap / 2;
    out += `<rect x="${px.toFixed(1)}" y="${sy.toFixed(1)}" width="${w.toFixed(1)}" height="${slatH.toFixed(1)}" fill="${colorHex}" rx="1"/>`;
    out += `<rect x="${px.toFixed(1)}" y="${sy.toFixed(1)}" width="${w.toFixed(1)}" height="1.5" fill="${highlight}" opacity="0.55"/>`;
    out += `<rect x="${px.toFixed(1)}" y="${(sy + slatH - 1.5).toFixed(1)}" width="${w.toFixed(1)}" height="1.5" fill="${shadowBottom}" opacity="0.4"/>`;
  }
  out += `<rect x="${(px + w - 1.5).toFixed(1)}" y="${y.toFixed(1)}" width="1.5" height="${h.toFixed(1)}" fill="${shadowEdge}" opacity="0.3"/>`;
  return out;
}

function drawMeshInfill(
  px: number,
  y: number,
  w: number,
  h: number,
  hasSpacer: boolean,
  openness: number,
  colorHex: string,
  shadowEdge: string,
  shadowBottom: string,
  patternId: PatternId,
): string {
  if (patternId === "pattern-palisade") {
    return drawPalisadeSlats(px, y, w, h, openness, colorHex, shadowEdge, shadowBottom);
  }
  if (patternId === "pattern-panel-horizontal") {
    return drawHorizontalInfill(px, y, w, h, openness, colorHex, shadowEdge, shadowBottom);
  }
  if (patternId === "pattern-3d") {
    return draw3DMeshInfill(px, y, w, h, colorHex);
  }
  const { useStacked, plankCount, slitGap, plankH } = computePlankLayout(
    h,
    hasSpacer,
    openness,
  );
  let out = "";
  if (useStacked) {
    for (let j = 0; j < plankCount; j++) {
      const py = y + j * (plankH + slitGap);
      out += drawPlank(px, py, w, plankH, shadowEdge, shadowBottom);
    }
  } else {
    out += drawPlank(px, y, w, h, shadowEdge, shadowBottom);
  }
  return out;
}

function drawWicketFrame(
  gateX: number,
  y: number,
  gateW: number,
  h: number,
  frameT: number,
  colorHex: string,
  shadowBottom: string,
): string {
  const frameLight = lighten(colorHex, 0.08);
  return `<!-- Wicket frame -->
    <rect x="${gateX.toFixed(1)}" y="${y.toFixed(1)}" width="${gateW.toFixed(1)}" height="${frameT.toFixed(1)}" fill="${colorHex}" rx="0.5"/>
    <rect x="${gateX.toFixed(1)}" y="${y.toFixed(1)}" width="${gateW.toFixed(1)}" height="1.5" fill="${frameLight}" opacity="0.55"/>
    <rect x="${gateX.toFixed(1)}" y="${(y + h - frameT).toFixed(1)}" width="${gateW.toFixed(1)}" height="${frameT.toFixed(1)}" fill="${colorHex}" rx="0.5"/>
    <rect x="${gateX.toFixed(1)}" y="${(y + h - frameT).toFixed(1)}" width="${gateW.toFixed(1)}" height="1.5" fill="${shadowBottom}" opacity="0.45"/>
    <rect x="${gateX.toFixed(1)}" y="${y.toFixed(1)}" width="${frameT.toFixed(1)}" height="${h.toFixed(1)}" fill="${colorHex}" rx="0.5"/>
    <rect x="${(gateX + gateW - frameT).toFixed(1)}" y="${y.toFixed(1)}" width="${frameT.toFixed(1)}" height="${h.toFixed(1)}" fill="${colorHex}" rx="0.5"/>`;
}

// Ocynkowane (jasny metal) okucia — stały kolor, by kontrastowały z dowolną
// barwą ramy/słupka, tak jak na zdjęciach referencyjnych.
const GALV_BODY = "#cdd2d8";
const GALV_EDGE = "#5f656c";
const GALV_HI = "#f1f4f7";
const GALV_BOLT = "#3f444b";

function drawWicketHinges(
  segmentEdgeX: number,
  postW: number,
  y: number,
  h: number,
  _colorHex: string,
  side: WicketHingeSide,
): string {
  // Regulowany zawias śrubowy spinający słupek z ramą skrzydła: pozioma śruba z
  // nakrętką + walcowy korpus na linii styku. Dwa zawiasy — górny i dolny.
  const postDir = side === "right" ? 1 : -1; // kierunek od styku w stronę słupka
  const postArm = Math.max(7, postW * 0.85); // ramię na słupku (mocowanie)
  const frameArm = Math.max(4, h * 0.022); // ramię na ramie skrzydła
  const strapH = Math.max(2.6, h * 0.016);
  const barrelW = Math.max(4, postW * 0.5);
  const barrelH = Math.max(9, h * 0.055);
  const strapW = postArm + frameArm;
  const strapX = postDir > 0 ? segmentEdgeX - frameArm : segmentEdgeX - postArm;
  const boltX = segmentEdgeX + postDir * postArm * 0.62;

  const hinge = (cy: number) => `
    <rect x="${strapX.toFixed(1)}" y="${(cy - strapH / 2).toFixed(1)}" width="${strapW.toFixed(1)}" height="${strapH.toFixed(1)}" fill="${GALV_BODY}" stroke="${GALV_EDGE}" stroke-width="0.6" rx="1"/>
    <rect x="${(segmentEdgeX - barrelW / 2).toFixed(1)}" y="${(cy - barrelH / 2).toFixed(1)}" width="${barrelW.toFixed(1)}" height="${barrelH.toFixed(1)}" fill="${GALV_BODY}" stroke="${GALV_EDGE}" stroke-width="0.7" rx="${(barrelW / 2).toFixed(1)}"/>
    <rect x="${(segmentEdgeX - barrelW / 2 + 0.6).toFixed(1)}" y="${(cy - barrelH / 2 + 0.6).toFixed(1)}" width="1.2" height="${(barrelH - 1.2).toFixed(1)}" fill="${GALV_HI}" opacity="0.85" rx="0.6"/>
    <circle cx="${boltX.toFixed(1)}" cy="${cy.toFixed(1)}" r="${Math.max(1.6, barrelW * 0.32).toFixed(1)}" fill="${GALV_BOLT}"/>
    <circle cx="${boltX.toFixed(1)}" cy="${cy.toFixed(1)}" r="${Math.max(0.7, barrelW * 0.14).toFixed(1)}" fill="${GALV_HI}" opacity="0.7"/>`;

  return `<!-- Wicket hinges -->
    ${hinge(y + h * 0.17)}
    ${hinge(y + h * 0.74)}`;
}

function drawWicketHandle(
  gateX: number,
  gateW: number,
  y: number,
  h: number,
  frameT: number,
  _colorHex: string,
  side: WicketHingeSide,
): string {
  // Czarny zamek z dźwignią na pionowym szyldzie, na listwie zatrzaskowej.
  // Dźwignia skierowana do wnętrza skrzydła (w stronę zawiasów).
  const hwBlack = "#23262b";
  const hwEdge = "#0e0f12";
  const hwHi = "#6b7178";
  const plateW = Math.max(6, frameT * 1.7);
  const plateH = Math.max(16, h * 0.15);
  const plateX =
    side === "left"
      ? gateX + frameT + 0.5
      : gateX + gateW - frameT - plateW - 0.5;
  const plateY = y + h * 0.42 - plateH / 2;
  const plateCx = plateX + plateW / 2;
  // Dźwignia: skierowana do środka skrzydła (przeciwnie do strony zatrzasku).
  const inward = side === "left" ? 1 : -1;
  const leverLen = Math.max(8, Math.min(gateW * 0.26, plateH * 0.7));
  const leverThick = Math.max(2.4, plateW * 0.42);
  const leverY = plateY + plateH * 0.32;
  const hubR = Math.max(2.4, plateW * 0.45);
  const hubY = leverY + leverThick / 2;
  const leverX = inward > 0 ? plateCx : plateCx - leverLen;
  const tipX = inward > 0 ? plateCx + leverLen : plateCx - leverLen;
  const lockY = plateY + plateH - Math.max(5, plateH * 0.26);
  return `<!-- Wicket handle -->
    <rect x="${plateX.toFixed(1)}" y="${plateY.toFixed(1)}" width="${plateW.toFixed(1)}" height="${plateH.toFixed(1)}" fill="${hwBlack}" stroke="${hwEdge}" stroke-width="0.6" rx="${Math.min(plateW / 2, 2.4).toFixed(1)}"/>
    <rect x="${(plateX + 0.7).toFixed(1)}" y="${(plateY + 0.7).toFixed(1)}" width="0.9" height="${(plateH - 1.4).toFixed(1)}" fill="${hwHi}" opacity="0.5"/>
    <circle cx="${plateCx.toFixed(1)}" cy="${hubY.toFixed(1)}" r="${hubR.toFixed(1)}" fill="${hwBlack}" stroke="${hwEdge}" stroke-width="0.6"/>
    <rect x="${leverX.toFixed(1)}" y="${leverY.toFixed(1)}" width="${leverLen.toFixed(1)}" height="${leverThick.toFixed(1)}" fill="${hwBlack}" stroke="${hwEdge}" stroke-width="0.5" rx="${(leverThick / 2).toFixed(1)}"/>
    <rect x="${leverX.toFixed(1)}" y="${(leverY + 0.4).toFixed(1)}" width="${leverLen.toFixed(1)}" height="0.8" fill="${hwHi}" opacity="0.55" rx="0.4"/>
    <circle cx="${tipX.toFixed(1)}" cy="${(leverY + leverThick / 2).toFixed(1)}" r="${(leverThick * 0.62).toFixed(1)}" fill="${hwBlack}" stroke="${hwEdge}" stroke-width="0.5"/>
    <circle cx="${plateCx.toFixed(1)}" cy="${lockY.toFixed(1)}" r="${Math.max(1.6, plateW * 0.3).toFixed(1)}" fill="#0c0d10" stroke="${hwHi}" stroke-width="0.5"/>
    <rect x="${(plateCx - 0.5).toFixed(1)}" y="${lockY.toFixed(1)}" width="1" height="2.4" fill="#0c0d10"/>`;
}

function drawWicketStriker(
  segmentEdgeX: number,
  segmentW: number,
  postW: number,
  y: number,
  h: number,
  colorHex: string,
  side: WicketHingeSide,
): string {
  const plateW = Math.max(2.5, postW * 0.3);
  const plateH = Math.max(12, h * 0.11);
  const plateX =
    side === "right"
      ? segmentEdgeX + segmentW - plateW - 1
      : segmentEdgeX + 1;
  const plateY = y + h * 0.44 - plateH / 2;
  const fill = darken(colorHex, 0.3);
  return `<!-- Wicket striker -->
    <rect x="${plateX.toFixed(1)}" y="${plateY.toFixed(1)}" width="${plateW.toFixed(1)}" height="${plateH.toFixed(1)}" fill="${fill}" rx="0.5" opacity="0.85"/>`;
}

function drawPostClamp(
  postX: number,
  postW: number,
  clampY: number,
  clampH: number,
  side: "west" | "east",
  colorHex: string,
): string {
  const extension = Math.max(3, postW * 0.32);
  const fill = darken(colorHex, 0.28);
  const edge = darken(colorHex, 0.42);
  if (side === "east") {
    const x = postX + postW;
    return `<rect x="${x.toFixed(1)}" y="${clampY.toFixed(1)}" width="${extension.toFixed(1)}" height="${clampH.toFixed(1)}" fill="${fill}" opacity="0.72" rx="0.3"/>
    <line x1="${x.toFixed(1)}" y1="${clampY.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(clampY + clampH).toFixed(1)}" stroke="${edge}" stroke-width="0.8" opacity="0.55"/>`;
  }
  const x = postX - extension;
  return `<rect x="${x.toFixed(1)}" y="${clampY.toFixed(1)}" width="${extension.toFixed(1)}" height="${clampH.toFixed(1)}" fill="${fill}" opacity="0.72" rx="0.3"/>
    <line x1="${(x + extension).toFixed(1)}" y1="${clampY.toFixed(1)}" x2="${(x + extension).toFixed(1)}" y2="${(clampY + clampH).toFixed(1)}" stroke="${edge}" stroke-width="0.8" opacity="0.55"/>`;
}

function postClampYPositions(
  fenceY: number,
  fenceH: number,
  clampH: number,
): number[] {
  return [
    fenceY + fenceH * 0.1,
    fenceY + fenceH * 0.5 - clampH / 2,
    fenceY + fenceH - clampH - fenceH * 0.1,
  ];
}

function drawPostClamps(
  postX: number,
  postW: number,
  fenceY: number,
  fenceH: number,
  sides: ("west" | "east")[],
  colorHex: string,
): string {
  const clampH = Math.max(5, fenceH * 0.045);
  const positions = postClampYPositions(fenceY, fenceH, clampH);
  let out = "";
  for (const side of sides) {
    for (const clampY of positions) {
      out += drawPostClamp(postX, postW, clampY, clampH, side, colorHex);
    }
  }
  return out;
}

function panelPatternDefs(patternId: PatternId, colorHex: string): string {
  const stroke = darken(colorHex, 0.25);
  const highlight = lighten(colorHex, 0.08);
  switch (patternId) {
    case "pattern-3d":
      return `<pattern id="panelPat" width="24" height="24" patternUnits="userSpaceOnUse">
        <line x1="0" y1="24" x2="24" y2="0" stroke="${stroke}" stroke-width="1.2" opacity="0.55"/>
        <line x1="12" y1="0" x2="24" y2="12" stroke="${stroke}" stroke-width="1" opacity="0.45"/>
        <line x1="0" y1="12" x2="12" y2="24" stroke="${stroke}" stroke-width="1" opacity="0.45"/>
      </pattern>`;
    case "pattern-palisade":
      return `<pattern id="panelPat" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="${colorHex}"/>
      </pattern>`;
    case "pattern-panel-horizontal":
      return `<pattern id="panelPat" width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="12" height="5" fill="${colorHex}"/>
      </pattern>`;
    default:
      return `<pattern id="panelPat" width="18" height="18" patternUnits="userSpaceOnUse">
        <rect width="18" height="18" fill="${colorHex}"/>
        <line x1="0" y1="18" x2="18" y2="0" stroke="${darken(colorHex, 0.07)}" stroke-width="1.5" opacity="0.35"/>
        <line x1="-9" y1="18" x2="9" y2="0" stroke="${darken(colorHex, 0.07)}" stroke-width="1.5" opacity="0.35"/>
        <line x1="9" y1="18" x2="27" y2="0" stroke="${darken(colorHex, 0.07)}" stroke-width="1.5" opacity="0.35"/>
      </pattern>`;
  }
}

function drawPlank(
  px: number,
  py: number,
  panelW: number,
  plankH: number,
  shadowEdge: string,
  shadowBottom: string,
  panelTextureUrl?: string | null,
  textureTileCount?: number,
): string {
  let out = "";
  if (panelTextureUrl) {
    out += drawTexturedStack(
      px,
      py,
      panelW,
      plankH,
      panelTextureUrl,
      textureTileCount ?? 1,
    );
  } else {
    out += `<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${panelW.toFixed(1)}" height="${plankH.toFixed(1)}" fill="url(#panelPat)" rx="2"/>`;
  }
  out += `<rect x="${(px + panelW - 2).toFixed(1)}" y="${py.toFixed(1)}" width="2" height="${plankH.toFixed(1)}" fill="${shadowEdge}" opacity="0.6"/>`;
  if (plankH > 4) {
    out += `<rect x="${px.toFixed(1)}" y="${(py + plankH - 3).toFixed(1)}" width="${panelW.toFixed(1)}" height="3" fill="${shadowBottom}" opacity="0.5"/>`;
  }
  return out;
}

function drawPalisadeSlats(
  px: number,
  y: number,
  sectionW: number,
  h: number,
  openness: number,
  colorHex: string,
  shadowEdge: string,
  shadowBottom: string,
): string {
  const slatW = Math.max(3, sectionW * 0.07);
  const gap = Math.max(2, slatW * (0.4 + openness * 1.2));
  const pitch = slatW + gap;
  const count = Math.max(1, Math.floor((sectionW + gap) / pitch));
  const totalW = count * slatW + (count - 1) * gap;
  const offsetX = px + (sectionW - totalW) / 2;
  const highlight = lighten(colorHex, 0.12);
  let out = "";
  for (let i = 0; i < count; i++) {
    const sx = offsetX + i * pitch;
    out += `<rect x="${sx.toFixed(1)}" y="${y.toFixed(1)}" width="${slatW.toFixed(1)}" height="${h.toFixed(1)}" fill="${colorHex}" rx="1"/>`;
    out += `<rect x="${sx.toFixed(1)}" y="${y.toFixed(1)}" width="1.5" height="${h.toFixed(1)}" fill="${highlight}" opacity="0.65"/>`;
    out += `<rect x="${(sx + slatW - 1.5).toFixed(1)}" y="${y.toFixed(1)}" width="1.5" height="${h.toFixed(1)}" fill="${shadowEdge}" opacity="0.5"/>`;
    if (h > 4) {
      out += `<rect x="${sx.toFixed(1)}" y="${(y + h - 2).toFixed(1)}" width="${slatW.toFixed(1)}" height="2" fill="${shadowBottom}" opacity="0.45"/>`;
    }
  }
  return out;
}

function drawSectionPanels(
  px: number,
  y: number,
  sectionW: number,
  h: number,
  hasSpacer: boolean,
  openness: number,
  colorHex: string,
  shadowEdge: string,
  shadowBottom: string,
  patternId: PatternId,
  panelTextureUrl?: string | null,
  textureTileCount?: number,
): string {
  const { useStacked, plankCount, slitGap, plankH } = computePlankLayout(
    h,
    hasSpacer,
    openness,
  );
  let out = "";
  if (panelTextureUrl) {
    out += drawTexturedStack(px, y, sectionW, h, panelTextureUrl, textureTileCount ?? 1);
    return out;
  }
  if (patternId === "pattern-palisade") {
    return drawPalisadeSlats(
      px,
      y,
      sectionW,
      h,
      openness,
      colorHex,
      shadowEdge,
      shadowBottom,
    );
  }
  if (patternId === "pattern-panel-horizontal") {
    return drawHorizontalPanel(
      px,
      y,
      sectionW,
      h,
      openness,
      colorHex,
      shadowEdge,
      shadowBottom,
    );
  }
  if (patternId === "pattern-3d") {
    return draw3DMeshPanel(px, y, sectionW, h, colorHex, shadowEdge, shadowBottom);
  }
  if (useStacked) {
    for (let j = 0; j < plankCount; j++) {
      const py = y + j * (plankH + slitGap);
      out += drawPlank(px, py, sectionW, plankH, shadowEdge, shadowBottom);
    }
  } else {
    out += drawPlank(px, y, sectionW, h, shadowEdge, shadowBottom);
  }
  return out;
}

/** Który bok segmentu furtki przylega do słupka skrajnego (ma margines +4px). */
type GateEndSide = "left" | "right" | "none";

function computeWicketGateLayout(
  px: number,
  segmentW: number,
  hingeSide: WicketHingeSide,
  endSide: GateEndSide,
): {
  gateX: number;
  gateW: number;
  latchSide: WicketHingeSide;
  hingeEdgeX: number;
} {
  // Pozycja skrzydła NIE zależy od strony zawiasów — tak by zmiana zawiasów
  // przesuwała wyłącznie okucia, a samo skrzydło było zawsze tak samo (idealnie)
  // wyśrodkowane w prześwicie. Bok przylegający do słupka skrajnego ma dodatkowy
  // margines pola (panelsX/panelsW = +4px), więc po tej stronie luz wewnętrzny
  // jest o tyle mniejszy, aby wizualnie luzy z obu stron były równe.
  const END_MARGIN = 4;
  const baseGap = Math.max(6, segmentW * 0.06);
  let leftGap = baseGap;
  let rightGap = baseGap;
  if (endSide === "right") {
    rightGap = Math.max(1.5, baseGap - END_MARGIN);
  } else if (endSide === "left") {
    leftGap = Math.max(1.5, baseGap - END_MARGIN);
  }
  const gateX = px + leftGap;
  const gateW = segmentW - leftGap - rightGap;
  // Strona zawiasów steruje tylko okuciami.
  const latchSide: WicketHingeSide = hingeSide === "right" ? "left" : "right";
  const hingeEdgeX = hingeSide === "right" ? gateX + gateW : gateX;
  return { gateX, gateW, latchSide, hingeEdgeX };
}

function drawGateSection(
  px: number,
  y: number,
  segmentW: number,
  h: number,
  fencePostW: number,
  hasSpacer: boolean,
  openness: number,
  colorHex: string,
  patternId: PatternId,
  hingeSide: WicketHingeSide,
  endSide: GateEndSide,
  openingTextureUrl?: string | null,
  textureTileCount?: number,
): { body: string; hardware: string } {
  const { gateX, gateW, latchSide, hingeEdgeX } = computeWicketGateLayout(
    px,
    segmentW,
    hingeSide,
    endSide,
  );
  const frameT = Math.max(3, Math.min(5, gateW * 0.07));

  let hardware = "";
  hardware += drawWicketStriker(px, segmentW, fencePostW, y, h, colorHex, latchSide);
  hardware += drawWicketHinges(hingeEdgeX, fencePostW, y, h, colorHex, hingeSide);
  hardware += drawWicketHandle(gateX, gateW, y, h, frameT, colorHex, latchSide);

  if (openingTextureUrl) {
    return {
      body: drawTexturedStack(
        gateX,
        y,
        gateW,
        h,
        openingTextureUrl,
        textureTileCount ?? 1,
      ),
      hardware,
    };
  }

  const shadowEdge = darken(colorHex, 0.3);
  const shadowBottom = darken(colorHex, 0.2);
  const innerX = gateX + frameT;
  const innerY = y + frameT;
  const innerW = gateW - frameT * 2;
  const innerH = h - frameT * 2;

  let body = "";
  body += drawWicketFrame(gateX, y, gateW, h, frameT, colorHex, shadowBottom);
  if (innerW > 2 && innerH > 2) {
    body += drawMeshInfill(
      innerX,
      innerY,
      innerW,
      innerH,
      hasSpacer,
      openness,
      colorHex,
      shadowEdge,
      shadowBottom,
      patternId,
    );
  }

  return { body, hardware };
}

function renderFenceSegments(
  x: number,
  y: number,
  totalW: number,
  h: number,
  gap: number,
  segments: FenceSegment[],
  wicketWidthCm: number,
  panelWidthCm: number,
  fencePostW: number,
  hasSpacer: boolean,
  openness: number,
  colorHex: string,
  patternId: PatternId,
  panelTextureUrl?: string | null,
  openingTextureUrl?: string | null,
  textureTileCount?: number,
  wicketHingeSide: WicketHingeSide = "right",
): { svg: string; footingSegments: { x: number; w: number }[]; wicketHardware: string } {
  const weights = segmentWidthWeights(segments, wicketWidthCm, panelWidthCm);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const innerW = totalW - gap * Math.max(0, segments.length - 1);
  const shadowEdge = darken(colorHex, 0.3);
  const shadowBottom = darken(colorHex, 0.2);
  const footingSegments: { x: number; w: number }[] = [];
  let out = "";
  let wicketHardware = "";
  let cursorX = x;

  for (let i = 0; i < segments.length; i++) {
    const segW = (innerW * weights[i]) / totalWeight;
    const seg = segments[i];
    if (seg.type === "wicket") {
      // Bok przy słupku skrajnym (pierwszy/ostatni segment) ma margines +4px.
      const isFirst = i === 0;
      const isLast = i === segments.length - 1;
      const endSide: GateEndSide =
        isLast && !isFirst ? "right" : isFirst && !isLast ? "left" : "none";
      const gate = drawGateSection(
        cursorX,
        y,
        segW,
        h,
        fencePostW,
        hasSpacer,
        openness,
        colorHex,
        patternId,
        wicketHingeSide,
        endSide,
        openingTextureUrl,
        textureTileCount,
      );
      out += gate.body;
      wicketHardware += gate.hardware;
    } else {
      out += drawSectionPanels(
        cursorX,
        y,
        segW,
        h,
        hasSpacer,
        openness,
        colorHex,
        shadowEdge,
        shadowBottom,
        patternId,
        panelTextureUrl,
        textureTileCount,
      );
      footingSegments.push({ x: cursorX, w: segW });
    }
    cursorX += segW + gap;
  }

  return { svg: out, footingSegments, wicketHardware };
}

export function buildFenceSvg(params: FenceRenderParams): string {
  const {
    heightM,
    patternId,
    colorHex,
    postWidthCm,
    hasSpacer,
    openness,
    panelCount = 3,
    panelWidthCm = DEFAULT_PANEL_WIDTH_CM,
    wicketWidthCm = getWicketWidthCm(DEFAULT_PANEL_WIDTH_CM),
    wicketInsertAfter,
    footingEnabled = false,
    footingHeightCm = 20,
    footingColorHex = "#9ca3af",
    wicketHingeSide = "right",
    transparent = false,
    panelTextureUrl,
    postTextureUrl,
    openingTextureUrl,
    textureTileCount = 1,
  } = params;

  const hasWicket = wicketInsertAfter !== undefined;
  const viewOptions: ViewWidthOptions = {
    hasWicket,
    wicketWidthCm,
    panelWidthCm,
  };

  const {
    viewW,
    groundY,
    fenceH,
    fenceY,
    postW,
    leftPost,
    rightPost,
    fenceCenterX,
    totalW,
  } = computeFenceGeometry(heightM, postWidthCm, panelCount, viewOptions);
  const gap = hasSpacer ? 8 + openness * 12 : 2;
  const panelsX = leftPost + postW + 4;
  const panelsW = rightPost - panelsX - 4;
  const segments = buildFenceSegments(panelCount, wicketInsertAfter);
  const segmentWeights = segmentWidthWeights(
    segments,
    wicketWidthCm,
    panelWidthCm,
  );
  const totalWeight = segmentWeights.reduce((sum, w) => sum + w, 0);
  const innerW = panelsW - gap * Math.max(0, segments.length - 1);

  const postBase = colorHex;
  const postLight = lighten(colorHex, 0.15);
  const postDark = darken(colorHex, 0.25);
  const postCap = darken(colorHex, 0.2);

  // Dimension line positioning
  const dimX = rightPost + postW + 22;
  const dimTopY = fenceY;
  const dimBotY = groundY;
  const dimMidY = (dimTopY + dimBotY) / 2;

  const defs = panelPatternDefs(patternId, colorHex);

  function postCapRect(px: number): string {
    const capW = postW + 4;
    const capX = px - 2;
    const capY = fenceY - 4;
    const capH = 4;
    return `<rect x="${capX}" y="${capY}" width="${capW}" height="${capH}" fill="${postCap}" rx="1"/>`;
  }

  function renderPost(
    px: number,
    clampSides: ("west" | "east")[] = [],
  ): string {
    let clamps = "";
    if (clampSides.length > 0 && patternId === "pattern-3d") {
      clamps = drawPostClamps(px, postW, fenceY, fenceH, clampSides, colorHex);
    }
    if (postTextureUrl) {
      const safeUrl = escapeXmlAttr(postTextureUrl);
      return `<!-- Post at ${px.toFixed(0)} -->
    <image href="${safeUrl}" x="${px}" y="${fenceY}" width="${postW}" height="${fenceH}" preserveAspectRatio="none"/>
    ${postCapRect(px)}${clamps}`;
    }
    return `<!-- Post at ${px.toFixed(0)} -->
    <rect x="${px}" y="${fenceY}" width="${postW}" height="${fenceH}" fill="${postBase}" rx="1"/>
    <rect x="${px}" y="${fenceY}" width="2" height="${fenceH}" fill="${postLight}" opacity="0.75" rx="1"/>
    <rect x="${px + postW - 3}" y="${fenceY}" width="3" height="${fenceH}" fill="${postDark}" opacity="0.5"/>
    ${postCapRect(px)}${clamps}`;
  }

  let intermediatePosts = "";
  let cursorX = panelsX;
  for (let i = 0; i < segments.length - 1; i++) {
    const segW = (innerW * segmentWeights[i]) / totalWeight;
    cursorX += segW;
    const postCenter = cursorX + gap / 2;
    intermediatePosts += renderPost(postCenter - postW / 2, ["west", "east"]);
    cursorX += gap;
  }

  const { svg: segmentsSvg, footingSegments, wicketHardware } = renderFenceSegments(
    panelsX,
    fenceY,
    panelsW,
    fenceH,
    gap,
    segments,
    wicketWidthCm,
    panelWidthCm,
    postW,
    hasSpacer,
    openness,
    colorHex,
    patternId,
    panelTextureUrl,
    openingTextureUrl,
    textureTileCount,
    wicketHingeSide,
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${VIEW_H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Podgląd ogrodzenia">
  <defs>
    ${defs}
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#a8d4f0"/>
      <stop offset="40%" stop-color="#c8e8f8"/>
      <stop offset="75%" stop-color="#e8f4fc"/>
      <stop offset="100%" stop-color="#f5f9fd"/>
    </linearGradient>
    <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6dbf3e"/>
      <stop offset="50%" stop-color="#4a9620"/>
      <stop offset="100%" stop-color="#3a7a18"/>
    </linearGradient>
    <filter id="postShadow" x="-20%" y="-10%" width="150%" height="130%">
      <feDropShadow dx="4" dy="6" stdDeviation="4" flood-color="#000000" flood-opacity="0.28"/>
    </filter>
    <filter id="panelShadow" x="-10%" y="-5%" width="130%" height="120%">
      <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.14"/>
    </filter>
  </defs>

  ${
    transparent
      ? `<!-- Transparent scene — tło z kontenera CSS -->
  <ellipse cx="${fenceCenterX}" cy="${groundY + 6}" rx="${(totalW * 0.55).toFixed(1)}" ry="18" fill="#000000" opacity="0.35"/>`
      : `<!-- Sky background -->
  <rect width="${viewW}" height="${VIEW_H}" fill="url(#sky)"/>

  <!-- Ground -->
  <rect x="0" y="${groundY}" width="${viewW}" height="${VIEW_H - groundY}" fill="url(#grass)"/>
  <rect x="0" y="${groundY + 10}" width="${viewW}" height="6" fill="#3a7a18" opacity="0.4"/>
  <rect x="0" y="${groundY + 22}" width="${viewW}" height="8" fill="#3a7a18" opacity="0.2"/>

  <!-- Ground shadow ellipse -->
  <ellipse cx="${fenceCenterX}" cy="${groundY + 4}" rx="${(totalW * 0.5).toFixed(1)}" ry="14" fill="#000000" opacity="0.08"/>`
  }

  <!-- Panels group -->
  <g filter="url(#panelShadow)">
    ${segmentsSvg}
  </g>

  <!-- Posts group -->
  <g filter="url(#postShadow)">
    ${renderPost(leftPost, ["east"])}
    ${intermediatePosts}
    ${renderPost(rightPost, ["west"])}
  </g>

  ${
    wicketHardware
      ? `<!-- Wicket hardware -->
  <g>
    ${wicketHardware}
  </g>`
      : ""
  }

  ${
    footingEnabled
      ? `<!-- Footing plinth -->
  <g>
    ${drawFootingPlinthSegments(
      fenceY + fenceH,
      footingSegments,
      footingHeightCm,
      footingColorHex,
    )}
  </g>`
      : ""
  }

  ${
    transparent
      ? ""
      : `<!-- Dimension line -->
  <line x1="${dimX}" y1="${dimTopY}" x2="${dimX}" y2="${dimBotY}" stroke="#e30311" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="${dimX - 5}" y1="${dimTopY}" x2="${dimX + 5}" y2="${dimTopY}" stroke="#e30311" stroke-width="2"/>
  <line x1="${dimX - 5}" y1="${dimBotY}" x2="${dimX + 5}" y2="${dimBotY}" stroke="#e30311" stroke-width="2"/>
  <text x="${dimX + 9}" y="${dimMidY + 5}" font-size="13" font-weight="700" fill="#e30311" font-family="system-ui,sans-serif">${heightM.toFixed(2).replace(".", ",")} m</text>`
  }
</svg>`;
}
