import React, { useState } from 'react';
import { CheckSquare } from 'lucide-react';
import { useTeamStore } from '../stores/teamStore';
import { usePersonalTasks } from '../hooks/usePersonalTasks';
import { PersonalTask } from '../api/personal-task.api';
import { TaskFilters } from '../components/personal-task/TaskFilterBar';
import TaskQuickInput from '../components/personal-task/TaskQuickInput';
import TaskFilterBar from '../components/personal-task/TaskFilterBar';
import TaskList from '../components/personal-task/TaskList';
import TaskDetailPanel from '../components/personal-task/TaskDetailPanel';
import ViewModeToggle, { ViewMode } from '../components/personal-task/ViewModeToggle';
import TaskKanban from '../components/personal-task/TaskKanban';
import TaskWeeklyView from '../components/personal-task/TaskWeeklyView';

export default function MyTasks() {
  const { currentTeamId } = useTeamStore();
  const [selectedTask, setSelectedTask] = useState<PersonalTask | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filters, setFilters] = useState<TaskFilters>({
    statusId: 'ALL',
    sortBy: 'dueDate',
  });
  const [clickedScheduledDate, setClickedScheduledDate] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = usePersonalTasks({
    teamId: currentTeamId ?? '',
    statusId: filters.statusId === 'ALL' ? undefined : filters.statusId,
    period: filters.period,
    projectId: filters.projectId,
    priority: filters.priority,
    q: filters.q,
    sortBy: filters.sortBy,
  });

  const handleSelectTask = (task: PersonalTask) => {
    setSelectedTask((prev) => (prev?.id === task.id ? null : task));
  };

  const handleClosePanel = () => {
    setSelectedTask(null);
  };

  const handleFiltersChange = (newFilters: TaskFilters) => {
    setFilters(newFilters);
    // Close panel if filter changes
    setSelectedTask(null);
  };

  const handleClickEmptyDate = (date: Date, hour?: number) => {
    // Convert to local ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:00)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    if (hour !== undefined) {
      const hh = String(hour).padStart(2, '0');
      setClickedScheduledDate(`${year}-${month}-${day}T${hh}:00`);
    } else {
      setClickedScheduledDate(`${year}-${month}-${day}`);
    }
  };

  const handleQuickInputDone = () => {
    setClickedScheduledDate(null);
  };

  // Count tasks that are not in COMPLETED category
  const incompleteTasks = tasks.filter((t) => t.taskStatus.category !== 'COMPLETED');
  const totalCount = tasks.length;

  if (!currentTeamId) {
    return (
      <div
        className="flex items-center justify-center h-48 text-[14px]"
        style={{ color: 'var(--text-sub)' }}
      >
        팀을 먼저 선택해 주세요.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CheckSquare size={20} style={{ color: 'var(--primary)' }} />
          <h1 className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>
            내 작업
          </h1>
          {totalCount > 0 && (
            <span
              className="text-[12px] px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--primary-bg)',
                color: 'var(--primary)',
                fontWeight: 600,
              }}
            >
              {incompleteTasks.length}건 진행 중
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          <p className="text-[12.5px] hidden sm:block" style={{ color: 'var(--text-sub)' }}>
            개인 작업을 등록하고 관리하세요
          </p>
        </div>
      </div>

      {/* Quick input */}
      <TaskQuickInput
        defaultScheduledDate={clickedScheduledDate ?? undefined}
        onDone={handleQuickInputDone}
      />

      {/* Filter bar */}
      <TaskFilterBar filters={filters} onChange={handleFiltersChange} />

      {/* Task view (conditional by viewMode) */}
      <div className="flex-1 min-h-0">
        {viewMode === 'kanban' && (
          <TaskKanban
            tasks={tasks}
            isLoading={isLoading}
            selectedTaskId={selectedTask?.id}
            onSelectTask={handleSelectTask}
          />
        )}
        {viewMode === 'list' && (
          <TaskList
            tasks={tasks}
            isLoading={isLoading}
            selectedTaskId={selectedTask?.id}
            onSelectTask={handleSelectTask}
          />
        )}
        {viewMode === 'weekly' && (
          <TaskWeeklyView
            tasks={tasks}
            isLoading={isLoading}
            selectedTaskId={selectedTask?.id}
            onSelectTask={handleSelectTask}
            onClickEmptyDate={handleClickEmptyDate}
          />
        )}
      </div>

      {/* Detail panel */}
      {selectedTask && (
        <TaskDetailPanel
          key={selectedTask.id}
          task={selectedTask}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
}
