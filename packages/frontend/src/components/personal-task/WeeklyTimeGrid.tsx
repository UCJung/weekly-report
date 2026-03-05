import React, { useMemo } from 'react';
import { PersonalTask } from '../../api/personal-task.api';
import WeeklyGridCard from './WeeklyGridCard';

interface WeeklyTimeGridProps {
  tasks: PersonalTask[];
  sunday: Date;
  saturday: Date;
  isThisWeek: boolean;
  selectedTaskId?: string;
  onSelectTask: (task: PersonalTask) => void;
  onClickEmptyDate?: (date: Date, hour?: number) => void;
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

// Row 0 = header, Row 1 = 종일, Row 2 = ~07:59, Row 3..13 = 08:00~18:00, Row 14 = 19:00~
const TIME_ROWS: { label: string; rowIndex: number }[] = [
  { label: '종일', rowIndex: 1 },
  { label: '~07:59', rowIndex: 2 },
  { label: '08:00', rowIndex: 3 },
  { label: '09:00', rowIndex: 4 },
  { label: '10:00', rowIndex: 5 },
  { label: '11:00', rowIndex: 6 },
  { label: '12:00', rowIndex: 7 },
  { label: '13:00', rowIndex: 8 },
  { label: '14:00', rowIndex: 9 },
  { label: '15:00', rowIndex: 10 },
  { label: '16:00', rowIndex: 11 },
  { label: '17:00', rowIndex: 12 },
  { label: '18:00', rowIndex: 13 },
  { label: '19:00~', rowIndex: 14 },
];

// Total grid rows (including header row 0): 15 rows
const TOTAL_ROWS = 15;

/** Check if two dates are on the same calendar day */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Check if a date is today */
function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/** Get the Date for sunday + dayIndex */
function getDayDate(sunday: Date, dayIndex: number): Date {
  const d = new Date(sunday);
  d.setDate(sunday.getDate() + dayIndex);
  return d;
}

/** Format column header: "M/D 요일" */
function formatHeader(sunday: Date, dayIndex: number): string {
  const d = getDayDate(sunday, dayIndex);
  return `${d.getMonth() + 1}/${d.getDate()} ${DAY_NAMES[dayIndex]}`;
}

/** Returns true if scheduledDate has a non-zero time */
function hasTime(dateStr: string): boolean {
  const d = new Date(dateStr);
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

/**
 * Map a task to { col (1-8), rowStart (1-14), rowSpan (1+) }
 * col: 1-7 = Sun-Sat, 8 = 예정업무
 * row: 1=종일, 2=~07:59, 3-13=08:00~18:00, 14=19:00~
 */
interface CellPlacement {
  col: number;    // 1-8
  rowStart: number; // 1-14 (grid row index within time rows)
  rowSpan: number;
}

function hourToRow(hour: number): number {
  if (hour < 8) return 2;
  if (hour >= 19) return 14;
  return hour - 8 + 3; // 08 → 3, 09 → 4, ..., 18 → 13
}

function taskToCell(task: PersonalTask, sunday: Date, saturday: Date): CellPlacement {
  const sundayNorm = new Date(sunday);
  sundayNorm.setHours(0, 0, 0, 0);
  const saturdayNorm = new Date(saturday);
  saturdayNorm.setHours(23, 59, 59, 999);

  // Helper: get day col (1-7) for a date, or null if out of range
  const getDayCol = (date: Date): number | null => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (d < sundayNorm || d > saturdayNorm) return null;
    return d.getDay() + 1; // 0=Sun → col 1
  };

  if (task.scheduledDate) {
    const scheduled = new Date(task.scheduledDate);
    const col = getDayCol(scheduled);
    if (col !== null) {
      if (hasTime(task.scheduledDate)) {
        const scheduledHour = scheduled.getHours();
        const rowStart = hourToRow(scheduledHour);

        // Calculate rowSpan if dueDate is on the same day with time
        let rowSpan = 1;
        if (task.dueDate && hasTime(task.dueDate)) {
          const due = new Date(task.dueDate);
          if (isSameDay(scheduled, due)) {
            const dueHour = due.getHours();
            const dueRow = hourToRow(dueHour);
            rowSpan = Math.max(1, dueRow - rowStart + 1);
          }
        }
        return { col, rowStart, rowSpan };
      } else {
        // No time → 종일 row
        return { col, rowStart: 1, rowSpan: 1 };
      }
    } else {
      // scheduledDate outside current week → 예정업무
      return { col: 8, rowStart: 1, rowSpan: 1 };
    }
  }

  // No scheduledDate — fallback logic
  if (task.taskStatus.category === 'COMPLETED' && task.completedAt) {
    const completed = new Date(task.completedAt);
    const col = getDayCol(completed);
    if (col !== null) {
      return { col, rowStart: 1, rowSpan: 1 };
    }
    return { col: 8, rowStart: 1, rowSpan: 1 };
  }

  if (task.taskStatus.category === 'IN_PROGRESS' && task.startedAt) {
    const started = new Date(task.startedAt);
    const col = getDayCol(started);
    if (col !== null) {
      return { col, rowStart: 1, rowSpan: 1 };
    }
  }

  // Default → 예정업무
  return { col: 8, rowStart: 1, rowSpan: 1 };
}

export default function WeeklyTimeGrid({
  tasks,
  sunday,
  saturday,
  isThisWeek,
  selectedTaskId,
  onSelectTask,
  onClickEmptyDate,
}: WeeklyTimeGridProps) {
  // Build cell placement map: col -> rowStart -> tasks[]
  const cellMap = useMemo(() => {
    const map = new Map<string, PersonalTask[]>();

    for (const task of tasks) {
      const { col, rowStart } = taskToCell(task, sunday, saturday);
      const key = `${col}-${rowStart}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return map;
  }, [tasks, sunday, saturday]);

  // Build rowspan map: taskId -> rowSpan
  const rowSpanMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const task of tasks) {
      const { rowSpan } = taskToCell(task, sunday, saturday);
      map.set(task.id, rowSpan);
    }
    return map;
  }, [tasks, sunday, saturday]);

  // Collect tasks for 예정업무 column (col 8) — all rows combined
  const pendingTasks = useMemo(() => {
    const result: PersonalTask[] = [];
    for (let row = 1; row <= 14; row++) {
      const key = `8-${row}`;
      const rowTasks = cellMap.get(key) ?? [];
      result.push(...rowTasks);
    }
    return result;
  }, [cellMap]);

  const handleCellClick = (col: number, rowIndex: number) => {
    if (!onClickEmptyDate || col === 8) return;
    const dayIndex = col - 1; // col 1 = dayIndex 0 = Sunday
    const date = getDayDate(sunday, dayIndex);

    // Derive hour from rowIndex
    let hour: number | undefined;
    if (rowIndex === 1) {
      // 종일 — no hour
      hour = undefined;
    } else if (rowIndex === 2) {
      // ~07:59
      hour = 8;
    } else if (rowIndex >= 3 && rowIndex <= 13) {
      hour = rowIndex - 3 + 8; // row 3 → 8, row 13 → 18
    } else if (rowIndex === 14) {
      hour = 19;
    }
    onClickEmptyDate(date, hour);
  };

  return (
    <div
      className="w-full h-full overflow-y-auto overflow-x-auto"
      style={{ minHeight: 0 }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateRows: `auto repeat(${TOTAL_ROWS - 1}, minmax(48px, 1fr))`,
          gridTemplateColumns: '60px repeat(7, 1fr) minmax(120px, 1fr)',
          minWidth: 720,
        }}
      >
        {/* ── Row 0: Header ── */}
        {/* Corner cell */}
        <div
          style={{
            gridRow: 1,
            gridColumn: 1,
            backgroundColor: 'var(--tbl-header)',
            borderRight: '1px solid var(--gray-border)',
            borderBottom: '1px solid var(--gray-border)',
          }}
        />

        {/* Day headers: col 2-8 */}
        {Array.from({ length: 7 }, (_, dayIndex) => {
          const col = dayIndex + 2;
          const dayDate = getDayDate(sunday, dayIndex);
          const todayCol = isThisWeek && isToday(dayDate);
          return (
            <div
              key={`hdr-${dayIndex}`}
              style={{
                gridRow: 1,
                gridColumn: col,
                backgroundColor: todayCol ? 'var(--primary-bg)' : 'var(--tbl-header)',
                borderRight: '1px solid var(--gray-border)',
                borderBottom: todayCol ? '2px solid var(--primary)' : '1px solid var(--gray-border)',
                padding: '6px 4px',
                textAlign: 'center',
              }}
            >
              <span
                className="text-[11.5px] font-semibold"
                style={{ color: todayCol ? 'var(--primary)' : 'var(--text-sub)' }}
              >
                {formatHeader(sunday, dayIndex)}
              </span>
            </div>
          );
        })}

        {/* 예정업무 header */}
        <div
          style={{
            gridRow: 1,
            gridColumn: 9,
            backgroundColor: 'var(--warn-bg)',
            borderBottom: '1px solid var(--gray-border)',
            padding: '6px 4px',
            textAlign: 'center',
          }}
        >
          <span
            className="text-[11.5px] font-semibold"
            style={{ color: 'var(--warn)' }}
          >
            예정업무
          </span>
        </div>

        {/* ── Rows 1-14: Time rows ── */}
        {TIME_ROWS.map(({ label, rowIndex }) => {
          const gridRow = rowIndex + 1; // CSS grid row (1-based, row 0 is header)
          const isAlt = rowIndex % 2 === 0;

          return (
            <React.Fragment key={`row-${rowIndex}`}>
              {/* Time label */}
              <div
                style={{
                  gridRow: gridRow,
                  gridColumn: 1,
                  backgroundColor: isAlt ? 'var(--row-alt)' : 'var(--white, #fff)',
                  borderRight: '1px solid var(--gray-border)',
                  borderBottom: '1px solid var(--gray-border)',
                  padding: '4px 6px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                }}
              >
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--text-sub)', whiteSpace: 'nowrap' }}
                >
                  {label}
                </span>
              </div>

              {/* Day cells: col 2-8 */}
              {Array.from({ length: 7 }, (_, dayIndex) => {
                const col = dayIndex + 2;
                const dayDate = getDayDate(sunday, dayIndex);
                const todayCol = isThisWeek && isToday(dayDate);
                const mapKey = `${dayIndex + 1}-${rowIndex}`;
                const cellTasks = cellMap.get(mapKey) ?? [];

                return (
                  <div
                    key={`cell-${rowIndex}-${dayIndex}`}
                    style={{
                      gridRow: gridRow,
                      gridColumn: col,
                      backgroundColor: todayCol
                        ? 'var(--primary-bg)'
                        : isAlt
                        ? 'var(--row-alt)'
                        : 'var(--white, #fff)',
                      borderRight: '1px solid var(--gray-border)',
                      borderBottom: '1px solid var(--gray-border)',
                      borderLeft: todayCol ? '1px solid var(--primary)' : undefined,
                      padding: '3px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      cursor: onClickEmptyDate ? 'pointer' : undefined,
                      position: 'relative',
                    }}
                    onClick={() => handleCellClick(dayIndex + 1, rowIndex)}
                  >
                    {cellTasks.map((task) => {
                      const span = rowSpanMap.get(task.id) ?? 1;
                      // Only render in the rowStart cell (rowIndex === placement.rowStart)
                      const placement = taskToCell(task, sunday, saturday);
                      if (placement.rowStart !== rowIndex) return null;

                      return (
                        <div
                          key={task.id}
                          style={
                            span > 1
                              ? {
                                  position: 'absolute',
                                  top: 3,
                                  left: 3,
                                  right: 3,
                                  // approximate height: span * 48px minus gaps
                                  height: `calc(${span * 48}px - 8px)`,
                                  zIndex: 1,
                                }
                              : undefined
                          }
                          onClick={(e) => e.stopPropagation()}
                        >
                          <WeeklyGridCard
                            task={task}
                            isSelected={selectedTaskId === task.id}
                            onSelect={onSelectTask}
                            showTime
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* 예정업무 column: spans all time rows (rows 2-15 in CSS grid) */}
        <div
          style={{
            gridRow: '2 / 16',
            gridColumn: 9,
            backgroundColor: 'var(--warn-bg)',
            borderBottom: '1px solid var(--gray-border)',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            overflowY: 'auto',
          }}
        >
          {pendingTasks.length === 0 ? (
            <div
              className="flex items-center justify-center h-full text-[11px]"
              style={{ color: 'var(--warn)' }}
            >
              예정 없음
            </div>
          ) : (
            pendingTasks.map((task) => (
              <WeeklyGridCard
                key={task.id}
                task={task}
                isSelected={selectedTaskId === task.id}
                onSelect={onSelectTask}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
