SEED_DATA = {
    "posts": [
        {
            "name": "Profil 60×40 mm",
            "slug": "standard",
            "widthCm": 10,
            "priceSurchargePerMeter": 0,
            "sortOrder": 0,
            "active": True,
        },
        {
            "name": "Profil 80×40 mm",
            "slug": "reinforced",
            "widthCm": 12,
            "priceSurchargePerMeter": 12,
            "sortOrder": 1,
            "active": True,
        },
    ],
    "panels": [
        {
            "name": "Panel 3D",
            "patternId": "pattern-3d",
            "priceSurchargePerMeter": 0,
            "sortOrder": 0,
            "active": True,
        },
        {
            "name": "Palisada",
            "patternId": "pattern-palisade",
            "priceSurchargePerMeter": 20,
            "sortOrder": 1,
            "active": True,
        },
        {
            "name": "Panel poziomy",
            "patternId": "pattern-panel-horizontal",
            "priceSurchargePerMeter": 15,
            "sortOrder": 2,
            "active": True,
        },
    ],
    "spacerOptions": [
        {
            "name": "Ocynk",
            "hasSpacer": False,
            "openness": 0,
            "priceSurchargePerMeter": 0,
            "sortOrder": 0,
            "active": True,
        },
        {
            "name": "Malowanie proszkowe RAL",
            "hasSpacer": False,
            "openness": 0.15,
            "priceSurchargePerMeter": 15,
            "sortOrder": 1,
            "active": True,
        },
    ],
    "heights": [
        {
            "label": "1,53 m",
            "valueM": 1.53,
            "priceMultiplier": 1.0,
            "sortOrder": 0,
            "active": True,
        },
        {
            "label": "1,80 m",
            "valueM": 1.8,
            "priceMultiplier": 1.08,
            "sortOrder": 1,
            "active": True,
        },
        {
            "label": "2,00 m",
            "valueM": 2.0,
            "priceMultiplier": 1.15,
            "sortOrder": 2,
            "active": True,
        },
    ],
    "colors": [
        {
            "name": "Ocynk naturalny",
            "hex": "#a8b0b8",
            "priceSurchargePerMeter": 0,
            "sortOrder": 0,
            "active": True,
        },
        {
            "name": "RAL 6005 zielony",
            "hex": "#0f5132",
            "priceSurchargePerMeter": 8,
            "sortOrder": 1,
            "active": True,
        },
        {
            "name": "RAL 7016 grafit",
            "hex": "#383e42",
            "priceSurchargePerMeter": 8,
            "sortOrder": 2,
            "active": True,
        },
        {
            "name": "RAL 9005 czarny",
            "hex": "#1a1a18",
            "priceSurchargePerMeter": 8,
            "sortOrder": 3,
            "active": True,
        },
        {
            "name": "RAL 9002 biały",
            "hex": "#f0f0eb",
            "priceSurchargePerMeter": 10,
            "sortOrder": 4,
            "active": True,
        },
    ],
    "elements": [
        {
            "type": "brama",
            "name": "Brama przesuwna",
            "priceNet": 2200,
            "sortOrder": 0,
            "active": True,
        },
        {
            "type": "brama",
            "name": "Brama przesuwna palisadowa",
            "priceNet": 3700,
            "sortOrder": 1,
            "active": True,
        },
        {
            "type": "brama",
            "name": "Brama dwuskrzydłowa",
            "priceNet": 1200,
            "sortOrder": 2,
            "active": True,
        },
        {
            "type": "brama",
            "name": "Brama dwuskrzydłowa palisadowa",
            "priceNet": 2700,
            "sortOrder": 3,
            "active": True,
        },
        {
            "type": "furtka",
            "name": "Furtka panelowa",
            "priceNet": 520,
            "sortOrder": 0,
            "active": True,
        },
        {
            "type": "furtka",
            "name": "Furtka palisadowa",
            "priceNet": 900,
            "sortOrder": 1,
            "active": True,
        },
        {
            "type": "furtka",
            "name": "Klamka + zamek",
            "priceNet": 80,
            "sortOrder": 2,
            "active": True,
        },
    ],
    "footingHeights": [
        {
            "label": "20 cm",
            "heightCm": 20,
            "priceSurchargePerPanel": 0,
            "sortOrder": 0,
            "active": True,
        },
        {
            "label": "30 cm",
            "heightCm": 30,
            "priceSurchargePerPanel": 15,
            "sortOrder": 1,
            "active": True,
        },
        {
            "label": "40 cm",
            "heightCm": 40,
            "priceSurchargePerPanel": 30,
            "sortOrder": 2,
            "active": True,
        },
    ],
    "footingMaterials": [
        {
            "name": "Beton szary",
            "hex": "#9ca3af",
            "priceSurchargePerPanel": 0,
            "sortOrder": 0,
            "active": True,
        },
        {
            "name": "Klinkier czerwony",
            "hex": "#8b3a2a",
            "priceSurchargePerPanel": 25,
            "sortOrder": 1,
            "active": True,
        },
        {
            "name": "Stal malowana RAL",
            "hex": "#383e42",
            "priceSurchargePerPanel": 18,
            "sortOrder": 2,
            "active": True,
        },
    ],
    "panelTextures": [],
    "postTextures": [],
}

DEFAULT_PRICING_SETTINGS = {
    "basePricePerMeterNet": 48,
    "panelPriceNet": 120,
    "footingPriceNet": 50,
    "panelWidthCm": 250,
    "currency": "PLN",
}

PANEL_PRICE_BY_PATTERN = {
    "pattern-3d": 0,
    "pattern-palisade": 50,
    "pattern-panel-horizontal": 38,
}

COLOR_PRICE_BY_NAME = {
    "Ocynk naturalny": 0,
    "RAL 6005 zielony": 20,
    "RAL 7016 grafit": 20,
    "RAL 9005 czarny": 20,
    "RAL 9002 biały": 25,
}

HEIGHT_MULTIPLIER_BY_VALUE_M = {
    1.53: 1.0,
    1.8: 1.08,
    2.0: 1.15,
}

POST_PRICE_BY_SLUG = {
    "standard": 0,
    "reinforced": 30,
}

SPACER_PRICE_BY_NAME = {
    "Ocynk": 0,
    "Malowanie proszkowe RAL": 38,
}

FOOTING_HEIGHT_SURCHARGE_BY_CM = {
    20: 0,
    30: 15,
    40: 30,
}

FOOTING_MATERIAL_SURCHARGE_BY_NAME = {
    "Beton szary": 0,
    "Klinkier czerwony": 25,
    "Stal malowana RAL": 18,
}
