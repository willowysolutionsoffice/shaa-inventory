"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className={`
        relative flex items-center gap-1 px-1 py-1 rounded-full w-16 h-8 
        transition-colors duration-300 border
        ${isDark 
          ? "bg-slate-800 border-slate-600" 
          : "bg-orange-50 border-orange-200"
        }
      `}
    >
      {/* Sliding pill */}
      <span
        className={`
          absolute top-1 w-6 h-6 rounded-full shadow-md
          transition-all duration-300 ease-in-out
          flex items-center justify-center
          ${isDark
            ? "translate-x-8 bg-slate-700"
            : "translate-x-0 bg-white"
          }
        `}
      >
        {isDark
          ? <Moon className="h-3.5 w-3.5 text-blue-300" />
          : <Sun className="h-3.5 w-3.5 text-orange-500" />
        }
      </span>

      {/* Background icons (decorative) */}
      <Sun className={`h-3.5 w-3.5 ml-0.5 transition-opacity duration-300 text-orange-400 ${isDark ? "opacity-30" : "opacity-0"}`} />
      <Moon className={`h-3.5 w-3.5 ml-auto mr-0.5 transition-opacity duration-300 text-blue-300 ${isDark ? "opacity-0" : "opacity-30"}`} />
    </button>
  );
}