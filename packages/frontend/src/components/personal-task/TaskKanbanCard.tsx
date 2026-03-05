import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PersonalTask } from '../../api/personal-task.api';
import Badge from '../ui/Badge';
import { TASK_PRIORITY_LABEL, TASK_PRIORITY_VARIANT } from '../../constants/labels';

interface TaskKanbanCardProps {
  task: PersonalTask;
  isSelected?: boolean;
  onSelect: (task: PersonalTask) => void;
  compact?: boolean;
}

function formatElapsedTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDueDate(dueDate: string): string {
  const d = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((taskDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '내일';
  if (diffDays === -1) return '어제';
  if (diffDays > 0) return `${d.getMonth() + 1}/${d.getDate()}`;
  return `${Math.abs(diffDays)}일 초과`;
}

function isOverdue(task: PersonalTask): boolean {
  if (!task.dueDate || task.taskStatus.category === 'COMPLETED') return false;
  return new Date(task.dueDate) < new Date();
}

const PRIORITY_BORDER_COLOR: Record<string, string> = {
  HIGH: 'var(--danger)',
  MEDIUM: 'var(--accent)',
  LOW: 'var(--text-sub)',
};

export default function TaskKanbanCard({
  task,
  isSelected,
  onSelect,
  compact = false,
}: TaskKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const isDone = task.taskStatus.category === 'COMPLETED';
  const overdue = isOverdue(task);
  const priorityVariant = TASK_PRIORITY_VARIANT[task.priority];
  const borderColor = PRIORITY_BORDER_COLOR[task.priority] ?? 'var(--gray-border)';

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeft: `3px solid ${borderColor}`,
        backgroundColor: isSelected ? 'var(--primary-bg)' : 'var(--white, #fff)',
        boxShadow: isDragging
          ? '0 8px 16px rgba(0,0,0,0.18)'
          : '0 1px 3px rgba(0,0,0,0.08)',
        outline: isSelected ? '1.5px solid var(--primary)' : undefined,
      }}
      className={[
        'rounded-lg cursor-pointer transition-all',
        compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5',
      ].join(' ')}
      onClick={() => onSelect(task)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(task)}
      {...attributes}
      {...listeners}
    >
      {/* Title */}
      <p
        className={[
          'font-semibold leading-snug',
          compact ? 'text-[11px]' : 'text-[13px]',
          isDone ? 'line-through' : '',
        ].join(' ')}
        style={{ color: isDone ? 'var(--text-sub)' : 'var(--text)' }}
      >
        {task.title}
      </p>

      {/* Memo preview */}
      {task.memo && !compact && (
        <p
          className="text-[11px] mt-0.5 truncate leading-tight"
          style={{ color: 'var(--text-sub)' }}
        >
          {task.memo}
        </p>
      )}

      {/* Badges row */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-1 mt-1.5">
          {/* Status badge with custom color */}
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: task.taskStatus.color + '22',
              color: task.taskStatus.color,
            }}
          >
            {task.taskStatus.name}
          </span>

          {/* Project badge */}
          {task.project && (
            <Badge variant="purple" className="max-w-[90px] truncate">
              {task.project.name}
            </Badge>
          )}

          {/* Priority badge */}
          <Badge variant={priorityVariant}>
            {TASK_PRIORITY_LABEL[task.priority]}
          </Badge>

          {/* Elapsed time badge (COMPLETED) */}
          {isDone && task.elapsedMinutes != null && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'var(--ok-bg)', color: 'var(--ok)' }}
            >
              {formatElapsedTime(task.elapsedMinutes)}
            </span>
          )}
        </div>
      )}

      {/* Compact badges */}
      {compact && (
        <div className="flex items-center gap-1 mt-0.5">
          {task.project && (
            <Badge variant="purple" className="max-w-[70px] truncate text-[10px]">
              {task.project.name}
            </Badge>
          )}
          <Badge variant={priorityVariant} className="text-[10px]">
            {TASK_PRIORITY_LABEL[task.priority]}
          </Badge>
        </div>
      )}

      {/* Due date */}
      {task.dueDate && !compact && (
        <p
          className="text-[10.5px] mt-1 font-medium"
          style={{ color: overdue ? 'var(--danger)' : 'var(--text-sub)' }}
        >
          마감: {formatDueDate(task.dueDate)}
        </p>
      )}
    </div>
  );
}
