export type CatalogEntity = {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
  description?: string;
  previewAsset?: string;
};

export type Post = CatalogEntity & {
  slug: string;
  widthCm: number;
  priceSurchargePerMeter?: number;
  priceSurchargePerPanel?: number;
  baseTextureUrl?: string;
};

export type Panel = CatalogEntity & {
  patternId: string;
  priceSurchargePerMeter?: number;
  priceSurchargePerPanel?: number;
  baseTextureUrl?: string;
  textureTileHeightM?: number;
};

export type SpacerOption = CatalogEntity & {
  hasSpacer: boolean;
  openness: number;
  priceSurchargePerMeter?: number;
  priceSurchargePerPanel?: number;
};

export type Height = {
  id: string;
  label: string;
  valueM: number;
  sortOrder: number;
  active: boolean;
  priceMultiplier?: number;
};

export type Color = CatalogEntity & {
  hex: string;
  priceSurchargePerMeter?: number;
  priceSurchargePerPanel?: number;
};

export type FootingHeight = {
  id: string;
  label: string;
  heightCm: number;
  sortOrder: number;
  active: boolean;
  description?: string;
  priceSurchargePerPanel?: number;
};

export type FootingMaterial = CatalogEntity & {
  hex: string;
  priceSurchargePerPanel?: number;
};

export type OpeningElementType = "brama" | "furtka";

export type OpeningElement = {
  id: string;
  type: OpeningElementType;
  name: string;
  sortOrder: number;
  active: boolean;
  textureUrl?: string;
  description?: string;
  /** Brama i furtka: cena stała netto (PLN). */
  priceNet?: number;
};

export type PanelTexture = {
  id: string;
  panelId: string;
  colorId: string;
  imageUrl: string;
  sortOrder?: number;
};

export type PostTexture = {
  id: string;
  postId: string;
  colorId: string;
  imageUrl: string;
  sortOrder?: number;
};

export type CatalogCollections = {
  posts: Post[];
  panels: Panel[];
  spacerOptions: SpacerOption[];
  heights: Height[];
  colors: Color[];
  footingHeights: FootingHeight[];
  footingMaterials: FootingMaterial[];
  elements: OpeningElement[];
  panelTextures: PanelTexture[];
  postTextures: PostTexture[];
};

export type ConfiguratorSelection = {
  postId: string | null;
  panelId: string | null;
  spacerId: string | null;
  heightId: string | null;
  colorId: string | null;
};

export const COLLECTION_NAMES = {
  posts: "posts",
  panels: "panels",
  spacerOptions: "spacerOptions",
  heights: "heights",
  colors: "colors",
  footingHeights: "footingHeights",
  footingMaterials: "footingMaterials",
  elements: "elements",
  panelTextures: "panelTextures",
  postTextures: "postTextures",
} as const;

export type CollectionName = keyof typeof COLLECTION_NAMES;

export type PricingSettings = {
  /** Zachowane do migracji wstecznej z modelu PLN/m. */
  basePricePerMeterNet: number;
  panelPriceNet: number;
  footingPriceNet: number;
  panelWidthCm: number;
  currency: string;
};

export type QuoteBreakdown = {
  label: string;
  value: string;
  amount: number;
};

export type QuoteConfigurationItem = {
  label: string;
  value: string;
};

export type QuoteResult = {
  perimeterM: number;
  estimatedPanels: number;
  panelUnits: number;
  pricePerPanelNet: number;
  /** @deprecated Użyj pricePerPanelNet — zachowane dla kompatybilności UI. */
  pricePerMeterNet: number;
  fenceSubtotal: number;
  footingPrice: number;
  bramaPrice: number;
  furtkaPrice: number;
  totalNet: number;
  currency: string;
  breakdown: QuoteBreakdown[];
  configurationItems: QuoteConfigurationItem[];
  hasMeasuredPerimeter: boolean;
};
