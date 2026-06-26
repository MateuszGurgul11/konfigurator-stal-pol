"use client";

import { useMemo } from "react";
import { DoorOpen, Square } from "lucide-react";
import { useConfiguratorStore } from "@/lib/configurator/state";
import type { CatalogCollections } from "@/lib/types";
import { calculateQuote } from "@/lib/pricing/calculateQuote";
import { resolveElement } from "@/lib/pricing/element-prices";

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

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-[#e8f4fc] to-[#f5f9fd] px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#ddd] bg-white p-6 shadow-lg">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e30311]">
          STAL-POL · Elementy otwierające
        </p>
        <h2 className="mt-2 font-heading text-xl font-bold text-[#1A1A18]">
          Podgląd konfiguracji
        </h2>
        <p className="mt-1 text-sm text-[#666]">
          Wybierz typ bramy i furtki w panelu bocznym. Ceny są stałe netto.
        </p>

        <div className="mt-6 space-y-3">
          {scope.gate && (
            <div className="flex items-center gap-4 rounded-xl border border-[#eee] bg-[#fafafa] p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1A1A18]">
                <Square className="h-6 w-6 text-[#e30311]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#999]">
                  Brama
                </p>
                <p className="font-semibold text-[#1A1A18]">
                  {brama?.name ?? "Wybierz w zakładce Elementy"}
                </p>
                {brama && (
                  <p className="text-sm text-[#e30311]">
                    {quote.bramaPrice.toLocaleString("pl-PL")} PLN netto
                  </p>
                )}
              </div>
            </div>
          )}

          {scope.wicket && (
            <div className="flex items-center gap-4 rounded-xl border border-[#eee] bg-[#fafafa] p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1A1A18]">
                <DoorOpen className="h-6 w-6 text-[#e30311]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#999]">
                  Furtka
                </p>
                <p className="font-semibold text-[#1A1A18]">
                  {furtka?.name ?? "Wybierz w zakładce Elementy"}
                </p>
                {furtka && (
                  <p className="text-sm text-[#e30311]">
                    {quote.furtkaPrice.toLocaleString("pl-PL")} PLN netto
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-[#eee] pt-4">
          <div className="flex items-center justify-between">
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
