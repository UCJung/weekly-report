import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '../hooks/useProjects';
import { Project, CreateProjectDto } from '../api/project.api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/Modal';
import SummaryCard from '../components/ui/SummaryCard';

const CATEGORY_LABELS: Record<string, string> = {
  COMMON: '공통',
  EXECUTION: '수행',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '활성',
  HOLD: '보류',
  COMPLETED: '완료',
};

const STATUS_BADGE: Record<string, 'ok' | 'warn' | 'gray'> = {
  ACTIVE: 'ok',
  HOLD: 'warn',
  COMPLETED: 'gray',
};

interface ProjectFormData {
  name: string;
  code: string;
  category: 'COMMON' | 'EXECUTION';
  status?: 'ACTIVE' | 'HOLD' | 'COMPLETED';
}

const DEFAULT_FORM: ProjectFormData = {
  name: '',
  code: '',
  category: 'EXECUTION',
};

export default function ProjectMgmt() {
  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const teamId = user?.id ? '1' : '1'; // 실제로는 user.teamId 사용

  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectFormData>(DEFAULT_FORM);
  const [formError, setFormError] = useState('');
  const [deleteWarning, setDeleteWarning] = useState('');

  const { data, isLoading } = useProjects({
    teamId,
    ...(categoryFilter ? { category: categoryFilter as 'COMMON' | 'EXECUTION' } : {}),
    ...(statusFilter ? { status: statusFilter as 'ACTIVE' | 'HOLD' | 'COMPLETED' } : {}),
  });
  const projects = data?.data ?? [];

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const filteredProjects = projects.filter((p) => {
    if (searchText && !p.name.includes(searchText) && !p.code.includes(searchText)) return false;
    return true;
  });

  const commonCount = projects.filter((p) => p.category === 'COMMON').length;
  const execCount = projects.filter((p) => p.category === 'EXECUTION').length;
  const activeCount = projects.filter((p) => p.status === 'ACTIVE').length;

  const openCreate = () => {
    setEditProject(null);
    setForm(DEFAULT_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditProject(project);
    setForm({
      name: project.name,
      code: project.code,
      category: project.category,
      status: project.status,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return setFormError('프로젝트명을 입력하세요.');
    if (!form.code.trim()) return setFormError('프로젝트코드를 입력하세요.');

    try {
      if (editProject) {
        await updateMutation.mutateAsync({ id: editProject.id, data: form });
        addToast('success', `"${form.name}" 프로젝트가 수정되었습니다.`);
      } else {
        await createMutation.mutateAsync({ ...form, teamId } as CreateProjectDto);
        addToast('success', `"${form.name}" 프로젝트가 등록되었습니다.`);
      }
      setModalOpen(false);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '오류가 발생했습니다.';
      setFormError(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteMutation.mutateAsync(deleteTarget.id);
      if (result._warning) {
        addToast('warning', result._warning);
      } else {
        addToast('success', `"${deleteTarget.name}" 프로젝트가 삭제(완료)되었습니다.`);
      }
      setDeleteTarget(null);
      setDeleteWarning('');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '삭제 중 오류가 발생했습니다.';
      addToast('danger', msg);
    }
  };

  const openDelete = (project: Project) => {
    setDeleteTarget(project);
    setDeleteWarning('');
  };

  return (
    <div>
      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <SummaryCard label="전체 프로젝트" value={projects.length} />
        <SummaryCard label="공통 과제" value={commonCount} />
        <SummaryCard label="수행 과제" value={execCount} />
        <SummaryCard label="활성 프로젝트" value={activeCount} />
      </div>

      {/* 필터 + 등록 버튼 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] p-4 mb-4">
        <div className="flex items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 px-2 border border-[var(--gray-border)] rounded text-[12px] outline-none"
          >
            <option value="">전체 분류</option>
            <option value="COMMON">공통</option>
            <option value="EXECUTION">수행</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2 border border-[var(--gray-border)] rounded text-[12px] outline-none"
          >
            <option value="">전체 상태</option>
            <option value="ACTIVE">활성</option>
            <option value="HOLD">보류</option>
            <option value="COMPLETED">완료</option>
          </select>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="프로젝트명 또는 코드 검색"
            className="h-8 px-3 border border-[var(--gray-border)] rounded text-[12px] outline-none w-[220px]"
          />
          <div className="ml-auto">
            <Button onClick={openCreate}>+ 프로젝트 등록</Button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[var(--tbl-header)] border-b border-[var(--gray-border)]">
              <th className="text-left px-4 py-2.5 font-medium text-[var(--text-sub)]">프로젝트명</th>
              <th className="text-left px-4 py-2.5 font-medium text-[var(--text-sub)]">코드</th>
              <th className="text-left px-4 py-2.5 font-medium text-[var(--text-sub)]">분류</th>
              <th className="text-left px-4 py-2.5 font-medium text-[var(--text-sub)]">상태</th>
              <th className="text-right px-4 py-2.5 font-medium text-[var(--text-sub)]">액션</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-[var(--text-sub)]">로딩 중...</td>
              </tr>
            )}
            {!isLoading && filteredProjects.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-[var(--text-sub)]">프로젝트가 없습니다.</td>
              </tr>
            )}
            {filteredProjects.map((project, idx) => (
              <tr
                key={project.id}
                className={[
                  'border-b border-[var(--gray-border)] hover:bg-[var(--row-alt)]',
                  idx % 2 === 1 ? 'bg-[var(--row-alt)]' : '',
                ].join(' ')}
              >
                <td className="px-4 py-2.5 font-medium">{project.name}</td>
                <td className="px-4 py-2.5 text-[var(--text-sub)] font-mono">{project.code}</td>
                <td className="px-4 py-2.5">
                  <Badge variant={project.category === 'COMMON' ? 'purple' : 'blue'}>
                    {CATEGORY_LABELS[project.category]}
                  </Badge>
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={STATUS_BADGE[project.status] ?? 'gray'}>
                    {STATUS_LABELS[project.status]}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-right flex justify-end gap-1">
                  <Button size="small" variant="outline" onClick={() => openEdit(project)}>수정</Button>
                  {project.status !== 'COMPLETED' && (
                    <Button size="small" variant="danger" onClick={() => openDelete(project)}>삭제</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 등록/수정 모달 */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProject ? '프로젝트 수정' : '프로젝트 등록'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>취소</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editProject ? '수정' : '등록'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1">프로젝트명 *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full h-8 px-3 border border-[var(--gray-border)] rounded text-[12px] outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1">프로젝트코드 *</label>
            <input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="예: 공통2500-팀"
              className="w-full h-8 px-3 border border-[var(--gray-border)] rounded text-[12px] outline-none focus:border-[var(--primary)] font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1">분류</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as 'COMMON' | 'EXECUTION' }))}
              className="w-full h-8 px-2 border border-[var(--gray-border)] rounded text-[12px] outline-none"
            >
              <option value="COMMON">공통</option>
              <option value="EXECUTION">수행</option>
            </select>
          </div>
          {editProject && (
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1">상태</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'ACTIVE' | 'HOLD' | 'COMPLETED' }))}
                className="w-full h-8 px-2 border border-[var(--gray-border)] rounded text-[12px] outline-none"
              >
                <option value="ACTIVE">활성</option>
                <option value="HOLD">보류</option>
                <option value="COMPLETED">완료</option>
              </select>
            </div>
          )}
          {formError && (
            <p className="text-[11px] text-[var(--danger)] bg-[var(--danger-bg)] px-3 py-2 rounded">
              {formError}
            </p>
          )}
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => { setDeleteTarget(null); setDeleteWarning(''); }}
        onConfirm={handleDelete}
        title="프로젝트 삭제"
        message={
          deleteWarning
            ? `${deleteWarning}\n\n정말 삭제(완료 처리)하시겠습니까?`
            : `"${deleteTarget?.name}" 프로젝트를 삭제(완료 처리)하시겠습니까?`
        }
        confirmLabel="삭제"
        danger
      />
    </div>
  );
}
