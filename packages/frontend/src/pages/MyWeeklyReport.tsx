import React, { useState, useMemo } from 'react';
import { CheckSquare } from 'lucide-react';
import { useUiStore } from '../stores/uiStore';
import { useGridStore } from '../stores/gridStore';
import { useTeamStore } from '../stores/teamStore';
import ImportFromTasksModal from '../components/personal-task/ImportFromTasksModal';
import {
  useMyWeeklyReport,
  useCreateWeeklyReport,
  useSubmitWeeklyReport,
  useCarryForward,
} from '../hooks/useWeeklyReport';
import {
  useAddWorkItem,
  useUpdateWorkItem,
  useDeleteWorkItem,
  useDeleteWorkItemsByProject,
} from '../hooks/useWorkItems';
import { useMyWeeklyReport as usePrevWeeklyReport } from '../hooks/useWeeklyReport';
import EditableGrid from '../components/grid/EditableGrid';
import ProjectSelectModal from '../components/grid/ProjectSelectModal';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/Modal';
import { WorkItem } from '../api/weekly-report.api';
import { getWeekLabel, addWeeks, formatWeekLabel } from '@uc-teamspace/shared/constants/week-utils';

export default function MyWeeklyReport() {
  const [currentWeek, setCurrentWeek] = useState(() => getWeekLabel(new Date()));
  const [carryForwardOpen, setCarryForwardOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [projectSelectOpen, setProjectSelectOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedPrevIds, setSelectedPrevIds] = useState<string[]>([]);
  const { addToast } = useUiStore();
  const { isSaving } = useGridStore();
  const { currentTeamId } = useTeamStore();

  const prevWeek = addWeeks(currentWeek, -1);

  const { data: report, isLoading } = useMyWeeklyReport(currentWeek);
  const { data: prevReport } = usePrevWeeklyReport(prevWeek);
  const createMutation = useCreateWeeklyReport(currentWeek);
  const submitMutation = useSubmitWeeklyReport(currentWeek);
  const carryMutation = useCarryForward(currentWeek);
  const addItemMutation = useAddWorkItem(currentWeek, report?.id ?? '');
  const updateItemMutation = useUpdateWorkItem(currentWeek);
  const deleteItemMutation = useDeleteWorkItem(currentWeek);
  const deleteByProjectMutation = useDeleteWorkItemsByProject(currentWeek, report?.id ?? '');

  const isSubmitted = report?.status === 'SUBMITTED';
  const workItems = report?.workItems ?? [];

  // 이미 추가된 프로젝트 ID 목록 (중복 제거)
  const alreadySelectedIds = useMemo(() => {
    const ids = workItems
      .map((item: WorkItem) => item.projectId)
      .filter((id): id is string => !!id);
    return [...new Set(ids)];
  }, [workItems]);

  const handleCreateReport = async () => {
    try {
      await createMutation.mutateAsync(currentWeek);
      addToast('success', '주간업무가 생성되었습니다.');
    } catch {
      addToast('danger', '주간업무 생성에 실패했습니다.');
    }
  };

  const handleAddItem = async (projectId: string) => {
    if (!report) await handleCreateReport();
    try {
      await addItemMutation.mutateAsync({
        projectId,
        doneWork: '',
        planWork: '',
        remarks: '',
      });
    } catch {
      addToast('danger', '행 추가에 실패했습니다.');
    }
  };

  const handleProjectSelect = async (project: { id: string; name: string; code: string }) => {
    if (alreadySelectedIds.includes(project.id)) {
      addToast('warning', '이미 추가된 프로젝트입니다.');
      return;
    }
    setProjectSelectOpen(false);
    await handleAddItem(project.id);
  };

  const handleDeleteProject = (projectId: string) => {
    deleteByProjectMutation.mutate(projectId, {
      onError: () => addToast('danger', '프로젝트 제거에 실패했습니다.'),
    });
  };

  const handleUpdateItem = (
    id: string,
    data: Partial<Pick<WorkItem, 'doneWork' | 'planWork' | 'remarks'>>,
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

  const prevWorkItems = prevReport?.workItems?.filter((item: WorkItem) => item.doneWork.trim() || item.planWork.trim()) ?? [];

  // 전주 할일 항목을 projectId 기준으로 그룹핑 (TASK-05)
  const prevWorkItemGroups = useMemo(() => {
    const map = new Map<string, { project: WorkItem['project']; items: WorkItem[] }>();
    const order: string[] = [];
    for (const item of prevWorkItems) {
      const key = item.projectId ?? '__no_project__';
      if (!map.has(key)) {
        map.set(key, { project: item.project, items: [] });
        order.push(key);
      }
      map.get(key)!.items.push(item);
    }
    return order.map((k) => ({ key: k, ...map.get(k)! }));
  }, [prevWorkItems]);

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
            {formatWeekLabel(currentWeek)}
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
              <Button
                variant="outline"
                onClick={() => setProjectSelectOpen(true)}
                disabled={addItemMutation.isPending}
              >
                + 프로젝트 추가
              </Button>
              <Button
                variant="outline"
                onClick={() => setCarryForwardOpen(true)}
                title="전주 업무 불러오기"
              >
                전주 불러오기
              </Button>
              <Button
                variant="outline"
                onClick={() => setImportModalOpen(true)}
                title="내 작업에서 가져오기"
              >
                <CheckSquare size={14} className="mr-1" />
                내 작업에서 가져오기
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
            workItems={[...workItems].sort((a, b) => (a.project?.sortOrder ?? 999) - (b.project?.sortOrder ?? 999))}
            disabled={isSubmitted}
            onUpdateItem={handleUpdateItem}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onDeleteProject={handleDeleteProject}
          />
        </div>
      )}

      {/* 프로젝트 선택 모달 */}
      <ProjectSelectModal
        open={projectSelectOpen}
        onClose={() => setProjectSelectOpen(false)}
        onSelect={handleProjectSelect}
        alreadySelectedIds={alreadySelectedIds}
      />

      {/* 전주 할일 불러오기 모달 */}
      <Modal
        open={carryForwardOpen}
        onClose={() => setCarryForwardOpen(false)}
        title="전주 업무 불러오기"
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
            전주({formatWeekLabel(prevWeek)})의 업무가 없습니다.
          </p>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] text-[var(--text-sub)]">
                전주 업무를 선택하면 그대로 불러옵니다.
              </p>
              <div className="flex gap-2">
                <button
                  className="text-[11px] hover:underline"
                  style={{ color: 'var(--primary)' }}
                  onClick={() => setSelectedPrevIds(prevWorkItems.map((i: WorkItem) => i.id))}
                >
                  전체 선택
                </button>
                <button
                  className="text-[11px] hover:underline"
                  style={{ color: 'var(--text-sub)' }}
                  onClick={() => setSelectedPrevIds([])}
                >
                  전체 해제
                </button>
              </div>
            </div>
            {/* 프로젝트별 그룹핑 목록 (TASK-05) */}
            <div className="flex flex-col gap-0 max-h-[400px] overflow-y-auto border border-[var(--gray-border)] rounded-md overflow-hidden">
              {prevWorkItemGroups.map((group) => (
                <div key={group.key}>
                  {/* 그룹 헤더 */}
                  <div
                    className="px-3 py-2 flex items-center gap-2 border-b border-[var(--gray-border)]"
                    style={{ backgroundColor: 'var(--tbl-header)' }}
                  >
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{
                        backgroundColor: 'var(--primary-bg)',
                        color: 'var(--primary)',
                        border: '1px solid var(--primary)',
                      }}
                    >
                      {group.project?.name ?? '(프로젝트 없음)'}
                    </span>
                    {group.project?.code && (
                      <span
                        className="text-[10px] font-mono tracking-widest"
                        style={{ color: 'var(--text-sub)' }}
                      >
                        {group.project.code}
                      </span>
                    )}
                  </div>
                  {/* 항목 목록 */}
                  {group.items.map((item: WorkItem) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-2 px-3 py-2.5 cursor-pointer border-b border-[var(--gray-border)] transition-colors"
                      style={{ backgroundColor: 'white' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLLabelElement).style.backgroundColor =
                          'var(--primary-bg)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLLabelElement).style.backgroundColor = 'white';
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPrevIds.includes(item.id)}
                        onChange={() => togglePrevItem(item.id)}
                        className="mt-0.5 flex-shrink-0"
                      />
                      <div className="text-[12px] line-clamp-3" style={{ color: 'var(--text)' }}>
                        {item.doneWork && (
                          <p><span className="font-semibold text-[var(--primary)]">[진행]</span> {item.doneWork}</p>
                        )}
                        {item.planWork && (
                          <p><span className="font-semibold" style={{ color: 'var(--ok)' }}>[예정]</span> {item.planWork}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
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

      {/* 내 작업에서 가져오기 모달 */}
      <ImportFromTasksModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        weekLabel={currentWeek}
        teamId={currentTeamId ?? ''}
      />
    </div>
  );
}
