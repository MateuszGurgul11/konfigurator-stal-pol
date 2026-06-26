"use client";

import { Box, Ruler, Fence, Calculator, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConfiguratorTab, ProductScope } from "@/lib/configurator/state";

const tabs: {
  id: ConfiguratorTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "model", label: "Model", icon: Box },
  { id: "dimensions", label: "Wymiary", icon: Ruler },
  { id: "gates", label: "Elementy", icon: Fence },
  { id: "quote", label: "Wycena", icon: Calculator },
  { id: "review", label: "Podsumowanie", icon: ClipboardCheck },
];

type Props = {
  active: ConfiguratorTab;
  scope: ProductScope;
  onChange: (tab: ConfiguratorTab) => void;
};

export function ConfiguratorTabs({ active, scope, onChange }: Props) {
  const visibleTabs = tabs.filter((tab) => {
    if (tab.id === "model" || tab.id === "dimensions") return scope.fence;
    if (tab.id === "gates") return scope.gate || scope.wicket;
    return true;
  });

  return (
    <div className="scrollbar-dark flex flex-nowrap gap-0.5 overflow-x-auto border-b border-[#2A2A26] px-2 pb-0 pt-3 sm:gap-1 sm:px-4">
      {visibleTabs.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "flex shrink-0 flex-col items-center gap-1.5 rounded-t-lg px-2.5 py-2.5 transition-all sm:px-3",
              isActive
                ? "bg-[#2A2A26] text-[#e30311]"
                : "text-[#666] hover:bg-[#222] hover:text-[#999]",
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-[#e30311]")} />
            <span className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.08em]">
              {label}
            </span>
            {isActive && (
              <span className="h-0.5 w-full rounded-full bg-[#e30311]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
