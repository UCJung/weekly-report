import React, { useState } from 'react';
import { useUiStore } from '../stores/uiStore';
import { useGridStore } from '../stores/gridStore';
import {
  useMyWeeklyReport,
  useCreateWeeklyReport,
  useSubmitWeeklyReport,
  useCarryForward,
} from '../hooks/useWeeklyReport';
import { useAddWorkItem, useUpdateWorkItem, useDeleteWorkItem } from '../hooks/useWorkItems';
import { useMyWeeklyReport as usePrevWeeklyReport } from '../hooks/useWeeklyReport';
import EditableGrid from '../components/grid/EditableGrid';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/Modal';
import { WorkItem } from '../api/weekly-report.api';

function getWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function addWeeks(weekLabel: string, n: number): string {
  const match = weekLabel.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return weekLabel;
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(Date.UTC(year, 0, 4 - jan4Day + 1));
  const monday = new Date(week1Monday.getTime() + (week - 1 + n) * 7 * 86400000);
  return getWeekLabel(monday);
}

function formatWeekDisplay(weekLabel: string): string {
  const match = weekLabel.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return weekLabel;
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(Date.UTC(year, 0, 4 - jan4Day + 1));
  const start = new Date(week1Monday.getTime() + (week - 1) * 7 * 86400000);
  const end = new Date(start.getTime() + 4 * 86400000);
  const fmt = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  return `${year}년 ${week}주차 (${fmt(start)} ~ ${fmt(end)})`;
}

export default function MyWeeklyReport() {
  const [currentWeek, setCurrentWeek] = useState(() => getWeekLabel(new Date()));
  const [carryForwardOpen, setCarryForwardOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [selectedPrevIds, setSelectedPrevIds] = useState<string[]>([]);
  const { addToast } = useUiStore();
  const { isSaving } = useGridStore();

  const prevWeek = addWeeks(currentWeek, -1);

  const { data: report, isLoading } = useMyWeeklyReport(currentWeek);
  const { data: prevReport } = usePrevWeeklyReport(prevWeek);
  const createMutation = useCreateWeeklyReport(currentWeek);
  const submitMutation = useSubmitWeeklyReport(currentWeek);
  const carryMutation = useCarryForward(currentWeek);
  const addItemMutation = useAddWorkItem(currentWeek, report?.id ?? '');
  const updateItemMutation = useUpdateWorkItem(currentWeek);
  const deleteItemMutation = useDeleteWorkItem(currentWeek);

  const isSubmitted = report?.status === 'SUBMITTED';
  const workItems = report?.workItems ?? [];

  const handleCreateReport = async () => {
    try {
      await createMutation.mutateAsync(currentWeek);
      addToast('success', '주간업무가 생성되었습니다.');
    } catch {
      addToast('danger', '주간업무 생성에 실패했습니다.');
    }
  };

  const handleAddItem = async () => {
    if (!report) await handleCreateReport();
    try {
      await addItemMutation.mutateAsync({
        projectId: '',
        doneWork: '',
        planWork: '',
        remarks: '',
      });
    } catch {
      addToast('danger', '행 추가에 실패했습니다.');
    }
  };

  const handleUpdateItem = (
    id: string,
    data: Partial<Pick<WorkItem, 'projectId' | 'doneWork' | 'planWork' | 'remarks'>>,
  ) => {
    updateItemMutation.mutate(
      { id, data },
      {
        onError: () => addToast('danger', '저장에 실패했습니다. 다시 시도해주세요.'),
      },
    );
  };

  const handleDeleteItem = (id: string) => {
    deleteItemMutation.mutate(id, {
      onError: () => addToast('danger', '삭제에 실패했습니다.'),
    });
  };

  const handleSubmit = async () => {
    if (!report) return;
    try {
      await submitMutation.mutateAsync({ id: report.id, status: 'SUBMITTED' });
      addToast('success', '주간업무를 제출했습니다.');
      setSubmitConfirmOpen(false);
    } catch {
      addToast('danger', '제출에 실패했습니다.');
    }
  };

  const handleRevertToDraft = async () => {
    if (!report) return;
    try {
      await submitMutation.mutateAsync({ id: report.id, status: 'DRAFT' });
      addToast('info', '임시저장 상태로 변경되었습니다.');
    } catch {
      addToast('danger', '상태 변경에 실패했습니다.');
    }
  };

  const handleCarryForward = async () => {
    try {
      const result = await carryMutation.mutateAsync({
        targetWeek: currentWeek,
        sourceWorkItemIds: selectedPrevIds.length > 0 ? selectedPrevIds : undefined,
      });
      addToast('success', result.message);
      setCarryForwardOpen(false);
      setSelectedPrevIds([]);
    } catch {
      addToast('danger', '전주 불러오기에 실패했습니다.');
    }
  };

  const prevWorkItems = prevReport?.workItems?.filter((item) => item.planWork.trim()) ?? [];

  const togglePrevItem = (id: string) => {
    setSelectedPrevIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div>
      {/* 통합 툴바: 주차 선택 + 상태 + 액션 버튼 */}
      <div
        className="bg-white rounded-lg border border-[var(--gray-border)] flex items-center gap-3 mb-4"
        style={{ padding: '10px 16px' }}
      >
        {/* 주차 탐색 */}
        <button
          onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
          className="text-[var(--text-sub)] hover:text-[var(--text)] text-[18px] leading-none"
        >
          ◀
        </button>
        <div className="flex-1 text-center">
          <span className="text-[14px] font-semibold text-[var(--text)]">
            {formatWeekDisplay(currentWeek)}
          </span>
        </div>
        <button
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          className="text-[var(--text-sub)] hover:text-[var(--text)] text-[18px] leading-none"
        >
          ▶
        </button>

        {/* 구분선 */}
        <div className="w-px h-5 bg-[var(--gray-border)]" />

        {/* 제출 상태 Badge */}
        <div className="flex items-center gap-2">
          {report ? (
            <Badge variant={isSubmitted ? 'ok' : 'warn'} dot>
              {isSubmitted ? '제출 완료' : '임시저장'}
            </Badge>
          ) : (
            <Badge variant="gray">미생성</Badge>
          )}
          {isSaving && <span className="text-[11px] text-[var(--text-sub)]">저장 중...</span>}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 ml-auto">
          {!report && (
            <Button variant="outline" onClick={handleCreateReport} disabled={createMutation.isPending}>
              주간업무 생성
            </Button>
          )}
          {report && !isSubmitted && (
            <>
              <Button variant="outline" onClick={() => setCarryForwardOpen(true)}>
                전주 할일 불러오기
              </Button>
              <Button variant="outline" onClick={() => addToast('info', '임시저장되었습니다.')}>
                임시저장
              </Button>
              <Button onClick={() => setSubmitConfirmOpen(true)}>제출</Button>
            </>
          )}
          {isSubmitted && (
            <Button variant="outline" onClick={handleRevertToDraft}>
              재편집
            </Button>
          )}
        </div>
      </div>

      {/* 그리드 */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-[var(--gray-border)] p-10 text-center text-[var(--text-sub)]">
          로딩 중...
        </div>
      ) : !report ? (
        <div className="bg-white rounded-lg border border-[var(--gray-border)] p-10 text-center">
          <p className="text-[var(--text-sub)] text-[13px] mb-3">이 주차의 주간업무가 없습니다.</p>
          <Button onClick={handleCreateReport}>주간업무 시작하기</Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[var(--gray-border)] p-4">
          <EditableGrid
            workItems={workItems}
            disabled={isSubmitted}
            onUpdateItem={handleUpdateItem}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
          />
        </div>
      )}

      {/* 전주 할일 불러오기 모달 */}
      <Modal
        open={carryForwardOpen}
        onClose={() => setCarryForwardOpen(false)}
        title="전주 예정업무 불러오기"
        footer={
          <>
            <Button variant="outline" onClick={() => setCarryForwardOpen(false)}>건너뛰기</Button>
            <Button onClick={handleCarryForward} disabled={carryMutation.isPending}>
              {carryMutation.isPending ? '불러오는 중...' : '불러오기'}
            </Button>
          </>
        }
      >
        {prevWorkItems.length === 0 ? (
          <p className="text-[13px] text-[var(--text-sub)]">
            전주({formatWeekDisplay(prevWeek)})의 예정업무가 없습니다.
          </p>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] text-[var(--text-sub)]">
                전주 예정업무를 선택하면 이번주 진행업무로 불러옵니다.
              </p>
              <div className="flex gap-2">
                <button
                  className="text-[11px] text-[var(--primary)] hover:underline"
                  onClick={() => setSelectedPrevIds(prevWorkItems.map((i) => i.id))}
                >
                  전체 선택
                </button>
                <button
                  className="text-[11px] text-[var(--text-sub)] hover:underline"
                  onClick={() => setSelectedPrevIds([])}
                >
                  전체 해제
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
              {prevWorkItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-2 p-2.5 rounded border border-[var(--gray-border)] cursor-pointer hover:bg-[var(--primary-bg)] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedPrevIds.includes(item.id)}
                    onChange={() => togglePrevItem(item.id)}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <p className="text-[11px] font-medium text-[var(--primary)]">
                      {item.project?.name ?? '(프로젝트 없음)'}
                    </p>
                    <p className="text-[11px] text-[var(--text)] mt-0.5 line-clamp-2">
                      {item.planWork}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* 제출 확인 */}
      <ConfirmModal
        open={submitConfirmOpen}
        onClose={() => setSubmitConfirmOpen(false)}
        onConfirm={handleSubmit}
        title="주간업무 제출"
        message="주간업무를 제출하시겠습니까? 빈 항목은 자동으로 제거되며, 제출 후에는 재편집 버튼으로만 수정할 수 있습니다."
        confirmLabel="제출"
      />
    </div>
  );
}
