"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Hand,
  Maximize2,
  Minimize2,
  MoveHorizontal,
  PanelLeft,
  PanelLeftClose,
  RotateCcw,
} from "lucide-react";
import {
  buildFenceSvg,
  getFenceContentBounds,
  getViewWidth,
  VIEW_H,
} from "@/lib/fence/renderFence";
import type { PatternId } from "@/lib/fence/patterns";
import {
  getWicketInsertAfterIndex,
  MAX_PREVIEW_PANELS,
  MIN_PREVIEW_PANELS,
  useConfiguratorStore,
} from "@/lib/configurator/state";
import { getWicketWidthCm } from "@/lib/pricing/variant-prices";
import {
  isDrivewayGateConfigured,
  resolveDrivewayGateKind,
  resolveElement,
} from "@/lib/pricing/element-prices";
import type { CatalogCollections, ConfiguratorSelection } from "@/lib/types";
import { resolveBackgroundUrl } from "@/lib/configurator/backgrounds";
import {
  computeTextureTileCount,
  resolveOpeningTextureUrl,
  resolvePanelTextureUrl,
  resolvePanelTileHeightM,
  resolvePostTextureUrl,
} from "@/lib/fence/resolveTexture";

const MIN_FENCE_SCALE = 0.6;
const MAX_FENCE_SCALE = 3.5;
const DEFAULT_FENCE_SCALE = 1.9;
const FENCE_WIDTH_REM_BASE = 56;
const FENCE_WIDTH_REM_PER_PANEL = 9;
/** Udział szerokości sceny zajmowany przez bazowy bbox płotu (przed skalą CSS). */
const FENCE_BASE_WIDTH_RATIO = 0.68;
const FENCE_BASE_WIDTH_PER_PANEL = 0.045;
/** Docelowy udział szerokości sceny po zastosowaniu domyślnej skali. */
const FENCE_TARGET_WIDTH_RATIO = 0.92;
const FENCE_TARGET_WIDTH_PER_PANEL = 0.015;
/** Odległość płotu od dołu sceny — większa wartość = wyżej na zdjęciu. */
const FENCE_SCENE_BOTTOM_PERCENT = 15;

type FenceTransform = { x: number; y: number; scale: number };
type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
};
type ResizeState = {
  pointerId: number;
  corner: "nw" | "ne" | "sw" | "se";
  startX: number;
  startY: number;
  origScale: number;
  origX: number;
  origY: number;
  origPanelCount: number;
  sceneWidth: number;
  hasWicket: boolean;
  wicketWidthCm: number;
  panelWidthCm: number;
};
type StretchState = {
  pointerId: number;
  side: "west" | "east";
  startX: number;
  origPanelCount: number;
  origX: number;
  origScale: number;
  sceneWidth: number;
};

function clampPanelCount(count: number): number {
  return Math.min(MAX_PREVIEW_PANELS, Math.max(MIN_PREVIEW_PANELS, count));
}

function compensateXForWidthChange(
  anchor: "west" | "east",
  origX: number,
  origPanelCount: number,
  newPanelCount: number,
  scale: number,
  sceneWidth: number,
  hasWicket = false,
  wicketWidthCm = getWicketWidthCm(250),
  panelWidthCm = 250,
): number {
  const oldW = getFenceBaseWidthPx(
    sceneWidth,
    origPanelCount,
    hasWicket,
    wicketWidthCm,
    panelWidthCm,
  );
  const newW = getFenceBaseWidthPx(
    sceneWidth,
    newPanelCount,
    hasWicket,
    wicketWidthCm,
    panelWidthCm,
  );
  const deltaW = newW - oldW;
  if (anchor === "west") return origX - (deltaW * scale) / 2;
  return origX + (deltaW * scale) / 2;
}

function clampScale(scale: number) {
  return Math.min(MAX_FENCE_SCALE, Math.max(MIN_FENCE_SCALE, scale));
}

function getFenceBaseWidthPx(
  sceneWidth: number,
  panelCount: number,
  hasWicket = false,
  wicketWidthCm = getWicketWidthCm(250),
  panelWidthCm = 250,
): number {
  const remFallback =
    (FENCE_WIDTH_REM_BASE +
      (panelCount - MIN_PREVIEW_PANELS) * FENCE_WIDTH_REM_PER_PANEL) *
    16;
  if (sceneWidth <= 0) return remFallback;
  const ratio =
    FENCE_BASE_WIDTH_RATIO +
    (panelCount - MIN_PREVIEW_PANELS) * FENCE_BASE_WIDTH_PER_PANEL;
  let width = sceneWidth * ratio;
  if (hasWicket) {
    const panelShare = width / panelCount;
    width += panelShare * (wicketWidthCm / panelWidthCm);
  }
  return width;
}

function getDefaultFenceScale(
  sceneWidth: number,
  panelCount: number,
  hasWicket = false,
  wicketWidthCm = getWicketWidthCm(250),
  panelWidthCm = 250,
): number {
  if (sceneWidth <= 0) return DEFAULT_FENCE_SCALE;
  const baseWidth = getFenceBaseWidthPx(
    sceneWidth,
    panelCount,
    hasWicket,
    wicketWidthCm,
    panelWidthCm,
  );
  const targetFraction =
    FENCE_TARGET_WIDTH_RATIO +
    (panelCount - MIN_PREVIEW_PANELS) * FENCE_TARGET_WIDTH_PER_PANEL;
  return clampScale((sceneWidth * targetFraction) / baseWidth);
}

function StretchHandle({
  side,
  onPointerDown,
}: {
  side: StretchState["side"];
  onPointerDown: (e: React.PointerEvent, side: StretchState["side"]) => void;
}) {
  const pos: Record<StretchState["side"], string> = {
    west: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
    east: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
  };

  return (
    <div
      data-stretch-handle=""
      role="presentation"
      className={`absolute z-30 h-4 w-4 rounded-sm border-2 border-white bg-[#e30311] shadow-md ${pos[side]}`}
      onPointerDown={(e) => onPointerDown(e, side)}
    />
  );
}

function ResizeHandle({
  corner,
  onPointerDown,
}: {
  corner: "nw" | "ne" | "sw" | "se";
  onPointerDown: (e: React.PointerEvent, corner: ResizeState["corner"]) => void;
}) {
  const pos: Record<ResizeState["corner"], string> = {
    nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
    ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
    sw: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
    se: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
  };

  return (
    <div
      data-resize-handle=""
      role="presentation"
      className={`absolute z-30 h-3.5 w-3.5 rounded-sm border-2 border-white bg-[#e30311] shadow-md ${pos[corner]}`}
      onPointerDown={(e) => onPointerDown(e, corner)}
    />
  );
}

type Props = {
  catalog: CatalogCollections;
  selection: ConfiguratorSelection;
};

function FenceInteractionHint({ inverseScale }: { inverseScale: number }) {
  return (
    <div
      className="pointer-events-none absolute -top-14 left-1/2 z-30 flex flex-col items-center gap-1.5"
      style={{
        transform: `translateX(-50%) scale(${inverseScale})`,
        transformOrigin: "center bottom",
      }}
    >
      <div className="flex items-center gap-2 rounded-full border border-[#e30311]/25 bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-sm">
        <Hand className="h-4 w-4 shrink-0 text-[#e30311]" />
        <span className="text-[11px] font-semibold text-[#303638]">
          Kliknij płot i przeciągnij
        </span>
      </div>
      <div className="flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.12em] text-white/90 drop-shadow-md">
        <span className="flex items-center gap-1">
          <Maximize2 className="h-3 w-3" />
          Rogi · skala
        </span>
        <span className="text-white/50">·</span>
        <span className="flex items-center gap-1">
          <MoveHorizontal className="h-3 w-3" />
          Boki · panele
        </span>
      </div>
    </div>
  );
}

function PreviewInfoBar({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <div className="pointer-events-none absolute left-4 right-24 top-4 z-20 flex flex-wrap gap-2">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-lg border border-[#e5e7eb] bg-white/92 px-3 py-2 shadow-sm backdrop-blur-md"
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#e30311]">
            {label}
          </p>
          <p className="whitespace-nowrap text-xs font-semibold text-[#303638]">{value}</p>
        </div>
      ))}
    </div>
  );
}

export function FencePreview({ catalog, selection }: Props) {
  const previewRootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const fenceRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const stretchRef = useRef<StretchState | null>(null);
  const wicketLayoutRef = useRef({
    hasWicket: false,
    wicketWidthCm: getWicketWidthCm(250),
    panelWidthCm: 250,
  });
  const initialScaleApplied = useRef(false);
  const [fenceSelected, setFenceSelected] = useState(false);
  const [showFenceHint, setShowFenceHint] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sceneWidth, setSceneWidth] = useState(0);
  const [fenceTransform, setFenceTransform] = useState<FenceTransform>({
    x: 0,
    y: 0,
    scale: DEFAULT_FENCE_SCALE,
  });
  const [isDragging, setIsDragging] = useState(false);

  const backgroundImageUrl = useConfiguratorStore((s) => s.backgroundImageUrl);
  const backgroundPresetId = useConfiguratorStore((s) => s.backgroundPresetId);
  const clearBackgroundImage = useConfiguratorStore((s) => s.clearBackgroundImage);
  const furtkaEnabled = useConfiguratorStore((s) => s.furtkaEnabled);
  const furtkaElementId = useConfiguratorStore((s) => s.furtkaElementId);
  const furtkaPosition = useConfiguratorStore((s) => s.furtkaPosition);
  const furtkaHingeSide = useConfiguratorStore((s) => s.furtkaHingeSide);
  const bramaElementId = useConfiguratorStore((s) => s.bramaElementId);
  const hasDrivewayGate = isDrivewayGateConfigured(bramaElementId);
  const previewPanelCount = useConfiguratorStore((s) => s.previewPanelCount);
  const setPreviewPanelCount = useConfiguratorStore((s) => s.setPreviewPanelCount);
  const footingEnabled = useConfiguratorStore((s) => s.footingEnabled);
  const footingHeightId = useConfiguratorStore((s) => s.footingHeightId);
  const footingMaterialId = useConfiguratorStore((s) => s.footingMaterialId);
  const pricing = useConfiguratorStore((s) => s.pricing);
  const sidebarOpen = useConfiguratorStore((s) => s.sidebarOpen);
  const toggleSidebarOpen = useConfiguratorStore((s) => s.toggleSidebarOpen);

  const post = catalog.posts.find((p) => p.id === selection.postId);
  const panel = catalog.panels.find((p) => p.id === selection.panelId);
  const spacer = catalog.spacerOptions.find((s) => s.id === selection.spacerId);
  const height = catalog.heights.find((h) => h.id === selection.heightId);
  const color = catalog.colors.find((c) => c.id === selection.colorId);

  useEffect(() => {
    wicketLayoutRef.current = {
      hasWicket: furtkaEnabled,
      wicketWidthCm: getWicketWidthCm(pricing.panelWidthCm),
      panelWidthCm: pricing.panelWidthCm,
    };
  }, [furtkaEnabled, pricing.panelWidthCm]);

  useEffect(() => {
    return () => {
      clearBackgroundImage();
    };
  }, [clearBackgroundImage]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      setSceneWidth(entry.contentRect.width);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!post || !panel || !spacer || !height || !color || sceneWidth <= 0) return;
    if (initialScaleApplied.current) return;
    initialScaleApplied.current = true;
    setFenceTransform({
      x: 0,
      y: 0,
      scale: getDefaultFenceScale(
        sceneWidth,
        previewPanelCount,
        furtkaEnabled,
        getWicketWidthCm(pricing.panelWidthCm),
        pricing.panelWidthCm,
      ),
    });
  }, [
    post,
    panel,
    spacer,
    height,
    color,
    sceneWidth,
    previewPanelCount,
    furtkaEnabled,
    pricing.panelWidthCm,
  ]);

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (drag && e.pointerId === drag.pointerId) {
        setFenceTransform((t) => ({
          ...t,
          x: drag.origX + e.clientX - drag.startX,
          y: drag.origY + e.clientY - drag.startY,
        }));
      }

      const resize = resizeRef.current;
      if (resize && e.pointerId === resize.pointerId) {
        const dx = e.clientX - resize.startX;
        const widthPx = getFenceBaseWidthPx(
          resize.sceneWidth,
          resize.origPanelCount,
          resize.hasWicket,
          resize.wicketWidthCm,
          resize.panelWidthCm,
        );
        // Chwytany bok ma śledzić kursor 1:1. Prawe rogi (ne/se) rozciągają
        // prawą krawędź, lewe (nw/sw) — lewą. Przesunięcie krawędzi przy skali
        // o origin "center" wynosi widthPx * scaleDiff, więc skala = dx/widthPx.
        const anchorLeftEdge =
          resize.corner === "ne" || resize.corner === "se";
        const horizontalSign = anchorLeftEdge ? 1 : -1;
        const newScale = clampScale(
          resize.origScale + (horizontalSign * dx) / widthPx,
        );
        const scaleDiff = newScale - resize.origScale;
        const newX = anchorLeftEdge
          ? resize.origX + (widthPx * scaleDiff) / 2
          : resize.origX - (widthPx * scaleDiff) / 2;
        setFenceTransform({
          x: newX,
          y: resize.origY,
          scale: newScale,
        });
      }

      const stretch = stretchRef.current;
      if (stretch && e.pointerId === stretch.pointerId) {
        const dx = e.clientX - stretch.startX;
        const signedDx = stretch.side === "east" ? dx : -dx;
        const deltaPanels = Math.round(signedDx / 45);
        const newCount = clampPanelCount(stretch.origPanelCount + deltaPanels);
        setPreviewPanelCount(newCount);
        setFenceTransform((t) => ({
          ...t,
          x: compensateXForWidthChange(
            stretch.side,
            stretch.origX,
            stretch.origPanelCount,
            newCount,
            stretch.origScale,
            stretch.sceneWidth,
            wicketLayoutRef.current.hasWicket,
            wicketLayoutRef.current.wicketWidthCm,
            wicketLayoutRef.current.panelWidthCm,
          ),
        }));
      }
    }

    function onPointerUp(e: PointerEvent) {
      if (dragRef.current?.pointerId === e.pointerId) {
        dragRef.current = null;
        setIsDragging(false);
      }
      if (resizeRef.current?.pointerId === e.pointerId) {
        resizeRef.current = null;
      }
      if (stretchRef.current?.pointerId === e.pointerId) {
        stretchRef.current = null;
      }
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [setPreviewPanelCount]);

  async function toggleFullscreen() {
    if (!previewRootRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await previewRootRef.current.requestFullscreen();
      }
    } catch {
      /* przeglądarka zablokowała fullscreen */
    }
  }

  function dismissFenceHint() {
    setShowFenceHint(false);
  }

  function resetFenceTransform() {
    const scale =
      sceneWidth > 0
        ? getDefaultFenceScale(
            sceneWidth,
            previewPanelCount,
            furtkaEnabled,
            getWicketWidthCm(pricing.panelWidthCm),
            pricing.panelWidthCm,
          )
        : DEFAULT_FENCE_SCALE;
    setFenceTransform({ x: 0, y: 0, scale });
    setFenceSelected(false);
  }

  function startDrag(e: React.PointerEvent) {
    if (
      (e.target as HTMLElement).closest("[data-resize-handle]") ||
      (e.target as HTMLElement).closest("[data-stretch-handle]")
    ) {
      return;
    }
    e.stopPropagation();
    dismissFenceHint();
    setFenceSelected(true);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: fenceTransform.x,
      origY: fenceTransform.y,
    };
    setIsDragging(true);
  }

  function startStretch(e: React.PointerEvent, side: StretchState["side"]) {
    e.stopPropagation();
    dismissFenceHint();
    stretchRef.current = {
      pointerId: e.pointerId,
      side,
      startX: e.clientX,
      origPanelCount: previewPanelCount,
      origX: fenceTransform.x,
      origScale: fenceTransform.scale,
      sceneWidth,
    };
  }

  function startResize(e: React.PointerEvent, corner: ResizeState["corner"]) {
    e.stopPropagation();
    dismissFenceHint();
    resizeRef.current = {
      pointerId: e.pointerId,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      origScale: fenceTransform.scale,
      origX: fenceTransform.x,
      origY: fenceTransform.y,
      origPanelCount: previewPanelCount,
      sceneWidth,
      hasWicket: furtkaEnabled,
      wicketWidthCm: getWicketWidthCm(pricing.panelWidthCm),
      panelWidthCm: pricing.panelWidthCm,
    };
  }

  function handleFenceWheel(e: React.WheelEvent) {
    if (!fenceSelected) return;
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.06 : 0.06;
    setFenceTransform((t) => ({
      ...t,
      scale: clampScale(t.scale + delta),
    }));
  }

  const wicketInsertAfter = useMemo(() => {
    if (!furtkaEnabled) return undefined;
    return getWicketInsertAfterIndex(furtkaPosition, previewPanelCount, {
      drivewayGateEnabled: hasDrivewayGate,
    });
  }, [furtkaEnabled, furtkaPosition, previewPanelCount, hasDrivewayGate]);

  const svgMarkup = useMemo(() => {
    if (!post || !panel || !spacer || !height || !color) return null;

    const panelTextureUrl = resolvePanelTextureUrl(
      catalog,
      selection.panelId,
      selection.colorId,
    );
    const postTextureUrl = resolvePostTextureUrl(
      catalog,
      selection.postId,
      selection.colorId,
    );
    const openingTextureUrl = furtkaEnabled
      ? resolveOpeningTextureUrl(catalog, "furtka", furtkaElementId)
      : null;
    const bramaElement = hasDrivewayGate
      ? resolveElement(catalog, "brama", bramaElementId)
      : undefined;
    const drivewayGateKind = bramaElement
      ? resolveDrivewayGateKind(bramaElement)
      : undefined;
    // Wypełnienie bramy dziedziczy wzór z modelu płotu.
    const drivewayGateInfillPatternId = panel.patternId as PatternId;
    const drivewayGateTextureUrl = hasDrivewayGate
      ? resolveOpeningTextureUrl(catalog, "brama", bramaElementId)
      : null;
    const textureTileCount = computeTextureTileCount(
      height.valueM,
      resolvePanelTileHeightM(catalog, selection.panelId),
    );

    const footingHeight = catalog.footingHeights.find(
      (h) => h.id === footingHeightId,
    );
    const footingMaterial = catalog.footingMaterials.find(
      (m) => m.id === footingMaterialId,
    );

    return buildFenceSvg({
      heightM: height.valueM,
      patternId: panel.patternId as PatternId,
      colorHex: color.hex,
      postWidthCm: post.widthCm,
      hasSpacer: spacer.hasSpacer,
      openness: spacer.openness,
      panelCount: previewPanelCount,
      panelWidthCm: pricing.panelWidthCm,
      wicketWidthCm: getWicketWidthCm(pricing.panelWidthCm),
      wicketInsertAfter,
      drivewayGateEnabled: hasDrivewayGate,
      drivewayGateKind,
      drivewayGateTextureUrl,
      drivewayGateInfillPatternId,
      footingEnabled,
      footingHeightCm: footingHeight?.heightCm ?? 20,
      footingColorHex: footingMaterial?.hex ?? "#9ca3af",
      wicketHingeSide: furtkaHingeSide,
      transparent: true,
      panelTextureUrl,
      postTextureUrl,
      openingTextureUrl,
      textureTileCount,
    });
  }, [
    post,
    panel,
    spacer,
    height,
    color,
    catalog,
    selection.panelId,
    selection.postId,
    selection.colorId,
    wicketInsertAfter,
    previewPanelCount,
    furtkaEnabled,
    furtkaElementId,
    furtkaHingeSide,
    bramaElementId,
    hasDrivewayGate,
    footingEnabled,
    footingHeightId,
    footingMaterialId,
    pricing.panelWidthCm,
  ]);

  const viewWidth = getViewWidth(previewPanelCount, {
    hasWicket: furtkaEnabled,
    wicketWidthCm: getWicketWidthCm(pricing.panelWidthCm),
    panelWidthCm: pricing.panelWidthCm,
  });

  const contentBounds = useMemo(() => {
    if (!post || !height) return null;
    return getFenceContentBounds({
      heightM: height.valueM,
      postWidthCm: post.widthCm,
      panelCount: previewPanelCount,
      hasWicket: furtkaEnabled,
      wicketWidthCm: getWicketWidthCm(pricing.panelWidthCm),
      panelWidthCm: pricing.panelWidthCm,
    });
  }, [post, height, previewPanelCount, furtkaEnabled, pricing.panelWidthCm]);

  const fenceDisplayWidth =
    sceneWidth > 0
      ? `${getFenceBaseWidthPx(
          sceneWidth,
          previewPanelCount,
          furtkaEnabled,
          getWicketWidthCm(pricing.panelWidthCm),
          pricing.panelWidthCm,
        )}px`
      : `${FENCE_WIDTH_REM_BASE + (previewPanelCount - MIN_PREVIEW_PANELS) * FENCE_WIDTH_REM_PER_PANEL}rem`;

  const allSelected = post && panel && spacer && height && color;
  const heightCm = height ? Math.round(height.valueM * 100) : 0;
  const sceneBackgroundUrl = resolveBackgroundUrl(
    backgroundPresetId,
    backgroundImageUrl,
  );

  const positionLabels = {
    left: "lewa sekcja",
    center: "środkowa sekcja",
    right: "prawa sekcja",
  };

  const hingeSideLabels = {
    left: "zawiasy lewe",
    right: "zawiasy prawe",
  };

  const openingLabels: string[] = [];
  if (bramaElementId) {
    const bramaElement = catalog.elements.find((e) => e.id === bramaElementId);
    openingLabels.push(bramaElement?.name ?? "Brama");
  }
  if (furtkaEnabled && furtkaElementId) {
    const furtkaElement = catalog.elements.find((e) => e.id === furtkaElementId);
    openingLabels.push(
      `${furtkaElement?.name ?? "Furtka"} · ${positionLabels[furtkaPosition]} · ${hingeSideLabels[furtkaHingeSide]}`,
    );
  }

  const previewInfoItems = allSelected
    ? [
        { label: "Wysokość", value: `${heightCm} cm` },
        { label: "Panele", value: `${previewPanelCount} szt.` },
        { label: "Materiał", value: `Stal · ${panel!.name}` },
        { label: "Kolor", value: color!.name },
        {
          label: "Wejścia",
          value: openingLabels.length > 0 ? openingLabels.join(" · ") : "Brak",
        },
      ]
    : [];

  return (
    <div
      ref={previewRootRef}
      className="relative flex h-full min-h-[420px] flex-col bg-[#f0f0f0]"
    >
      {/* View controls */}
      <div className="absolute right-4 top-4 z-20 flex gap-2">
        <button
          type="button"
          aria-label={sidebarOpen ? "Ukryj panel opcji" : "Pokaż panel opcji"}
          title={sidebarOpen ? "Ukryj panel opcji" : "Pokaż panel opcji"}
          onClick={toggleSidebarOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white/92 text-[#6b7280] shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-[#303638]"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          aria-label={isFullscreen ? "Wyjdź z pełnego ekranu" : "Pełny ekran podglądu"}
          title={isFullscreen ? "Wyjdź z pełnego ekranu" : "Pełny ekran podglądu"}
          onClick={toggleFullscreen}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white/92 text-[#6b7280] shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-[#303638]"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          aria-label="Resetuj pozycję płotu"
          title="Resetuj pozycję płotu"
          onClick={resetFenceTransform}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white/92 text-[#6b7280] shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-[#303638]"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Scene */}
      <div
        ref={sceneRef}
        className="relative flex flex-1 overflow-hidden rounded-none lg:rounded-none"
        onClick={() => setFenceSelected(false)}
        style={{
          minHeight: 480,
          backgroundImage: `url(${sceneBackgroundUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-white/5" />

        {allSelected && <PreviewInfoBar items={previewInfoItems} />}

        {/* Fence SVG (draggable / resizable, tight bounds like Drutex) */}
        {svgMarkup && contentBounds ? (
          <div
            className="absolute left-1/2 z-10"
            style={{
              bottom: `${FENCE_SCENE_BOTTOM_PERCENT}%`,
              transform: `translate(calc(-50% + ${fenceTransform.x}px), ${fenceTransform.y}px) scale(${fenceTransform.scale})`,
              transformOrigin: "center bottom",
            }}
          >
            {showFenceHint && !fenceSelected && (
              <FenceInteractionHint inverseScale={1 / fenceTransform.scale} />
            )}
            <div
              ref={fenceRef}
              className={`relative touch-none select-none overflow-visible drop-shadow-[0_12px_28px_rgba(0,0,0,0.45)] ${
                fenceSelected
                  ? isDragging
                    ? "cursor-grabbing"
                    : "cursor-grab"
                  : "cursor-pointer"
              }`}
              style={{
                width: fenceDisplayWidth,
                aspectRatio: `${contentBounds.width} / ${contentBounds.height}`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                dismissFenceHint();
                setFenceSelected(true);
              }}
              onPointerDown={startDrag}
              onWheel={handleFenceWheel}
            >
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className="absolute [&_svg]:h-full [&_svg]:w-full"
                  style={{
                    width: `${(viewWidth / contentBounds.width) * 100}%`,
                    height: `${(VIEW_H / contentBounds.height) * 100}%`,
                    left: `${(-contentBounds.x / contentBounds.width) * 100}%`,
                    top: `${(-contentBounds.y / contentBounds.height) * 100}%`,
                  }}
                  dangerouslySetInnerHTML={{ __html: svgMarkup }}
                />
              </div>

              {(fenceSelected || showFenceHint) && (
                <div
                  className={`pointer-events-none absolute inset-0 z-20 border-2 border-dashed border-[#e30311] ${
                    showFenceHint && !fenceSelected ? "animate-pulse" : ""
                  }`}
                  aria-hidden
                />
              )}
              {fenceSelected && (
                <>
                  <ResizeHandle corner="nw" onPointerDown={startResize} />
                  <ResizeHandle corner="ne" onPointerDown={startResize} />
                  <ResizeHandle corner="sw" onPointerDown={startResize} />
                  <ResizeHandle corner="se" onPointerDown={startResize} />
                  <StretchHandle side="west" onPointerDown={startStretch} />
                  <StretchHandle side="east" onPointerDown={startStretch} />
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <p className="text-sm text-white/40">
              Wybierz opcje, aby zobaczyć podgląd
            </p>
          </div>
        )}

        {fenceSelected && svgMarkup && (
          <p className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-md border border-[#e5e7eb] bg-white/92 px-3 py-1 text-[10px] text-[#6b7280] shadow-sm backdrop-blur-sm">
            Przeciągnij aby przesunąć · boki: panele · rogi: skala · scroll: zoom
          </p>
        )}
      </div>

      {/* Bottom info bar */}
      {allSelected && (
        <div className="flex items-center gap-4 border-t border-[#e8e8e8] bg-white px-6 py-3">
          <div className="flex items-center gap-2">
            <span
              className="h-4 w-4 rounded-sm border border-[#ddd]"
              style={{ backgroundColor: color!.hex }}
            />
            <span className="text-xs font-semibold text-[#303638]">
              {panel!.name} · {height!.label} · {color!.name}
              {openingLabels.length > 0 ? ` · ${openingLabels.join(" · ")}` : ""}
            </span>
          </div>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-[#aaa]">
            Podgląd 2D · aktualizacja na żywo
          </span>
        </div>
      )}
    </div>
  );
}
