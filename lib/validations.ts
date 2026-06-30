import { z } from "zod";

/** Firestore zwraca null dla pustych pól opcjonalnych — akceptuj null i pusty string. */
const optionalString = z.preprocess(
  (val) => (val === null || val === undefined ? undefined : String(val)),
  z.string().optional(),
);

const optionalUrl = z.preprocess(
  (val) => {
    if (val === null || val === undefined || val === "") return undefined;
    return String(val);
  },
  z.string().url("Podaj poprawny URL").optional(),
);

/** URL opcjonalny — pusty string lub null jawnie czyści pole w Firestore. */
const clearableUrl = z.preprocess(
  (val) => {
    if (val === null || val === undefined || val === "") return null;
    return String(val);
  },
  z.union([z.string().url("Podaj poprawny URL"), z.null()]),
);

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Kolor musi być w formacie #RRGGBB");

export const postSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug: małe litery, cyfry i myślniki"),
  description: optionalString,
  previewAsset: optionalString,
  baseTextureUrl: clearableUrl,
  widthCm: z.coerce.number().min(10).max(50),
  priceSurchargePerMeter: z.coerce.number().min(0).default(0),
  priceSurchargePerPanel: z.coerce.number().min(0).default(0),
  sortOrder: z.coerce.number().int().min(0),
  active: z.boolean(),
});

export const panelSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  patternId: z.enum([
    "pattern-3d",
    "pattern-palisade",
    "pattern-panel-horizontal",
  ]),
  priceSurchargePerMeter: z.coerce.number().min(0).default(0),
  priceSurchargePerPanel: z.coerce.number().min(0).default(0),
  description: optionalString,
  previewAsset: optionalString,
  baseTextureUrl: clearableUrl,
  textureTileHeightM: z.coerce.number().min(0.1).max(2.25).optional(),
  sortOrder: z.coerce.number().int().min(0),
  active: z.boolean(),
});

export const spacerSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  hasSpacer: z.boolean(),
  openness: z.coerce.number().min(0).max(1),
  priceSurchargePerMeter: z.coerce.number().min(0).default(0),
  priceSurchargePerPanel: z.coerce.number().min(0).default(0),
  sortOrder: z.coerce.number().int().min(0),
  active: z.boolean(),
});

export const heightSchema = z.object({
  label: z.string().min(1, "Etykieta jest wymagana"),
  valueM: z.coerce.number().min(1).max(2.25),
  priceMultiplier: z.coerce.number().min(0.1).max(5).default(1),
  description: optionalString,
  sortOrder: z.coerce.number().int().min(0),
  active: z.boolean(),
});

export const colorSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  hex: hexColorSchema,
  priceSurchargePerMeter: z.coerce.number().min(0).default(0),
  priceSurchargePerPanel: z.coerce.number().min(0).default(0),
  description: optionalString,
  previewAsset: optionalString,
  sortOrder: z.coerce.number().int().min(0),
  active: z.boolean(),
});

export const footingHeightSchema = z.object({
  label: z.string().min(1, "Etykieta jest wymagana"),
  heightCm: z.coerce.number().min(5).max(80),
  priceSurchargePerPanel: z.coerce.number().min(0).default(0),
  description: optionalString,
  sortOrder: z.coerce.number().int().min(0),
  active: z.boolean(),
});

export const footingMaterialSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  hex: hexColorSchema,
  priceSurchargePerPanel: z.coerce.number().min(0).default(0),
  description: optionalString,
  previewAsset: optionalString,
  sortOrder: z.coerce.number().int().min(0),
  active: z.boolean(),
});

export const elementSchema = z.object({
  type: z.enum(["brama", "furtka"]),
  name: z.string().min(1, "Nazwa jest wymagana"),
  description: optionalString,
  textureUrl: clearableUrl,
  gateKind: z.enum(["sliding", "double-leaf"]).optional(),
  infillPatternId: z
    .enum(["pattern-3d", "pattern-palisade", "pattern-panel-horizontal"])
    .optional(),
  priceNet: z.coerce.number().min(0).default(0),
  sortOrder: z.coerce.number().int().min(0),
  active: z.boolean(),
});

export const panelTextureSchema = z.object({
  panelId: z.string().min(1),
  colorId: z.string().min(1),
  imageUrl: z.string().url("Podaj poprawny URL zdjęcia"),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const postTextureSchema = z.object({
  postId: z.string().min(1),
  colorId: z.string().min(1),
  imageUrl: z.string().url("Podaj poprawny URL zdjęcia"),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const loginSchema = z.object({
  email: z.string().email("Podaj poprawny adres e-mail"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
});
