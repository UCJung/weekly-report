import { describe, it, expect } from 'vitest';
import { PersonalTask } from '../../api/personal-task.api';
import { taskToCell, hourToRow, hasTime } from './WeeklyTimeGrid';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** 테스트용 PersonalTask 팩토리 */
function makeTask(overrides: Partial<PersonalTask> = {}): PersonalTask {
  return {
    id: 'task-1',
    memberId: 'member-1',
    teamId: 'team-1',
    title: '테스트 작업',
    priority: 'MEDIUM',
    statusId: 'status-todo',
    taskStatus: {
      id: 'status-todo',
      name: '할일',
      category: 'BEFORE_START',
      color: '#6B5CE7',
      sortOrder: 1,
    },
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * ISO datetime 문자열을 로컬 시간 기준으로 생성한다.
 */
function localDatetime(year: number, month: number, day: number, hour: number, minute = 0): string {
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

/** 로컬 날짜만 (시간 없음) */
function localDateOnly(year: number, month: number, day: number): string {
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

// 이번 주 일요일 (2026-03-01 일요일 기준)
const SUNDAY = new Date(2026, 2, 1, 0, 0, 0, 0); // 2026-03-01 (일)
const SATURDAY = new Date(2026, 2, 7, 23, 59, 59, 999); // 2026-03-07 (토)

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('hourToRow (30-min rows)', () => {
  it('08:00 → row 3', () => {
    expect(hourToRow(8, 0)).toBe(3);
  });

  it('08:30 → row 4', () => {
    expect(hourToRow(8, 30)).toBe(4);
  });

  it('09:00 → row 5', () => {
    expect(hourToRow(9, 0)).toBe(5);
  });

  it('09:30 → row 6', () => {
    expect(hourToRow(9, 30)).toBe(6);
  });

  it('14:00 → row 15', () => {
    expect(hourToRow(14, 0)).toBe(15);
  });

  it('14:30 → row 16', () => {
    expect(hourToRow(14, 30)).toBe(16);
  });

  it('18:00 → row 23', () => {
    expect(hourToRow(18, 0)).toBe(23);
  });

  it('18:30 → row 24', () => {
    expect(hourToRow(18, 30)).toBe(24);
  });

  it('19:00 → row 25 (야간)', () => {
    expect(hourToRow(19, 0)).toBe(25);
  });

  it('20:00 → row 25 (야간 상한)', () => {
    expect(hourToRow(20, 0)).toBe(25);
  });

  it('7:00 → row 2 (~07:59)', () => {
    expect(hourToRow(7, 0)).toBe(2);
  });

  it('0:00 → row 2 (8시 미만)', () => {
    expect(hourToRow(0, 0)).toBe(2);
  });

  it('minute 생략 시 기본 0 → 정시 행', () => {
    expect(hourToRow(10)).toBe(7); // 10:00 → row 7
  });
});

describe('hasTime', () => {
  it('로컬 14:00 datetime → true', () => {
    const dt = localDatetime(2026, 3, 5, 14);
    expect(hasTime(dt)).toBe(true);
  });

  it('로컬 14:30 datetime → true', () => {
    const dt = localDatetime(2026, 3, 5, 14, 30);
    expect(hasTime(dt)).toBe(true);
  });

  it('로컬 00:00:00 datetime → false', () => {
    const dt = localDateOnly(2026, 3, 5);
    expect(hasTime(dt)).toBe(false);
  });
});

describe('taskToCell', () => {
  // ── 1. 시간 있는 task ───────────────────────────────────────────────

  it('scheduledDate 14:00 (월) → col 2, rowStart 15', () => {
    const task = makeTask({
      scheduledDate: localDatetime(2026, 3, 2, 14),
    });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.col).toBe(2);
    expect(result!.rowStart).toBe(15); // hourToRow(14, 0) = 15
  });

  it('scheduledDate 09:30 (수) → col 4, rowStart 6', () => {
    const task = makeTask({
      scheduledDate: localDatetime(2026, 3, 4, 9, 30),
    });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.col).toBe(4);
    expect(result!.rowStart).toBe(6); // hourToRow(9, 30) = 6
  });

  // ── 2. 시간 없는 task → 종일 행 ────────────────────────────────────

  it('scheduledDate 날짜만 (시간 없음) → rowStart 1 (종일)', () => {
    const task = makeTask({
      scheduledDate: localDateOnly(2026, 3, 3),
    });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.rowStart).toBe(1);
  });

  // ── 3. 8시 이전 task → ~07:59 행 (rowIndex 2) ─────────────────────

  it('scheduledDate 6:00 → rowStart 2 (~07:59)', () => {
    const task = makeTask({
      scheduledDate: localDatetime(2026, 3, 3, 6),
    });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.rowStart).toBe(2);
  });

  it('scheduledDate 0:00 hasTime=false → rowStart 1 (종일)', () => {
    const task = makeTask({
      scheduledDate: localDateOnly(2026, 3, 3),
    });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.rowStart).toBe(1);
  });

  // ── 4. 19시 이후 task → 야간 행 (rowIndex 25) ─────────────────────

  it('scheduledDate 19:00 → rowStart 25', () => {
    const task = makeTask({
      scheduledDate: localDatetime(2026, 3, 5, 19),
    });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.rowStart).toBe(25);
  });

  it('scheduledDate 21:00 → rowStart 25 (야간 상한)', () => {
    const task = makeTask({
      scheduledDate: localDatetime(2026, 3, 5, 21),
    });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.rowStart).toBe(25);
  });

  // ── 5. rowSpan 계산 (30분 단위, exclusive end) ────────────────────

  it('14:00~16:00 → rowSpan 4 (2시간 = 4행)', () => {
    // hourToRow(14,0)=15, hourToRow(16,0)=19, span = 19-15 = 4
    const task = makeTask({
      scheduledDate: localDatetime(2026, 3, 3, 14),
      dueDate: localDatetime(2026, 3, 3, 16),
    });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.rowSpan).toBe(4);
  });

  it('09:00~11:00 → rowSpan 4 (2시간 = 4행)', () => {
    // hourToRow(9,0)=5, hourToRow(11,0)=9, span = 9-5 = 4
    const task = makeTask({
      scheduledDate: localDatetime(2026, 3, 3, 9),
      dueDate: localDatetime(2026, 3, 3, 11),
    });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.rowSpan).toBe(4);
  });

  it('09:00~09:30 → rowSpan 1 (30분 = 1행)', () => {
    // hourToRow(9,0)=5, hourToRow(9,30)=6, span = 6-5 = 1
    const task = makeTask({
      scheduledDate: localDatetime(2026, 3, 3, 9),
      dueDate: localDatetime(2026, 3, 3, 9, 30),
    });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.rowSpan).toBe(1);
  });

  it('10:30~12:00 → rowSpan 3 (1.5시간 = 3행)', () => {
    // hourToRow(10,30)=8, hourToRow(12,0)=11, span = 11-8 = 3
    const task = makeTask({
      scheduledDate: localDatetime(2026, 3, 3, 10, 30),
      dueDate: localDatetime(2026, 3, 3, 12),
    });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.rowSpan).toBe(3);
  });

  it('dueDate가 다른 날이면 rowSpan = 1', () => {
    const task = makeTask({
      scheduledDate: localDatetime(2026, 3, 3, 14),
      dueDate: localDatetime(2026, 3, 4, 16),
    });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.rowSpan).toBe(1);
  });

  it('dueDate가 없으면 rowSpan = 1', () => {
    const task = makeTask({
      scheduledDate: localDatetime(2026, 3, 3, 14),
    });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.rowSpan).toBe(1);
  });

  // ── 6. 이번 주 밖 → null ──────────────────────────────────────────

  it('scheduledDate가 이번 주 이전 → null', () => {
    const task = makeTask({
      scheduledDate: localDatetime(2026, 2, 28, 14),
    });
    expect(taskToCell(task, SUNDAY, SATURDAY)).toBeNull();
  });

  it('scheduledDate가 이번 주 이후 → null', () => {
    const task = makeTask({
      scheduledDate: localDatetime(2026, 3, 9, 14),
    });
    expect(taskToCell(task, SUNDAY, SATURDAY)).toBeNull();
  });

  // ── 7. scheduledDate 없음 → col 8 (일정미지정) ────────────────────

  it('scheduledDate 없는 task → col 8', () => {
    const task = makeTask({ scheduledDate: undefined });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.col).toBe(8);
  });

  it('scheduledDate 없는 COMPLETED task → col 8', () => {
    const task = makeTask({
      scheduledDate: undefined,
      taskStatus: {
        id: 'status-done',
        name: '완료',
        category: 'COMPLETED',
        color: '#27AE60',
        sortOrder: 2,
      },
      completedAt: localDatetime(2026, 3, 4, 15),
    });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.col).toBe(8);
  });

  // ── 8. 경계 (일요일 col 1, 토요일 col 7) ─────────────────────────

  it('일요일 scheduledDate → col 1', () => {
    const task = makeTask({
      scheduledDate: localDatetime(2026, 3, 1, 10),
    });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.col).toBe(1);
  });

  it('토요일 scheduledDate → col 7', () => {
    const task = makeTask({
      scheduledDate: localDatetime(2026, 3, 7, 10),
    });
    const result = taskToCell(task, SUNDAY, SATURDAY);
    expect(result).not.toBeNull();
    expect(result!.col).toBe(7);
  });
});
