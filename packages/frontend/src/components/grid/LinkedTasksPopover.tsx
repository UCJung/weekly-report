import React, { useState, useMemo } from 'react';
import { useLinkedTasks, useApplyTasksToWorkItem } from '../../hooks/useWorkItems';
import { LinkedTask } from '../../api/weekly-report.api';
import Button from '../ui/Button';

interface LinkedTasksPopoverProps {
  workItemId: string;
  projectName?: string;
  weekLabel: string;
  teamId: string;
  onApplied?: () => void;
  onClose?: () => void;
}

export default function LinkedTasksPopover({
  workItemId,
  projectName,
  weekLabel,
  teamId,
  onApplied,
  onClose,
}: LinkedTasksPopoverProps) {
  const { data: linkedTasksResult, isLoading } = useLinkedTasks(workItemId, teamId);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'COMPLETED' | 'IN_PROGRESS' | 'BEFORE_START'>(
    'COMPLETED',
  );

  const applyTasksMutation = useApplyTasksToWorkItem(weekLabel);

  // 카테고리별로 작업 분류
  const tasksByCategory = useMemo(() => {
    if (!linkedTasksResult?.tasks) return { COMPLETED: [], IN_PROGRESS: [], BEFORE_START: [] };

    return {
      COMPLETED: linkedTasksResult.tasks.filter((t) => t.taskStatus.category === 'COMPLETED'),
      IN_PROGRESS: linkedTasksResult.tasks.filter((t) => t.taskStatus.category === 'IN_PROGRESS'),
      BEFORE_START: linkedTasksResult.tasks.filter((t) => t.taskStatus.category === 'BEFORE_START'),
    };
  }, [linkedTasksResult?.tasks]);

  const activeTasks = tasksByCategory[activeTab];

  const toggleTask = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  const handleApplyToDone = async () => {
    const taskIds = Array.from(selectedTaskIds);
    if (taskIds.length === 0) return;

    try {
      await applyTasksMutation.mutateAsync({
        workItemId,
        dto: {
          taskIds,
          appendMode: 'append',
          teamId,
        },
      });
      setSelectedTaskIds(new Set());
      onApplied?.();
      onClose?.();
    } catch (error) {
      console.error('Failed to apply tasks:', error);
    }
  };

  const handleApplyToPlan = async () => {
    const taskIds = Array.from(selectedTaskIds);
    if (taskIds.length === 0) return;

    try {
      await applyTasksMutation.mutateAsync({
        workItemId,
        dto: {
          taskIds,
          appendMode: 'append',
          teamId,
        },
      });
      setSelectedTaskIds(new Set());
      onApplied?.();
      onClose?.();
    } catch (error) {
      console.error('Failed to apply tasks:', error);
    }
  };

  return (
    <div
      className="bg-white rounded-lg border border-[var(--gray-border)] shadow-lg overflow-hidden"
      style={{ minWidth: '280px', maxWidth: '360px' }}
    >
      {/* 헤더 */}
      <div
        className="px-3 py-2.5 border-b border-[var(--gray-border)]"
        style={{ backgroundColor: 'var(--tbl-header)' }}
      >
        <p className="text-[12px] font-semibold text-[var(--text)]">
          연관 작업{projectName && <span className="text-[var(--text-sub)]"> ({projectName})</span>}
        </p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 px-3 pt-2 border-b border-[var(--gray-border)]">
        {(['COMPLETED', 'IN_PROGRESS', 'BEFORE_START'] as const).map((tab) => {
          const labels: Record<typeof tab, string> = {
            COMPLETED: '완료',
            IN_PROGRESS: '진행',
            BEFORE_START: '예정',
          };
          const counts = tasksByCategory[tab].length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[11px] px-2 py-1.5 border-b-2 transition ${
                activeTab === tab
                  ? 'border-[var(--primary)] text-[var(--primary)] font-semibold'
                  : 'border-transparent text-[var(--text-sub)] hover:text-[var(--text)]'
              }`}
            >
              {labels[tab]} ({counts})
            </button>
          );
        })}
      </div>

      {/* 작업 목록 또는 안내 텍스트 */}
      <div className="p-3 max-h-[320px] overflow-y-auto">
        {isLoading ? (
          <p className="text-[11px] text-[var(--text-sub)]">로딩 중...</p>
        ) : activeTasks.length === 0 ? (
          <p className="text-[11px] text-[var(--text-sub)]">이번 주 연관 작업이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {activeTasks.map((task: LinkedTask) => (
              <label
                key={task.id}
                className="flex items-start gap-2 p-1.5 rounded hover:bg-[var(--gray-light)] cursor-pointer text-[11px] group"
              >
                <input
                  type="checkbox"
                  checked={selectedTaskIds.has(task.id)}
                  onChange={() => toggleTask(task.id)}
                  className="mt-0.5 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text)] truncate font-medium">{task.title}</p>
                  {task.memo && (
                    <p className="text-[var(--text-sub)] truncate text-[10px]">{task.memo}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      {activeTasks.length > 0 && (
        <div className="flex flex-col gap-1.5 px-3 py-2.5 border-t border-[var(--gray-border)]">
          <Button
            size="small"
            variant="ghost"
            onClick={handleApplyToDone}
            disabled={selectedTaskIds.size === 0 || applyTasksMutation.isPending}
            className="text-[11px] w-full"
          >
            한일에 추가
          </Button>
          <Button
            size="small"
            variant="ghost"
            onClick={handleApplyToPlan}
            disabled={selectedTaskIds.size === 0 || applyTasksMutation.isPending}
            className="text-[11px] w-full"
          >
            할일에 추가
          </Button>
        </div>
      )}
    </div>
  );
}
