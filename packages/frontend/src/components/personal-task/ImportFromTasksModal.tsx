import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { usePersonalTasks } from '../../hooks/usePersonalTasks';
import { personalTaskApi } from '../../api/personal-task.api';
import type { PersonalTask } from '../../api/personal-task.api';

interface ImportFromTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekLabel: string;
  teamId: string;
}

type TabType = 'done' | 'todo';

export default function ImportFromTasksModal({
  isOpen,
  onClose,
  weekLabel,
  teamId,
}: ImportFromTasksModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('done');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: doneTasks = [], isLoading: isDoneLoading } = usePersonalTasks({
    teamId,
    status: 'DONE',
  });

  const { data: inProgressTasks = [], isLoading: isInProgressLoading } = usePersonalTasks({
    teamId,
    status: 'IN_PROGRESS',
  });

  const { data: todoTasks = [], isLoading: isTodoLoading } = usePersonalTasks({
    teamId,
    status: 'TODO',
  });

  const todoAndInProgress = [...inProgressTasks, ...todoTasks];
  const isLoading = activeTab === 'done' ? isDoneLoading : isInProgressLoading || isTodoLoading;
  const currentList = activeTab === 'done' ? doneTasks : todoAndInProgress;

  const importMutation = useMutation({
    mutationFn: () =>
      personalTaskApi.importToWeeklyReport({ taskIds: selectedIds, weekLabel, teamId }),
    onSuccess: (res) => {
      const imported = res.data.data?.imported ?? selectedIds.length;
      toast.success(`${imported}개 작업이 주간업무에 반영되었습니다.`);
      queryClient.invalidateQueries({ queryKey: ['weekly-report'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-reports'] });
      handleClose();
    },
    onError: () => {
      toast.error('가져오기에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handleClose = () => {
    setSelectedIds([]);
    setActiveTab('done');
    onClose();
  };

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === currentList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentList.map((t) => t.id));
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedIds([]);
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return null;
    const d = new Date(dueDate);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const isOverdue = (task: PersonalTask) => {
    if (!task.dueDate || task.status === 'DONE') return false;
    return new Date(task.dueDate) < new Date();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="내 작업에서 가져오기"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={selectedIds.length === 0 || importMutation.isPending}
          >
            {importMutation.isPending ? '가져오는 중...' : `가져오기 (${selectedIds.length})`}
          </Button>
        </>
      }
    >
      {/* 탭 */}
      <div
        className="flex rounded-md overflow-hidden mb-3"
        style={{ border: '1px solid var(--gray-border)' }}
      >
        <button
          onClick={() => handleTabChange('done')}
          className="flex-1 py-2 text-[12px] font-medium transition-colors"
          style={{
            backgroundColor: activeTab === 'done' ? 'var(--primary)' : 'white',
            color: activeTab === 'done' ? 'white' : 'var(--text-sub)',
          }}
        >
          한일 (완료)
        </button>
        <button
          onClick={() => handleTabChange('todo')}
          className="flex-1 py-2 text-[12px] font-medium transition-colors"
          style={{
            backgroundColor: activeTab === 'todo' ? 'var(--primary)' : 'white',
            color: activeTab === 'todo' ? 'white' : 'var(--text-sub)',
            borderLeft: '1px solid var(--gray-border)',
          }}
        >
          할일 (진행중/할일)
        </button>
      </div>

      {/* 목록 헤더 */}
      {currentList.length > 0 && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px]" style={{ color: 'var(--text-sub)' }}>
            {selectedIds.length > 0
              ? `${selectedIds.length}개 선택됨`
              : `${currentList.length}개 작업`}
          </span>
          <button
            className="text-[11px] hover:underline"
            style={{ color: 'var(--primary)' }}
            onClick={toggleAll}
          >
            {selectedIds.length === currentList.length ? '전체 해제' : '전체 선택'}
          </button>
        </div>
      )}

      {/* 목록 */}
      {isLoading ? (
        <div
          className="py-8 text-center text-[13px]"
          style={{ color: 'var(--text-sub)' }}
        >
          로딩 중...
        </div>
      ) : currentList.length === 0 ? (
        <div
          className="py-8 text-center text-[13px]"
          style={{ color: 'var(--text-sub)' }}
        >
          {activeTab === 'done' ? '완료된 작업이 없습니다.' : '진행중/할일 작업이 없습니다.'}
        </div>
      ) : (
        <div
          className="flex flex-col max-h-[340px] overflow-y-auto rounded-md overflow-hidden"
          style={{ border: '1px solid var(--gray-border)' }}
        >
          {currentList.map((task, idx) => {
            const checked = selectedIds.includes(task.id);
            const overdue = isOverdue(task);
            const dueDateStr = formatDueDate(task.dueDate);

            return (
              <label
                key={task.id}
                className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-colors"
                style={{
                  backgroundColor: checked ? 'var(--primary-bg)' : idx % 2 === 0 ? 'white' : 'var(--row-alt)',
                  borderBottom: '1px solid var(--gray-border)',
                }}
                onMouseEnter={(e) => {
                  if (!checked) {
                    (e.currentTarget as HTMLLabelElement).style.backgroundColor = 'var(--primary-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!checked) {
                    (e.currentTarget as HTMLLabelElement).style.backgroundColor =
                      idx % 2 === 0 ? 'white' : 'var(--row-alt)';
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleItem(task.id)}
                  className="mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[12.5px] truncate"
                    style={{
                      color: task.status === 'DONE' ? 'var(--text-sub)' : 'var(--text)',
                      textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {task.project && (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: 'var(--primary-bg)',
                          color: 'var(--primary)',
                          border: '1px solid var(--primary)',
                        }}
                      >
                        {task.project.name}
                      </span>
                    )}
                    {dueDateStr && (
                      <span
                        className="text-[10px]"
                        style={{ color: overdue ? 'var(--danger)' : 'var(--text-sub)' }}
                      >
                        {overdue ? '⚠ ' : ''}{dueDateStr}
                      </span>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {currentList.length > 0 && (
        <p className="text-[11px] mt-2" style={{ color: 'var(--text-sub)' }}>
          선택한 작업의 제목이 이번 주 주간업무의 한일(또는 할일) 항목으로 추가됩니다.
        </p>
      )}
    </Modal>
  );
}
