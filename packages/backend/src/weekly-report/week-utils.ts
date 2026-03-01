/**
 * ISO 8601 주차 계산 유틸리티 (백엔드 로컬 복사본)
 * shared/constants/week-utils.ts 와 동일한 로직
 */

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getISOWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return d.getUTCFullYear();
}

export function getWeekLabel(date: Date): string {
  const year = getISOWeekYear(date);
  const week = getISOWeekNumber(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export function getWeekRange(weekLabel: string): { start: Date; end: Date } {
  const match = weekLabel.match(/^(\d{4})-W(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid weekLabel format: "${weekLabel}". Expected "YYYY-WNN".`);
  }
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(Date.UTC(year, 0, 4 - jan4Day + 1));
  const start = new Date(week1Monday.getTime() + (week - 1) * 7 * 86400000);
  const end = new Date(start.getTime() + 4 * 86400000);

  return { start, end };
}

export function getPreviousWeekLabel(weekLabel: string): string {
  const { start } = getWeekRange(weekLabel);
  const prevMonday = new Date(start.getTime() - 7 * 86400000);
  return getWeekLabel(prevMonday);
}

export function getNextWeekLabel(weekLabel: string): string {
  const { start } = getWeekRange(weekLabel);
  const nextMonday = new Date(start.getTime() + 7 * 86400000);
  return getWeekLabel(nextMonday);
}

export function getCurrentWeekLabel(): string {
  return getWeekLabel(new Date());
}
