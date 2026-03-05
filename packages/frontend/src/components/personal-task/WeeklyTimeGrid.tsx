import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { PersonalTask, UpdatePersonalTaskDto } from '../../api/personal-task.api';
import WeeklyGridCard from './WeeklyGridCard';

interface WeeklyTimeGridProps {
  tasks: PersonalTask[];
  sunday: Date;
  saturday: Date;
  isThisWeek: boolean;
  selectedTaskId?: string;
  onSelectTask: (task: PersonalTask) => void;
  onClickEmptyDate?: (date: Date, hour?: number) => void;
  onUpdateTask?: (id: string, dto: UpdatePersonalTaskDto) => void;
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

// Row 0 = header, Row 1 = 종일, Row 2 = ~07:59,
// Row 3..24 = 08:00~18:30 (30-min intervals), Row 25 = 19:00~
const TIME_ROWS: { label: string; rowIndex: number; isHalf?: boolean }[] = [
  { label: '종일', rowIndex: 1 },
  { label: '~07:59', rowIndex: 2 },
  { label: '08:00', rowIndex: 3 },
  { label: '08:30', rowIndex: 4, isHalf: true },
  { label: '09:00', rowIndex: 5 },
  { label: '09:30', rowIndex: 6, isHalf: true },
  { label: '10:00', rowIndex: 7 },
  { label: '10:30', rowIndex: 8, isHalf: true },
  { label: '11:00', rowIndex: 9 },
  { label: '11:30', rowIndex: 10, isHalf: true },
  { label: '12:00', rowIndex: 11 },
  { label: '12:30', rowIndex: 12, isHalf: true },
  { label: '13:00', rowIndex: 13 },
  { label: '13:30', rowIndex: 14, isHalf: true },
  { label: '14:00', rowIndex: 15 },
  { label: '14:30', rowIndex: 16, isHalf: true },
  { label: '15:00', rowIndex: 17 },
  { label: '15:30', rowIndex: 18, isHalf: true },
  { label: '16:00', rowIndex: 19 },
  { label: '16:30', rowIndex: 20, isHalf: true },
  { label: '17:00', rowIndex: 21 },
  { label: '17:30', rowIndex: 22, isHalf: true },
  { label: '18:00', rowIndex: 23 },
  { label: '18:30', rowIndex: 24, isHalf: true },
  { label: '19:00~', rowIndex: 25 },
];

// Total grid rows (including header row 0): 26 rows
const TOTAL_ROWS = 26;

// Row height in px — each row = 30 minutes
const ROW_HEIGHT_PX = 32;

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
export function hasTime(dateStr: string): boolean {
  const d = new Date(dateStr);
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

/**
 * Map a task to { col (1-8), rowStart (1-14), rowSpan (1+) }
 * col: 1-7 = Sun-Sat, 8 = 일정미지정
 * row: 1=종일, 2=~07:59, 3-13=08:00~18:00, 14=19:00~
 */
export interface CellPlacement {
  col: number;    // 1-8
  rowStart: number; // 1-14 (grid row index within time rows)
  rowSpan: number;
}

export function hourToRow(hour: number, minute: number = 0): number {
  if (hour < 8) return 2;
  if (hour >= 19) return 25;
  return (hour - 8) * 2 + 3 + (minute >= 30 ? 1 : 0);
  // 08:00→3, 08:30→4, 09:00→5, ..., 18:00→23, 18:30→24
}

/** Convert rowIndex back to { hour, minute } for datetime construction */
function rowToTime(rowIndex: number): { hour: number; minute: number } | undefined {
  if (rowIndex === 1) return undefined; // 종일
  if (rowIndex === 2) return { hour: 7, minute: 0 };
  if (rowIndex >= 3 && rowIndex <= 24) {
    const idx = rowIndex - 3;
    return { hour: Math.floor(idx / 2) + 8, minute: (idx % 2) * 30 };
  }
  if (rowIndex === 25) return { hour: 19, minute: 0 };
  return undefined;
}

export function taskToCell(task: PersonalTask, sunday: Date, saturday: Date): CellPlacement | null {
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
        const rowStart = hourToRow(scheduled.getHours(), scheduled.getMinutes());

        // Calculate rowSpan if dueDate is on the same day with time
        let rowSpan = 1;
        if (task.dueDate && hasTime(task.dueDate)) {
          const due = new Date(task.dueDate);
          if (isSameDay(scheduled, due)) {
            const dueRow = hourToRow(due.getHours(), due.getMinutes());
            rowSpan = Math.max(1, dueRow - rowStart);
          }
        }
        return { col, rowStart, rowSpan };
      } else {
        // No time → 종일 row
        return { col, rowStart: 1, rowSpan: 1 };
      }
    } else {
      // scheduledDate outside current week → not displayed (filtered out)
      return null;
    }
  }

  // No scheduledDate → 일정미지정 (col 8)
  return { col: 8, rowStart: 1, rowSpan: 1 };
}

/** Parse droppable cell id "cell-{col}-{rowIndex}" → {col, rowIndex} */
function parseCellId(id: string): { col: number; rowIndex: number } | null {
  const match = id.match(/^cell-(\d+)-(\d+)$/);
  if (!match) return null;
  return { col: parseInt(match[1], 10), rowIndex: parseInt(match[2], 10) };
}

/** Build an ISO datetime string from a date + optional hour + minutes */
function buildDatetime(date: Date, hour: number | undefined, minutes = 0): string {
  if (hour === undefined) {
    // Date only (종일)
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}T00:00:00.000Z`;
  }
  const result = new Date(date);
  result.setHours(hour, minutes, 0, 0);
  return result.toISOString();
}

/** Clamp minutes to valid range [0, 23*60+30] and snap to 30-min */
function clampMinutes(totalMinutes: number): number {
  return Math.max(0, Math.min(23 * 60 + 30, totalMinutes));
}

/** Minimum card height during resize */
const MIN_RESIZE_HEIGHT = ROW_HEIGHT_PX - 8;

// ─────────────────────────────────────────────────────────────────────────────
// DroppableCell component
// ─────────────────────────────────────────────────────────────────────────────

interface DroppableCellProps {
  id: string;
  gridRow: number;
  gridColumn: number;
  backgroundColor: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

function DroppableCell({
  id,
  gridRow,
  gridColumn,
  backgroundColor,
  borderRight,
  borderBottom,
  borderLeft,
  children,
  onClick,
}: DroppableCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        gridRow,
        gridColumn,
        backgroundColor: isOver ? 'var(--primary-bg)' : backgroundColor,
        borderRight,
        borderBottom: isOver ? '2px solid var(--primary)' : borderBottom,
        borderLeft,
        padding: '3px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        cursor: onClick ? 'pointer' : undefined,
        position: 'relative',
        transition: 'background-color 0.1s',
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WeeklyTimeGrid main component
// ─────────────────────────────────────────────────────────────────────────────

export default function WeeklyTimeGrid({
  tasks,
  sunday,
  saturday,
  isThisWeek,
  selectedTaskId,
  onSelectTask,
  onClickEmptyDate,
  onUpdateTask,
}: WeeklyTimeGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Track the active drag id for DragOverlay (card moves only, not resize)
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  // Capture original card dimensions for DragOverlay sizing
  const [activeDragRect, setActiveDragRect] = useState<{ width: number; height: number }>({ width: 120, height: 40 });

  // Suppress card selection after drag/resize ends (prevents detail panel from opening)
  const suppressClickRef = useRef(false);

  // Find the task being dragged (for overlay rendering)
  const activeTask = useMemo(() => {
    if (!activeDragId) return null;
    // Only show overlay for card moves (task-{id}), not resize
    const taskIdMatch = activeDragId.match(/^task-(.+)$/);
    if (!taskIdMatch) return null;
    return tasks.find((t) => t.id === taskIdMatch[1]) ?? null;
  }, [activeDragId, tasks]);

  // Wrapped select handler that ignores clicks right after drag/resize
  const handleSelectTask = useCallback((task: PersonalTask) => {
    if (suppressClickRef.current) return;
    onSelectTask(task);
  }, [onSelectTask]);

  // ── Resize state (native pointer events, NOT @dnd-kit) ────────────
  const [resizeState, setResizeState] = useState<{
    taskId: string;
    type: 'top' | 'bottom';
    startY: number;
    deltaY: number;
  } | null>(null);

  const resizeRef = useRef(resizeState);
  resizeRef.current = resizeState;

  const handleResizeStart = useCallback((taskId: string, type: 'top' | 'bottom', startY: number) => {
    setResizeState({ taskId, type, startY, deltaY: 0 });
  }, []);

  // Global pointer move/up listeners for resize
  useEffect(() => {
    if (!resizeState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const state = resizeRef.current;
      if (!state) return;
      setResizeState({ ...state, deltaY: e.clientY - state.startY });
    };

    const handlePointerUp = () => {
      // Suppress card click after resize
      suppressClickRef.current = true;
      setTimeout(() => { suppressClickRef.current = false; }, 200);

      const state = resizeRef.current;
      if (!state || !onUpdateTask) {
        setResizeState(null);
        return;
      }

      const task = tasks.find((t) => t.id === state.taskId);
      if (!task || !task.scheduledDate) {
        setResizeState(null);
        return;
      }

      const deltaSteps = Math.round(state.deltaY / ROW_HEIGHT_PX);
      if (deltaSteps !== 0) {
        const scheduled = new Date(task.scheduledDate);

        if (state.type === 'top') {
          // Resize top → change scheduledDate
          const currentMinutes = scheduled.getHours() * 60 + scheduled.getMinutes();
          const newTotalMinutes = clampMinutes(currentMinutes + deltaSteps * 30);

          // Constraint: scheduledDate must be < dueDate
          let valid = true;
          if (task.dueDate && hasTime(task.dueDate)) {
            const dueMinutes = new Date(task.dueDate).getHours() * 60 + new Date(task.dueDate).getMinutes();
            if (newTotalMinutes >= dueMinutes) valid = false;
          }
          if (valid) {
            const newScheduled = new Date(scheduled);
            newScheduled.setHours(Math.floor(newTotalMinutes / 60), newTotalMinutes % 60, 0, 0);
            onUpdateTask(state.taskId, { scheduledDate: newScheduled.toISOString() });
          }
        } else {
          // Resize bottom → change dueDate
          const scheduledMinutes = scheduled.getHours() * 60 + scheduled.getMinutes();
          const baseDue = task.dueDate && hasTime(task.dueDate)
            ? new Date(task.dueDate)
            : (() => { const d = new Date(scheduled); d.setMinutes(d.getMinutes() + 30); return d; })();

          const currentDueMinutes = baseDue.getHours() * 60 + baseDue.getMinutes();
          const newDueMinutes = clampMinutes(currentDueMinutes + deltaSteps * 30);

          if (newDueMinutes > scheduledMinutes) {
            const newDue = new Date(scheduled);
            newDue.setHours(Math.floor(newDueMinutes / 60), newDueMinutes % 60, 0, 0);
            onUpdateTask(state.taskId, { dueDate: newDue.toISOString() });
          }
        }
      }

      setResizeState(null);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [resizeState !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build cell placement map: col -> rowStart -> tasks[]
  const cellMap = useMemo(() => {
    const map = new Map<string, PersonalTask[]>();

    for (const task of tasks) {
      const placement = taskToCell(task, sunday, saturday);
      if (!placement) continue; // skip tasks outside current week
      const key = `${placement.col}-${placement.rowStart}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return map;
  }, [tasks, sunday, saturday]);

  // Build rowspan map: taskId -> rowSpan
  const rowSpanMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const task of tasks) {
      const placement = taskToCell(task, sunday, saturday);
      if (!placement) continue;
      map.set(task.id, placement.rowSpan);
    }
    return map;
  }, [tasks, sunday, saturday]);

  // Collect tasks for 일정미지정 column (col 8) — all rows combined
  const unscheduledTasks = useMemo(() => {
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
    const time = rowToTime(rowIndex);
    onClickEmptyDate(date, time?.hour);
  };

  // ── DnD handlers ──────────────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveDragId(id);
    // Capture original card dimensions for DragOverlay
    const taskId = id.replace('task-', '');
    const el = document.querySelector(`[data-dnd-card="${taskId}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setActiveDragRect({ width: rect.width, height: rect.height });
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // visual feedback is handled by DroppableCell's isOver state
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);

    // Suppress card click after drag
    suppressClickRef.current = true;
    setTimeout(() => { suppressClickRef.current = false; }, 200);

    const { active, over, delta } = event;
    if (!onUpdateTask) return;

    const activeId = String(active.id);

    // ── Card move ─────────────────────────────────────────────────────
    if (activeId.startsWith('task-')) {
      if (!over) return;
      const taskId = activeId.slice('task-'.length);
      const task = tasks.find((t) => t.id === taskId);
      const overId = String(over.id);
      const cell = parseCellId(overId);
      if (!cell) return;

      const { col, rowIndex } = cell;
      const dayIndex = col - 2; // col 2 = dayIndex 0 = Sunday
      const targetDate = getDayDate(sunday, dayIndex);
      const time = rowToTime(rowIndex);

      const dto: UpdatePersonalTaskDto = {
        scheduledDate: buildDatetime(targetDate, time?.hour, time?.minute ?? 0),
      };

      // Preserve duration: if task had both scheduledDate and dueDate with time
      if (
        time !== undefined &&
        task?.scheduledDate && hasTime(task.scheduledDate) &&
        task?.dueDate && hasTime(task.dueDate)
      ) {
        const origDurationMs = new Date(task.dueDate).getTime() - new Date(task.scheduledDate).getTime();
        if (origDurationMs > 0) {
          const newScheduled = new Date(dto.scheduledDate!);
          const newDue = new Date(newScheduled.getTime() + origDurationMs);
          dto.dueDate = newDue.toISOString();
        }
      }

      // If moving to 종일, clear dueDate
      if (time === undefined) {
        dto.dueDate = null;
      }

      onUpdateTask(taskId, dto);
      return;
    }

    // Resize is handled via native pointer events (not @dnd-kit)
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className="w-full h-full overflow-y-auto overflow-x-auto"
        style={{ minHeight: 0 }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateRows: `auto repeat(${TOTAL_ROWS - 1}, minmax(${ROW_HEIGHT_PX}px, 1fr))`,
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

          {/* 일정미지정 header */}
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
              일정미지정
            </span>
          </div>

          {/* ── Rows 1-25: Time rows (30-min intervals) ── */}
          {TIME_ROWS.map(({ label, rowIndex, isHalf }) => {
            const gridRow = rowIndex + 1; // CSS grid row (1-based, row 0 is header)
            // Alternate background: group by hour (every 2 rows)
            const isAlt = rowIndex >= 3 ? Math.floor((rowIndex - 3) / 2) % 2 === 1 : rowIndex % 2 === 0;
            const borderBottomStyle = isHalf
              ? '1px dashed var(--gray-border)'
              : '1px solid var(--gray-border)';

            return (
              <React.Fragment key={`row-${rowIndex}`}>
                {/* Time label */}
                <div
                  style={{
                    gridRow: gridRow,
                    gridColumn: 1,
                    backgroundColor: isAlt ? 'var(--row-alt)' : 'var(--white, #fff)',
                    borderRight: '1px solid var(--gray-border)',
                    borderBottom: borderBottomStyle,
                    padding: '2px 6px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span
                    style={{
                      fontSize: isHalf ? '9px' : '10px',
                      color: 'var(--text-sub)',
                      opacity: isHalf ? 0.5 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </span>
                </div>

                {/* Day cells: col 2-8 (droppable) */}
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const col = dayIndex + 2;
                  const dayDate = getDayDate(sunday, dayIndex);
                  const todayCol = isThisWeek && isToday(dayDate);
                  const mapKey = `${dayIndex + 1}-${rowIndex}`;
                  const cellTasks = cellMap.get(mapKey) ?? [];
                  const cellId = `cell-${col}-${rowIndex}`;

                  return (
                    <DroppableCell
                      key={`cell-${rowIndex}-${dayIndex}`}
                      id={cellId}
                      gridRow={gridRow}
                      gridColumn={col}
                      backgroundColor={
                        todayCol
                          ? 'var(--primary-bg)'
                          : isAlt
                          ? 'var(--row-alt)'
                          : 'var(--white, #fff)'
                      }
                      borderRight="1px solid var(--gray-border)"
                      borderBottom={borderBottomStyle}
                      borderLeft={todayCol ? '1px solid var(--primary)' : undefined}
                      onClick={
                        onClickEmptyDate
                          ? () => handleCellClick(dayIndex + 1, rowIndex)
                          : undefined
                      }
                    >
                      {cellTasks.map((task) => {
                        const span = rowSpanMap.get(task.id) ?? 1;
                        // Only render in the rowStart cell (rowIndex === placement.rowStart)
                        const placement = taskToCell(task, sunday, saturday);
                        if (!placement || placement.rowStart !== rowIndex) return null;

                        const isTimed = task.scheduledDate != null && hasTime(task.scheduledDate);

                        // Compute real-time height during resize
                        let wrapperHeight = span * ROW_HEIGHT_PX - 4;
                        let wrapperTop = 2;
                        if (resizeState?.taskId === task.id) {
                          if (resizeState.type === 'bottom') {
                            wrapperHeight = Math.max(MIN_RESIZE_HEIGHT, wrapperHeight + resizeState.deltaY);
                          } else {
                            wrapperHeight = Math.max(MIN_RESIZE_HEIGHT, wrapperHeight - resizeState.deltaY);
                            wrapperTop = 2 + resizeState.deltaY;
                          }
                        }

                        return (
                          <div
                            key={task.id}
                            style={
                              isTimed
                                ? {
                                    position: 'absolute',
                                    top: wrapperTop,
                                    left: 3,
                                    right: 3,
                                    height: wrapperHeight,
                                    zIndex: resizeState?.taskId === task.id ? 10 : 1,
                                    transition: resizeState?.taskId === task.id ? 'none' : undefined,
                                  }
                                : undefined
                            }
                            onClick={(e) => e.stopPropagation()}
                          >
                            <WeeklyGridCard
                              task={task}
                              isSelected={selectedTaskId === task.id}
                              onSelect={handleSelectTask}
                              showTime
                              showResizeHandles={!!onUpdateTask && isTimed}
                              onResizeStart={handleResizeStart}
                            />
                          </div>
                        );
                      })}
                    </DroppableCell>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* 일정미지정 column: spans all time rows (rows 2-27 in CSS grid) */}
          <div
            style={{
              gridRow: '2 / 27',
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
            {unscheduledTasks.length === 0 ? (
              <div
                className="flex items-center justify-center h-full text-[11px]"
                style={{ color: 'var(--warn)' }}
              >
                미지정 없음
              </div>
            ) : (
              unscheduledTasks.map((task) => (
                <WeeklyGridCard
                  key={task.id}
                  task={task}
                  isSelected={selectedTaskId === task.id}
                  onSelect={handleSelectTask}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* DragOverlay — rendered outside the grid scroll container */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div style={{ width: activeDragRect.width, height: activeDragRect.height, opacity: 0.85 }}>
            <WeeklyGridCard
              task={activeTask}
              isSelected={false}
              onSelect={() => {}}
              showTime
              isOverlay
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
