import React, { useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTeamStore } from '../stores/teamStore';
import { useUiStore } from '../stores/uiStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partApi, SummaryWorkItem } from '../api/part.api';
import { exportApi } from '../api/export.api';
import GridCell from '../components/grid/GridCell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/Modal';
import { getWeekLabel, addWeeks, formatWeekLabel } from '@uc-teamspace/shared/constants/week-utils';

type EditingCell = { rowId: string; column: 'doneWork' | 'planWork' | 'remarks' } | null;
type ScopeType = 'TEAM' | 'PART';

export default function ReportConsolidation() {
  const { user } = useAuthStore();
  const { currentTeamId } = useTeamStore();
  const { addToast } = useUiStore();
  const queryClient = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(() => getWeekLabel(new Date()));
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [loadConfirmOpen, setLoadConfirmOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isLeader = user?.roles.includes('LEADER') ?? false;
  const teamId = currentTeamId ?? user?.teamId ?? '';
  const partId = user?.partId ?? '';

  // LEADER: 전체/파트 선택 가능, PART_LEADER: 파트 고정
  const [scope, setScope] = useState<ScopeType>(isLeader ? 'TEAM' : 'PART');
  const [selectedPartId, setSelectedPartId] = useState<string>(partId);

  // 파트 목록 가져오기 (LEADER용)
  const { data: overviews = [] } = useQuery({
    queryKey: ['team-weekly-overview', teamId, currentWeek],
    queryFn: () => partApi.getTeamWeeklyOverview(teamId, currentWeek).then((r) => r.data.data),
    enabled: isLeader && !!teamId,
    staleTime: 30_000,
  });
  const parts = useMemo(() => overviews.map((o) => o.part), [overviews]);

  const queryParams = useMemo(() => {
    if (scope === 'TEAM') return { scope: 'TEAM' as const, teamId, week: currentWeek };
    return { scope: 'PART' as const, partId: selectedPartId, week: currentWeek };
  }, [scope, teamId, selectedPartId, currentWeek]);

  const queryKey = ['summary', queryParams];

  const { data: summary, isLoading } = useQuery({
    queryKey,
    queryFn: () => partApi.getSummary(queryParams).then((r) => r.data.data),
    enabled: scope === 'TEAM' ? !!teamId : !!selectedPartId,
    staleTime: 30_000,
  });

  // ── Mutations ──

  const createMutation = useMutation({
    mutationFn: () =>
      partApi.createSummary({
        scope,
        ...(scope === 'TEAM' ? { teamId } : { partId: selectedPartId }),
        weekLabel: currentWeek,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => addToast('danger', '취합보고 생성에 실패했습니다.'),
  });

  const loadRowsMutation = useMutation({
    mutationFn: (summaryId: string) => partApi.loadRows(summaryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setSelectedIds(new Set());
      addToast('success', '팀원 업무를 불러왔습니다.');
      setLoadConfirmOpen(false);
    },
    onError: () => addToast('danger', '업무 불러오기에 실패했습니다.'),
  });

  const mergeMutation = useMutation({
    mutationFn: ({ summaryId, ids }: { summaryId: string; ids: string[] }) =>
      partApi.mergeRows(summaryId, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setSelectedIds(new Set());
      addToast('success', '선택 행을 병합했습니다.');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message ?? '병합에 실패했습니다.';
      addToast('danger', msg);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { doneWork?: string; planWork?: string; remarks?: string } }) =>
      partApi.updateSummaryWorkItem(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => addToast('danger', '수정에 실패했습니다.'),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => partApi.deleteSummaryWorkItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (deleteTarget) next.delete(deleteTarget);
        return next;
      });
      setDeleteTarget(null);
      addToast('success', '행을 삭제했습니다.');
    },
    onError: () => addToast('danger', '삭제에 실패했습니다.'),
  });

  const submitMutation = useMutation({
    mutationFn: (summaryId: string) =>
      partApi.updatePartSummary(summaryId, { status: 'SUBMITTED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setSubmitConfirmOpen(false);
      addToast('success', '취합보고를 제출했습니다.');
    },
    onError: () => addToast('danger', '제출에 실패했습니다.'),
  });

  const revertMutation = useMutation({
    mutationFn: (summaryId: string) =>
      partApi.updatePartSummary(summaryId, { status: 'DRAFT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      addToast('info', '임시저장 상태로 변경되었습니다.');
    },
    onError: () => addToast('danger', '상태 변경에 실패했습니다.'),
  });

  // ── Handlers ──

  const handleExcelDownload = async () => {
    if (exporting || !summary) return;
    setExporting(true);
    try {
      await exportApi.downloadExcel({
        type: 'summary',
        summaryId: summary.id,
        week: currentWeek,
      });
      addToast('success', 'Excel 파일을 다운로드했습니다.');
    } catch {
      addToast('danger', 'Excel 다운로드에 실패했습니다.');
    } finally {
      setExporting(false);
    }
  };

  const handleLoad = async () => {
    if (!summary) {
      // 먼저 summary를 생성
      try {
        const result = await createMutation.mutateAsync();
        const newId = result.data.data.id;
        await loadRowsMutation.mutateAsync(newId);
      } catch {
        // errors handled in mutations
      }
    } else if (summary.summaryWorkItems.length > 0) {
      setLoadConfirmOpen(true);
    } else {
      loadRowsMutation.mutate(summary.id);
    }
  };

  const handleMerge = () => {
    if (!summary || selectedIds.size < 2) return;
    mergeMutation.mutate({ summaryId: summary.id, ids: Array.from(selectedIds) });
  };

  const handleSaveCell = useCallback(
    (id: string, column: 'doneWork' | 'planWork' | 'remarks', value: string) => {
      updateItemMutation.mutate({ id, data: { [column]: value } });
    },
    [updateItemMutation],
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (!items.length) return;
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  // ── Derived state ──

  const isSubmitted = summary?.status === 'SUBMITTED';
  const items: SummaryWorkItem[] = summary?.summaryWorkItems ?? [];

  // 제출 조회 시 같은 프로젝트 행 rowspan 계산
  const projectRowSpans = useMemo(() => {
    if (!isSubmitted) return new Map<number, number>();
    const spans = new Map<number, number>();
    let i = 0;
    while (i < items.length) {
      const pid = items[i].projectId;
      let count = 1;
      while (i + count < items.length && items[i + count].projectId === pid) {
        count++;
      }
      spans.set(i, count);
      i += count;
    }
    return spans;
  }, [isSubmitted, items]);

  // 같은 프로젝트 2개 이상 선택 시 병합 가능
  const canMerge = useMemo(() => {
    if (selectedIds.size < 2) return false;
    const selectedItems = items.filter((i) => selectedIds.has(i.id));
    const projectIds = new Set(selectedItems.map((i) => i.projectId));
    return projectIds.size === 1;
  }, [selectedIds, items]);

  return (
    <div>
      {/* 통합 툴바 */}
      <div
        className="bg-white rounded-lg border border-[var(--gray-border)] flex items-center gap-3 mb-4 flex-wrap"
        style={{ padding: '10px 16px' }}
      >
        {/* 주차 네비 */}
        <button
          onClick={() => { setCurrentWeek(addWeeks(currentWeek, -1)); setSelectedIds(new Set()); }}
          className="text-[18px] text-[var(--text-sub)] hover:text-[var(--text)]"
        >
          ◀
        </button>
        <span className="text-[14px] font-semibold text-[var(--text)] min-w-[200px] text-center">
          {formatWeekLabel(currentWeek)}
        </span>
        <button
          onClick={() => { setCurrentWeek(addWeeks(currentWeek, 1)); setSelectedIds(new Set()); }}
          className="text-[18px] text-[var(--text-sub)] hover:text-[var(--text)]"
        >
          ▶
        </button>

        <div className="w-px h-5 bg-[var(--gray-border)]" />

        {/* 범위 선택 */}
        {isLeader ? (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-[12px] cursor-pointer">
              <input
                type="radio"
                name="scope"
                checked={scope === 'TEAM'}
                onChange={() => { setScope('TEAM'); setSelectedIds(new Set()); }}
                className="accent-[var(--primary)]"
              />
              전체
            </label>
            <label className="flex items-center gap-1 text-[12px] cursor-pointer">
              <input
                type="radio"
                name="scope"
                checked={scope === 'PART'}
                onChange={() => { setScope('PART'); setSelectedIds(new Set()); }}
                className="accent-[var(--primary)]"
              />
              파트
            </label>
            {scope === 'PART' && (
              <select
                value={selectedPartId}
                onChange={(e) => { setSelectedPartId(e.target.value); setSelectedIds(new Set()); }}
                className="text-[12px] border border-[var(--gray-border)] rounded px-2 py-1"
              >
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <span className="text-[12px] text-[var(--text-sub)]">
            {user?.partName ?? '파트'}
          </span>
        )}

        <div className="w-px h-5 bg-[var(--gray-border)]" />

        {/* 상태 Badge */}
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
          {!isSubmitted && (
            <Button
              variant="outline"
              onClick={handleLoad}
              disabled={loadRowsMutation.isPending || createMutation.isPending}
            >
              {loadRowsMutation.isPending ? '불러오는 중...' : '불러오기'}
            </Button>
          )}
          {summary && !isSubmitted && (
            <Button
              onClick={() => setSubmitConfirmOpen(true)}
              disabled={submitMutation.isPending || items.length === 0}
            >
              제출
            </Button>
          )}
          {isSubmitted && (
            <>
              <Button
                variant="outline"
                onClick={handleExcelDownload}
                disabled={exporting}
              >
                {exporting ? '다운로드 중...' : 'Excel 다운로드'}
              </Button>
              <Button
                variant="outline"
                onClick={() => summary && revertMutation.mutate(summary.id)}
                disabled={revertMutation.isPending}
              >
                재편집
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 선택 바 */}
      {!isSubmitted && items.length > 0 && (
        <div
          className="bg-white rounded-lg border border-[var(--gray-border)] flex items-center gap-3 mb-4"
          style={{ padding: '8px 16px' }}
        >
          <span className="text-[12px] text-[var(--text-sub)]">
            선택 {selectedIds.size}개
          </span>
          <Button
            size="small"
            variant="outline"
            onClick={handleMerge}
            disabled={!canMerge || mergeMutation.isPending}
          >
            {mergeMutation.isPending ? '병합 중...' : '병합'}
          </Button>
          {selectedIds.size > 0 && !canMerge && selectedIds.size >= 2 && (
            <span className="text-[11px] text-[var(--danger)]">
              같은 프로젝트만 병합할 수 있습니다
            </span>
          )}
        </div>
      )}

      {/* 테이블 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-[var(--text-sub)] text-[13px]">로딩 중...</div>
        ) : (
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              {!isSubmitted && <col style={{ width: '36px' }} />}
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: isSubmitted ? '30%' : '27%' }} />
              <col style={{ width: isSubmitted ? '30%' : '27%' }} />
              <col style={{ width: isSubmitted ? '20%' : '17%' }} />
              {!isSubmitted && <col style={{ width: '36px' }} />}
            </colgroup>
            <thead>
              <tr className="bg-[var(--tbl-header)] border-b border-[var(--gray-border)]">
                {!isSubmitted && (
                  <th className="px-2 py-[9px] text-center">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selectedIds.size === items.length}
                      onChange={handleToggleAll}
                      className="accent-[var(--primary)]"
                    />
                  </th>
                )}
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">프로젝트</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">팀원(파트)</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">진행업무</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">예정업무</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">비고</th>
                {!isSubmitted && <th className="px-2 py-[9px]" />}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={isSubmitted ? 5 : 7}
                    className="text-center py-12 text-[var(--text-sub)] text-[13px]"
                  >
                    {summary
                      ? '[불러오기] 버튼으로 팀원 업무를 가져오세요.'
                      : '[불러오기] 버튼으로 취합을 시작하세요.'}
                  </td>
                </tr>
              )}
              {items.map((item, idx) => {
                const rowSpan = projectRowSpans.get(idx);
                const showProjectCell = !isSubmitted || rowSpan !== undefined;
                return (
                <tr
                  key={item.id}
                  className={[
                    'border-b border-[var(--gray-border)]',
                    selectedIds.has(item.id) ? 'bg-[var(--primary-bg)]' : idx % 2 === 1 ? 'bg-[var(--row-alt)]' : 'bg-white',
                  ].join(' ')}
                >
                  {!isSubmitted && (
                    <td className="px-2 py-[8px] text-center align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => handleToggleSelect(item.id)}
                        className="accent-[var(--primary)] mt-1"
                      />
                    </td>
                  )}
                  {showProjectCell && (
                  <td
                    className="px-3 py-[8px] align-top text-[12.5px] font-medium text-[var(--text)]"
                    rowSpan={isSubmitted ? rowSpan : undefined}
                    style={isSubmitted && rowSpan && rowSpan > 1 ? { borderRight: '1px solid var(--gray-border)', verticalAlign: 'middle' } : undefined}
                  >
                    {item.project?.name ?? '—'}
                  </td>
                  )}
                  <td className="px-3 py-[8px] align-top text-[11px] text-[var(--text-sub)]">
                    {item.memberNames ?? '—'}
                  </td>
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
                  {!isSubmitted && (
                    <td className="px-2 py-[8px] align-top text-center">
                      <button
                        onClick={() => setDeleteTarget(item.id)}
                        className="mt-1 text-[var(--text-sub)] hover:text-[var(--danger)] text-[14px] transition-colors"
                        title="행 삭제"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 불러오기 덮어쓰기 확인 */}
      <ConfirmModal
        open={loadConfirmOpen}
        onClose={() => setLoadConfirmOpen(false)}
        onConfirm={() => summary && loadRowsMutation.mutate(summary.id)}
        title="업무 불러오기"
        message="기존 취합 항목이 모두 대체됩니다. 계속하시겠습니까?"
        confirmLabel="불러오기"
      />

      {/* 제출 확인 */}
      <ConfirmModal
        open={submitConfirmOpen}
        onClose={() => setSubmitConfirmOpen(false)}
        onConfirm={() => summary && submitMutation.mutate(summary.id)}
        title="취합보고 제출"
        message="취합보고를 제출하시겠습니까? 제출 후에는 재편집 버튼으로만 수정할 수 있습니다."
        confirmLabel="제출"
      />

      {/* 행 삭제 확인 */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteItemMutation.mutate(deleteTarget)}
        title="행 삭제"
        message="선택한 항목을 삭제하시겠습니까?"
        confirmLabel="삭제"
        danger
      />
    </div>
  );
}
