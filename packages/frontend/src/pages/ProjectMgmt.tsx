import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';
import { useTeamStore } from '../stores/teamStore';
import { useTeamProjects, useAddTeamProjects, useRemoveTeamProject, useReorderTeamProjects, useProjects } from '../hooks/useProjects';
import { TeamProject } from '../api/project.api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/Modal';
import SummaryCard from '../components/ui/SummaryCard';
import ProjectDndTable from './ProjectDndTable';

const CATEGORY_LABELS: Record<string, string> = {
  COMMON: '공통',
  EXECUTION: '수행',
};

// ── 프로젝트 추가 모달 ────────────────────────────────────────
interface AddProjectModalProps {
  teamId: string;
  registeredIds: Set<string>;
  onClose: () => void;
}

function AddProjectModal({ teamId, registeredIds, onClose }: AddProjectModalProps) {
  const { data: projectsResponse, isLoading } = useProjects({ limit: 100 });
  const allProjects = projectsResponse?.data ?? [];
  const addTeamProjects = useAddTeamProjects(teamId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const available = allProjects.filter(
    (p) => !registeredIds.has(p.id)
  );

  const filtered = available.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) {
      toast.error('추가할 프로젝트를 선택하세요.');
      return;
    }
    try {
      await addTeamProjects.mutateAsync(Array.from(selected));
      toast.success(`${selected.size}개 프로젝트가 팀에 등록되었습니다.`);
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message ?? '등록 실패');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6"
        style={{ border: '1px solid var(--gray-border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>
            프로젝트 추가
          </h2>
          <p className="text-[12px]" style={{ color: 'var(--text-sub)' }}>
            {selected.size}개 선택됨
          </p>
        </div>

        {/* 검색 */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
          style={{ border: '1px solid var(--gray-border)' }}
        >
          <Search size={13} style={{ color: 'var(--text-sub)' }} />
          <input
            type="text"
            placeholder="프로젝트명 또는 코드 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-[12px] outline-none bg-transparent"
            style={{ color: 'var(--text)' }}
          />
        </div>

        {/* 목록 */}
        <div
          className="overflow-y-auto rounded-lg"
          style={{ maxHeight: '320px', border: '1px solid var(--gray-border)' }}
        >
          {isLoading ? (
            <div className="text-center py-8 text-[13px]" style={{ color: 'var(--text-sub)' }}>
              불러오는 중...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-[13px]" style={{ color: 'var(--text-sub)' }}>
              추가 가능한 프로젝트가 없습니다.
            </div>
          ) : (
            filtered.map((p, idx) => (
              <label
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                style={{
                  backgroundColor: selected.has(p.id) ? 'var(--primary-bg)' : idx % 2 === 1 ? 'var(--row-alt)' : 'transparent',
                  borderBottom: '1px solid var(--gray-border)',
                }}
                onMouseEnter={(e) => {
                  if (!selected.has(p.id)) {
                    (e.currentTarget as HTMLLabelElement).style.backgroundColor = 'var(--row-alt)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected.has(p.id)) {
                    (e.currentTarget as HTMLLabelElement).style.backgroundColor = idx % 2 === 1 ? 'var(--row-alt)' : 'transparent';
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                  className="rounded"
                  style={{ accentColor: 'var(--primary)' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium truncate" style={{ color: 'var(--text)' }}>
                      {p.name}
                    </span>
                    <Badge variant={p.category === 'COMMON' ? 'purple' : 'blue'}>
                      {CATEGORY_LABELS[p.category]}
                    </Badge>
                    {p.status === 'INACTIVE' && (
                      <Badge variant="gray">사용안함</Badge>
                    )}
                  </div>
                  <span className="text-[11px] font-mono" style={{ color: 'var(--text-sub)' }}>
                    {p.code}
                  </span>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            취소
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            disabled={selected.size === 0 || addTeamProjects.isPending}
          >
            <Plus size={13} className="mr-1" />
            {selected.size > 0 ? `${selected.size}개 추가` : '추가'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function ProjectMgmt() {
  const { user } = useAuthStore();
  const { currentTeamId } = useTeamStore();
  const teamId = currentTeamId ?? user?.teamId ?? '';

  const [removeTarget, setRemoveTarget] = useState<TeamProject | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [localProjects, setLocalProjects] = useState<TeamProject[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: teamProjects = [], isLoading } = useTeamProjects(teamId);
  const removeProject = useRemoveTeamProject(teamId);
  const reorderProjects = useReorderTeamProjects(teamId);

  useEffect(() => {
    setLocalProjects(teamProjects);
  }, [teamProjects]);

  const hasFilters = !!categoryFilter;
  const isDndActive = !hasFilters;

  const filtered = localProjects.filter((p) => {
    if (categoryFilter && p.category !== categoryFilter) return false;
    return true;
  });

  const handleReorder = async (newOrder: TeamProject[]) => {
    setLocalProjects(newOrder);
    try {
      await reorderProjects.mutateAsync(newOrder.map((p) => p.teamProjectId));
    } catch {
      toast.error('순서 변경에 실패했습니다.');
      setLocalProjects(teamProjects);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      const result = await removeProject.mutateAsync(removeTarget.id);
      if (result._warning) {
        toast.warning(result._warning);
      } else {
        toast.success(`"${removeTarget.name}" 프로젝트가 팀에서 해제되었습니다.`);
      }
      setRemoveTarget(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message ?? '해제 실패');
    }
  };

  const commonCount = teamProjects.filter((p) => p.category === 'COMMON').length;
  const execCount = teamProjects.filter((p) => p.category === 'EXECUTION').length;
  const activeCount = teamProjects.filter((p) => p.status === 'ACTIVE').length;
  const inactiveCount = teamProjects.filter((p) => p.status === 'INACTIVE').length;

  const registeredIds = new Set(teamProjects.map((p) => p.id));

  return (
    <div>
      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <SummaryCard label="등록된 프로젝트" value={teamProjects.length} iconBg="var(--primary-bg)" />
        <SummaryCard label="공통업무" value={commonCount} iconBg="var(--primary-bg)" />
        <SummaryCard label="수행과제" value={execCount} iconBg="var(--primary-bg)" />
        <SummaryCard label="사용중 / 사용안함" value={`${activeCount} / ${inactiveCount}`} iconBg="var(--ok-bg)" />
      </div>

      {/* 필터 + 추가 버튼 */}
      <div
        className="bg-white rounded-lg p-4 mb-4 flex items-center gap-3"
        style={{ border: '1px solid var(--gray-border)' }}
      >
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-2 border border-[var(--gray-border)] rounded outline-none text-[12.5px]"
          style={{ height: '30px', color: 'var(--text)' }}
        >
          <option value="">전체 분류</option>
          <option value="COMMON">공통업무</option>
          <option value="EXECUTION">수행과제</option>
        </select>
        {hasFilters && (
          <p className="text-[11px]" style={{ color: 'var(--warn)' }}>
            필터를 초기화해야 순서를 변경할 수 있습니다.
          </p>
        )}
        <div className="ml-auto">
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={13} className="mr-1" />
            프로젝트 추가
          </Button>
        </div>
      </div>

      {/* 테이블 */}
      <div
        className="bg-white rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--gray-border)' }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            padding: '11px 16px',
            borderBottom: '1px solid var(--gray-border)',
          }}
        >
          <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
            팀 등록 프로젝트 목록
          </p>
          <p className="text-[12px]" style={{ color: 'var(--text-sub)' }}>
            총 {filtered.length}건
          </p>
        </div>

        <ProjectDndTable
          projects={filtered}
          isLoading={isLoading}
          isDndActive={isDndActive}
          onRemove={setRemoveTarget}
          onReorder={handleReorder}
        />
      </div>

      {/* 프로젝트 추가 모달 */}
      {showAddModal && (
        <AddProjectModal
          teamId={teamId}
          registeredIds={registeredIds}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* 해제 확인 모달 */}
      <ConfirmModal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="프로젝트 해제"
        message={`"${removeTarget?.name}" 프로젝트를 팀에서 해제하시겠습니까?\n\n기존 업무항목은 조회 가능하나 신규 작성은 불가합니다.`}
        confirmLabel="해제"
        danger
      />
    </div>
  );
}
