import React, { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partApi, SummaryWorkItem } from '../api/part.api';
import GridCell from '../components/grid/GridCell';
import ProjectDropdown from '../components/grid/ProjectDropdown';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/Modal';
import { Project } from '../api/project.api';
import { useGridStore } from '../stores/gridStore';

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

type EditingCell = { rowId: string; column: 'doneWork' | 'planWork' | 'remarks' } | null;

export default function PartSummary() {
  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const { markDirty } = useGridStore();
  const queryClient = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(() => getWeekLabel(new Date()));
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [projectDropdownRow, setProjectDropdownRow] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [autoMergeConfirmOpen, setAutoMergeConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  const partId = user?.partId ?? '';

  const { data: summary, isLoading } = useQuery({
    queryKey: ['part-summary', partId, currentWeek],
    queryFn: () => partApi.getPartSummary(partId, currentWeek).then((r) => r.data.data),
    enabled: !!partId && !!currentWeek,
  });

  const createMutation = useMutation({
    mutationFn: () => partApi.createPartSummary({ partId, weekLabel: currentWeek }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['part-summary', partId, currentWeek] });
    },
    onError: () => addToast('danger', '취합보고 생성에 실패했습니다.'),
  });

  const autoMergeMutation = useMutation({
    mutationFn: (summaryId: string) => partApi.autoMerge(summaryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['part-summary', partId, currentWeek] });
      addToast('success', '자동 취합이 완료되었습니다.');
      setAutoMergeConfirmOpen(false);
    },
    onError: () => addToast('danger', '자동 취합에 실패했습니다.'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { status: 'DRAFT' | 'SUBMITTED' }) =>
      partApi.updatePartSummary(summary!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['part-summary', partId, currentWeek] });
    },
    onError: () => addToast('danger', '저장에 실패했습니다.'),
  });

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync();
      addToast('success', '파트 취합보고를 생성했습니다.');
    } catch {
      // error handled in mutation
    }
  };

  const handleAutoMerge = async () => {
    if (!summary) {
      try {
        const result = await createMutation.mutateAsync();
        await autoMergeMutation.mutateAsync(result.data.data.id);
      } catch {
        // errors handled in mutations
      }
    } else if (summary.summaryWorkItems.length > 0) {
      setAutoMergeConfirmOpen(true);
    } else {
      autoMergeMutation.mutate(summary.id);
    }
  };

  const handleSubmit = async () => {
    if (!summary) return;
    try {
      await updateMutation.mutateAsync({ status: 'SUBMITTED' });
      addToast('success', '파트 취합보고를 제출했습니다.');
      setSubmitConfirmOpen(false);
    } catch {
      // error handled in mutation
    }
  };

  const handleSaveDraft = async () => {
    if (!summary) return;
    try {
      await updateMutation.mutateAsync({ status: 'DRAFT' });
      addToast('success', '임시저장되었습니다.');
    } catch {
      // error handled in mutation
    }
  };

  const handleRevertToDraft = async () => {
    if (!summary) return;
    try {
      await updateMutation.mutateAsync({ status: 'DRAFT' });
      addToast('info', '임시저장 상태로 변경되었습니다.');
    } catch {
      // error handled in mutation
    }
  };

  const handleSaveCell = useCallback(
    (_id: string, _column: 'doneWork' | 'planWork' | 'remarks', _value: string) => {
      markDirty(_id, { [_column]: _value });
      addToast('info', '셀이 수정되었습니다. 임시저장 버튼으로 저장하세요.');
    },
    [markDirty, addToast],
  );

  const handleProjectSelect = useCallback(
    (rowId: string, project: Project) => {
      markDirty(rowId, { projectId: project.id });
      setProjectDropdownRow(null);
      addToast('info', '프로젝트가 변경되었습니다. 임시저장 버튼으로 저장하세요.');
    },
    [markDirty, addToast],
  );

  const isSubmitted = summary?.status === 'SUBMITTED';
  const items: SummaryWorkItem[] = summary?.summaryWorkItems ?? [];

  return (
    <div>
      {/* 통합 툴바 */}
      <div
        className="bg-white rounded-lg border border-[var(--gray-border)] flex items-center gap-3 mb-4"
        style={{ padding: '10px 16px' }}
      >
        <button
          onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
          className="text-[18px] text-[var(--text-sub)] hover:text-[var(--text)]"
        >
          ◀
        </button>
        <span className="flex-1 text-center text-[14px] font-semibold text-[var(--text)]">
          {currentWeek}
        </span>
        <button
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          className="text-[18px] text-[var(--text-sub)] hover:text-[var(--text)]"
        >
          ▶
        </button>

        <div className="w-px h-5 bg-[var(--gray-border)]" />

        {/* 제출 상태 Badge */}
        <div>
          {summary ? (
            <Badge variant={isSubmitted ? 'ok' : 'warn'} dot>
              {isSubmitted ? '제출 완료' : '임시저장'}
            </Badge>
          ) : (
            <Badge variant="gray">미생성</Badge>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            onClick={handleAutoMerge}
            disabled={autoMergeMutation.isPending || createMutation.isPending}
          >
            {autoMergeMutation.isPending ? '취합 중...' : '자동 취합'}
          </Button>
          {!summary && (
            <Button variant="outline" onClick={handleCreate} disabled={createMutation.isPending}>
              취합보고 생성
            </Button>
          )}
          {summary && !isSubmitted && (
            <>
              <Button variant="outline" onClick={handleSaveDraft} disabled={updateMutation.isPending}>
                임시저장
              </Button>
              <Button onClick={() => setSubmitConfirmOpen(true)} disabled={updateMutation.isPending}>
                제출
              </Button>
            </>
          )}
          {isSubmitted && (
            <Button variant="outline" onClick={handleRevertToDraft} disabled={updateMutation.isPending}>
              재편집
            </Button>
          )}
        </div>
      </div>

      {/* 취합 그리드 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-[var(--text-sub)] text-[13px]">로딩 중...</div>
        ) : (
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '11%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: isSubmitted ? '21%' : '18%' }} />
              {!isSubmitted && <col style={{ width: '3%' }} />}
            </colgroup>
            <thead>
              <tr className="bg-[var(--tbl-header)] border-b border-[var(--gray-border)]">
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">프로젝트명</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">코드</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">진행업무</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">예정업무</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">비고</th>
                {!isSubmitted && <th className="px-3 py-[9px]"></th>}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={isSubmitted ? 5 : 6}
                    className="text-center py-12 text-[var(--text-sub)] text-[13px]"
                  >
                    {summary
                      ? '[자동 취합] 버튼으로 파트원 업무를 가져오거나, 직접 입력하세요.'
                      : '취합보고가 없습니다. [자동 취합] 또는 [취합보고 생성] 버튼을 사용하세요.'}
                  </td>
                </tr>
              )}
              {items.map((item, idx) => (
                <tr
                  key={item.id}
                  className={[
                    'border-b border-[var(--gray-border)]',
                    idx % 2 === 1 ? 'bg-[var(--row-alt)]' : 'bg-white',
                  ].join(' ')}
                >
                  {/* 프로젝트명 */}
                  <td className="px-3 py-[8px] align-top">
                    <div className="relative">
                      <button
                        disabled={isSubmitted}
                        className={[
                          'w-full text-left px-1 py-1 min-h-[52px] rounded text-[12.5px] transition-colors',
                          !isSubmitted ? 'hover:bg-[var(--primary-bg)] cursor-pointer' : 'cursor-default',
                          item.project ? 'text-[var(--text)] font-medium' : 'text-[var(--gray-border)]',
                        ].join(' ')}
                        onClick={() => !isSubmitted && setProjectDropdownRow(item.id)}
                      >
                        {item.project?.name ?? '프로젝트 선택'}
                      </button>
                      {projectDropdownRow === item.id && (
                        <ProjectDropdown
                          value={item.projectId}
                          onChange={(project) => handleProjectSelect(item.id, project)}
                          onClose={() => setProjectDropdownRow(null)}
                        />
                      )}
                    </div>
                  </td>

                  {/* 코드 */}
                  <td
                    className="px-3 py-[8px] align-top text-[11px] font-mono text-[var(--text-sub)]"
                    style={{ backgroundColor: 'var(--tbl-header)' }}
                  >
                    {item.project?.code ?? ''}
                  </td>

                  {/* 진행업무 */}
                  <td className="px-3 py-[8px] align-top">
                    <GridCell
                      value={item.doneWork}
                      isEditing={editingCell?.rowId === item.id && editingCell?.column === 'doneWork'}
                      onStartEdit={() => !isSubmitted && setEditingCell({ rowId: item.id, column: 'doneWork' })}
                      onEndEdit={() => setEditingCell(null)}
                      onSave={(v) => handleSaveCell(item.id, 'doneWork', v)}
                      disabled={isSubmitted}
                      placeholder="진행업무"
                    />
                  </td>

                  {/* 예정업무 */}
                  <td className="px-3 py-[8px] align-top">
                    <GridCell
                      value={item.planWork}
                      isEditing={editingCell?.rowId === item.id && editingCell?.column === 'planWork'}
                      onStartEdit={() => !isSubmitted && setEditingCell({ rowId: item.id, column: 'planWork' })}
                      onEndEdit={() => setEditingCell(null)}
                      onSave={(v) => handleSaveCell(item.id, 'planWork', v)}
                      disabled={isSubmitted}
                      placeholder="예정업무"
                    />
                  </td>

                  {/* 비고 */}
                  <td className="px-3 py-[8px] align-top">
                    <GridCell
                      value={item.remarks ?? ''}
                      isEditing={editingCell?.rowId === item.id && editingCell?.column === 'remarks'}
                      onStartEdit={() => !isSubmitted && setEditingCell({ rowId: item.id, column: 'remarks' })}
                      onEndEdit={() => setEditingCell(null)}
                      onSave={(v) => handleSaveCell(item.id, 'remarks', v)}
                      disabled={isSubmitted}
                      placeholder="비고"
                    />
                  </td>

                  {/* 액션 */}
                  {!isSubmitted && (
                    <td className="px-3 py-[8px] align-top">
                      <button
                        onClick={() => setDeleteTarget(item.id)}
                        className="mt-1.5 text-[var(--text-sub)] hover:text-[var(--danger)] text-[14px] transition-colors"
                        title="행 삭제"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 자동 취합 덮어쓰기 확인 */}
      <ConfirmModal
        open={autoMergeConfirmOpen}
        onClose={() => setAutoMergeConfirmOpen(false)}
        onConfirm={() => summary && autoMergeMutation.mutate(summary.id)}
        title="자동 취합"
        message="기존 취합 항목이 모두 대체됩니다. 계속하시겠습니까?"
        confirmLabel="취합"
      />

      {/* 제출 확인 */}
      <ConfirmModal
        open={submitConfirmOpen}
        onClose={() => setSubmitConfirmOpen(false)}
        onConfirm={handleSubmit}
        title="파트 취합보고 제출"
        message="파트 취합보고를 제출하시겠습니까? 제출 후에는 재편집 버튼으로만 수정할 수 있습니다."
        confirmLabel="제출"
      />

      {/* 행 삭제 확인 */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => setDeleteTarget(null)}
        title="행 삭제"
        message="선택한 항목을 삭제하시겠습니까?"
        confirmLabel="삭제"
        danger
      />
    </div>
  );
}
