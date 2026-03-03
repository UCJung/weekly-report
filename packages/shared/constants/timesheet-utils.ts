/**
 * 근무시간표 유틸리티
 * 프론트엔드·백엔드 공용
 */

import type { AttendanceType } from '../types/timesheet';

/**
 * Date → "2026-03" 형식의 yearMonth 문자열 반환
 */
export function getYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * "2026-03" → { year: 2026, month: 3 } 파싱
 */
export function parseYearMonth(yearMonth: string): { year: number; month: number } {
  const match = yearMonth.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid yearMonth format: "${yearMonth}". Expected "YYYY-MM".`);
  }
  return { year: parseInt(match[1], 10), month: parseInt(match[2], 10) };
}

/**
 * 해당 월의 전체 날짜 배열 반환 (UTC 기준)
 */
export function getMonthDays(yearMonth: string): Date[] {
  const { year, month } = parseYearMonth(yearMonth);
  const days: Date[] = [];
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let d = 1; d <= lastDay; d++) {
    days.push(new Date(Date.UTC(year, month - 1, d)));
  }
  return days;
}

/**
 * 토/일 여부 판별
 */
export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * 해당 월의 근무일수 (주말 제외)
 */
export function getWorkingDays(yearMonth: string): number {
  return getMonthDays(yearMonth).filter((d) => !isWeekend(d)).length;
}

/**
 * 근태 유형별 필요 근무시간 반환
 */
export function getRequiredHours(attendance: AttendanceType): number {
  switch (attendance) {
    case 'WORK':
    case 'HOLIDAY_WORK':
      return 8;
    case 'HALF_DAY_LEAVE':
      return 4;
    case 'ANNUAL_LEAVE':
    case 'HOLIDAY':
      return 0;
    default:
      return 8;
  }
}

/**
 * 현재 날짜 기준 yearMonth 반환
 */
export function getCurrentYearMonth(): string {
  return getYearMonth(new Date());
}

/**
 * 이전 월 yearMonth 반환
 */
export function getPreviousYearMonth(yearMonth: string): string {
  const { year, month } = parseYearMonth(yearMonth);
  if (month === 1) return `${year - 1}-12`;
  return `${year}-${String(month - 1).padStart(2, '0')}`;
}

/**
 * 다음 월 yearMonth 반환
 */
export function getNextYearMonth(yearMonth: string): string {
  const { year, month } = parseYearMonth(yearMonth);
  if (month === 12) return `${year + 1}-01`;
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * yearMonth → 사람이 읽기 쉬운 형식
 * 예: "2026-03" → "2026년 3월"
 */
export function formatYearMonth(yearMonth: string): string {
  const { year, month } = parseYearMonth(yearMonth);
  return `${year}년 ${month}월`;
}
