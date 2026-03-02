import React, { useState } from 'react';
import { useAdminTeams, useUpdateTeamStatus } from '../../hooks/useAdmin';
import { TeamStatus, AdminTeam } from '../../api/admin.api';
import { useUiStore } from '../../stores/uiStore';
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

const STATUS_LABELS: Record<TeamStatus, string> = {
  PENDING: '신청',
  APPROVED: '승인',
  ACTIVE: '사용중',
  INACTIVE: '종료',
};

const STATUS_BADGE_VARIANT: Record<TeamStatus, 'warn' | 'blue' | 'ok' | 'gray'> = {
  PENDING: 'warn',
  APPROVED: 'blue',
  ACTIVE: 'ok',
  INACTIVE: 'gray',
};

type FilterOption = 'ALL' | TeamStatus;

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '신청' },
  { value: 'APPROVED', label: '승인' },
  { value: 'ACTIVE', label: '사용중' },
  { value: 'INACTIVE', label: '종료' },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

interface StatusActionButtonsProps {
  team: AdminTeam;
  onChangeStatus: (id: string, status: TeamStatus) => void;
  isPending: boolean;
}

function StatusActionButtons({ team, onChangeStatus, isPending }: StatusActionButtonsProps) {
  const { teamStatus: status, id } = team;

  return (
    <div className="flex items-center gap-1 justify-end">
      {status === 'PENDING' && (
        <Button
          size="small"
          onClick={() => onChangeStatus(id, 'APPROVED')}
          disabled={isPending}
        >
          승인
        </Button>
      )}
      {status === 'APPROVED' && (
        <>
          <Button
            size="small"
            onClick={() => onChangeStatus(id, 'ACTIVE')}
            disabled={isPending}
          >
            활성화
          </Button>
          <Button
            size="small"
            variant="outline"
            onClick={() => onChangeStatus(id, 'INACTIVE')}
            disabled={isPending}
          >
            종료
          </Button>
        </>
      )}
      {status === 'ACTIVE' && (
        <Button
          size="small"
          variant="outline"
          onClick={() => onChangeStatus(id, 'INACTIVE')}
          disabled={isPending}
        >
          종료
        </Button>
      )}
      {status === 'INACTIVE' && (
        <Button
          size="small"
          variant="outline"
          onClick={() => onChangeStatus(id, 'ACTIVE')}
          disabled={isPending}
        >
          재활성화
        </Button>
      )}
    </div>
  );
}

export default function TeamManagement() {
  const { addToast } = useUiStore();
  const [filter, setFilter] = useState<FilterOption>('ALL');

  const { data: teams = [], isLoading } = useAdminTeams(
    filter === 'ALL' ? undefined : filter,
  );
  const updateStatusMutation = useUpdateTeamStatus();

  const handleChangeStatus = async (id: string, status: TeamStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, data: { status } });
      addToast('success', `팀 상태가 "${STATUS_LABELS[status]}"으로 변경되었습니다.`);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        '상태 변경에 실패했습니다.';
      addToast('danger', msg);
    }
  };

  return (
    <div>
      {/* 필터 바 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] p-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-medium" style={{ color: 'var(--text-sub)' }}>
            상태 필터:
          </span>
          <div className="flex gap-1">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={[
                  'px-3 py-1 text-[12px] font-medium rounded border transition-colors',
                  filter === opt.value
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'bg-white text-[var(--text-sub)] border-[var(--gray-border)] hover:border-[var(--primary)] hover:text-[var(--primary)]',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 팀 목록 테이블 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden">
        <div
          className="flex items-center justify-between border-b border-[var(--gray-border)]"
          style={{ padding: '11px 16px' }}
        >
          <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
            팀 목록
          </p>
          <p className="text-[12px]" style={{ color: 'var(--text-sub)' }}>
            총 {teams.length}건
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>팀명</TableHead>
              <TableHead>신청자</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>구성원</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>신청일</TableHead>
              <TableHead className="text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10" style={{ color: 'var(--text-sub)' }}>
                  로딩 중...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && teams.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10" style={{ color: 'var(--text-sub)' }}>
                  팀이 없습니다.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              teams.map((team: AdminTeam, idx: number) => (
                <TableRow
                  key={team.id}
                  className={idx % 2 === 1 ? 'bg-[var(--row-alt)]' : ''}
                >
                  <TableCell className="font-medium text-[13px]">{team.name}</TableCell>
                  <TableCell className="text-[12px]">{team.requestedBy?.name ?? '—'}</TableCell>
                  <TableCell className="text-[var(--text-sub)] text-[12px]">{team.requestedBy?.email ?? '—'}</TableCell>
                  <TableCell className="text-[12px]">
                    {team.memberCount != null ? `${team.memberCount}명` : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[team.teamStatus]}>
                      {STATUS_LABELS[team.teamStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px]" style={{ color: 'var(--text-sub)' }}>
                    {formatDate(team.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusActionButtons
                      team={team}
                      onChangeStatus={handleChangeStatus}
                      isPending={updateStatusMutation.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
