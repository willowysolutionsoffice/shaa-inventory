"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";

interface LocalDateDisplayProps {
  date: Date | string | null | undefined;
  dateFormat?: string;
  fallback?: string;
}

export const LocalDateDisplay = ({
  date,
  dateFormat = "dd MMM yyyy",
  fallback = "—",
}: LocalDateDisplayProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!date) return <>{fallback}</>;

  // If not mounted yet, return null or a skeleton to avoid hydration mismatch
  // Because server renders UTC date, client renders Local date.
  if (!mounted) {
    return <span className="opacity-0">Loading...</span>;
  }

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return <>{fallback}</>;

    // Check if the date is exactly UTC Midnight (our new normalized format)
    const isNormalizedUtc =
      d.getUTCHours() === 0 &&
      d.getUTCMinutes() === 0 &&
      d.getUTCSeconds() === 0 &&
      d.getUTCMilliseconds() === 0;

    let displayDate: Date;

    if (isNormalizedUtc) {
      // For normalized dates, specific calendar day is locked in UTC
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth();
      const day = d.getUTCDate();
      displayDate = new Date(year, month, day);
    } else {
      // For legacy dates (with time components), rely on browser's local timezone
      // This correctly handles "late night" submissions from previous versions
      displayDate = d;
    }

    return <>{format(displayDate, dateFormat)}</>;
  } catch (error) {
    return <>{fallback}</>;
  }
};
