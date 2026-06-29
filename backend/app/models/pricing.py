from pydantic import BaseModel, Field


class PricingSettings(BaseModel):
    basePricePerMeterNet: float = Field(ge=0, default=48)
    panelPriceNet: float = Field(ge=0, default=120)
    footingPriceNet: float = Field(ge=0, default=50)
    panelWidthCm: float = Field(ge=50, le=500, default=250)
    currency: str = Field(default="PLN", min_length=3, max_length=3)


DEFAULT_PRICING_SETTINGS = PricingSettings()
