import React, { useState } from 'react';
import SummaryCard from '../components/ui/SummaryCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { partApi, TeamWeeklyOverview } from '../api/part.api';
import { exportApi } from '../api/export.api';

function getWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

const ROLE_LABEL: Record<string, string> = {
  LEADER: '팀장',
  PART_LEADER: '파트장',
  MEMBER: '팀원',
};

const STATUS_VARIANT: Record<string, 'ok' | 'warn' | 'danger' | 'gray'> = {
  SUBMITTED: 'ok',
  DRAFT: 'warn',
  NOT_STARTED: 'gray',
};

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: '제출완료',
  DRAFT: '임시저장',
  NOT_STARTED: '미작성',
};

const SUMMARY_STATUS_VARIANT: Record<string, 'ok' | 'warn' | 'gray'> = {
  SUBMITTED: 'ok',
  DRAFT: 'warn',
  NOT_STARTED: 'gray',
};

interface FlatMember {
  memberId: string;
  memberName: string;
  role: string;
  partName: string;
  status: 'SUBMITTED' | 'DRAFT' | 'NOT_STARTED';
  workItemCount: number;
  updatedAt: string | null;
}

interface PartSummaryRow {
  partId: string;
  partName: string;
  partLeaderName: string;
  summaryStatus: 'SUBMITTED' | 'DRAFT' | 'NOT_STARTED';
  submittedCount: number;
  totalCount: number;
}

function buildFlatMembers(teamOverview: TeamWeeklyOverview[]): FlatMember[] {
  return teamOverview.flatMap((o) =>
    o.members.map((m) => ({
      memberId: m.member.id,
      memberName: m.member.name,
      role: m.member.roles?.[0] ?? 'MEMBER',
      partName: o.part.name,
      status: m.report ? m.report.status : 'NOT_STARTED',
      workItemCount: m.report ? m.report.workItems.length : 0,
      updatedAt: null,
    })),
  );
}

function buildPartSummaryRows(teamOverview: TeamWeeklyOverview[]): PartSummaryRow[] {
  return teamOverview.map((o) => {
    const partLeader = o.members.find((m) => m.member.roles?.includes('PART_LEADER'));
    const submittedCount = o.members.filter(
      (m) => m.report?.status === 'SUBMITTED',
    ).length;
    return {
      partId: o.part.id,
      partName: o.part.name,
      partLeaderName: partLeader?.member.name ?? '—',
      summaryStatus: o.summaryStatus,
      submittedCount,
      totalCount: o.members.length,
    };
  });
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [currentWeek] = useState(() => getWeekLabel(new Date()));
  const [exporting, setExporting] = useState(false);

  const isLeader = user?.roles.includes('LEADER') ?? false;
  const isPartLeader = user?.roles.includes('PART_LEADER') ?? false;
  const partId = user?.partId ?? '';
  const teamId = user?.teamId ?? '';

  const { data: teamOverview = [] } = useQuery({
    queryKey: ['team-weekly-overview', teamId, currentWeek],
    queryFn: () =>
      partApi.getTeamWeeklyOverview(teamId, currentWeek).then((r) => r.data.data),
    enabled: (isLeader || isPartLeader) && !!teamId,
  });

  // For PART_LEADER: filter to own part only
  const visibleOverview: TeamWeeklyOverview[] = isLeader
    ? teamOverview
    : isPartLeader
      ? teamOverview.filter((o) => o.part.id === partId)
      : [];

  const flatMembers = buildFlatMembers(visibleOverview);
  const partSummaryRows = buildPartSummaryRows(visibleOverview);

  const totalMembers = flatMembers.length;
  const submittedMembers = flatMembers.filter((m) => m.status === 'SUBMITTED');
  const draftMembers = flatMembers.filter((m) => m.status === 'DRAFT');
  const notStartedMembers = flatMembers.filter((m) => m.status === 'NOT_STARTED');

  const handleExcelExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportApi.downloadExcel({ type: 'team', teamId, week: currentWeek });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      {/* 요약 카드 4개 */}
      <div className="grid grid-cols-4 mb-4" style={{ gap: '12px' }}>
        <SummaryCard
          icon="👥"
          label="전체 팀원"
          value={totalMembers}
          subText="명"
          iconBg="var(--primary-bg)"
        />
        <SummaryCard
          icon="✅"
          label="제출 완료"
          value={submittedMembers.length}
          subText={`/ ${totalMembers} 명`}
          iconBg="var(--ok-bg)"
        />
        <SummaryCard
          icon="📝"
          label="임시저장"
          value={draftMembers.length}
          subText={
            draftMembers.length > 0
              ? draftMembers.map((m) => m.memberName).join(', ')
              : '없음'
          }
          iconBg="var(--warn-bg)"
        />
        <SummaryCard
          icon="❌"
          label="미작성"
          value={notStartedMembers.length}
          subText={`/ ${totalMembers} 명`}
          iconBg="var(--danger-bg)"
        />
      </div>

      {/* 팀원 작성 현황 테이블 */}
      {(isLeader || isPartLeader) && flatMembers.length > 0 && (
        <div
          className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden mb-[var(--content-gap,12px)]"
        >
          <div
            className="flex items-center justify-between border-b border-[var(--gray-border)]"
            style={{ padding: '11px 16px' }}
          >
            <p className="text-[13px] font-semibold text-[var(--text)]">팀원 작성 현황</p>
            <div className="flex items-center gap-3">
              <p className="text-[12px] text-[var(--text-sub)]">{currentWeek}</p>
              {isLeader && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExcelExport}
                  disabled={exporting}
                >
                  {exporting ? '내보내는 중...' : 'Excel 내보내기'}
                </Button>
              )}
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--tbl-header)]">
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">
                  파트
                </th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">
                  성명
                </th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">
                  역할
                </th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">
                  업무항목 수
                </th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">
                  작성 상태
                </th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">
                  최종 수정
                </th>
              </tr>
            </thead>
            <tbody>
              {flatMembers.map((m, idx) => {
                const isNotStarted = m.status === 'NOT_STARTED';
                const statusVariant = STATUS_VARIANT[m.status] ?? 'gray';
                const statusLabel = STATUS_LABEL[m.status] ?? m.status;
                const rowBg = isNotStarted
                  ? { backgroundColor: 'var(--danger-bg)' }
                  : idx % 2 === 1
                    ? { backgroundColor: 'var(--row-alt)' }
                    : undefined;
                return (
                  <tr
                    key={m.memberId}
                    className="border-b border-[var(--gray-border)]"
                    style={rowBg}
                  >
                    <td className="px-3 py-[9px]">
                      <Badge variant="purple">{m.partName}</Badge>
                    </td>
                    <td className="px-3 py-[9px] text-[12.5px] font-medium text-[var(--text)]">
                      {m.memberName}
                    </td>
                    <td className="px-3 py-[9px] text-[12.5px] text-[var(--text-sub)]">
                      {ROLE_LABEL[m.role] ?? m.role}
                    </td>
                    <td className="px-3 py-[9px] text-[12.5px] text-[var(--text)]">
                      {m.workItemCount}
                    </td>
                    <td className="px-3 py-[9px]">
                      <Badge variant={statusVariant} dot>
                        {statusLabel}
                      </Badge>
                    </td>
                    <td className="px-3 py-[9px] text-[12px] text-[var(--text-sub)]">
                      {m.updatedAt ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 파트 취합 현황 테이블 */}
      {isLeader && partSummaryRows.length > 0 && (
        <div
          className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden mb-[var(--content-gap,12px)]"
        >
          <div
            className="flex items-center justify-between border-b border-[var(--gray-border)]"
            style={{ padding: '11px 16px' }}
          >
            <p className="text-[13px] font-semibold text-[var(--text)]">파트 취합 현황</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--tbl-header)]">
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">
                  파트
                </th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">
                  파트장
                </th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">
                  취합 상태
                </th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">
                  팀원 제출률
                </th>
              </tr>
            </thead>
            <tbody>
              {partSummaryRows.map((p, idx) => {
                const summaryVariant = SUMMARY_STATUS_VARIANT[p.summaryStatus] ?? 'gray';
                const summaryLabel = STATUS_LABEL[p.summaryStatus] ?? p.summaryStatus;
                const pct =
                  p.totalCount > 0
                    ? Math.round((p.submittedCount / p.totalCount) * 100)
                    : 0;
                return (
                  <tr
                    key={p.partId}
                    className={[
                      'border-b border-[var(--gray-border)]',
                      idx % 2 === 1 ? 'bg-[var(--row-alt)]' : '',
                    ].join(' ')}
                  >
                    <td className="px-3 py-[9px] text-[12.5px] font-medium text-[var(--text)]">
                      {p.partName}
                    </td>
                    <td className="px-3 py-[9px] text-[12.5px] text-[var(--text-sub)]">
                      {p.partLeaderName}
                    </td>
                    <td className="px-3 py-[9px]">
                      <Badge variant={summaryVariant} dot>
                        {summaryLabel}
                      </Badge>
                    </td>
                    <td className="px-3 py-[9px]">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 rounded-full overflow-hidden"
                          style={{ height: '6px', backgroundColor: 'var(--gray-light)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor:
                                pct === 100
                                  ? 'var(--ok)'
                                  : pct > 0
                                    ? 'var(--warn)'
                                    : 'var(--gray-border)',
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-[var(--text-sub)] w-8">
                          {pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
