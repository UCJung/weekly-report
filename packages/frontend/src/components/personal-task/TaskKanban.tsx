import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { PersonalTask } from '../../api/personal-task.api';
import {
  useToggleDonePersonalTask,
  useUpdatePersonalTask,
  useReorderPersonalTasks,
} from '../../hooks/usePersonalTasks';
import TaskKanbanCard from './TaskKanbanCard';
import { useTaskStatuses } from '../../hooks/useTaskStatuses';
import { useTeamStore } from '../../stores/teamStore';
import { TaskStatusDef } from '../../api/team.api';

interface TaskKanbanProps {
  tasks: PersonalTask[];
  isLoading: boolean;
  selectedTaskId?: string;
  onSelectTask: (task: PersonalTask) => void;
}

// Derive header/column bg from status category
function getColumnStyle(status: TaskStatusDef): {
  headerBg: string;
  headerColor: string;
  columnBg: string;
} {
  switch (status.category) {
    case 'BEFORE_START':
      return {
        headerBg: 'var(--gray-light)',
        headerColor: 'var(--text-sub)',
        columnBg: 'var(--gray-light)',
      };
    case 'IN_PROGRESS':
      return {
        headerBg: 'var(--primary-bg)',
        headerColor: 'var(--primary)',
        columnBg: 'var(--primary-bg)',
      };
    case 'COMPLETED':
      return {
        headerBg: 'var(--ok-bg)',
        headerColor: 'var(--ok)',
        columnBg: 'var(--ok-bg)',
      };
    default:
      return {
        headerBg: 'var(--gray-light)',
        headerColor: 'var(--text-sub)',
        columnBg: 'var(--gray-light)',
      };
  }
}

// Droppable column container
function KanbanColumn({
  statusDef,
  tasks,
  selectedTaskId,
  onSelectTask,
}: {
  statusDef: TaskStatusDef;
  tasks: PersonalTask[];
  selectedTaskId?: string;
  onSelectTask: (task: PersonalTask) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${statusDef.id}` });
  const { headerBg, headerColor, columnBg } = getColumnStyle(statusDef);

  // Use status custom color if provided (as accent for count badge)
  const accentColor = statusDef.color || headerColor;

  return (
    <div
      className="flex flex-col flex-1 min-w-0 rounded-xl overflow-hidden"
      style={{
        border: '1px solid var(--gray-border)',
        minWidth: 220,
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ backgroundColor: headerBg }}
      >
        <div className="flex items-center gap-1.5">
          {/* Color dot from status definition */}
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          <span className="text-[13px] font-semibold" style={{ color: headerColor }}>
            {statusDef.name}
          </span>
        </div>
        <span
          className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: accentColor + '22', color: accentColor }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto transition-colors"
        style={{
          backgroundColor: isOver ? headerBg : columnBg,
          minHeight: 300,
        }}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskKanbanCard
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              onSelect={onSelectTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div
            className="flex-1 flex items-center justify-center text-[12px] rounded-lg border-2 border-dashed"
            style={{
              color: 'var(--gray-border)',
              borderColor: 'var(--gray-border)',
              minHeight: 80,
            }}
          >
            {isOver ? '여기에 놓기' : '없음'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TaskKanban({
  tasks,
  isLoading,
  selectedTaskId,
  onSelectTask,
}: TaskKanbanProps) {
  const { currentTeamId } = useTeamStore();
  const { data: statusDefs = [] } = useTaskStatuses(currentTeamId ?? '');

  const [activeId, setActiveId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<PersonalTask[]>([]);

  // Sync localTasks from prop when not dragging
  React.useEffect(() => {
    if (!activeId) {
      setLocalTasks(tasks);
    }
  }, [tasks, activeId]);

  const toggleMutation = useToggleDonePersonalTask();
  const updateMutation = useUpdatePersonalTask();
  const reorderMutation = useReorderPersonalTasks();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const displayTasks = activeId ? localTasks : tasks;

  const getColumnTasks = (statusId: string) =>
    displayTasks.filter((t) => t.statusId === statusId);

  const getTaskStatusId = (taskId: string): string | undefined =>
    displayTasks.find((t) => t.id === taskId)?.statusId;

  // Detect which column statusId an item is being dragged over
  const getOverStatusId = (event: DragOverEvent): string | null => {
    const overId = event.over?.id as string | undefined;
    if (!overId) return null;

    // Over a column droppable
    if (overId.startsWith('column-')) {
      return overId.replace('column-', '');
    }

    // Over another card — use that card's statusId
    const overTask = displayTasks.find((t) => t.id === overId);
    return overTask?.statusId ?? null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setLocalTasks(tasks);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const activeTaskId = event.active.id as string;
    const overStatusId = getOverStatusId(event);
    if (!overStatusId) return;

    const activeStatusId = getTaskStatusId(activeTaskId);
    if (!activeStatusId || activeStatusId === overStatusId) return;

    const newStatusDef = statusDefs.find((s) => s.id === overStatusId);
    if (!newStatusDef) return;

    // Move card to new column optimistically
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === activeTaskId
          ? { ...t, statusId: overStatusId, taskStatus: { ...newStatusDef } }
          : t,
      ),
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeTaskId);
    if (!activeTask) return;

    // Determine new statusId
    let newStatusId: string | null = null;
    if (overId.startsWith('column-')) {
      newStatusId = overId.replace('column-', '');
    } else {
      const overTask = localTasks.find((t) => t.id === overId);
      newStatusId = overTask?.statusId ?? null;
    }

    if (!newStatusId) return;

    const oldStatusId = activeTask.statusId;

    if (newStatusId !== oldStatusId) {
      const newStatusDef = statusDefs.find((s) => s.id === newStatusId);
      const oldStatusDef = statusDefs.find((s) => s.id === oldStatusId);

      // Toggle-done logic: use toggleDone if crossing COMPLETED boundary
      const isMovingToCompleted = newStatusDef?.category === 'COMPLETED';
      const isMovingFromCompleted = oldStatusDef?.category === 'COMPLETED';

      if (isMovingToCompleted && !isMovingFromCompleted) {
        toggleMutation.mutate(activeTaskId);
      } else if (isMovingFromCompleted && !isMovingToCompleted) {
        toggleMutation.mutate(activeTaskId);
      } else {
        updateMutation.mutate({
          id: activeTaskId,
          dto: { statusId: newStatusId },
        });
      }
    } else {
      // Same column: reorder
      const columnTasks = localTasks.filter((t) => t.statusId === newStatusId);
      const oldIndex = columnTasks.findIndex((t) => t.id === activeTaskId);
      const newIndex = columnTasks.findIndex((t) => t.id === overId);

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

      const reordered = arrayMove(columnTasks, oldIndex, newIndex);
      const items = reordered.map((t, idx) => ({ id: t.id, sortOrder: idx + 1 }));
      reorderMutation.mutate({ items });
    }
  };

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

  const activeTask = activeId ? displayTasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 h-full overflow-x-auto pb-2">
        {statusDefs.map((statusDef) => (
          <KanbanColumn
            key={statusDef.id}
            statusDef={statusDef}
            tasks={getColumnTasks(statusDef.id)}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
          />
        ))}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeTask ? (
          <TaskKanbanCard
            task={activeTask}
            onSelect={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
