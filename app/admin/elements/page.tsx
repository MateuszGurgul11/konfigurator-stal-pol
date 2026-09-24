"use client";

import { AdminEntitySection } from "@/components/admin/AdminEntitySection";
import { elementsConfig, postsConfig } from "@/lib/admin/entity-configs";

export default function AdminElementsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Elementy</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Opcje z zakładki Elementy: bramy, furtki oraz warianty słupków.
        </p>
      </div>

      <AdminEntitySection
        config={elementsConfig}
        description="Brama: stawka za panel lub odcinek na rzucie. Furtka: cena jednorazowa za sztukę."
      />
      <AdminEntitySection
        config={postsConfig}
        description="Warianty słupków ogrodzenia. Opcjonalne bazowe zdjęcie słupka."
      />
    </div>
  );
}
