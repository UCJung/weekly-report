import React, { useState } from 'react';
import { Plus, Pencil, CheckCircle, XCircle, Search } from 'lucide-react';
import { useAdminProjects, useCreateProject, useUpdateProject, useApproveProject } from '../../hooks/useAdmin';
import { AdminProject, ProjectCategory, ProjectStatus } from '../../api/admin.api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../components/ui/Table';
import { toast } from 'sonner';

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  COMMON: '공통업무',
  EXECUTION: '수행과제',
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  PENDING: '승인대기',
  ACTIVE: '사용중',
  INACTIVE: '사용안함',
};

const STATUS_BADGE: Record<ProjectStatus, 'warn' | 'ok' | 'gray'> = {
  PENDING: 'warn',
  ACTIVE: 'ok',
  INACTIVE: 'gray',
};

type FilterCategory = 'ALL' | ProjectCategory;
type FilterStatus = 'ALL' | ProjectStatus;

interface ProjectFormData {
  name: string;
  code: string;
  category: ProjectCategory;
  managerId: string;
  department: string;
  description: string;
}

interface ProjectModalProps {
  project?: AdminProject;
  onClose: () => void;
}

function ProjectModal({ project, onClose }: ProjectModalProps) {
  const isEdit = !!project;
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const [form, setForm] = useState<ProjectFormData>({
    name: project?.name ?? '',
    code: project?.code ?? '',
    category: project?.category ?? 'COMMON',
    managerId: project?.managerId ?? '',
    department: project?.department ?? '',
    description: project?.description ?? '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('프로젝트명과 코드는 필수입니다.');
      return;
    }

    try {
      if (isEdit && project) {
        await updateProject.mutateAsync({
          id: project.id,
          data: {
            name: form.name,
            code: form.code,
            category: form.category,
            managerId: form.managerId || undefined,
            department: form.department || undefined,
            description: form.description || undefined,
          },
        });
        toast.success('프로젝트가 수정되었습니다.');
      } else {
        await createProject.mutateAsync({
          name: form.name,
          code: form.code,
          category: form.category,
          managerId: form.managerId || undefined,
          department: form.department || undefined,
          description: form.description || undefined,
        });
        toast.success('프로젝트가 생성되었습니다.');
      }
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message ?? '저장 실패');
    }
  };

  const inputStyle = {
    border: '1px solid var(--gray-border)',
    color: 'var(--text)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 overflow-y-auto"
        style={{ border: '1px solid var(--gray-border)', maxHeight: '90vh' }}
      >
        <h2 className="text-[15px] font-bold mb-5" style={{ color: 'var(--text)' }}>
          {isEdit ? '프로젝트 수정' : '프로젝트 신규 생성'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--text)' }}>
              프로젝트명 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="예: 팀공통"
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--gray-border)')}
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--text)' }}>
              프로젝트코드 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="예: 공통2500-팀"
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--gray-border)')}
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--text)' }}>
              분류
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as ProjectCategory })}
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
              style={{ ...inputStyle, backgroundColor: 'white' }}
            >
              <option value="COMMON">공통업무</option>
              <option value="EXECUTION">수행과제</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--text)' }}>
              책임자 (이름)
            </label>
            <input
              type="text"
              value={form.managerId}
              onChange={(e) => setForm({ ...form, managerId: e.target.value })}
              placeholder="예: 홍길동"
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--gray-border)')}
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--text)' }}>
              책임부서
            </label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="예: 선행연구개발팀"
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--gray-border)')}
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--text)' }}>
              상세설명
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="프로젝트에 대한 상세 설명"
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none resize-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--gray-border)')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              취소
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={createProject.isPending || updateProject.isPending}
            >
              {isEdit ? '수정' : '생성'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── PENDING 승인 모달 ─────────────────────────────────────────
interface ApproveProjectModalProps {
  project: AdminProject;
  onClose: () => void;
}

function ApproveProjectModal({ project, onClose }: ApproveProjectModalProps) {
  const approveProject = useApproveProject();
  const [code, setCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('프로젝트 코드를 입력하세요.');
      return;
    }
    try {
      await approveProject.mutateAsync({ id: project.id, data: { code: code.trim() } });
      toast.success(`"${project.name}" 프로젝트가 승인되었습니다.`);
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message ?? '승인 실패');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6"
        style={{ border: '1px solid var(--gray-border)' }}
      >
        <h2 className="text-[15px] font-bold mb-1" style={{ color: 'var(--text)' }}>
          프로젝트 승인
        </h2>
        <p className="text-[12px] mb-4" style={{ color: 'var(--text-sub)' }}>
          "{project.name}" 프로젝트를 승인합니다.
          {project.requestedBy && (
            <span> (요청자: {project.requestedBy.name})</span>
          )}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--text)' }}>
              프로젝트 코드 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="예: 수행2500-AI"
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
              style={{ border: '1px solid var(--gray-border)', color: 'var(--text)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--gray-border)')}
              autoFocus
            />
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-sub)' }}>
              승인 시 이 코드로 프로젝트가 활성화됩니다.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              취소
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={approveProject.isPending}
            >
              승인
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectManagement() {
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalProject, setModalProject] = useState<AdminProject | null | 'new'>(null);
  const [approveProject, setApproveProject] = useState<AdminProject | null>(null);

  const { data: projects = [], isLoading } = useAdminProjects();
  const updateProject = useUpdateProject();

  const handleToggleStatus = async (project: AdminProject) => {
    if (project.status === 'PENDING') return; // PENDING 프로젝트는 승인 모달 사용
    const newStatus: ProjectStatus = project.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateProject.mutateAsync({ id: project.id, data: { status: newStatus } });
      toast.success(`"${project.name}" 이(가) ${STATUS_LABELS[newStatus]}으로 변경되었습니다.`);
    } catch {
      toast.error('상태 변경 실패');
    }
  };

  const filtered = projects.filter((p) => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const pendingCount = projects.filter((p) => p.status === 'PENDING').length;

  return (
    <div>
      {/* 툴바 카드 */}
      <div
        className="bg-white rounded-lg border border-[var(--gray-border)] flex flex-wrap items-center gap-3 mb-4"
        style={{ padding: '10px 16px' }}
      >
        <h1 className="text-[16px] font-semibold flex-shrink-0" style={{ color: 'var(--text)' }}>
          프로젝트 관리
        </h1>
        <div className="w-px h-5 bg-[var(--gray-border)]" />

        {/* 검색 */}
        <div className="relative flex-shrink-0" style={{ width: 200 }}>
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-sub)' }} />
          <input
            type="text"
            placeholder="프로젝트명 또는 코드 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded border outline-none transition-colors"
            style={{ borderColor: 'var(--gray-border)', color: 'var(--text)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--gray-border)'; }}
          />
        </div>

        {/* 분류 필터 */}
        <div className="flex gap-1">
          {(['ALL', 'COMMON', 'EXECUTION'] as FilterCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className="px-3 py-1 text-[12px] font-medium rounded border transition-colors"
              style={{
                backgroundColor: categoryFilter === cat ? 'var(--primary-bg)' : 'transparent',
                color: categoryFilter === cat ? 'var(--primary)' : 'var(--text-sub)',
                borderColor: categoryFilter === cat ? 'var(--primary)' : 'var(--gray-border)',
              }}
            >
              {cat === 'ALL' ? '전체' : CATEGORY_LABELS[cat as ProjectCategory]}
            </button>
          ))}
        </div>

        {/* 상태 필터 */}
        <div className="flex gap-1">
          {(['ALL', 'PENDING', 'ACTIVE', 'INACTIVE'] as FilterStatus[]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="px-3 py-1 text-[12px] font-medium rounded border transition-colors"
              style={{
                backgroundColor: statusFilter === st ? 'var(--primary-bg)' : 'transparent',
                color: statusFilter === st ? 'var(--primary)' : 'var(--text-sub)',
                borderColor: statusFilter === st ? 'var(--primary)' : 'var(--gray-border)',
              }}
            >
              {st === 'ALL' ? '전체' : STATUS_LABELS[st as ProjectStatus]}
            </button>
          ))}
        </div>

        <div className="flex-1" />
        {pendingCount > 0 && (
          <Badge variant="warn" dot>{pendingCount}건 승인 대기</Badge>
        )}
        <Button variant="primary" size="sm" onClick={() => setModalProject('new')}>
          <Plus size={13} className="mr-1" />
          프로젝트 생성
        </Button>
      </div>

      {/* 테이블 */}
      <div
        className="bg-white rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--gray-border)' }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>프로젝트명</TableHead>
              <TableHead>코드</TableHead>
              <TableHead>분류</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>책임자</TableHead>
              <TableHead>책임부서</TableHead>
              <TableHead>등록 팀</TableHead>
              <TableHead>업무항목 수</TableHead>
              <TableHead>관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <p className="text-center py-8 text-[13px]" style={{ color: 'var(--text-sub)' }}>
                    불러오는 중...
                  </p>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <p className="text-center py-8 text-[13px]" style={{ color: 'var(--text-sub)' }}>
                    조건에 맞는 프로젝트가 없습니다.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div>
                      <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                        {project.name}
                      </span>
                      {project.requestedBy && (
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-sub)' }}>
                          요청: {project.requestedBy.name}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code
                      className="text-[12px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: 'var(--tbl-header)',
                        color: 'var(--text-sub)',
                      }}
                    >
                      {project.code || '—'}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={project.category === 'COMMON' ? 'blue' : 'warn'}>
                      {CATEGORY_LABELS[project.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[project.status]}>
                      {STATUS_LABELS[project.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-[12px]" style={{ color: 'var(--text-sub)' }}>
                      {project.managerName ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[12px]" style={{ color: 'var(--text-sub)' }}>
                      {project.department ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[13px]" style={{ color: 'var(--text-sub)' }}>
                      {project.teamCount}개 팀
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[13px]" style={{ color: 'var(--text-sub)' }}>
                      {project.workItemCount}건
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {project.status === 'PENDING' ? (
                        <Button
                          size="small"
                          variant="primary"
                          onClick={() => setApproveProject(project)}
                        >
                          승인
                        </Button>
                      ) : (
                        <>
                          <button
                            onClick={() => setModalProject(project)}
                            className="p-1.5 rounded-lg transition-colors"
                            title="수정"
                            style={{ color: 'var(--text-sub)' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--primary-bg)';
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-sub)';
                            }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(project)}
                            className="p-1.5 rounded-lg transition-colors"
                            title={project.status === 'ACTIVE' ? '사용안함으로 변경' : '사용중으로 변경'}
                            style={{ color: project.status === 'ACTIVE' ? 'var(--ok)' : 'var(--text-sub)' }}
                            onMouseEnter={(e) => {
                              const btn = e.currentTarget as HTMLButtonElement;
                              if (project.status === 'ACTIVE') {
                                btn.style.backgroundColor = 'var(--danger-bg)';
                                btn.style.color = 'var(--danger)';
                              } else {
                                btn.style.backgroundColor = 'var(--ok-bg)';
                                btn.style.color = 'var(--ok)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              const btn = e.currentTarget as HTMLButtonElement;
                              btn.style.backgroundColor = 'transparent';
                              btn.style.color = project.status === 'ACTIVE' ? 'var(--ok)' : 'var(--text-sub)';
                            }}
                          >
                            {project.status === 'ACTIVE' ? <CheckCircle size={13} /> : <XCircle size={13} />}
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 생성/수정 모달 */}
      {modalProject && (
        <ProjectModal
          project={modalProject === 'new' ? undefined : modalProject}
          onClose={() => setModalProject(null)}
        />
      )}

      {/* 승인 모달 */}
      {approveProject && (
        <ApproveProjectModal
          project={approveProject}
          onClose={() => setApproveProject(null)}
        />
      )}
    </div>
  );
}
