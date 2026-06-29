import type { CatalogCollections } from "@/lib/types";

export function normalizeCatalog(
  catalog: Partial<CatalogCollections> & CatalogCollections,
): CatalogCollections {
  return {
    ...catalog,
    footingHeights: catalog.footingHeights ?? [],
    footingMaterials: catalog.footingMaterials ?? [],
  };
}
