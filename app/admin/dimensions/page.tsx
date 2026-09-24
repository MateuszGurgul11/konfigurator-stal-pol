"use client";

import { AdminEntitySection } from "@/components/admin/AdminEntitySection";
import { heightsConfig } from "@/lib/admin/entity-configs";

export default function AdminDimensionsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Wymiary</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Presety wysokości płotu z zakładki Wymiary. Szerokość podglądu (liczba
          paneli) jest lokalna dla użytkownika i nie jest edytowana w CMS.
        </p>
      </div>

      <AdminEntitySection config={heightsConfig} />
    </div>
  );
}
