import type { PricingSettings } from "@/lib/types";
import { DEFAULT_PRICING_SETTINGS } from "@/lib/pricing/defaults";

type RawPricingSettings = Partial<PricingSettings> & {
  gatePriceNet?: number;
  bramaPriceNet?: number;
  furtkaPriceNet?: number;
};

export function normalizePricingSettings(
  raw: RawPricingSettings,
): PricingSettings {
  return {
    basePricePerMeterNet:
      raw.basePricePerMeterNet ?? DEFAULT_PRICING_SETTINGS.basePricePerMeterNet,
    panelWidthCm: raw.panelWidthCm ?? DEFAULT_PRICING_SETTINGS.panelWidthCm,
    currency: raw.currency ?? DEFAULT_PRICING_SETTINGS.currency,
  };
}
