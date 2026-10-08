// src/components/sales/pos-legend-bar.tsx
"use client";

import React, { memo } from "react";
import { BOTTOM_LEGEND_KEYS } from "./pos-shortcuts-config";

interface PosLegendBarProps {
  onShortcutClick?: (key: string) => void;
}

export const PosLegendBar = memo(function PosLegendBar({
  onShortcutClick,
}: PosLegendBarProps) {
  return (
    <div className="sticky bottom-0 z-30 flex items-center justify-between overflow-x-auto border-t border-border bg-card/95 backdrop-blur-xs px-3 py-1.5 text-xs shadow-md no-scrollbar">
      <div className="flex items-center gap-1.5 flex-nowrap">
        {BOTTOM_LEGEND_KEYS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onShortcutClick?.(item.key)}
            className="flex items-center gap-1 shrink-0 rounded-md border border-border/80 bg-background/80 px-2 py-1 text-[11px] font-medium transition-colors hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30"
          >
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-purple-700 dark:text-purple-300">
              {item.key}
            </kbd>
            <span className="text-muted-foreground">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="hidden lg:flex items-center text-[11px] text-muted-foreground pl-3 shrink-0">
        <span className="font-semibold text-purple-600 dark:text-purple-400">
          Excel Billing Active
        </span>
      </div>
    </div>
  );
});
