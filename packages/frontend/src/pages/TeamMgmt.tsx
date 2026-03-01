import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useTeamMembers, useParts, useCreateMember, useUpdateMember } from '../hooks/useTeamMembers';
import { Member, CreateMemberDto } from '../api/team.api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import SummaryCard from '../components/ui/SummaryCard';

const ROLE_LABELS: Record<string, string> = {
  LEADER: '팀장',
  PART_LEADER: '파트장',
  MEMBER: '팀원',
};

const ROLE_BADGE: Record<string, 'purple' | 'blue' | 'gray'> = {
  LEADER: 'purple',
  PART_LEADER: 'blue',
  MEMBER: 'gray',
};

interface MemberFormData {
  name: string;
  email: string;
  password: string;
  partId: string;
  role: 'LEADER' | 'PART_LEADER' | 'MEMBER';
  isActive: boolean;
}

const DEFAULT_FORM: MemberFormData = {
  name: '',
  email: '',
  password: '',
  partId: '',
  role: 'MEMBER',
  isActive: true,
};

export default function TeamMgmt() {
  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const teamId = user?.id ? '1' : ''; // 실제로는 user.teamId를 사용

  const [partFilter, setPartFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberFormData>(DEFAULT_FORM);
  const [formError, setFormError] = useState('');

  const { data: parts = [] } = useParts(teamId || '1');
  const { data: members = [], isLoading } = useTeamMembers(teamId || '1', partFilter || undefined);
  const createMutation = useCreateMember(teamId || '1');
  const updateMutation = useUpdateMember(teamId || '1');

  const filteredMembers = members.filter((m) => {
    if (searchText && !m.name.includes(searchText) && !m.email.includes(searchText)) return false;
    return true;
  });

  const openCreate = () => {
    setEditMember(null);
    setForm(DEFAULT_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditMember(member);
    setForm({
      name: member.name,
      email: member.email,
      password: '',
      partId: member.partId,
      role: member.role,
      isActive: member.isActive,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return setFormError('이름을 입력하세요.');
    if (!editMember && !form.email.trim()) return setFormError('이메일을 입력하세요.');
    if (!editMember && !form.password.trim()) return setFormError('비밀번호를 입력하세요.');
    if (!form.partId) return setFormError('파트를 선택하세요.');

    try {
      if (editMember) {
        await updateMutation.mutateAsync({
          id: editMember.id,
          data: {
            name: form.name,
            partId: form.partId,
            role: form.role,
            isActive: form.isActive,
          },
        });
        addToast('success', `${form.name} 님 정보가 수정되었습니다.`);
      } else {
        await createMutation.mutateAsync(form as CreateMemberDto);
        addToast('success', `${form.name} 님이 등록되었습니다.`);
      }
      setModalOpen(false);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '오류가 발생했습니다.';
      addToast('danger', msg);
    }
  };

  const totalCount = members.length;
  const activeCount = members.filter((m) => m.isActive).length;

  return (
    <div>
      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <SummaryCard label="전체 인원" value={totalCount} />
        <SummaryCard label="활성 인원" value={activeCount} />
        {parts.map((part) => (
          <SummaryCard
            key={part.id}
            label={`${part.name} 파트`}
            value={members.filter((m) => m.partId === part.id).length}
          />
        ))}
      </div>

      {/* 필터 + 등록 버튼 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] p-4 mb-4">
        <div className="flex items-center gap-3">
          <select
            value={partFilter}
            onChange={(e) => setPartFilter(e.target.value)}
            className="h-8 px-2 border border-[var(--gray-border)] rounded text-[12px] outline-none"
          >
            <option value="">전체 파트</option>
            {parts.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="이름 또는 이메일 검색"
            className="h-8 px-3 border border-[var(--gray-border)] rounded text-[12px] outline-none w-[200px]"
          />
          <div className="ml-auto">
            <Button onClick={openCreate}>+ 팀원 등록</Button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[var(--tbl-header)] border-b border-[var(--gray-border)]">
              <th className="text-left px-4 py-2.5 font-medium text-[var(--text-sub)]">이름</th>
              <th className="text-left px-4 py-2.5 font-medium text-[var(--text-sub)]">이메일</th>
              <th className="text-left px-4 py-2.5 font-medium text-[var(--text-sub)]">파트</th>
              <th className="text-left px-4 py-2.5 font-medium text-[var(--text-sub)]">역할</th>
              <th className="text-left px-4 py-2.5 font-medium text-[var(--text-sub)]">상태</th>
              <th className="text-right px-4 py-2.5 font-medium text-[var(--text-sub)]">액션</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-[var(--text-sub)]">
                  로딩 중...
                </td>
              </tr>
            )}
            {!isLoading && filteredMembers.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-[var(--text-sub)]">
                  팀원이 없습니다.
                </td>
              </tr>
            )}
            {filteredMembers.map((member, idx) => (
              <tr
                key={member.id}
                className={[
                  'border-b border-[var(--gray-border)] hover:bg-[var(--row-alt)]',
                  !member.isActive ? 'opacity-50' : '',
                  idx % 2 === 1 ? 'bg-[var(--row-alt)]' : '',
                ].join(' ')}
              >
                <td className="px-4 py-2.5 font-medium">{member.name}</td>
                <td className="px-4 py-2.5 text-[var(--text-sub)]">{member.email}</td>
                <td className="px-4 py-2.5">{member.partName ?? member.partId}</td>
                <td className="px-4 py-2.5">
                  <Badge variant={ROLE_BADGE[member.role] ?? 'gray'}>
                    {ROLE_LABELS[member.role] ?? member.role}
                  </Badge>
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={member.isActive ? 'ok' : 'gray'}>
                    {member.isActive ? '활성' : '비활성'}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button size="small" variant="outline" onClick={() => openEdit(member)}>
                    수정
                  </Button>
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
        title={editMember ? '팀원 수정' : '팀원 등록'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>취소</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editMember ? '수정' : '등록'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1">이름 *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full h-8 px-3 border border-[var(--gray-border)] rounded text-[12px] outline-none focus:border-[var(--primary)]"
            />
          </div>
          {!editMember && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1">이메일 *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full h-8 px-3 border border-[var(--gray-border)] rounded text-[12px] outline-none focus:border-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1">비밀번호 *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full h-8 px-3 border border-[var(--gray-border)] rounded text-[12px] outline-none focus:border-[var(--primary)]"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1">파트 *</label>
            <select
              value={form.partId}
              onChange={(e) => setForm((f) => ({ ...f, partId: e.target.value }))}
              className="w-full h-8 px-2 border border-[var(--gray-border)] rounded text-[12px] outline-none"
            >
              <option value="">파트 선택</option>
              {parts.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-sub)] mb-1">역할</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as MemberFormData['role'] }))}
              className="w-full h-8 px-2 border border-[var(--gray-border)] rounded text-[12px] outline-none"
            >
              <option value="MEMBER">팀원</option>
              <option value="PART_LEADER">파트장</option>
              <option value="LEADER">팀장</option>
            </select>
          </div>
          {editMember && (
            <label className="flex items-center gap-2 text-[12px]">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              활성 상태
            </label>
          )}
          {formError && (
            <p className="text-[11px] text-[var(--danger)] bg-[var(--danger-bg)] px-3 py-2 rounded">
              {formError}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
