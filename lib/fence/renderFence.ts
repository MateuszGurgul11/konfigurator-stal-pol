import type { PatternId } from "./patterns";

export type FenceRenderParams = {
  heightM: number;
  patternId: PatternId;
  colorHex: string;
  postWidthCm: number;
  hasSpacer: boolean;
  openness: number;
  panelCount?: number;
  openingPanelIndices?: number[];
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

export function getViewWidth(panelCount: number): number {
  return MARGIN_X * 2 + panelCount * SECTION_WIDTH;
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
): FenceGeometry {
  const scale = heightM / BASE_HEIGHT_M;
  const groundY = 330;
  const fenceH = Math.round(240 * scale);
  const fenceY = groundY - fenceH;
  const postW = Math.max(10, Math.round((postWidthCm / 20) * 14));
  const viewW = getViewWidth(panelCount);
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
}): FenceContentBounds {
  const { groundY, fenceY, postW, leftPost, rightPost } = computeFenceGeometry(
    params.heightM,
    params.postWidthCm,
    params.panelCount ?? 3,
  );
  const capTop = fenceY - 22;
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

function panelPatternDefs(patternId: PatternId, colorHex: string): string {
  const stroke = darken(colorHex, 0.25);
  const highlight = lighten(colorHex, 0.08);
  const shadow = darken(colorHex, 0.15);
  switch (patternId) {
    case "pattern-3d":
      return `<pattern id="panelPat" width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill="${colorHex}"/>
        <rect x="0" y="0" width="24" height="5" fill="${shadow}" opacity="0.35"/>
        <rect x="0" y="19" width="24" height="5" fill="${shadow}" opacity="0.35"/>
        <line x1="0" y1="24" x2="24" y2="0" stroke="${stroke}" stroke-width="1.2" opacity="0.55"/>
        <line x1="0" y1="12" x2="12" y2="0" stroke="${highlight}" stroke-width="0.8" opacity="0.4"/>
        <line x1="12" y1="24" x2="24" y2="12" stroke="${highlight}" stroke-width="0.8" opacity="0.4"/>
        <line x1="12" y1="0" x2="24" y2="12" stroke="${stroke}" stroke-width="1" opacity="0.45"/>
        <line x1="0" y1="12" x2="12" y2="24" stroke="${stroke}" stroke-width="1" opacity="0.45"/>
      </pattern>`;
    case "pattern-palisade":
      return `<pattern id="panelPat" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="${colorHex}"/>
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

function drawGateSection(
  px: number,
  y: number,
  panelW: number,
  h: number,
  hasSpacer: boolean,
  openness: number,
  colorHex: string,
  patternId: PatternId,
  openingTextureUrl?: string | null,
  textureTileCount?: number,
): string {
  if (openingTextureUrl) {
    return drawTexturedStack(
      px,
      y,
      panelW,
      h,
      openingTextureUrl,
      textureTileCount ?? 1,
    );
  }

  const shadowEdge = darken(colorHex, 0.3);
  const shadowBottom = darken(colorHex, 0.2);
  const frameW = Math.max(10, panelW * 0.14);
  const gateW = panelW - frameW * 2;
  const gateX = px + frameW;
  const clearance = Math.max(4, h * 0.04);
  const doorH = h - clearance;
  const doorOpen = Math.min(10, gateW * 0.06);
  const handleMetal = lighten(colorHex, 0.25);

  let out = "";
  out += drawSectionPanels(px, y, frameW, h, hasSpacer, openness, colorHex, shadowEdge, shadowBottom, patternId);
  out += drawSectionPanels(
    px + panelW - frameW,
    y,
    frameW,
    h,
    hasSpacer,
    openness,
    colorHex,
    shadowEdge,
    shadowBottom,
    patternId,
  );
  out += drawSectionPanels(
    gateX + doorOpen,
    y,
    gateW - doorOpen,
    doorH,
    hasSpacer,
    openness,
    colorHex,
    shadowEdge,
    shadowBottom,
    patternId,
  );
  out += `<line x1="${gateX.toFixed(1)}" y1="${y}" x2="${(gateX + doorOpen).toFixed(1)}" y2="${(y + doorH).toFixed(1)}" stroke="${darken(colorHex, 0.2)}" stroke-width="2" opacity="0.45"/>`;
  out += `<rect x="${(gateX + gateW - 16).toFixed(1)}" y="${(y + doorH * 0.38).toFixed(1)}" width="3" height="${(doorH * 0.22).toFixed(1)}" fill="${darken(colorHex, 0.35)}" rx="1"/>`;
  out += `<circle cx="${(gateX + gateW - 14.5).toFixed(1)}" cy="${(y + doorH * 0.52).toFixed(1)}" r="4" fill="${handleMetal}" stroke="${darken(colorHex, 0.3)}" stroke-width="1"/>`;
  return out;
}

function panelRects(
  x: number,
  y: number,
  w: number,
  h: number,
  gap: number,
  count: number,
  hasSpacer: boolean,
  openness: number,
  colorHex: string,
  patternId: PatternId,
  openingPanelIndices: number[] = [],
  panelTextureUrl?: string | null,
  openingTextureUrl?: string | null,
  textureTileCount?: number,
): string {
  const panelW = (w - gap * (count - 1)) / count;
  const shadowEdge = darken(colorHex, 0.3);
  const shadowBottom = darken(colorHex, 0.2);
  const openingSet = new Set(openingPanelIndices);
  let out = "";
  for (let i = 0; i < count; i++) {
    const px = x + i * (panelW + gap);
    if (openingSet.has(i)) {
      out += drawGateSection(
        px,
        y,
        panelW,
        h,
        hasSpacer,
        openness,
        colorHex,
        patternId,
        openingTextureUrl,
        textureTileCount,
      );
    } else {
      out += drawSectionPanels(
        px,
        y,
        panelW,
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
    }
  }
  return out;
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
    openingPanelIndices = [],
    transparent = false,
    panelTextureUrl,
    postTextureUrl,
    openingTextureUrl,
    textureTileCount = 1,
  } = params;

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
  } = computeFenceGeometry(heightM, postWidthCm, panelCount);
  const gap = hasSpacer ? 8 + openness * 12 : 2;
  const panelsX = leftPost + postW + 4;
  const panelsW = rightPost - panelsX - 4;
  const sectionPanelW = (panelsW - gap * (panelCount - 1)) / panelCount;

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
    const capY = fenceY - 14;
    const capH = 4;
    return `<rect x="${capX}" y="${capY}" width="${capW}" height="${capH}" fill="${postCap}" rx="1"/>`;
  }

  function renderPost(px: number): string {
    if (postTextureUrl) {
      const safeUrl = escapeXmlAttr(postTextureUrl);
      return `<!-- Post at ${px.toFixed(0)} -->
    <image href="${safeUrl}" x="${px}" y="${fenceY - 8}" width="${postW}" height="${fenceH + 8}" preserveAspectRatio="none"/>
    ${postCapRect(px)}`;
    }
    return `<!-- Post at ${px.toFixed(0)} -->
    <rect x="${px}" y="${fenceY - 8}" width="${postW}" height="${fenceH + 8}" fill="${postBase}" rx="1"/>
    <rect x="${px}" y="${fenceY - 8}" width="2" height="${fenceH + 8}" fill="${postLight}" opacity="0.75" rx="1"/>
    <rect x="${px + postW - 3}" y="${fenceY - 8}" width="3" height="${fenceH + 8}" fill="${postDark}" opacity="0.5"/>
    ${postCapRect(px)}`;
  }

  let intermediatePosts = "";
  for (let i = 1; i < panelCount; i++) {
    const dividerCenter = panelsX + i * sectionPanelW + (i - 0.5) * gap;
    const px = dividerCenter - postW / 2;
    intermediatePosts += renderPost(px);
  }

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
    ${panelRects(
      panelsX,
      fenceY,
      panelsW,
      fenceH,
      gap,
      panelCount,
      hasSpacer,
      openness,
      colorHex,
      patternId,
      openingPanelIndices,
      panelTextureUrl,
      openingTextureUrl,
      textureTileCount,
    )}
  </g>

  <!-- Posts group -->
  <g filter="url(#postShadow)">
    ${renderPost(leftPost)}
    ${intermediatePosts}
    ${renderPost(rightPost)}
  </g>

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
