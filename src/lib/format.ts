import { format, formatDistance, parseISO } from "date-fns";

import { DEMO_NOW } from "@/lib/demo";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const LAKH = 100_000;
const CRORE = 10_000_000;

export function formatINR(amount: number): string {
  return inr.format(amount).replace(/\s/g, "");
}

function compactUnit(amount: number, unit: number, suffix: string): string {
  const scaled = Math.round((amount / unit) * 10) / 10;
  const digits = Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
  return `₹${digits}${suffix}`;
}

export function formatINRCompact(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const absolute = Math.abs(amount);
  if (absolute < LAKH) return formatINR(amount);
  if (absolute >= CRORE) return `${sign}${compactUnit(absolute, CRORE, "Cr")}`;
  return `${sign}${compactUnit(absolute, LAKH, "L")}`;
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "d MMM yyyy");
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "d MMM, HH:mm");
}

export function relativeTime(value: string | Date, now: Date = DEMO_NOW): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return formatDistance(date, now, { addSuffix: true });
}
