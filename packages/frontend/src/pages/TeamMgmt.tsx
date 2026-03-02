import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useTeamMembers, useParts, useCreateMember, useUpdateMember, useReorderParts } from '../hooks/useTeamMembers';
import { Member, Part, CreateMemberDto } from '../api/team.api';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../components/ui/Table';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';

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

const ALL_ROLES: ('LEADER' | 'PART_LEADER' | 'MEMBER')[] = ['LEADER', 'PART_LEADER', 'MEMBER'];

interface MemberFormData {
  name: string;
  email: string;
  password: string;
  partId: string;
  roles: ('LEADER' | 'PART_LEADER' | 'MEMBER')[];
  isActive: boolean;
}

const DEFAULT_FORM: MemberFormData = {
  name: '',
  email: '',
  password: '',
  partId: '',
  roles: ['MEMBER'],
  isActive: true,
};

type TabMode = 'members' | 'parts';

// ── Sortable Part Row ─────────────────────────────────────
interface SortablePartRowProps {
  part: Part;
  idx: number;
}

function SortablePartRow({ part, idx }: SortablePartRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: part.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={[
        idx % 2 === 1 ? 'bg-[var(--row-alt)]' : '',
        isDragging ? 'shadow-lg z-10 relative' : '',
      ].join(' ')}
    >
      <TableCell className="w-12 text-center">
        <span
          {...attributes}
          {...listeners}
          className="inline-flex items-center justify-center w-5 h-5 cursor-grab active:cursor-grabbing text-[var(--text-sub)] hover:text-[var(--text)]"
          title="드래그하여 순서 변경"
        >
          ⠿
        </span>
      </TableCell>
      <TableCell className="font-medium text-[13px]">{part.name}</TableCell>
      <TableCell className="text-[var(--text-sub)] text-[12px]">{part.sortOrder}</TableCell>
    </TableRow>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function TeamMgmt() {
  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const teamId = user?.teamId ?? '';

  const [tabMode, setTabMode] = useState<TabMode>('members');
  const [partFilter, setPartFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberFormData>(DEFAULT_FORM);
  const [formError, setFormError] = useState('');
  const [localParts, setLocalParts] = useState<Part[]>([]);

  const { data: parts = [] } = useParts(teamId);
  const { data: members = [], isLoading } = useTeamMembers(teamId, partFilter || undefined);
  const createMutation = useCreateMember(teamId);
  const updateMutation = useUpdateMember(teamId);
  const reorderPartsMutation = useReorderParts(teamId);

  useEffect(() => {
    setLocalParts(parts);
  }, [parts]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handlePartDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localParts.findIndex((p) => p.id === active.id);
    const newIndex = localParts.findIndex((p) => p.id === over.id);
    const newOrder = arrayMove(localParts, oldIndex, newIndex);

    setLocalParts(newOrder);

    try {
      await reorderPartsMutation.mutateAsync(newOrder.map((p) => p.id));
    } catch {
      addToast('danger', '파트 순서 변경에 실패했습니다.');
      setLocalParts(parts); // rollback
    }
  };

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
      roles: member.roles,
      isActive: member.isActive,
    });
    setFormError('');
    setModalOpen(true);
  };

  const toggleRole = (role: 'LEADER' | 'PART_LEADER' | 'MEMBER') => {
    setForm((f) => {
      const hasRole = f.roles.includes(role);
      if (hasRole && f.roles.length <= 1) return f; // 최소 1개
      return {
        ...f,
        roles: hasRole ? f.roles.filter((r) => r !== role) : [...f.roles, role],
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return setFormError('이름을 입력하세요.');
    if (!editMember && !form.email.trim()) return setFormError('이메일을 입력하세요.');
    if (!editMember && !form.password.trim()) return setFormError('비밀번호를 입력하세요.');
    if (!form.partId) return setFormError('파트를 선택하세요.');
    if (form.roles.length === 0) return setFormError('역할을 1개 이상 선택하세요.');

    try {
      if (editMember) {
        await updateMutation.mutateAsync({
          id: editMember.id,
          data: {
            name: form.name,
            partId: form.partId,
            roles: form.roles,
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

  return (
    <div>
      {/* 탭 버튼 */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setTabMode('members')}
          className={[
            'px-4 py-2 text-[13px] font-medium rounded border transition-colors',
            tabMode === 'members'
              ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
              : 'bg-white text-[var(--text-sub)] border-[var(--gray-border)] hover:border-[var(--primary)]',
          ].join(' ')}
        >
          팀원 관리
        </button>
        <button
          onClick={() => setTabMode('parts')}
          className={[
            'px-4 py-2 text-[13px] font-medium rounded border transition-colors',
            tabMode === 'parts'
              ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
              : 'bg-white text-[var(--text-sub)] border-[var(--gray-border)] hover:border-[var(--primary)]',
          ].join(' ')}
        >
          파트 관리
        </button>
      </div>

      {/* ── 팀원 관리 탭 ── */}
      {tabMode === 'members' && (
        <>
          {/* 필터 바 */}
          <div className="bg-white rounded-lg border border-[var(--gray-border)] p-4 mb-4">
            <div className="flex items-center gap-3">
              <Select value={partFilter || 'all'} onValueChange={(v) => setPartFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[140px] h-[30px] text-[12.5px]">
                  <SelectValue placeholder="전체 파트" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 파트</SelectItem>
                  {parts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="이름 또는 이메일 검색"
                className="h-[30px] text-[12.5px] w-[200px]"
              />

              <div className="ml-auto">
                <Button onClick={openCreate}>+ 팀원 등록</Button>
              </div>
            </div>
          </div>

          {/* 팀원 테이블 */}
          <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden">
            <div
              className="flex items-center justify-between border-b border-[var(--gray-border)]"
              style={{ padding: '11px 16px' }}
            >
              <p className="text-[13px] font-semibold text-[var(--text)]">팀원 목록</p>
              <p className="text-[12px] text-[var(--text-sub)]">총 {filteredMembers.length}명</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>파트</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-[var(--text-sub)]">
                      로딩 중...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filteredMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-[var(--text-sub)]">
                      팀원이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
                {filteredMembers.map((member, idx) => (
                  <TableRow
                    key={member.id}
                    className={[
                      !member.isActive ? 'opacity-50' : '',
                      idx % 2 === 1 ? 'bg-[var(--row-alt)]' : '',
                    ].join(' ')}
                  >
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-[var(--text-sub)]">{member.email}</TableCell>
                    <TableCell>{member.partName ?? member.partId}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.roles.map((role) => (
                          <Badge key={role} variant={ROLE_BADGE[role] ?? 'gray'}>
                            {ROLE_LABELS[role] ?? role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.isActive ? 'ok' : 'gray'}>
                        {member.isActive ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="small" variant="outline" onClick={() => openEdit(member)}>
                        수정
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* ── 파트 관리 탭 ── */}
      {tabMode === 'parts' && (
        <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden">
          <div
            className="flex items-center justify-between border-b border-[var(--gray-border)]"
            style={{ padding: '11px 16px' }}
          >
            <p className="text-[13px] font-semibold text-[var(--text)]">파트 목록</p>
            <p className="text-[12px] text-[var(--text-sub)]">드래그하여 순서 변경</p>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handlePartDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">순서</TableHead>
                  <TableHead>파트명</TableHead>
                  <TableHead>sortOrder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localParts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-[var(--text-sub)]">
                      파트가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
                <SortableContext
                  items={localParts.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {localParts.map((part, idx) => (
                    <SortablePartRow key={part.id} part={part} idx={idx} />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </div>
      )}

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
          {/* 이름 */}
          <div className="grid gap-[10px]" style={{ gridTemplateColumns: '90px 1fr', alignItems: 'center' }}>
            <Label>이름 <span className="text-[var(--danger)]">*</span></Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-8 text-[12.5px]"
            />
          </div>
          {!editMember && (
            <>
              <div className="grid gap-[10px]" style={{ gridTemplateColumns: '90px 1fr', alignItems: 'center' }}>
                <Label>이메일 <span className="text-[var(--danger)]">*</span></Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="h-8 text-[12.5px]"
                />
              </div>
              <div className="grid gap-[10px]" style={{ gridTemplateColumns: '90px 1fr', alignItems: 'center' }}>
                <Label>비밀번호 <span className="text-[var(--danger)]">*</span></Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="h-8 text-[12.5px]"
                />
              </div>
            </>
          )}
          {/* 파트 */}
          <div className="grid gap-[10px]" style={{ gridTemplateColumns: '90px 1fr', alignItems: 'center' }}>
            <Label>파트 <span className="text-[var(--danger)]">*</span></Label>
            <Select
              value={form.partId || 'none'}
              onValueChange={(v) => setForm((f) => ({ ...f, partId: v === 'none' ? '' : v }))}
            >
              <SelectTrigger className="h-8 text-[12.5px]">
                <SelectValue placeholder="파트 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">파트 선택</SelectItem>
                {parts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* 역할 - 체크박스 다중 선택 */}
          <div className="grid gap-[10px]" style={{ gridTemplateColumns: '90px 1fr', alignItems: 'start' }}>
            <Label className="pt-1">역할</Label>
            <div className="flex flex-col gap-2">
              {ALL_ROLES.map((role) => (
                <label key={role} className="flex items-center gap-2 text-[12.5px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.roles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="accent-[var(--primary)] w-4 h-4"
                  />
                  <Badge variant={ROLE_BADGE[role] ?? 'gray'}>{ROLE_LABELS[role]}</Badge>
                </label>
              ))}
              {form.roles.length === 0 && (
                <p className="text-[11px] text-[var(--danger)]">역할을 1개 이상 선택하세요.</p>
              )}
            </div>
          </div>
          {/* 상태 (편집 시만) */}
          {editMember && (
            <div className="grid gap-[10px]" style={{ gridTemplateColumns: '90px 1fr', alignItems: 'center' }}>
              <Label>상태</Label>
              <label className="flex items-center gap-2 text-[12.5px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="accent-[var(--primary)] w-4 h-4"
                />
                활성 상태
              </label>
            </div>
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
