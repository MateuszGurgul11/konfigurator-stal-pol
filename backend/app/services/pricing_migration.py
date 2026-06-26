from app.firebase import get_db
from app.models.pricing import PricingSettings
from app.services.pricing import update_pricing_settings
from app.services.seed_data import (
    COLOR_PRICE_BY_NAME,
    DEFAULT_PRICING_SETTINGS,
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
            panel_updates.append(
                (
                    doc.id,
                    {
                        "priceSurchargePerMeter": PANEL_PRICE_BY_PATTERN[pattern_id],
                    },
                )
            )
    counts["panels"] = _patch_collection("panels", panel_updates)


    color_updates: list[tuple[str, dict]] = []
    for doc in db.collection("colors").stream():
        data = doc.to_dict() or {}
        name = data.get("name")
        if name in COLOR_PRICE_BY_NAME:
            color_updates.append(
                (
                    doc.id,
                    {"priceSurchargePerMeter": COLOR_PRICE_BY_NAME[name]},
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
            post_updates.append(
                (
                    doc.id,
                    {"priceSurchargePerMeter": POST_PRICE_BY_SLUG[slug]},
                )
            )
    counts["posts"] = _patch_collection("posts", post_updates)


    spacer_updates: list[tuple[str, dict]] = []
    for doc in db.collection("spacerOptions").stream():
        data = doc.to_dict() or {}
        name = data.get("name")
        if name in SPACER_PRICE_BY_NAME:
            spacer_updates.append(
                (
                    doc.id,
                    {"priceSurchargePerMeter": SPACER_PRICE_BY_NAME[name]},
                )
            )
    counts["spacerOptions"] = _patch_collection("spacerOptions", spacer_updates)

    update_pricing_settings(DEFAULT_PRICING_SETTINGS)
    counts["pricingSettings"] = 1

    return counts
