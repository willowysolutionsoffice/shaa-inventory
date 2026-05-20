import { format } from "date-fns";

/**
 * Normalizes a date to UTC midnight (00:00:00.000Z) of the calendar day
 * represented by the input date in its current timezone.
 * 
 * This ensures that "2026-02-10" in Saudi remains "2026-02-10" when stored.
 */
export function normalizeToUtcMidnight(date: Date | string | number | null | undefined): Date {
    if (!date) return getTodayUtcMidnight();

    if (typeof date === "string" && date.length === 10) {
        return parseDateStringtoUtc(date);
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) return getTodayUtcMidnight();

    /**
     * Snap logic:
     * To consistently map local-midnight dates (like IST 18:30Z) to their intended calendar day
     * across BOTH client and server (regardless of server TZ), we add a small offset (6h) 
     * and take the UTC day.
     * 
     * Why 6h? 
     * - IST is +5.5h. Local midnight is 18:30 UTC. 18:30 + 6h = 00:30 UTC next day. Correct.
     * - Saudi is +3h. Local midnight is 21:00 UTC. 21:00 + 6h = 03:00 UTC next day. Correct.
     * - PST is -8h. Local midnight is 08:00 UTC. 08:00 + 6h = 14:00 UTC same day. Correct.
     */
    const snapped = new Date(d.getTime() + 6 * 60 * 60 * 1000);
    const year = snapped.getUTCFullYear();
    const month = snapped.getUTCMonth();
    const day = snapped.getUTCDate();

    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}



/**
 * Returns a Date object representing today at UTC midnight 
 * (relative to local calendar day).
 */
export function getTodayUtcMidnight(): Date {
    // Determine "Today" relative to the business region (UTC+3 to UTC+6)
    // by adding 6 hours to current UTC time.
    const now = new Date();
    const snapped = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    return new Date(Date.UTC(snapped.getUTCFullYear(), snapped.getUTCMonth(), snapped.getUTCDate(), 0, 0, 0, 0));
}


/**
 * Parses a "yyyy-MM-dd" string (or the start of an ISO string) into a UTC midnight Date object.
 */
export function parseDateStringtoUtc(dateStr: string | null | undefined): Date {
    if (!dateStr) return new Date(new Date().setUTCHours(0, 0, 0, 0));

    // Ensure we only take the yyyy-MM-dd part if an ISO string is passed
    const cleanDateStr = dateStr.substring(0, 10);
    const [year, month, day] = cleanDateStr.split("-").map(Number);

    const d = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    if (isNaN(d.getTime())) {
        return new Date(new Date().setUTCHours(0, 0, 0, 0));
    }
    return d;
}

/**
 * Formats a date to "yyyy-MM-dd" using UTC components.
 * Useful for consistent filtering across timezones.
 */
export function formatUtcDate(date: Date): string {
    return format(new Date(date.getTime() + date.getTimezoneOffset() * 60000), "yyyy-MM-dd");
}

/**
 * Returns the query range { gte, lte } for a given date range string.
 * This applies the same -6h shift used to align with the +6h display shift,
 * ensuring that the Filter matches exactly what the User sees.
 */
export function getDateRangeForQuery(from: string | undefined, to: string | undefined): { gte?: Date, lte?: Date } {
    const range: { gte?: Date, lte?: Date } = {};
    const SHIFT_MS = 6 * 60 * 60 * 1000;

    if (from) {
        const d = parseDateStringtoUtc(from);
        range.gte = new Date(d.getTime() - SHIFT_MS);
    }

    if (to) {
        const d = parseDateStringtoUtc(to);
        // Start with absolute end of that UTC day
        d.setUTCHours(23, 59, 59, 999);
        range.lte = new Date(d.getTime() - SHIFT_MS);
    }

    return range;
}
