import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { PersonalTask } from '../../api/personal-task.api';

interface WeeklyGridCardProps {
  task: PersonalTask;
  isSelected?: boolean;
  onSelect: (task: PersonalTask) => void;
  showTime?: boolean;
  /** When true, resize handles are rendered (only for timed grid cells) */
  showResizeHandles?: boolean;
  /** When true, renders without drag listeners (for DragOverlay preview) */
  isOverlay?: boolean;
  /** Callback when resize starts via pointer down on a handle */
  onResizeStart?: (taskId: string, type: 'top' | 'bottom', startY: number) => void;
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

/** Resize handle — uses native pointer events (NOT @dnd-kit) */
function ResizeHandle({
  type,
  onPointerDown,
}: {
  type: 'top' | 'bottom';
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const isTop = type === 'top';

  return (
    <div
      style={{
        position: 'absolute',
        [isTop ? 'top' : 'bottom']: 0,
        left: 0,
        right: 0,
        height: 8,
        cursor: isTop ? 'n-resize' : 's-resize',
        backgroundColor: 'transparent',
        borderRadius: isTop ? '3px 3px 0 0' : '0 0 3px 3px',
        zIndex: 2,
        transition: 'background-color 0.15s',
      }}
      onPointerDown={(e) => {
        e.stopPropagation(); // prevent card drag from activating
        e.preventDefault();
        onPointerDown(e);
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--primary-bg)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
      }}
    />
  );
}

export default function WeeklyGridCard({
  task,
  isSelected,
  onSelect,
  showTime = false,
  showResizeHandles = false,
  isOverlay = false,
  onResizeStart,
}: WeeklyGridCardProps) {
  const isDone = task.taskStatus.category === 'COMPLETED';
  const borderColor = PRIORITY_BORDER_COLOR[task.priority] ?? 'var(--gray-border)';

  const timeStr =
    showTime && task.scheduledDate && hasNonZeroTime(task.scheduledDate)
      ? formatTime(task.scheduledDate)
      : null;

  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: `task-${task.id}`,
    disabled: isOverlay,
  });

  const handleResizePointerDown = (type: 'top' | 'bottom') => (e: React.PointerEvent) => {
    if (onResizeStart) {
      onResizeStart(task.id, type, e.clientY);
    }
  };

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      data-dnd-card={task.id}
      style={{
        borderLeft: `3px solid ${borderColor}`,
        backgroundColor: isSelected ? 'var(--primary-bg)' : 'var(--white, #fff)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.07)',
        outline: isSelected ? '1.5px solid var(--primary)' : undefined,
        opacity: isDragging ? 0.4 : 1,
        position: 'relative',
        touchAction: 'none',
        height: '100%',
      }}
      className="rounded transition-all w-full overflow-hidden"
      onClick={(e) => {
        if (isDragging) return;
        e.stopPropagation();
        onSelect(task);
      }}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(task)}
      role="button"
      tabIndex={0}
    >
      {showResizeHandles && !isOverlay && (
        <ResizeHandle type="top" onPointerDown={handleResizePointerDown('top')} />
      )}

      {/* Inner content area — drag listeners here only (separate from resize handles) */}
      <div
        className="cursor-grab px-1.5 py-1"
        {...(isOverlay ? {} : attributes)}
        {...(isOverlay ? {} : listeners)}
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

      {showResizeHandles && !isOverlay && (
        <ResizeHandle type="bottom" onPointerDown={handleResizePointerDown('bottom')} />
      )}
    </div>
  );
}
