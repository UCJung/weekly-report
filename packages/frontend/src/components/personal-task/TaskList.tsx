import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PersonalTask } from '../../api/personal-task.api';
import { useReorderPersonalTasks, useToggleDonePersonalTask } from '../../hooks/usePersonalTasks';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: PersonalTask[];
  isLoading: boolean;
  selectedTaskId?: string;
  onSelectTask: (task: PersonalTask) => void;
}

export default function TaskList({ tasks, isLoading, selectedTaskId, onSelectTask }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const reorderMutation = useReorderPersonalTasks();
  const toggleMutation = useToggleDonePersonalTask();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeTasks = tasks.filter((t) => t.taskStatus.category !== 'COMPLETED');
  const doneTasks = tasks.filter((t) => t.taskStatus.category === 'COMPLETED');

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activeTasks.findIndex((t) => t.id === active.id);
    const newIndex = activeTasks.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(activeTasks, oldIndex, newIndex);
    const items = reordered.map((t, idx) => ({ id: t.id, sortOrder: idx + 1 }));
    reorderMutation.mutate({ items });
  };

  const handleToggleDone = (id: string) => {
    toggleMutation.mutate(id);
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

  if (tasks.length === 0) {
    return (
      <div
        className="rounded-lg border px-4 py-12 text-center"
        style={{
          borderColor: 'var(--gray-border)',
          backgroundColor: 'var(--white)',
        }}
      >
        <p className="text-[14px]" style={{ color: 'var(--text-sub)' }}>
          등록된 작업이 없습니다
        </p>
        <p className="text-[12px] mt-1" style={{ color: 'var(--gray-border)' }}>
          위 입력란에 작업을 추가해 보세요
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: 'var(--gray-border)',
        backgroundColor: 'var(--white)',
      }}
    >
      {/* Active tasks with DnD */}
      {activeTasks.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {activeTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isSelected={selectedTaskId === task.id}
                onSelect={onSelectTask}
                onToggleDone={handleToggleDone}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        <div
          className="px-4 py-8 text-center text-[13px]"
          style={{ color: 'var(--text-sub)' }}
        >
          미완료 작업이 없습니다
        </div>
      )}

      {/* Completed tasks group */}
      {doneTasks.length > 0 && (
        <div style={{ borderTop: '1px solid var(--gray-border)' }}>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-[var(--gray-light)]"
            style={{ color: 'var(--text-sub)' }}
          >
            <span>완료된 작업 {doneTasks.length}건</span>
            {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showCompleted && doneTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              onSelect={onSelectTask}
              onToggleDone={handleToggleDone}
            />
          ))}
        </div>
      )}
    </div>
  );
}
