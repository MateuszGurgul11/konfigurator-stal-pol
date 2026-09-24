"use client";

import { EntityManager } from "@/components/admin/EntityManager";
import type { EntityConfig } from "@/lib/admin/entity-configs";

type Props = {
  config: EntityConfig;
  description?: string;
};

export function AdminEntitySection({ config, description }: Props) {
  return (
    <section className="space-y-3">
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      <EntityManager
        collection={config.collection}
        title={config.title}
        schema={config.schema}
        emptyItem={config.emptyItem}
        fields={config.fields}
        asSection
      />
    </section>
  );
}
