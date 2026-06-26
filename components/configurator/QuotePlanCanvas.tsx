"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, RotateCcw, Ruler, Fence } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  clientToNormalizedInLayout,
  computePxPerMeter,
  findNearestPointIndex,
  getObjectContainLayout,
  lineLengthNormalizedPx,
  polygonPerimeterNormalizedPx,
  pxToMeters,
  type ImageLayout,
} from "@/lib/pricing/geometry";
import {
  ACCEPTED_BG_TYPES,
  MAX_BG_SIZE,
  validateBackgroundFile,
} from "@/lib/configurator/backgrounds";
import { useConfiguratorStore } from "@/lib/configurator/state";
import {
  gatePositionFromPoint,
  perimeterSlicePoints,
  pointAtArcT,
  projectPointOntoClosedPerimeter,
} from "@/lib/pricing/perimeter-path";

const EMPTY_LAYOUT: ImageLayout = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
};

type OpeningDragTarget = "brama-start" | "brama-end" | "furtka" | null;

export function QuotePlanCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [imageLayout, setImageLayout] = useState<ImageLayout>(EMPTY_LAYOUT);

  const quotePlanImageUrl = useConfiguratorStore((s) => s.quotePlanImageUrl);
  const quoteDrawMode = useConfiguratorStore((s) => s.quoteDrawMode);
  const quoteCalibrationLine = useConfiguratorStore((s) => s.quoteCalibrationLine);
  const quoteCalibrationPending = useConfiguratorStore(
    (s) => s.quoteCalibrationPending,
  );
  const quoteCalibrationLengthM = useConfiguratorStore(
    (s) => s.quoteCalibrationLengthM,
  );
  const quoteFencePoints = useConfiguratorStore((s) => s.quoteFencePoints);
  const quoteFenceClosed = useConfiguratorStore((s) => s.quoteFenceClosed);
  const quotePerimeterM = useConfiguratorStore((s) => s.quotePerimeterM);
  const quotePxPerMeter = useConfiguratorStore((s) => s.quotePxPerMeter);
  const bramaEnabled = useConfiguratorStore((s) => s.bramaEnabled);
  const bramaArcStart = useConfiguratorStore((s) => s.bramaArcStart);
  const bramaArcEnd = useConfiguratorStore((s) => s.bramaArcEnd);
  const furtkaEnabled = useConfiguratorStore((s) => s.furtkaEnabled);
  const furtkaArcPosition = useConfiguratorStore((s) => s.furtkaArcPosition);

  const setQuotePlanImage = useConfiguratorStore((s) => s.setQuotePlanImage);
  const setQuoteDrawMode = useConfiguratorStore((s) => s.setQuoteDrawMode);
  const setQuoteCalibrationLine = useConfiguratorStore(
    (s) => s.setQuoteCalibrationLine,
  );
  const setQuoteCalibrationPending = useConfiguratorStore(
    (s) => s.setQuoteCalibrationPending,
  );
  const setQuotePxPerMeter = useConfiguratorStore((s) => s.setQuotePxPerMeter);
  const addQuoteFencePoint = useConfiguratorStore((s) => s.addQuoteFencePoint);
  const removeQuoteFencePointAt = useConfiguratorStore(
    (s) => s.removeQuoteFencePointAt,
  );
  const setQuotePerimeterM = useConfiguratorStore((s) => s.setQuotePerimeterM);
  const resetQuoteDrawing = useConfiguratorStore((s) => s.resetQuoteDrawing);
  const setBramaArcStart = useConfiguratorStore((s) => s.setBramaArcStart);
  const setBramaArcEnd = useConfiguratorStore((s) => s.setBramaArcEnd);
  const setFurtkaArcPosition = useConfiguratorStore((s) => s.setFurtkaArcPosition);
  const setFurtkaPosition = useConfiguratorStore((s) => s.setFurtkaPosition);

  const openingDragRef = useRef<OpeningDragTarget>(null);

  const updateLayout = useCallback(() => {
    const el = containerRef.current;
    const img = imgRef.current;
    if (!el) return;

    const { width, height } = el.getBoundingClientRect();

    const nw = img?.naturalWidth ?? naturalSize.width;
    const nh = img?.naturalHeight ?? naturalSize.height;
    if (nw > 0 && nh > 0) {
      setImageLayout(getObjectContainLayout(width, height, nw, nh));
    }
  }, [naturalSize.width, naturalSize.height]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateLayout());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateLayout, quotePlanImageUrl]);

  useEffect(() => {
    if (
      !quoteCalibrationLine ||
      imageLayout.width <= 0 ||
      quoteCalibrationLengthM <= 0
    ) {
      return;
    }
    const linePx = lineLengthNormalizedPx(quoteCalibrationLine, imageLayout);
    const pxPerMeter = computePxPerMeter(linePx, quoteCalibrationLengthM);
    setQuotePxPerMeter(pxPerMeter);
  }, [
    quoteCalibrationLine,
    quoteCalibrationLengthM,
    imageLayout,
    setQuotePxPerMeter,
  ]);

  useEffect(() => {
    if (
      !quoteFenceClosed ||
      quoteFencePoints.length < 3 ||
      !quotePxPerMeter ||
      imageLayout.width <= 0
    ) {
      return;
    }
    const perimeterPx = polygonPerimeterNormalizedPx(
      quoteFencePoints,
      imageLayout,
      true,
    );
    setQuotePerimeterM(pxToMeters(perimeterPx, quotePxPerMeter));
  }, [
    quoteFenceClosed,
    quoteFencePoints,
    quotePxPerMeter,
    imageLayout,
    setQuotePerimeterM,
  ]);

  const projectToPerimeter = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current || !quotePxPerMeter) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const point = clientToNormalizedInLayout(
        clientX,
        clientY,
        rect,
        imageLayout,
      );
      if (!point) return null;
      return projectPointOntoClosedPerimeter(
        point,
        quoteFencePoints,
        imageLayout,
        quotePxPerMeter,
      );
    },
    [imageLayout, quoteFencePoints, quotePxPerMeter],
  );

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const target = openingDragRef.current;
      if (!target || !quoteFenceClosed) return;
      const projection = projectToPerimeter(e.clientX, e.clientY);
      if (!projection) return;

      if (target === "brama-start") {
        setBramaArcStart(projection.arcT);
      } else if (target === "brama-end") {
        setBramaArcEnd(projection.arcT);
      } else if (target === "furtka") {
        setFurtkaArcPosition(projection.arcT);
        setFurtkaPosition(gatePositionFromPoint(projection.point));
      }
    }

    function onPointerUp() {
      openingDragRef.current = null;
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [
    quoteFenceClosed,
    projectToPerimeter,
    setBramaArcStart,
    setBramaArcEnd,
    setFurtkaArcPosition,
    setFurtkaPosition,
  ]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const error = validateBackgroundFile(file);
    if (error) {
      alert(error);
      return;
    }
    if (!ACCEPTED_BG_TYPES.includes(file.type) || file.size > MAX_BG_SIZE) {
      alert("Nieprawidłowy plik.");
      return;
    }
    setQuotePlanImage(URL.createObjectURL(file));
  };

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    updateLayout();
  };

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!quotePlanImageUrl || !containerRef.current) return;
      if (imageLayout.width <= 0) return;

      const rect = containerRef.current.getBoundingClientRect();
      const point = clientToNormalizedInLayout(
        e.clientX,
        e.clientY,
        rect,
        imageLayout,
      );
      if (!point) return;

      if (quoteDrawMode === "calibrate") {
        if (quoteCalibrationLine && !quoteCalibrationPending) {
          setQuoteCalibrationLine(null);
          setQuotePxPerMeter(null);
          setQuoteCalibrationPending(point);
          return;
        }
        if (!quoteCalibrationPending) {
          setQuoteCalibrationPending(point);
          return;
        }
        const line = {
          x1: quoteCalibrationPending.x,
          y1: quoteCalibrationPending.y,
          x2: point.x,
          y2: point.y,
        };
        setQuoteCalibrationLine(line);
        setQuoteCalibrationPending(null);

        const linePx = lineLengthNormalizedPx(line, imageLayout);
        const pxPerMeter = computePxPerMeter(linePx, quoteCalibrationLengthM);
        setQuotePxPerMeter(pxPerMeter);
        setQuoteDrawMode("fence");
        return;
      }

      if (!quotePxPerMeter) return;

      const hitIndex = findNearestPointIndex(
        point,
        quoteFencePoints,
        imageLayout,
      );
      if (hitIndex !== null) {
        removeQuoteFencePointAt(hitIndex);
        return;
      }

      if (quoteFenceClosed) return;
      addQuoteFencePoint(point);
    },
    [
      quotePlanImageUrl,
      imageLayout,
      quoteDrawMode,
      quoteCalibrationLine,
      quoteCalibrationPending,
      quoteCalibrationLengthM,
      quotePxPerMeter,
      quoteFenceClosed,
      quoteFencePoints,
      setQuoteCalibrationPending,
      setQuoteCalibrationLine,
      setQuotePxPerMeter,
      setQuoteDrawMode,
      addQuoteFencePoint,
      removeQuoteFencePointAt,
    ],
  );

  const calibrationPreviewLine = quoteCalibrationLine;

  const bramaSlicePoints =
    quoteFenceClosed &&
    bramaEnabled &&
    bramaArcStart != null &&
    bramaArcEnd != null
      ? perimeterSlicePoints(
          bramaArcStart,
          bramaArcEnd,
          quoteFencePoints,
          imageLayout,
        )
      : [];

  const bramaStartPoint =
    bramaArcStart != null
      ? pointAtArcT(bramaArcStart, quoteFencePoints, imageLayout)
      : null;
  const bramaEndPoint =
    bramaArcEnd != null
      ? pointAtArcT(bramaArcEnd, quoteFencePoints, imageLayout)
      : null;
  const furtkaPoint =
    furtkaArcPosition != null
      ? pointAtArcT(furtkaArcPosition, quoteFencePoints, imageLayout)
      : null;

  const calibrationMidpoint = quoteCalibrationLine
    ? {
        x: (quoteCalibrationLine.x1 + quoteCalibrationLine.x2) / 2,
        y: (quoteCalibrationLine.y1 + quoteCalibrationLine.y2) / 2,
      }
    : null;

  const fenceCentroid =
    quoteFenceClosed && quoteFencePoints.length >= 3
      ? {
          x:
            quoteFencePoints.reduce((sum, p) => sum + p.x, 0) /
            quoteFencePoints.length,
          y:
            quoteFencePoints.reduce((sum, p) => sum + p.y, 0) /
            quoteFencePoints.length,
        }
      : null;

  function startOpeningDrag(
    e: React.PointerEvent,
    target: OpeningDragTarget,
  ) {
    e.stopPropagation();
    e.preventDefault();
    openingDragRef.current = target;
  }

  return (
    <div className="relative flex h-full min-h-[420px] flex-col bg-[#e8e8e8]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
      />

      <div className="absolute right-4 top-4 z-20 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 items-center gap-2 rounded-full border border-black/5 bg-white/85 px-3.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#303638] shadow-md shadow-black/10 backdrop-blur transition-colors hover:bg-white"
        >
          <ImagePlus className="h-4 w-4 text-[#e30311]" />
          {quotePlanImageUrl ? "Zmień rzut" : "Wgraj rzut"}
        </button>
        {quotePlanImageUrl && (
          <>
            <div className="flex items-center gap-1 rounded-full border border-black/5 bg-white/85 p-1 shadow-md shadow-black/10 backdrop-blur">
              <button
                type="button"
                onClick={() => {
                  setQuoteDrawMode("calibrate");
                  setQuoteCalibrationPending(null);
                }}
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors",
                  quoteDrawMode === "calibrate"
                    ? "bg-[#e30311] text-white shadow-sm"
                    : "text-[#5b6164] hover:bg-black/5",
                )}
              >
                <Ruler className="h-3.5 w-3.5" />
                Skala
              </button>
              <button
                type="button"
                disabled={!quotePxPerMeter}
                onClick={() => setQuoteDrawMode("fence")}
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors disabled:cursor-not-allowed disabled:opacity-35",
                  quoteDrawMode === "fence"
                    ? "bg-[#e30311] text-white shadow-sm"
                    : "text-[#5b6164] hover:bg-black/5",
                )}
              >
                <Fence className="h-3.5 w-3.5" />
                Obrys
              </button>
            </div>
            <button
              type="button"
              onClick={resetQuoteDrawing}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white/85 text-[#6b7280] shadow-md shadow-black/10 backdrop-blur transition-colors hover:bg-white hover:text-[#e30311]"
              title="Resetuj rysowanie"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {!quotePlanImageUrl ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="max-w-sm rounded-2xl border border-dashed border-[#c4c6ca] bg-white/80 px-8 py-10 shadow-xl shadow-black/5 backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e30311] shadow-lg shadow-[#e30311]/25">
              <ImagePlus className="h-8 w-8 text-white" />
            </div>
            <p className="font-heading text-base font-bold text-[#222]">
              Wgraj plan działki lub zrzut mapy
            </p>
            <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-[#6b7280]">
              Ustaw skalę (2 kliknięcia + długość w&nbsp;metrach), a&nbsp;potem
              klikaj narożniki działki, gdzie stanie płot.
            </p>
            <div className="my-5 flex items-center justify-center gap-2">
              {["Skala", "Obrys", "Cena"].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  {i > 0 && <span className="h-px w-4 bg-[#d4d6da]" />}
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#888]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f0d3d5] text-[10px] font-bold text-[#e30311]">
                      {i + 1}
                    </span>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-[#e30311] px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-md shadow-[#e30311]/25 transition-colors hover:bg-[#c9020f]"
            >
              Wybierz plik
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="relative flex-1 cursor-crosshair overflow-hidden"
          onClick={handleCanvasClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={quotePlanImageUrl}
            alt="Rzut działki"
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            draggable={false}
            onLoad={handleImageLoad}
          />

          <div
            className="absolute"
            style={{
              left: imageLayout.left,
              top: imageLayout.top,
              width: imageLayout.width,
              height: imageLayout.height,
            }}
          >
            {quoteDrawMode === "fence" &&
              quoteFencePoints.map((p, i) => (
                <button
                  key={`hit-${p.x}-${p.y}-${i}`}
                  type="button"
                  aria-label={`Usuń punkt ${i + 1}`}
                  title={`Usuń punkt ${i + 1}`}
                  className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-transparent text-[10px] font-bold text-[#e30311] opacity-0 transition-all hover:border-[#e30311] hover:bg-white/90 hover:opacity-100 focus-visible:border-[#e30311] focus-visible:bg-white/90 focus-visible:opacity-100"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeQuoteFencePointAt(i);
                  }}
                >
                  ×
                </button>
              ))}
          </div>

          <div
            className="pointer-events-none absolute"
            style={{
              left: imageLayout.left,
              top: imageLayout.top,
              width: imageLayout.width,
              height: imageLayout.height,
            }}
          >
            <svg
              className="h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {calibrationPreviewLine && (
                <line
                  x1={calibrationPreviewLine.x1}
                  y1={calibrationPreviewLine.y1}
                  x2={calibrationPreviewLine.x2}
                  y2={calibrationPreviewLine.y2}
                  stroke="#e30311"
                  strokeWidth="0.4"
                  strokeDasharray="1.2 0.8"
                />
              )}
              {quoteFenceClosed && quoteFencePoints.length >= 3 ? (
                <polygon
                  points={quoteFencePoints.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="rgba(255, 49, 49, 0.12)"
                  stroke="#e30311"
                  strokeWidth="0.45"
                />
              ) : (
                quoteFencePoints.length > 0 && (
                  <polyline
                    points={quoteFencePoints
                      .map((p) => `${p.x},${p.y}`)
                      .join(" ")}
                    fill="none"
                    stroke="#e30311"
                    strokeWidth="0.45"
                    strokeDasharray="1 0.6"
                  />
                )
              )}
              {bramaSlicePoints.length > 1 && (
                <polyline
                  points={bramaSlicePoints
                    .map((p) => `${p.x},${p.y}`)
                    .join(" ")}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </div>

          <div
            className="pointer-events-none absolute"
            style={{
              left: imageLayout.left,
              top: imageLayout.top,
              width: imageLayout.width,
              height: imageLayout.height,
            }}
          >
            {calibrationPreviewLine &&
              [
                { x: calibrationPreviewLine.x1, y: calibrationPreviewLine.y1 },
                { x: calibrationPreviewLine.x2, y: calibrationPreviewLine.y2 },
              ].map((end, i) => (
                <span
                  key={`cal-end-${i}`}
                  className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#e30311] shadow-md"
                  style={{ left: `${end.x}%`, top: `${end.y}%` }}
                />
              ))}
            {quoteCalibrationPending && (
              <span
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2 border-white bg-[#e30311] shadow-md"
                style={{
                  left: `${quoteCalibrationPending.x}%`,
                  top: `${quoteCalibrationPending.y}%`,
                }}
              />
            )}
            {quoteFencePoints.map((p, i) => (
              <span
                key={`dot-${p.x}-${p.y}-${i}`}
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#e30311] bg-white shadow-sm"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              />
            ))}
            {calibrationMidpoint && quoteCalibrationLengthM > 0 && (
              <span
                className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-[#e30311] px-2 py-0.5 text-[10px] font-bold text-white shadow-md ring-2 ring-white/70"
                style={{
                  left: `${calibrationMidpoint.x}%`,
                  top: `${calibrationMidpoint.y}%`,
                }}
              >
                <Ruler className="h-2.5 w-2.5" />
                {quoteCalibrationLengthM} m
              </span>
            )}
            {fenceCentroid && quotePerimeterM && (
              <span
                className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-lg bg-[#1A1A18]/92 px-2.5 py-1 text-center shadow-lg ring-2 ring-white/15 backdrop-blur"
                style={{
                  left: `${fenceCentroid.x}%`,
                  top: `${fenceCentroid.y}%`,
                }}
              >
                <span className="text-[8px] font-bold uppercase tracking-wider text-white/55">
                  Obwód
                </span>
                <span className="font-heading text-sm font-bold leading-none text-white">
                  {quotePerimeterM.toFixed(1)}{" "}
                  <span className="text-[9px] font-medium text-white/60">m</span>
                </span>
              </span>
            )}
          </div>

          {quoteFenceClosed && (
            <div
              className="absolute touch-none"
              style={{
                left: imageLayout.left,
                top: imageLayout.top,
                width: imageLayout.width,
                height: imageLayout.height,
              }}
            >
              {bramaEnabled && bramaStartPoint && (
                <button
                  type="button"
                  aria-label="Początek bramy"
                  className="absolute z-30 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-[#2563eb] text-[9px] font-bold text-white shadow-md active:cursor-grabbing"
                  style={{
                    left: `${bramaStartPoint.x}%`,
                    top: `${bramaStartPoint.y}%`,
                  }}
                  onPointerDown={(e) => startOpeningDrag(e, "brama-start")}
                >
                  B1
                </button>
              )}
              {bramaEnabled && bramaEndPoint && (
                <button
                  type="button"
                  aria-label="Koniec bramy"
                  className="absolute z-30 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-[#2563eb] text-[9px] font-bold text-white shadow-md active:cursor-grabbing"
                  style={{
                    left: `${bramaEndPoint.x}%`,
                    top: `${bramaEndPoint.y}%`,
                  }}
                  onPointerDown={(e) => startOpeningDrag(e, "brama-end")}
                >
                  B2
                </button>
              )}
              {furtkaEnabled && furtkaPoint && (
                <button
                  type="button"
                  aria-label="Furtka"
                  className="absolute z-30 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-md border-2 border-white bg-[#f59e0b] text-[9px] font-bold text-white shadow-md active:cursor-grabbing"
                  style={{
                    left: `${furtkaPoint.x}%`,
                    top: `${furtkaPoint.y}%`,
                  }}
                  onPointerDown={(e) => startOpeningDrag(e, "furtka")}
                >
                  F
                </button>
              )}
            </div>
          )}

          <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center gap-2.5 rounded-xl border border-black/5 bg-white/90 px-3 py-2.5 shadow-lg shadow-black/10 backdrop-blur sm:right-auto sm:max-w-md">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white",
                quoteDrawMode === "calibrate" ? "bg-[#e30311]" : "bg-[#1A1A18]",
              )}
            >
              {quoteDrawMode === "calibrate" ? (
                <Ruler className="h-4 w-4" />
              ) : (
                <Fence className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#e30311]">
                {quoteDrawMode === "calibrate"
                  ? "Krok 1 · Skala"
                  : "Krok 2 · Obrys"}
              </p>
              <p className="text-xs font-semibold leading-snug text-[#303638]">
                {quoteDrawMode === "calibrate"
                  ? quoteCalibrationPending
                    ? "Kliknij drugi punkt, aby domknąć linię skali"
                    : quoteCalibrationLine
                      ? "Kliknij, aby ustawić skalę od nowa"
                      : "Kliknij pierwszy punkt linii skali"
                  : quoteFenceClosed
                    ? bramaEnabled || furtkaEnabled
                      ? "Przeciągnij uchwyty bramy (B1/B2) lub furtkę (F) wzdłuż obrysu"
                      : "Obrys gotowy — × na kropce usuwa punkt"
                    : quoteFencePoints.length === 0
                      ? "Klikaj narożniki działki (min. 3). × usuwa punkt"
                      : `Punkt ${quoteFencePoints.length} — kliknij kolejny narożnik lub × by usunąć`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
