// src/components/sales/pos-shortcuts-help-dialog.tsx
"use client";

import React, { memo } from "react";
import { Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { POS_SHORTCUTS, ShortcutItem } from "./pos-shortcuts-config";

interface PosShortcutsHelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export const PosShortcutsHelpDialog = memo(function PosShortcutsHelpDialog({
  open,
  onClose,
}: PosShortcutsHelpDialogProps) {
  if (!open) return null;

  const categories = ["Billing", "Cart", "Navigation", "System"] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-foreground">
                POS Keyboard Shortcuts Reference
              </h2>
              <p className="text-xs text-muted-foreground">
                Mouse-free keyboard controls & hotkeys
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-5">
          {categories.map((cat) => {
            const items = POS_SHORTCUTS.filter((s) => s.category === cat);
            if (items.length === 0) return null;

            return (
              <div key={cat} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  {cat} Hotkeys
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs"
                    >
                      <span className="font-semibold text-foreground">
                        {item.description}
                      </span>
                      <kbd className="inline-flex h-5 items-center justify-center rounded border border-purple-300 bg-background px-2 font-mono text-[11px] font-extrabold text-purple-700 shadow-xs dark:border-purple-800 dark:text-purple-300">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/10 px-5 py-3">
          <span className="text-xs text-muted-foreground">
            Press <kbd className="font-mono font-bold">Esc</kbd> to close this help dialog
          </span>
          <Button type="button" variant="default" size="sm" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
});
