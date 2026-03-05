import React from 'react';
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PersonalTask } from '../../api/personal-task.api';
import Badge from '../ui/Badge';
import { TASK_PRIORITY_LABEL } from '../../constants/labels';

interface TaskItemProps {
  task: PersonalTask;
  isSelected: boolean;
  onSelect: (task: PersonalTask) => void;
  onToggleDone: (id: string) => void;
}

function isOverdue(task: PersonalTask): boolean {
  if (!task.dueDate || task.status === 'DONE') return false;
  return new Date(task.dueDate) < new Date();
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

export default function TaskItem({ task, isSelected, onSelect, onToggleDone }: TaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const overdue = isOverdue(task);
  const isDone = task.status === 'DONE';

  const priorityVariant = {
    HIGH: 'danger' as const,
    MEDIUM: 'warn' as const,
    LOW: 'gray' as const,
  }[task.priority];

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleDone(task.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(task)}
      className={[
        'flex items-center gap-2.5 px-4 py-2.5 border-b cursor-pointer transition-colors',
        isSelected ? 'bg-[var(--primary-bg)]' : 'hover:bg-[var(--gray-light)]',
        isDragging ? 'shadow-md z-10 relative rounded-lg' : '',
      ].join(' ')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(task)}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing"
        style={{ color: 'var(--gray-border)' }}
      >
        <GripVertical size={14} />
      </span>

      {/* Checkbox */}
      <button
        type="button"
        onClick={handleCheckboxClick}
        className={[
          'flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
          isDone
            ? 'border-[var(--ok)] bg-[var(--ok)]'
            : 'border-[var(--gray-border)] bg-transparent hover:border-[var(--primary)]',
        ].join(' ')}
        aria-label={isDone ? '완료 취소' : '완료 처리'}
      >
        {isDone && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Title + Memo preview */}
      <div className="flex-1 min-w-0 flex flex-col">
        <span
          className={['text-[13px] truncate', isDone ? 'line-through' : ''].join(' ')}
          style={{ color: isDone ? 'var(--text-sub)' : 'var(--text)' }}
        >
          {task.title}
        </span>
        {task.memo && (
          <p className="text-[11px] truncate leading-tight" style={{ color: 'var(--text-sub)' }}>
            {task.memo}
          </p>
        )}
      </div>

      {/* Elapsed time badge */}
      {isDone && task.elapsedMinutes != null && (
        <span
          className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded"
          style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)' }}
        >
          {formatElapsedTime(task.elapsedMinutes)}
        </span>
      )}

      {/* Project badge */}
      {task.project && (
        <Badge variant="purple" className="flex-shrink-0 max-w-[100px] truncate">
          {task.project.name}
        </Badge>
      )}

      {/* Priority badge */}
      <Badge variant={priorityVariant} className="flex-shrink-0">
        {TASK_PRIORITY_LABEL[task.priority]}
      </Badge>

      {/* Due date */}
      {task.dueDate && (
        <span
          className="flex-shrink-0 text-[11px] font-medium"
          style={{ color: overdue ? 'var(--danger)' : 'var(--text-sub)' }}
        >
          {formatDueDate(task.dueDate)}
        </span>
      )}
    </div>
  );
}
