import React, { useState, useDeferredValue } from 'react';
import { Search } from 'lucide-react';
import { useAdminAccounts, useUpdateAccountStatus, useResetPassword } from '../../hooks/useAdmin';
import { AccountStatus, AdminAccount } from '../../api/admin.api';
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

const STATUS_LABELS: Record<AccountStatus, string> = {
  PENDING: '신청',
  APPROVED: '승인',
  ACTIVE: '사용중',
  INACTIVE: '종료',
};

const STATUS_BADGE_VARIANT: Record<AccountStatus, 'warn' | 'blue' | 'ok' | 'gray'> = {
  PENDING: 'warn',
  APPROVED: 'blue',
  ACTIVE: 'ok',
  INACTIVE: 'gray',
};

type FilterOption = 'ALL' | AccountStatus;

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
  account: AdminAccount;
  onChangeStatus: (id: string, status: AccountStatus) => void;
  onResetPassword: (id: string, name: string) => void;
  isPending: boolean;
}

function StatusActionButtons({ account, onChangeStatus, onResetPassword, isPending }: StatusActionButtonsProps) {
  const { accountStatus: status, id } = account;

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
        <>
          <Button
            size="small"
            variant="outline"
            onClick={() => onResetPassword(id, account.name)}
            disabled={isPending}
          >
            PW초기화
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

export default function AccountManagement() {
  const { addToast } = useUiStore();
  const [filter, setFilter] = useState<FilterOption>('ALL');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const queryParams = {
    ...(filter !== 'ALL' && { status: filter }),
    ...(deferredSearch && { search: deferredSearch }),
  };
  const { data: accounts = [], isLoading } = useAdminAccounts(
    Object.keys(queryParams).length > 0 ? queryParams : undefined,
  );
  const updateStatusMutation = useUpdateAccountStatus();
  const resetPasswordMutation = useResetPassword();

  const handleChangeStatus = async (id: string, status: AccountStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, data: { status } });
      addToast('success', `계정 상태가 "${STATUS_LABELS[status]}"으로 변경되었습니다.`);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        '상태 변경에 실패했습니다.';
      addToast('danger', msg);
    }
  };

  const handleResetPassword = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" 계정의 비밀번호를 초기화하시겠습니까?`)) return;
    try {
      await resetPasswordMutation.mutateAsync(id);
      addToast('success', `"${name}" 계정의 비밀번호가 초기화되었습니다.`);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        '비밀번호 초기화에 실패했습니다.';
      addToast('danger', msg);
    }
  };

  return (
    <div>
      {/* 필터 바 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] p-4 mb-4">
        <div className="flex items-center gap-4">
          {/* 검색 */}
          <div className="relative flex-shrink-0" style={{ width: 220 }}>
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-sub)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="성명 또는 이메일 검색"
              className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded border outline-none transition-colors"
              style={{
                borderColor: 'var(--gray-border)',
                color: 'var(--text)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--gray-border)'; }}
            />
          </div>

          {/* 상태 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] font-medium" style={{ color: 'var(--text-sub)' }}>
              상태:
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
      </div>

      {/* 계정 목록 테이블 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden">
        <div
          className="flex items-center justify-between border-b border-[var(--gray-border)]"
          style={{ padding: '11px 16px' }}
        >
          <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
            계정 목록
          </p>
          <p className="text-[12px]" style={{ color: 'var(--text-sub)' }}>
            총 {accounts.length}건
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>성명</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>소속팀</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>가입일</TableHead>
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
            {!isLoading && accounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10" style={{ color: 'var(--text-sub)' }}>
                  계정이 없습니다.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              accounts.map((account: AdminAccount, idx: number) => (
                <TableRow
                  key={account.id}
                  className={idx % 2 === 1 ? 'bg-[var(--row-alt)]' : ''}
                >
                  <TableCell className="font-medium text-[13px]">{account.name}</TableCell>
                  <TableCell className="text-[var(--text-sub)] text-[12px]">{account.email}</TableCell>
                  <TableCell className="text-[12px]">
                    {account.teams && account.teams.length > 0
                      ? account.teams.map((t: { id: string; name: string }) => t.name).join(', ')
                      : '—'}
                  </TableCell>
                  <TableCell className="text-[12px]">{account.roles?.join(', ') ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[account.accountStatus]}>
                      {STATUS_LABELS[account.accountStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px]" style={{ color: 'var(--text-sub)' }}>
                    {formatDate(account.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusActionButtons
                      account={account}
                      onChangeStatus={handleChangeStatus}
                      onResetPassword={handleResetPassword}
                      isPending={updateStatusMutation.isPending || resetPasswordMutation.isPending}
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
