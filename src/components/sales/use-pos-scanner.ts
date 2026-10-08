// src/components/sales/use-pos-scanner.ts
"use client";

import { useEffect, useRef } from "react";

interface UsePosScannerOptions {
  onScan: (barcode: string) => void;
  maxIntervalMs?: number;
  minChars?: number;
}

export function usePosScanner({
  onScan,
  maxIntervalMs = 50,
  minChars = 3,
}: UsePosScannerOptions) {
  const bufferRef = useRef<string>("");
  const timestampsRef = useRef<number[]>([]);
  const targetElementRef = useRef<EventTarget | null>(null);
  const initialValueRef = useRef<string>("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an open modal / dialog
      if ((e.target as HTMLElement)?.closest('[role="dialog"]')) {
        bufferRef.current = "";
        timestampsRef.current = [];
        return;
      }

      const now = Date.now();
      const lastTime = timestampsRef.current[timestampsRef.current.length - 1] || 0;
      const timeDelta = now - lastTime;

      if (e.key === "Enter") {
        const buf = bufferRef.current.trim();
        const timestamps = timestampsRef.current;

        // Check if scanner: 3+ characters and fast avg typing speed
        if (buf.length >= minChars && timestamps.length >= minChars) {
          const totalDuration = timestamps[timestamps.length - 1] - timestamps[0];
          const avgInterval = totalDuration / (timestamps.length - 1);

          if (avgInterval <= maxIntervalMs) {
            e.preventDefault();
            e.stopPropagation();

            // If focused in another input, restore its previous value
            const target = targetElementRef.current as HTMLInputElement | null;
            if (
              target &&
              (target.tagName === "INPUT" || target.tagName === "TEXTAREA") &&
              target.dataset.scannerInput !== "true"
            ) {
              target.value = initialValueRef.current;
              target.dispatchEvent(new Event("input", { bubbles: true }));
            }

            onScan(buf);
          }
        }

        // Reset buffer
        bufferRef.current = "";
        timestampsRef.current = [];
        targetElementRef.current = null;
        initialValueRef.current = "";
        return;
      }

      // Only track single printable characters
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (timestampsRef.current.length === 0 || timeDelta <= maxIntervalMs * 2.5) {
          if (timestampsRef.current.length === 0) {
            targetElementRef.current = e.target;
            const target = e.target as HTMLInputElement | null;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
              initialValueRef.current = target.value;
            }
          }
          bufferRef.current += e.key;
          timestampsRef.current.push(now);
        } else {
          // Reset if too slow (human typing)
          bufferRef.current = e.key;
          timestampsRef.current = [now];
          targetElementRef.current = e.target;
          const target = e.target as HTMLInputElement | null;
          if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
            initialValueRef.current = target.value;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [onScan, maxIntervalMs, minChars]);
}
