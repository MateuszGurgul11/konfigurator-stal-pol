"use client";

import { AdminEntitySection } from "@/components/admin/AdminEntitySection";
import {
  colorsConfig,
  footingHeightsConfig,
  footingMaterialsConfig,
  panelsConfig,
  spacersConfig,
} from "@/lib/admin/entity-configs";

export default function AdminModelPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Model</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Opcje z zakładki Model w konfiguratorze: modele paneli, kolory RAL,
          wykończenie powierzchni i podmurówka.
        </p>
      </div>

      <AdminEntitySection
        config={panelsConfig}
        description="Wzór SVG i opcjonalne bazowe zdjęcie. Gdy brak zdjęcia, podgląd używa wzoru SVG."
      />
      <AdminEntitySection
        config={colorsConfig}
        description="Kolory malowania paneli i elementów (nazwa + kod #RRGGBB)."
      />
      <AdminEntitySection
        config={spacersConfig}
        description="Ocynk, malowanie proszkowe i inne warianty wykończenia powierzchni."
      />
      <AdminEntitySection
        config={footingHeightsConfig}
        description="Presety wysokości podmurówki dostępne przy włączonej opcji „Z podmurówką”."
      />
      <AdminEntitySection
        config={footingMaterialsConfig}
        description="Materiały i kolory podglądu podmurówki."
      />
    </div>
  );
}
