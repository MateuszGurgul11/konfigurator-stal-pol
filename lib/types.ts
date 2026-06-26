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
  baseTextureUrl?: string;
};

export type Panel = CatalogEntity & {
  patternId: string;
  priceSurchargePerMeter?: number;
  baseTextureUrl?: string;
  textureTileHeightM?: number;
};

export type SpacerOption = CatalogEntity & {
  hasSpacer: boolean;
  openness: number;
  priceSurchargePerMeter?: number;
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
  elements: "elements",
  panelTextures: "panelTextures",
  postTextures: "postTextures",
} as const;

export type CollectionName = keyof typeof COLLECTION_NAMES;

export type PricingSettings = {
  basePricePerMeterNet: number;
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
  pricePerMeterNet: number;
  fenceSubtotal: number;
  bramaPrice: number;
  furtkaPrice: number;
  totalNet: number;
  currency: string;
  breakdown: QuoteBreakdown[];
  configurationItems: QuoteConfigurationItem[];
  hasMeasuredPerimeter: boolean;
};
