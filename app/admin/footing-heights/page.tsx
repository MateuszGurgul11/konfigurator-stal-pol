"use client";

import { EntityManager } from "@/components/admin/EntityManager";
import { footingHeightSchema } from "@/lib/validations";
import type { FootingHeight } from "@/lib/types";

const emptyItem = {
  label: "",
  heightCm: 20,
  priceSurchargePerPanel: 0,
  sortOrder: 0,
  active: true,
};

export default function AdminFootingHeightsPage() {
  return (
    <EntityManager<FootingHeight>
      collection="footingHeights"
      title="Wysokości podmurówki"
      schema={footingHeightSchema}
      emptyItem={emptyItem}
      fields={[
        { name: "label", label: "Etykieta (np. 20 cm)", type: "text" },
        { name: "heightCm", label: "Wysokość (cm)", type: "number" },
        {
          name: "priceSurchargePerPanel",
          label: "Dopłata za panel (PLN)",
          type: "number",
        },
        { name: "sortOrder", label: "Kolejność", type: "number" },
        { name: "active", label: "Aktywny", type: "boolean" },
      ]}
    />
  );
}
