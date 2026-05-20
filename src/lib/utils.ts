import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from "date-fns";
import { normalizeToUtcMidnight } from "./date-utils";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate initials from a full name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format currency values
 */
export const CURRENCY_SYMBOL = "⃁";

/**
 * Format currency values
 */
export function formatCurrency(
  amount: number,
  currency: string = CURRENCY_SYMBOL,
  locale: string = 'en-SA'
): string {
  return `${currency} ${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Format a Date object or date string into a readable format
 * format: dd MMM yyyy (e.g., 22 Jul 2025)
 */
export function formatDate(
  date: Date | string,
  elementStr: string = "dd MMM yyyy"
): string {
  if (!date) return "-";

  // Use normalizeToUtcMidnight to ensure we are working with the intended calendar day
  const d = normalizeToUtcMidnight(date);
  if (isNaN(d.getTime())) return "";

  // The new Date(year, month, day) constructor creates a local date.
  // When formatted, it will show the correct intended day regardless of timezone.
  return format(
    new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
    elementStr
  );
}



export function groupPurchasesByMonth(purchases: { purchaseDate: Date; totalAmount: number }[]) {
  const grouped: Record<string, number> = {};

  purchases.forEach((p) => {
    const d = new Date(p.purchaseDate);
    // Create a date using UTC components to group correctly
    const utcDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), 1);
    const month = format(utcDate, "MMM yyyy");
    grouped[month] = (grouped[month] || 0) + p.totalAmount;
  });

  return Object.entries(grouped).map(([month, value]) => ({
    month,
    value,
  }));
}

export function groupSalesByMonth(
  sales: { saleDate: Date; grandTotal: number }[]
) {
  const map = new Map<string, number>();

  for (const sale of sales) {
    const d = new Date(sale.saleDate);
    // Use UTC components for month display
    const month = new Date(d.getUTCFullYear(), d.getUTCMonth(), 1).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    map.set(month, (map.get(month) || 0) + sale.grandTotal);
  }

  return Array.from(map.entries()).map(([month, value]) => ({ month, value }));
}

