import { format, formatDistanceToNowStrict, isPast, differenceInCalendarDays } from "date-fns";

export function fmtDate(d?: Date | string | null): string {
  if (!d) return "—";
  return format(new Date(d), "dd MMM yyyy");
}

export function fmtDateTime(d?: Date | string | null): string {
  if (!d) return "—";
  return format(new Date(d), "dd MMM yyyy, HH:mm");
}

export function fromNow(d?: Date | string | null): string {
  if (!d) return "—";
  return formatDistanceToNowStrict(new Date(d), { addSuffix: true });
}

export function daysUntil(d?: Date | string | null): number | null {
  if (!d) return null;
  return differenceInCalendarDays(new Date(d), new Date());
}

export function isOverdue(d?: Date | string | null): boolean {
  if (!d) return false;
  return isPast(new Date(d));
}

export function money(amount?: number | null, currency = "AED"): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
