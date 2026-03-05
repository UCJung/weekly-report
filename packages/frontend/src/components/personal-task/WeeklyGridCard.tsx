import React from 'react';
import { PersonalTask } from '../../api/personal-task.api';

interface WeeklyGridCardProps {
  task: PersonalTask;
  isSelected?: boolean;
  onSelect: (task: PersonalTask) => void;
  showTime?: boolean;
}

const PRIORITY_BORDER_COLOR: Record<string, string> = {
  HIGH: 'var(--danger)',
  MEDIUM: 'var(--accent)',
  LOW: 'var(--text-sub)',
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function hasNonZeroTime(dateStr: string): boolean {
  const d = new Date(dateStr);
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

export default function WeeklyGridCard({
  task,
  isSelected,
  onSelect,
  showTime = false,
}: WeeklyGridCardProps) {
  const isDone = task.taskStatus.category === 'COMPLETED';
  const borderColor = PRIORITY_BORDER_COLOR[task.priority] ?? 'var(--gray-border)';

  const timeStr =
    showTime && task.scheduledDate && hasNonZeroTime(task.scheduledDate)
      ? formatTime(task.scheduledDate)
      : null;

  return (
    <div
      data-dnd-card={task.id}
      style={{
        borderLeft: `3px solid ${borderColor}`,
        backgroundColor: isSelected ? 'var(--primary-bg)' : 'var(--white, #fff)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.07)',
        outline: isSelected ? '1.5px solid var(--primary)' : undefined,
      }}
      className="rounded cursor-pointer transition-all px-1.5 py-1 w-full overflow-hidden"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(task);
      }}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(task)}
      role="button"
      tabIndex={0}
    >
      {timeStr && (
        <p
          className="leading-none mb-0.5"
          style={{ fontSize: '9px', color: 'var(--text-sub)' }}
        >
          {timeStr}
        </p>
      )}
      <p
        className="font-semibold leading-snug truncate"
        style={{
          fontSize: '10px',
          color: isDone ? 'var(--text-sub)' : 'var(--text)',
          textDecoration: isDone ? 'line-through' : undefined,
        }}
      >
        {task.title}
      </p>
      {task.project && (
        <p
          className="truncate mt-0.5 leading-none"
          style={{ fontSize: '9px', color: 'var(--primary)' }}
        >
          {task.project.name}
        </p>
      )}
    </div>
  );
}
