import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trash2, Calendar, Tag, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { PersonalTask, TaskPriority } from '../../api/personal-task.api';
import {
  useUpdatePersonalTask,
  useDeletePersonalTask,
} from '../../hooks/usePersonalTasks';
import { useTeamProjects } from '../../hooks/useProjects';
import { useTeamStore } from '../../stores/teamStore';
import { useTaskStatuses } from '../../hooks/useTaskStatuses';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import {
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_VARIANT,
} from '../../constants/labels';

/**
 * ISO 문자열 또는 날짜 문자열에서 date/time 파트를 분리한다.
 * - 시간이 00:00(자정)인 경우 "시간 없음(종일)"으로 취급하여 time을 빈 문자열로 반환한다.
 */
function parseDatetime(isoStr?: string | null): { date: string; time: string } {
  if (!isoStr) return { date: '', time: '' };
  const d = new Date(isoStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
  return { date: `${yyyy}-${mm}-${dd}`, time: hasTime ? `${hh}:${min}` : '' };
}

/**
 * 날짜 문자열과 시간 문자열을 조합하여 API 전달 값을 생성한다.
 * - dateStr 없으면 null 반환 (날짜 삭제)
 * - timeStr 없으면 날짜만 반환 (종일)
 * - 둘 다 있으면 ISO datetime 반환
 */
function combineDatetime(dateStr: string, timeStr: string): string | null {
  if (!dateStr) return null;
  if (!timeStr) return dateStr;
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

interface TaskDetailPanelProps {
  task: PersonalTask;
  onClose: () => void;
}

const REPEAT_TYPE_LABEL: Record<string, string> = {
  DAILY: '매일',
  WEEKLY: '주간',
  MONTHLY: '월간',
};

export default function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  const { currentTeamId } = useTeamStore();
  const { data: teamProjects } = useTeamProjects(currentTeamId ?? '');
  const { data: statusDefs = [] } = useTaskStatuses(currentTeamId ?? '');
  const updateMutation = useUpdatePersonalTask();
  const deleteMutation = useDeletePersonalTask();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);
  const [memoValue, setMemoValue] = useState(task.memo ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [elapsedHours, setElapsedHours] = useState<number>(() =>
    task.elapsedMinutes != null ? Math.floor(task.elapsedMinutes / 60) : 0,
  );
  const [elapsedMins, setElapsedMins] = useState<number>(() =>
    task.elapsedMinutes != null ? task.elapsedMinutes % 60 : 0,
  );

  // date/time split state for dueDate
  const [dueDateStr, setDueDateStr] = useState<string>(() => parseDatetime(task.dueDate).date);
  const [dueTimeStr, setDueTimeStr] = useState<string>(() => parseDatetime(task.dueDate).time);

  // date/time split state for scheduledDate
  const [scheduledDateStr, setScheduledDateStr] = useState<string>(
    () => parseDatetime(task.scheduledDate).date,
  );
  const [scheduledTimeStr, setScheduledTimeStr] = useState<string>(
    () => parseDatetime(task.scheduledDate).time,
  );

  const titleRef = useRef<HTMLInputElement>(null);
  const memoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with task changes
  useEffect(() => {
    setTitleValue(task.title);
    setMemoValue(task.memo ?? '');
    setIsEditingTitle(false);
    setConfirmDelete(false);
    setElapsedHours(task.elapsedMinutes != null ? Math.floor(task.elapsedMinutes / 60) : 0);
    setElapsedMins(task.elapsedMinutes != null ? task.elapsedMinutes % 60 : 0);
    const due = parseDatetime(task.dueDate);
    setDueDateStr(due.date);
    setDueTimeStr(due.time);
    const sched = parseDatetime(task.scheduledDate);
    setScheduledDateStr(sched.date);
    setScheduledTimeStr(sched.time);
  }, [task.id, task.elapsedMinutes, task.dueDate, task.scheduledDate]);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isEditingTitle]);

  const handleSaveTitle = useCallback(() => {
    const trimmed = titleValue.trim();
    if (!trimmed || trimmed === task.title) {
      setTitleValue(task.title);
      setIsEditingTitle(false);
      return;
    }
    updateMutation.mutate({ id: task.id, dto: { title: trimmed } });
    setIsEditingTitle(false);
  }, [titleValue, task.id, task.title]);

  const handleMemoChange = (value: string) => {
    setMemoValue(value);
    if (memoDebounceRef.current) clearTimeout(memoDebounceRef.current);
    memoDebounceRef.current = setTimeout(() => {
      updateMutation.mutate({ id: task.id, dto: { memo: value } });
    }, 500);
  };

  const handleElapsedSave = () => {
    const totalMinutes = elapsedHours * 60 + elapsedMins;
    updateMutation.mutate({ id: task.id, dto: { elapsedMinutes: totalMinutes } });
  };

  const formatStartedAt = (isoString: string) => {
    const d = new Date(isoString);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await deleteMutation.mutateAsync(task.id);
      toast.success('작업이 삭제되었습니다');
      onClose();
    } catch {
      toast.error('삭제에 실패했습니다');
    }
  };

  const selectStyle: React.CSSProperties = {
    fontSize: '12.5px',
    color: 'var(--text)',
    backgroundColor: 'var(--gray-light)',
    border: '1px solid var(--gray-border)',
    borderRadius: '5px',
    padding: '5px 8px',
    outline: 'none',
    width: '100%',
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-sub)',
    marginBottom: '4px',
    display: 'block',
  };

  const isCompleted = task.taskStatus.category === 'COMPLETED';
  const isInProgress = task.taskStatus.category === 'IN_PROGRESS';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full z-40 flex flex-col overflow-hidden"
        style={{
          width: '400px',
          backgroundColor: 'var(--white)',
          borderLeft: '1px solid var(--gray-border)',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--gray-border)' }}
        >
          <div className="flex items-center gap-2">
            <Badge variant={TASK_PRIORITY_VARIANT[task.priority]}>
              {TASK_PRIORITY_LABEL[task.priority]}
            </Badge>
            {/* Status indicator with dynamic color */}
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: task.taskStatus.color + '22',
                color: task.taskStatus.color,
              }}
            >
              {task.taskStatus.name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded transition-colors hover:bg-[var(--gray-light)]"
            style={{ color: 'var(--text-sub)' }}
            aria-label="패널 닫기"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Title */}
          <div>
            {isEditingTitle ? (
              <input
                ref={titleRef}
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setTitleValue(task.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="w-full text-[16px] font-semibold bg-transparent border-b-2 outline-none py-1"
                style={{
                  color: 'var(--text)',
                  borderColor: 'var(--primary)',
                }}
              />
            ) : (
              <h2
                className="text-[16px] font-semibold cursor-text py-1 border-b-2 border-transparent hover:border-[var(--gray-border)]"
                style={{ color: 'var(--text)' }}
                onClick={() => setIsEditingTitle(true)}
              >
                {task.title}
              </h2>
            )}
          </div>

          {/* Status — dynamic select from team TaskStatusDef */}
          <div>
            <label style={labelStyle}>상태</label>
            <select
              value={task.statusId}
              onChange={(e) =>
                updateMutation.mutate({ id: task.id, dto: { statusId: e.target.value } })
              }
              style={selectStyle}
            >
              {statusDefs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label style={labelStyle}>우선순위</label>
            <select
              value={task.priority}
              onChange={(e) =>
                updateMutation.mutate({
                  id: task.id,
                  dto: { priority: e.target.value as TaskPriority },
                })
              }
              style={selectStyle}
            >
              <option value="HIGH">높음</option>
              <option value="MEDIUM">보통</option>
              <option value="LOW">낮음</option>
            </select>
          </div>

          {/* Project */}
          <div>
            <label style={labelStyle}>
              <Tag size={11} className="inline mr-1" />
              프로젝트
            </label>
            <select
              value={task.projectId ?? ''}
              onChange={(e) =>
                updateMutation.mutate({
                  id: task.id,
                  dto: { projectId: e.target.value || null },
                })
              }
              style={selectStyle}
            >
              <option value="">프로젝트 없음</option>
              {teamProjects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div>
            <label style={labelStyle}>
              <Calendar size={11} className="inline mr-1" />
              마감일
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dueDateStr}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setDueDateStr(newDate);
                  // 날짜 지우기 → null 전달
                  updateMutation.mutate({
                    id: task.id,
                    dto: { dueDate: combineDatetime(newDate, dueTimeStr) },
                  });
                }}
                style={{ ...selectStyle, fontSize: '12.5px', flex: '1' }}
              />
              <input
                type="time"
                step="1800"
                value={dueTimeStr}
                onChange={(e) => {
                  const newTime = e.target.value;
                  setDueTimeStr(newTime);
                  if (dueDateStr) {
                    updateMutation.mutate({
                      id: task.id,
                      dto: { dueDate: combineDatetime(dueDateStr, newTime) },
                    });
                  }
                }}
                disabled={!dueDateStr}
                style={{
                  ...selectStyle,
                  fontSize: '12.5px',
                  width: '100px',
                  flex: 'none',
                  opacity: dueDateStr ? 1 : 0.4,
                  cursor: dueDateStr ? 'pointer' : 'not-allowed',
                }}
              />
              {dueTimeStr && (
                <button
                  title="시간 지우기"
                  onClick={() => {
                    setDueTimeStr('');
                    if (dueDateStr) {
                      updateMutation.mutate({
                        id: task.id,
                        dto: { dueDate: dueDateStr },
                      });
                    }
                  }}
                  style={{
                    color: 'var(--text-sub)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Scheduled date */}
          <div>
            <label style={labelStyle}>
              <Calendar size={11} className="inline mr-1" />
              예정일
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={scheduledDateStr}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setScheduledDateStr(newDate);
                  updateMutation.mutate({
                    id: task.id,
                    dto: { scheduledDate: combineDatetime(newDate, scheduledTimeStr) },
                  });
                }}
                style={{ ...selectStyle, fontSize: '12.5px', flex: '1' }}
              />
              <input
                type="time"
                step="1800"
                value={scheduledTimeStr}
                onChange={(e) => {
                  const newTime = e.target.value;
                  setScheduledTimeStr(newTime);
                  if (scheduledDateStr) {
                    updateMutation.mutate({
                      id: task.id,
                      dto: { scheduledDate: combineDatetime(scheduledDateStr, newTime) },
                    });
                  }
                }}
                disabled={!scheduledDateStr}
                style={{
                  ...selectStyle,
                  fontSize: '12.5px',
                  width: '100px',
                  flex: 'none',
                  opacity: scheduledDateStr ? 1 : 0.4,
                  cursor: scheduledDateStr ? 'pointer' : 'not-allowed',
                }}
              />
              {scheduledTimeStr && (
                <button
                  title="시간 지우기"
                  onClick={() => {
                    setScheduledTimeStr('');
                    if (scheduledDateStr) {
                      updateMutation.mutate({
                        id: task.id,
                        dto: { scheduledDate: scheduledDateStr },
                      });
                    }
                  }}
                  style={{
                    color: 'var(--text-sub)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* 소요시간 — shown for IN_PROGRESS and COMPLETED */}
          {!!(isCompleted || isInProgress) && (
            <div>
              <label style={labelStyle}>
                <Clock size={11} className="inline mr-1" />
                소요시간
              </label>
              {isCompleted ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={elapsedHours}
                    onChange={(e) => setElapsedHours(Math.max(0, Number(e.target.value)))}
                    onBlur={handleElapsedSave}
                    className="w-16 text-center rounded border outline-none"
                    style={{
                      fontSize: '12.5px',
                      padding: '5px 6px',
                      color: 'var(--text)',
                      backgroundColor: 'var(--gray-light)',
                      borderColor: 'var(--gray-border)',
                    }}
                  />
                  <span className="text-[12.5px]" style={{ color: 'var(--text-sub)' }}>시간</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={elapsedMins}
                    onChange={(e) => setElapsedMins(Math.min(59, Math.max(0, Number(e.target.value))))}
                    onBlur={handleElapsedSave}
                    className="w-16 text-center rounded border outline-none"
                    style={{
                      fontSize: '12.5px',
                      padding: '5px 6px',
                      color: 'var(--text)',
                      backgroundColor: 'var(--gray-light)',
                      borderColor: 'var(--gray-border)',
                    }}
                  />
                  <span className="text-[12.5px]" style={{ color: 'var(--text-sub)' }}>분</span>
                </div>
              ) : isInProgress && task.startedAt ? (
                <div className="text-[12.5px]" style={{ color: 'var(--text-sub)' }}>
                  진행 중 (시작: {formatStartedAt(task.startedAt)})
                </div>
              ) : (
                <div className="text-[12.5px]" style={{ color: 'var(--text-sub)' }}>—</div>
              )}
            </div>
          )}

          {/* Repeat config display */}
          {task.repeatConfig && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-md text-[12.5px]"
              style={{
                backgroundColor: 'var(--primary-bg)',
                color: 'var(--primary)',
              }}
            >
              <span>반복: {REPEAT_TYPE_LABEL[task.repeatConfig.type] ?? task.repeatConfig.type}</span>
            </div>
          )}

          {/* Linked week label */}
          {task.linkedWeekLabel && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-md text-[12px]"
              style={{
                backgroundColor: 'var(--ok-bg)',
                color: 'var(--ok)',
              }}
            >
              <AlertCircle size={12} />
              <span>주간업무 {task.linkedWeekLabel}에 반영됨</span>
            </div>
          )}

          {/* Memo */}
          <div className="flex-1">
            <label style={labelStyle}>메모</label>
            <textarea
              value={memoValue}
              onChange={(e) => handleMemoChange(e.target.value)}
              placeholder="메모를 입력하세요..."
              rows={6}
              className="w-full text-[13px] resize-none rounded-md border p-3 outline-none transition-colors focus:border-[var(--primary)]"
              style={{
                color: 'var(--text)',
                backgroundColor: 'var(--gray-light)',
                borderColor: 'var(--gray-border)',
              }}
            />
          </div>

          {/* Timestamps */}
          <div className="text-[11px]" style={{ color: 'var(--text-sub)' }}>
            <span>등록: {new Date(task.createdAt).toLocaleDateString('ko-KR')}</span>
            {task.completedAt && (
              <span className="ml-3">
                완료: {new Date(task.completedAt).toLocaleDateString('ko-KR')}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 border-t flex-shrink-0"
          style={{ borderColor: 'var(--gray-border)' }}
        >
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] flex-1" style={{ color: 'var(--danger)' }}>
                정말 삭제하시겠습니까?
              </span>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                삭제
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                취소
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost-danger"
              size="sm"
              icon={<Trash2 size={13} />}
              onClick={handleDelete}
            >
              작업 삭제
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
