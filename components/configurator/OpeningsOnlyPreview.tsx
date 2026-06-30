"use client";

import { useMemo } from "react";
import { buildFenceSvg, getViewWidth, VIEW_H } from "@/lib/fence/renderFence";
import type { PatternId } from "@/lib/fence/patterns";
import { useConfiguratorStore } from "@/lib/configurator/state";
import type { CatalogCollections } from "@/lib/types";
import { calculateQuote } from "@/lib/pricing/calculateQuote";
import {
  isDrivewayGateConfigured,
  resolveDrivewayGateKind,
  resolveElement,
} from "@/lib/pricing/element-prices";
import { getWicketWidthCm } from "@/lib/pricing/variant-prices";
import {
  computeTextureTileCount,
  resolveOpeningTextureUrl,
  resolvePanelTileHeightM,
} from "@/lib/fence/resolveTexture";

type Props = {
  catalog: CatalogCollections;
};

export function OpeningsOnlyPreview({ catalog }: Props) {
  const scope = useConfiguratorStore((s) => s.scope);
  const selection = useConfiguratorStore((s) => s.selection);
  const pricing = useConfiguratorStore((s) => s.pricing);
  const bramaElementId = useConfiguratorStore((s) => s.bramaElementId);
  const furtkaElementId = useConfiguratorStore((s) => s.furtkaElementId);
  const bramaEnabled = useConfiguratorStore((s) => s.bramaEnabled);
  const furtkaEnabled = useConfiguratorStore((s) => s.furtkaEnabled);
  const furtkaHingeSide = useConfiguratorStore((s) => s.furtkaHingeSide);

  const quote = useMemo(
    () =>
      calculateQuote({
        catalog,
        selection,
        pricing,
        fenceEnabled: false,
        bramaEnabled,
        bramaElementId,
        furtkaEnabled,
        furtkaElementId,
      }),
    [
      catalog,
      selection,
      pricing,
      bramaEnabled,
      bramaElementId,
      furtkaEnabled,
      furtkaElementId,
    ],
  );

  const brama = bramaEnabled
    ? resolveElement(catalog, "brama", bramaElementId)
    : undefined;
  const furtka = furtkaEnabled
    ? resolveElement(catalog, "furtka", furtkaElementId)
    : undefined;

  const post = catalog.posts.find((p) => p.id === selection.postId);
  const panel = catalog.panels.find((p) => p.id === selection.panelId);
  const spacer = catalog.spacerOptions.find((s) => s.id === selection.spacerId);
  const height = catalog.heights.find((h) => h.id === selection.heightId);
  const color = catalog.colors.find((c) => c.id === selection.colorId);

  const hasDrivewayGate =
    bramaEnabled && isDrivewayGateConfigured(bramaElementId);
  const hasWicket = furtkaEnabled && Boolean(furtkaElementId);

  const svgMarkup = useMemo(() => {
    if (!post || !panel || !spacer || !height || !color) return null;
    if (!hasDrivewayGate && !hasWicket) return null;

    // Brama zajmuje dwa pełne panele; furtkę dostawiamy obok bez paneli.
    const panelCount = hasDrivewayGate ? 2 : 0;
    const wicketInsertAfter = hasWicket ? -1 : undefined;

    const drivewayGateKind = brama
      ? resolveDrivewayGateKind(brama)
      : undefined;
    // Wypełnienie bramy dziedziczy wzór z modelu płotu.
    const drivewayGateInfillPatternId = panel.patternId as PatternId;
    const drivewayGateTextureUrl = hasDrivewayGate
      ? resolveOpeningTextureUrl(catalog, "brama", bramaElementId)
      : null;
    const openingTextureUrl = hasWicket
      ? resolveOpeningTextureUrl(catalog, "furtka", furtkaElementId)
      : null;

    const textureTileCount = computeTextureTileCount(
      height.valueM,
      resolvePanelTileHeightM(catalog, selection.panelId),
    );

    return buildFenceSvg({
      heightM: height.valueM,
      patternId: panel.patternId as PatternId,
      colorHex: color.hex,
      postWidthCm: post.widthCm,
      hasSpacer: spacer.hasSpacer,
      openness: spacer.openness,
      panelCount,
      panelWidthCm: pricing.panelWidthCm,
      wicketWidthCm: getWicketWidthCm(pricing.panelWidthCm),
      wicketInsertAfter,
      drivewayGateEnabled: hasDrivewayGate,
      drivewayGateKind,
      drivewayGateTextureUrl,
      drivewayGateInfillPatternId,
      wicketHingeSide: furtkaHingeSide,
      transparent: true,
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
    pricing.panelWidthCm,
    hasDrivewayGate,
    hasWicket,
    brama,
    bramaElementId,
    furtkaElementId,
    furtkaHingeSide,
  ]);

  const aspectRatio = useMemo(() => {
    const panelCount = hasDrivewayGate ? 2 : 0;
    const viewW = getViewWidth(panelCount, {
      hasWicket,
      wicketWidthCm: getWicketWidthCm(pricing.panelWidthCm),
      panelWidthCm: pricing.panelWidthCm,
    });
    return viewW / VIEW_H;
  }, [hasDrivewayGate, hasWicket, pricing.panelWidthCm]);

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#e8f4fc] to-[#f5f9fd]">
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        {svgMarkup ? (
          <div
            className="w-full max-w-3xl"
            style={{ aspectRatio: `${aspectRatio}` }}
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        ) : (
          <div className="w-full max-w-md rounded-2xl border border-[#ddd] bg-white p-6 text-center shadow-lg">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e30311]">
              STAL-POL · Elementy otwierające
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold text-[#1A1A18]">
              Podgląd konfiguracji
            </h2>
            <p className="mt-1 text-sm text-[#666]">
              Wybierz typ bramy i furtki w panelu bocznym, aby zobaczyć podgląd.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-[#dce6ef] bg-white/70 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {scope.gate && (
              <span className="text-[#1A1A18]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#999]">
                  Brama:{" "}
                </span>
                <span className="font-semibold">
                  {brama?.name ?? "wybierz w zakładce Elementy"}
                </span>
                {brama && (
                  <span className="ml-1 text-[#e30311]">
                    {quote.bramaPrice.toLocaleString("pl-PL")} PLN netto
                  </span>
                )}
              </span>
            )}
            {scope.wicket && (
              <span className="text-[#1A1A18]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#999]">
                  Furtka:{" "}
                </span>
                <span className="font-semibold">
                  {furtka?.name ?? "wybierz w zakładce Elementy"}
                </span>
                {furtka && (
                  <span className="ml-1 text-[#e30311]">
                    {quote.furtkaPrice.toLocaleString("pl-PL")} PLN netto
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-[#666]">Razem netto</span>
            <span className="font-heading text-2xl font-bold text-[#1A1A18]">
              {Math.round(quote.totalNet).toLocaleString("pl-PL")} PLN
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
