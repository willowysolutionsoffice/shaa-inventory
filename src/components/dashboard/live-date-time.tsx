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
      <div className="hidden lg:flex items-center gap-3 bg-muted/40 border border-border/60 px-3.5 py-1.5 rounded-xl text-xs text-muted-foreground animate-pulse">
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
    <div className="flex items-center gap-2.5 bg-muted/40 hover:bg-muted/60 transition-colors border border-border/70 px-3 py-1.5 rounded-xl shadow-xs">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
        <span>{dateStr}</span>
      </div>
      <span className="text-muted-foreground/50">|</span>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground font-mono">
        <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        <span>{timeStr}</span>
      </div>
      <div className="flex items-center gap-1 pl-1 border-l border-border/60 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="hidden sm:inline">Live</span>
      </div>
    </div>
  );
}
