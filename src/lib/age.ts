// Birth-date helpers. The profile stores a date of birth (ISO `YYYY-MM-DD`) and
// age is derived on demand — so a user's age stays correct over time without any
// re-entry, and the DOB can later seed starting skill / test difficulty.

export const MIN_AGE = 3;
export const MAX_AGE = 120;

// Days in a given 1-based month, leap-year aware (day 0 of next month = last day).
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Build an ISO date (YYYY-MM-DD) from parts, or null if it isn't a real calendar
// date (bad month, day out of range for that month/year, non-integers).
export function toISODate(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// Whole years elapsed between an ISO birth date and today.
export function ageFromISO(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  const monthDiff = now.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d)) age -= 1;
  return age;
}
