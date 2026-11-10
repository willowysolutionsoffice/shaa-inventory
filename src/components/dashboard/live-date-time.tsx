"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";

export function LiveDateTime() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="hidden lg:flex items-center gap-3 bg-background border border-purple-300/60 dark:border-purple-800 px-3.5 py-1.5 rounded-lg text-xs text-muted-foreground animate-pulse">
        <div className="h-4 w-28 bg-muted rounded" />
      </div>
    );
  }

  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex items-center gap-2.5 bg-background hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-all border border-purple-400/80 dark:border-purple-500/80 hover:border-purple-600 px-3.5 py-1.5 rounded-lg shadow-2xs">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
        <span>{dateStr}</span>
      </div>
      <span className="text-muted-foreground/40 font-light">|</span>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground font-mono">
        <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        <span>{timeStr}</span>
      </div>
      <div className="flex items-center gap-1 pl-1 border-l border-border/70 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="hidden sm:inline">Live</span>
      </div>
    </div>
  );
}
