"use client";

import { Box, Ruler, Fence, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getVisibleConfiguratorTabs, type ConfiguratorTab, type ProductScope } from "@/lib/configurator/state";

const tabs: {
  id: ConfiguratorTab;
  labelLines: string[];
  mobileLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "model", labelLines: ["Model"], icon: Box },
  { id: "gates", labelLines: ["Elementy"], icon: Fence },
  { id: "quote", labelLines: ["Wymiary"], icon: Ruler },
  {
    id: "review",
    labelLines: ["Podsumowanie"],
    mobileLabel: "Podsum.",
    icon: ClipboardCheck,
  },
];

type Props = {
  active: ConfiguratorTab;
  scope: ProductScope;
  onChange: (tab: ConfiguratorTab) => void;
};

export function ConfiguratorTabs({ active, scope, onChange }: Props) {
  const visibleTabIds = new Set(getVisibleConfiguratorTabs(scope));
  const visibleTabs = tabs.filter((tab) => visibleTabIds.has(tab.id));

  return (
    <div className="flex w-full border-b border-[#2A2A26] px-2 pb-0 pt-3 max-lg:landscape:pt-1.5 sm:px-4">
      {visibleTabs.map(({ id, labelLines, mobileLabel, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "relative flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-t-lg px-1.5 py-2.5 transition-all max-lg:flex-row max-lg:gap-1.5 max-lg:landscape:min-h-[44px] max-lg:landscape:py-2 sm:px-2",
              isActive
                ? "bg-[#2A2A26] text-[#e30311]"
                : "text-[#d6d6d2] hover:bg-[#222] hover:text-[#ecece8]",
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-[#e30311]")} />
            <span className="text-center text-[16px] font-semibold leading-[1.2] tracking-normal normal-case">
              {mobileLabel ? (
                <>
                  <span className="block truncate lg:hidden">{mobileLabel}</span>
                  <span className="hidden truncate lg:block">
                    {labelLines[0]}
                  </span>
                </>
              ) : (
                labelLines.map((line) => (
                  <span key={line} className="block truncate">
                    {line}
                  </span>
                ))
              )}
            </span>
            {isActive && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#e30311]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
