import type { z } from "zod";
import { PATTERN_OPTIONS } from "@/lib/fence/patterns";
import { catalogAssetPath } from "@/lib/firebase/storage";
import { DEFAULT_FURTKA_PRICE_NET } from "@/lib/pricing/element-prices";
import type { CollectionName } from "@/lib/types";
import {
  colorSchema,
  elementSchema,
  footingHeightSchema,
  footingMaterialSchema,
  heightSchema,
  panelSchema,
  postSchema,
  spacerSchema,
} from "@/lib/validations";
import type { FieldConfig } from "@/components/admin/EntityManager";

export type EntityConfig = {
  collection: CollectionName;
  title: string;
  schema: z.ZodType<Record<string, unknown>>;
  emptyItem: Record<string, unknown>;
  fields: FieldConfig[];
};

export const panelsConfig: EntityConfig = {
  collection: "panels",
  title: "Wybór modelu",
  schema: panelSchema,
  emptyItem: {
    name: "",
    patternId: "pattern-3d",
    widthCm: 250,
    priceSurchargePerMeter: 0,
    priceSurchargePerPanel: 0,
    sortOrder: 0,
    active: true,
  },
  fields: [
    { name: "name", label: "Nazwa", type: "text" },
    {
      name: "patternId",
      label: "Wzór",
      type: "select",
      options: PATTERN_OPTIONS.map((p) => ({ value: p.id, label: p.label })),
    },
    {
      name: "widthCm",
      label: "Szerokość panelu (cm)",
      type: "number",
    },
    {
      name: "priceSurchargePerPanel",
      label: "Dopłata za panel (PLN)",
      type: "number",
    },
    {
      name: "priceSurchargePerMeter",
      label: "Dopłata za m bieżący (PLN, legacy)",
      type: "number",
    },
    { name: "sortOrder", label: "Kolejność", type: "number" },
    { name: "active", label: "Aktywny", type: "boolean" },
  ],
};

export const colorsConfig: EntityConfig = {
  collection: "colors",
  title: "Kolor (RAL)",
  schema: colorSchema,
  emptyItem: {
    name: "",
    hex: "#9ca3af",
    priceSurchargePerMeter: 0,
    priceSurchargePerPanel: 0,
    sortOrder: 0,
    active: true,
  },
  fields: [
    { name: "name", label: "Nazwa", type: "text" },
    { name: "hex", label: "Kolor", type: "color" },
    {
      name: "priceSurchargePerPanel",
      label: "Dopłata za panel (PLN)",
      type: "number",
    },
    {
      name: "priceSurchargePerMeter",
      label: "Dopłata za m bieżący (PLN, legacy)",
      type: "number",
    },
    { name: "sortOrder", label: "Kolejność", type: "number" },
    { name: "active", label: "Aktywny", type: "boolean" },
  ],
};

export const spacersConfig: EntityConfig = {
  collection: "spacerOptions",
  title: "Wykończenie powierzchni",
  schema: spacerSchema,
  emptyItem: {
    name: "",
    hasSpacer: false,
    openness: 0,
    priceSurchargePerMeter: 0,
    priceSurchargePerPanel: 0,
    sortOrder: 0,
    active: true,
  },
  fields: [
    { name: "name", label: "Nazwa", type: "text" },
    { name: "hasSpacer", label: "Z dystansem", type: "boolean" },
    { name: "openness", label: "Ażurowość (0–1)", type: "number" },
    {
      name: "priceSurchargePerPanel",
      label: "Dopłata za panel (PLN)",
      type: "number",
    },
    {
      name: "priceSurchargePerMeter",
      label: "Dopłata za m bieżący (PLN, legacy)",
      type: "number",
    },
    { name: "sortOrder", label: "Kolejność", type: "number" },
    { name: "active", label: "Aktywny", type: "boolean" },
  ],
};

export const footingHeightsConfig: EntityConfig = {
  collection: "footingHeights",
  title: "Wysokość podmurówki",
  schema: footingHeightSchema,
  emptyItem: {
    label: "",
    heightCm: 20,
    priceSurchargePerPanel: 0,
    sortOrder: 0,
    active: true,
  },
  fields: [
    { name: "label", label: "Etykieta (np. 20 cm)", type: "text" },
    { name: "heightCm", label: "Wysokość (cm)", type: "number" },
    {
      name: "priceSurchargePerPanel",
      label: "Dopłata za panel (PLN)",
      type: "number",
    },
    { name: "sortOrder", label: "Kolejność", type: "number" },
    { name: "active", label: "Aktywny", type: "boolean" },
  ],
};

export const footingMaterialsConfig: EntityConfig = {
  collection: "footingMaterials",
  title: "Materiał / kolor podmurówki",
  schema: footingMaterialSchema,
  emptyItem: {
    name: "",
    hex: "#9ca3af",
    priceSurchargePerPanel: 0,
    sortOrder: 0,
    active: true,
  },
  fields: [
    { name: "name", label: "Nazwa materiału", type: "text" },
    { name: "hex", label: "Kolor podglądu (hex)", type: "color" },
    {
      name: "priceSurchargePerPanel",
      label: "Dopłata za panel (PLN)",
      type: "number",
    },
    { name: "sortOrder", label: "Kolejność", type: "number" },
    { name: "active", label: "Aktywny", type: "boolean" },
  ],
};

export const heightsConfig: EntityConfig = {
  collection: "heights",
  title: "Wysokość — presety",
  schema: heightSchema,
  emptyItem: {
    label: "",
    valueM: 1.5,
    priceMultiplier: 1,
    sortOrder: 0,
    active: true,
  },
  fields: [
    { name: "label", label: "Etykieta (np. 1,50 m)", type: "text" },
    { name: "valueM", label: "Wartość (m)", type: "number" },
    {
      name: "priceMultiplier",
      label: "Mnożnik ceny",
      type: "number",
    },
    { name: "sortOrder", label: "Kolejność", type: "number" },
    { name: "active", label: "Aktywny", type: "boolean" },
  ],
};

export const elementsConfig: EntityConfig = {
  collection: "elements",
  title: "Brama i furtka",
  schema: elementSchema,
  emptyItem: {
    type: "furtka",
    name: "",
    description: "",
    textureUrl: "",
    priceNet: DEFAULT_FURTKA_PRICE_NET,
    sortOrder: 0,
    active: true,
  },
  fields: [
    {
      name: "type",
      label: "Typ",
      type: "select",
      options: [
        { value: "brama", label: "Brama wjazdowa" },
        { value: "furtka", label: "Furtka" },
      ],
    },
    { name: "name", label: "Nazwa", type: "text" },
    {
      name: "gateKind",
      label: "Typ bramy",
      type: "select",
      options: [
        { value: "sliding", label: "Przesuwna" },
        { value: "double-leaf", label: "Dwuskrzydłowa" },
      ],
    },
    {
      name: "infillPatternId",
      label: "Wzór wypełnienia",
      type: "select",
      options: PATTERN_OPTIONS.map((p) => ({ value: p.id, label: p.label })),
    },
    {
      name: "priceNet",
      label: "Cena (PLN netto)",
      type: "number",
    },
    { name: "active", label: "Aktywny", type: "boolean" },
    { name: "sortOrder", label: "Kolejność", type: "number" },
    {
      name: "textureUrl",
      label: "Zdjęcie tekstury",
      type: "image",
      storagePath: ({ form, editingId }) => {
        if (!editingId) return null;
        const type = String(form.type ?? "furtka");
        return catalogAssetPath("elements", type, editingId);
      },
    },
  ],
};

export const postsConfig: EntityConfig = {
  collection: "posts",
  title: "Wybór słupka",
  schema: postSchema,
  emptyItem: {
    name: "",
    slug: "",
    previewAsset: "",
    baseTextureUrl: "",
    widthCm: 20,
    priceSurchargePerMeter: 0,
    priceSurchargePerPanel: 0,
    sortOrder: 0,
    active: true,
  },
  fields: [
    { name: "name", label: "Nazwa", type: "text" },
    { name: "slug", label: "Slug", type: "text" },
    { name: "widthCm", label: "Szerokość (cm)", type: "number" },
    {
      name: "priceSurchargePerPanel",
      label: "Dopłata za panel (PLN)",
      type: "number",
    },
    {
      name: "priceSurchargePerMeter",
      label: "Dopłata za m bieżący (PLN, legacy)",
      type: "number",
    },
    {
      name: "baseTextureUrl",
      label: "Bazowe zdjęcie słupka",
      type: "image",
      storagePath: ({ editingId }) =>
        editingId ? catalogAssetPath("posts", editingId, "base") : null,
    },
    { name: "sortOrder", label: "Kolejność", type: "number" },
    { name: "active", label: "Aktywny", type: "boolean" },
  ],
};
