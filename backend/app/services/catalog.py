from typing import Any
import logging

from google.cloud.firestore import DELETE_FIELD

from app.firebase import get_db
from app.models.catalog import (
    COLLECTION_NAMES,
    CREATE_MODELS,
    OUT_MODELS,
    CatalogCollections,
    CollectionName,
    ColorOut,
    ElementOut,
    FootingHeightOut,
    FootingMaterialOut,
    HeightOut,
    PanelOut,
    PanelTextureOut,
    PostOut,
    PostTextureOut,
    SpacerOut,
)
from app.services.seed_data import SEED_DATA

logger = logging.getLogger(__name__)

TEXTURE_COLLECTIONS = frozenset({"panelTextures", "postTextures"})

# Stare wzorce z Firestore przed uproszczeniem oferty STAL-POL.
LEGACY_PATTERN_MAP = {
    "pattern-solid": "pattern-3d",
    "pattern-grid": "pattern-3d",
    "pattern-brick": "pattern-3d",
    "pattern-lines": "pattern-palisade",
}

VALID_PATTERN_IDS = frozenset(
    ("pattern-3d", "pattern-palisade", "pattern-panel-horizontal")
)
DEFAULT_PATTERN_ID = "pattern-3d"


def _map_pattern_id(value: str | None) -> tuple[str | None, bool]:
    """Zwraca (zmapowany_id, czy_wymaga_zapisu)."""
    if value is None:
        return None, False
    if value in LEGACY_PATTERN_MAP:
        return LEGACY_PATTERN_MAP[value], True
    if value not in VALID_PATTERN_IDS:
        return DEFAULT_PATTERN_ID, True
    return value, False


def _normalize_pattern_fields(data: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    """Zamienia legacy / nieznane patternId. Zwraca (normalized, firestore_patch)."""
    out = dict(data)
    patch: dict[str, Any] = {}

    mapped, needs_write = _map_pattern_id(out.get("patternId") if isinstance(out.get("patternId"), str) else None)
    if needs_write and mapped is not None:
        out["patternId"] = mapped
        patch["patternId"] = mapped

    raw_infill = out.get("infillPatternId")
    if isinstance(raw_infill, str):
        mapped_infill, needs_infill_write = _map_pattern_id(raw_infill)
        if needs_infill_write and mapped_infill is not None:
            out["infillPatternId"] = mapped_infill
            patch["infillPatternId"] = mapped_infill

    return out, patch


def _doc_to_dict(doc) -> tuple[dict[str, Any], dict[str, Any]]:
    data = doc.to_dict() or {}
    return _normalize_pattern_fields({"id": doc.id, **data})


def _sort_items(items: list[dict]) -> list[dict]:
    return sorted(items, key=lambda x: x.get("sortOrder", 0))


def _parse_models(model_cls, items: list[dict], collection: str) -> list:
    result = []
    for item in items:
        try:
            result.append(model_cls(**item))
        except Exception as e:
            logger.warning(
                "Pominięto nieprawidłowy dokument %s/%s: %s",
                collection,
                item.get("id"),
                e,
            )
    return result


def fetch_collection(
    name: CollectionName,
    active_only: bool = False,
) -> list[dict]:
    db = get_db()
    docs = list(db.collection(name).stream())
    items: list[dict] = []
    for doc in docs:
        item, patch = _doc_to_dict(doc)
        if patch:
            db.collection(name).document(doc.id).set(patch, merge=True)
            logger.info("Zmigrowano legacy pattern w %s/%s: %s", name, doc.id, patch)
        items.append(item)
    if active_only and name not in TEXTURE_COLLECTIONS:
        items = [i for i in items if i.get("active", False)]
    return _sort_items(items)


def fetch_active_catalog() -> CatalogCollections:
    return CatalogCollections(
        posts=_parse_models(PostOut, fetch_collection("posts", active_only=True), "posts"),
        panels=_parse_models(PanelOut, fetch_collection("panels", active_only=True), "panels"),
        spacerOptions=_parse_models(
            SpacerOut, fetch_collection("spacerOptions", active_only=True), "spacerOptions"
        ),
        heights=_parse_models(
            HeightOut, fetch_collection("heights", active_only=True), "heights"
        ),
        colors=_parse_models(
            ColorOut, fetch_collection("colors", active_only=True), "colors"
        ),
        footingHeights=_parse_models(
            FootingHeightOut,
            fetch_collection("footingHeights", active_only=True),
            "footingHeights",
        ),
        footingMaterials=_parse_models(
            FootingMaterialOut,
            fetch_collection("footingMaterials", active_only=True),
            "footingMaterials",
        ),
        elements=_parse_models(
            ElementOut, fetch_collection("elements", active_only=True), "elements"
        ),
        panelTextures=_parse_models(
            PanelTextureOut, fetch_collection("panelTextures"), "panelTextures"
        ),
        postTextures=_parse_models(
            PostTextureOut, fetch_collection("postTextures"), "postTextures"
        ),
    )


def fetch_all_for_admin(name: CollectionName) -> list[dict]:
    out_model = OUT_MODELS[name]
    return [
        m.model_dump()
        for m in _parse_models(out_model, fetch_collection(name, active_only=False), name)
    ]
def create_entity(name: CollectionName, data: dict) -> dict:
    model = CREATE_MODELS[name](**data)
    db = get_db()
    ref = db.collection(name).add(model.model_dump(exclude_none=True))
    doc_id = ref[1].id
    out = OUT_MODELS[name](id=doc_id, **model.model_dump())
    return out.model_dump()


def update_entity(name: CollectionName, doc_id: str, data: dict) -> dict:
    model = CREATE_MODELS[name](**data)
    db = get_db()
    payload: dict[str, Any] = model.model_dump(exclude_none=True)
    for key, value in data.items():
        if value is None:
            payload[key] = DELETE_FIELD
    db.collection(name).document(doc_id).set(payload, merge=True)
    out = OUT_MODELS[name](id=doc_id, **model.model_dump())
    return out.model_dump()


def delete_entity(name: CollectionName, doc_id: str) -> None:
    db = get_db()
    db.collection(name).document(doc_id).delete()


def seed_catalog() -> dict[str, int]:
    counts: dict[str, int] = {}
    for name in COLLECTION_NAMES:
        items = SEED_DATA.get(name, [])
        for item in items:
            create_entity(name, item)
        counts[name] = len(items)
    return counts
