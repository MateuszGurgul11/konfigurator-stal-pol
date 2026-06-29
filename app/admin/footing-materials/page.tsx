"use client";

import { EntityManager } from "@/components/admin/EntityManager";
import { footingMaterialSchema } from "@/lib/validations";
import type { FootingMaterial } from "@/lib/types";

const emptyItem = {
  name: "",
  hex: "#9ca3af",
  priceSurchargePerPanel: 0,
  sortOrder: 0,
  active: true,
};

export default function AdminFootingMaterialsPage() {
  return (
    <EntityManager<FootingMaterial>
      collection="footingMaterials"
      title="Materiały podmurówki"
      schema={footingMaterialSchema}
      emptyItem={emptyItem}
      fields={[
        { name: "name", label: "Nazwa materiału", type: "text" },
        { name: "hex", label: "Kolor podglądu (hex)", type: "color" },
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
