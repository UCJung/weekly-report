import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PersonalTask } from '../../api/personal-task.api';
import WeeklyTimeGrid from './WeeklyTimeGrid';

interface TaskWeeklyViewProps {
  tasks: PersonalTask[];
  isLoading: boolean;
  selectedTaskId?: string;
  onSelectTask: (task: PersonalTask) => void;
  onClickEmptyDate?: (date: Date, hour?: number) => void;
}

/** Get Sunday of the week that contains the given date, offset by N weeks */
function getWeekSunday(date: Date, offsetWeeks: number): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day + offsetWeeks * 7);
  return d;
}

export default function TaskWeeklyView({
  tasks,
  isLoading,
  selectedTaskId,
  onSelectTask,
  onClickEmptyDate,
}: TaskWeeklyViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const sunday = useMemo(() => getWeekSunday(new Date(), weekOffset), [weekOffset]);

  const saturday = useMemo(() => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + 6);
    return d;
  }, [sunday]);

  const isThisWeek = weekOffset === 0;

  if (isLoading) {
    return (
      <div
        className="rounded-lg border px-4 py-10 text-center text-[13px]"
        style={{
          borderColor: 'var(--gray-border)',
          backgroundColor: 'var(--white)',
          color: 'var(--text-sub)',
        }}
      >
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Week navigation */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => setWeekOffset((v) => v - 1)}
          className="p-1 rounded hover:bg-[var(--gray-light)] transition-colors"
          style={{ color: 'var(--text-sub)' }}
          aria-label="이전 주"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
          {sunday.getMonth() + 1}/{sunday.getDate()}
          {' '}—{' '}
          {saturday.getMonth() + 1}/{saturday.getDate()}
        </span>

        {!isThisWeek && (
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="text-[11px] px-2 py-0.5 rounded-full transition-colors"
            style={{
              backgroundColor: 'var(--primary-bg)',
              color: 'var(--primary)',
            }}
          >
            이번 주
          </button>
        )}

        <button
          type="button"
          onClick={() => setWeekOffset((v) => v + 1)}
          className="p-1 rounded hover:bg-[var(--gray-light)] transition-colors"
          style={{ color: 'var(--text-sub)' }}
          aria-label="다음 주"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Time grid */}
      <div className="flex-1 min-h-0">
        <WeeklyTimeGrid
          tasks={tasks}
          sunday={sunday}
          saturday={saturday}
          isThisWeek={isThisWeek}
          selectedTaskId={selectedTaskId}
          onSelectTask={onSelectTask}
          onClickEmptyDate={onClickEmptyDate}
        />
      </div>
    </div>
  );
}
