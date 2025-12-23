import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date helpers
export function formatKey(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return formatKey(date) === formatKey(today);
}

export function formatCurrency(amount: number, currency: string = "₱"): string {
  return `${currency}${Math.abs(amount).toLocaleString()}`;
}
