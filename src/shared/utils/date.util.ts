// src/shared/utils/date.util.ts
const pad = (n: number): string => String(n).padStart(2, '0');

export function formatDate(date: Date, format: string): string {
  return format
    .replace('YYYY', String(date.getUTCFullYear()))
    .replace('MM', pad(date.getUTCMonth() + 1))
    .replace('DD', pad(date.getUTCDate()))
    .replace('HH', pad(date.getUTCHours()))
    .replace('mm', pad(date.getUTCMinutes()))
    .replace('ss', pad(date.getUTCSeconds()));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

export function isExpired(date: Date): boolean {
  return date < new Date();
}

export function diffInDays(a: Date, b: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.trunc((a.getTime() - b.getTime()) / MS_PER_DAY);
}

export function toISOString(date: Date): string {
  return date.toISOString();
}
