from app.firebase import get_db
from app.models.pricing import PricingSettings
from app.services.pricing import update_pricing_settings
from app.services.seed_data import (
    COLOR_PRICE_BY_NAME,
    DEFAULT_PRICING_SETTINGS,
    FOOTING_HEIGHT_SURCHARGE_BY_CM,
    FOOTING_MATERIAL_SURCHARGE_BY_NAME,
    HEIGHT_MULTIPLIER_BY_VALUE_M,
    PANEL_PRICE_BY_PATTERN,
    POST_PRICE_BY_SLUG,
    SPACER_PRICE_BY_NAME,
)


def _patch_collection(
    collection: str,
    updates: list[tuple[str, dict]],
) -> int:
    db = get_db()
    count = 0
    for doc_id, fields in updates:
        db.collection(collection).document(doc_id).set(fields, merge=True)
        count += 1
    return count


def apply_default_variant_prices() -> dict[str, int]:
    db = get_db()
    counts: dict[str, int] = {}

    panel_updates: list[tuple[str, dict]] = []
    for doc in db.collection("panels").stream():
        data = doc.to_dict() or {}
        pattern_id = data.get("patternId")
        if pattern_id in PANEL_PRICE_BY_PATTERN:
            per_panel = PANEL_PRICE_BY_PATTERN[pattern_id]
            panel_updates.append(
                (
                    doc.id,
                    {
                        "priceSurchargePerPanel": per_panel,
                        "priceSurchargePerMeter": per_panel / 2.5,
                    },
                )
            )
    counts["panels"] = _patch_collection("panels", panel_updates)

    color_updates: list[tuple[str, dict]] = []
    for doc in db.collection("colors").stream():
        data = doc.to_dict() or {}
        name = data.get("name")
        if name in COLOR_PRICE_BY_NAME:
            per_panel = COLOR_PRICE_BY_NAME[name]
            color_updates.append(
                (
                    doc.id,
                    {
                        "priceSurchargePerPanel": per_panel,
                        "priceSurchargePerMeter": per_panel / 2.5,
                    },
                )
            )
    counts["colors"] = _patch_collection("colors", color_updates)

    height_updates: list[tuple[str, dict]] = []
    for doc in db.collection("heights").stream():
        data = doc.to_dict() or {}
        value_m = data.get("valueM")
        if value_m in HEIGHT_MULTIPLIER_BY_VALUE_M:
            height_updates.append(
                (
                    doc.id,
                    {
                        "priceMultiplier": HEIGHT_MULTIPLIER_BY_VALUE_M[value_m],
                    },
                )
            )
    counts["heights"] = _patch_collection("heights", height_updates)

    post_updates: list[tuple[str, dict]] = []
    for doc in db.collection("posts").stream():
        data = doc.to_dict() or {}
        slug = data.get("slug")
        if slug in POST_PRICE_BY_SLUG:
            per_panel = POST_PRICE_BY_SLUG[slug]
            post_updates.append(
                (
                    doc.id,
                    {
                        "priceSurchargePerPanel": per_panel,
                        "priceSurchargePerMeter": per_panel / 2.5,
                    },
                )
            )
    counts["posts"] = _patch_collection("posts", post_updates)

    spacer_updates: list[tuple[str, dict]] = []
    for doc in db.collection("spacerOptions").stream():
        data = doc.to_dict() or {}
        name = data.get("name")
        if name in SPACER_PRICE_BY_NAME:
            per_panel = SPACER_PRICE_BY_NAME[name]
            spacer_updates.append(
                (
                    doc.id,
                    {
                        "priceSurchargePerPanel": per_panel,
                        "priceSurchargePerMeter": per_panel / 2.5,
                    },
                )
            )
    counts["spacerOptions"] = _patch_collection("spacerOptions", spacer_updates)

    footing_height_updates: list[tuple[str, dict]] = []
    for doc in db.collection("footingHeights").stream():
        data = doc.to_dict() or {}
        height_cm = data.get("heightCm")
        if height_cm in FOOTING_HEIGHT_SURCHARGE_BY_CM:
            footing_height_updates.append(
                (
                    doc.id,
                    {
                        "priceSurchargePerPanel": FOOTING_HEIGHT_SURCHARGE_BY_CM[
                            height_cm
                        ],
                    },
                )
            )
    counts["footingHeights"] = _patch_collection(
        "footingHeights", footing_height_updates
    )

    footing_material_updates: list[tuple[str, dict]] = []
    for doc in db.collection("footingMaterials").stream():
        data = doc.to_dict() or {}
        name = data.get("name")
        if name in FOOTING_MATERIAL_SURCHARGE_BY_NAME:
            footing_material_updates.append(
                (
                    doc.id,
                    {
                        "priceSurchargePerPanel": FOOTING_MATERIAL_SURCHARGE_BY_NAME[
                            name
                        ],
                    },
                )
            )
    counts["footingMaterials"] = _patch_collection(
        "footingMaterials", footing_material_updates
    )

    update_pricing_settings(PricingSettings(**DEFAULT_PRICING_SETTINGS))
    counts["pricingSettings"] = 1

    return counts
