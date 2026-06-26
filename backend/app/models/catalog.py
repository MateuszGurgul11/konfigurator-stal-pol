from typing import Literal

from pydantic import BaseModel, Field, field_validator
import re

COLLECTION_NAMES = (
    "posts",
    "panels",
    "spacerOptions",
    "heights",
    "colors",
    "elements",
    "panelTextures",
    "postTextures",
)
CollectionName = Literal[
    "posts",
    "panels",
    "spacerOptions",
    "heights",
    "colors",
    "elements",
    "panelTextures",
    "postTextures",
]

HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")
PATTERN_IDS = ("pattern-3d", "pattern-palisade")


class BaseEntity(BaseModel):
    name: str = Field(min_length=1)
    sortOrder: int = Field(ge=0, default=0)
    active: bool = True
    description: str | None = None
    previewAsset: str | None = None


class PostCreate(BaseEntity):
    slug: str = Field(min_length=1, pattern=r"^[a-z0-9-]+$")
    widthCm: float = Field(ge=10, le=50)
    priceSurchargePerMeter: float = Field(ge=0, default=0)
    baseTextureUrl: str | None = None


class PostOut(PostCreate):
    id: str


class PanelCreate(BaseEntity):
    patternId: Literal["pattern-3d", "pattern-palisade"]
    priceSurchargePerMeter: float = Field(ge=0, default=0)
    baseTextureUrl: str | None = None
    textureTileHeightM: float | None = Field(default=None, ge=0.1, le=2.25)


class PanelOut(PanelCreate):
    id: str


class SpacerCreate(BaseEntity):
    hasSpacer: bool
    openness: float = Field(ge=0, le=1)
    priceSurchargePerMeter: float = Field(ge=0, default=0)


class SpacerOut(SpacerCreate):
    id: str


class HeightCreate(BaseModel):
    label: str = Field(min_length=1)
    valueM: float = Field(ge=1.0, le=2.25)
    sortOrder: int = Field(ge=0, default=0)
    active: bool = True
    description: str | None = None
    priceMultiplier: float = Field(ge=0.1, le=5, default=1.0)


class HeightOut(HeightCreate):
    id: str


class ColorCreate(BaseEntity):
    hex: str
    priceSurchargePerMeter: float = Field(ge=0, default=0)

    @field_validator("hex")
    @classmethod
    def validate_hex(cls, v: str) -> str:
        if not HEX_RE.match(v):
            raise ValueError("Kolor musi być w formacie #RRGGBB")
        return v


class ColorOut(ColorCreate):
    id: str


class ElementCreate(BaseModel):
    type: Literal["brama", "furtka"]
    name: str = Field(min_length=1)
    sortOrder: int = Field(ge=0, default=0)
    active: bool = True
    description: str | None = None
    textureUrl: str | None = None
    priceNet: float = Field(ge=0, default=0)


class ElementOut(ElementCreate):
    id: str


class PanelTextureCreate(BaseModel):
    panelId: str = Field(min_length=1)
    colorId: str = Field(min_length=1)
    imageUrl: str = Field(min_length=1)
    sortOrder: int = Field(ge=0, default=0)


class PanelTextureOut(PanelTextureCreate):
    id: str


class PostTextureCreate(BaseModel):
    postId: str = Field(min_length=1)
    colorId: str = Field(min_length=1)
    imageUrl: str = Field(min_length=1)
    sortOrder: int = Field(ge=0, default=0)


class PostTextureOut(PostTextureCreate):
    id: str


class CatalogCollections(BaseModel):
    posts: list[PostOut]
    panels: list[PanelOut]
    spacerOptions: list[SpacerOut]
    heights: list[HeightOut]
    colors: list[ColorOut]
    elements: list[ElementOut]
    panelTextures: list[PanelTextureOut]
    postTextures: list[PostTextureOut]


CREATE_MODELS = {
    "posts": PostCreate,
    "panels": PanelCreate,
    "spacerOptions": SpacerCreate,
    "heights": HeightCreate,
    "colors": ColorCreate,
    "elements": ElementCreate,
    "panelTextures": PanelTextureCreate,
    "postTextures": PostTextureCreate,
}

OUT_MODELS = {
    "posts": PostOut,
    "panels": PanelOut,
    "spacerOptions": SpacerOut,
    "heights": HeightOut,
    "colors": ColorOut,
    "elements": ElementOut,
    "panelTextures": PanelTextureOut,
    "postTextures": PostTextureOut,
}
