import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SummaryCard from '../components/ui/SummaryCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';
import { useTeamStore } from '../stores/teamStore';
import { useQuery } from '@tanstack/react-query';
import { partApi, TeamWeeklyOverview } from '../api/part.api';
import { teamApi } from '../api/team.api';
import { exportApi } from '../api/export.api';
import { getWeekLabel, addWeeks, formatWeekLabel } from '@uc-teamspace/shared/constants/week-utils';
import {
  formatYearMonth,
  getCurrentYearMonth,
  getPreviousYearMonth,
  getNextYearMonth,
} from '@uc-teamspace/shared/constants/timesheet-utils';
import {
  ROLE_LABEL,
  REPORT_STATUS_LABEL,
  REPORT_STATUS_VARIANT,
  POSITION_LABEL,
  TIMESHEET_STATUS_LABEL,
  TIMESHEET_STATUS_VARIANT,
} from '../constants/labels';
import { useTeamMembersStatus } from '../hooks/useTimesheet';
import { usePersonalTaskSummary } from '../hooks/usePersonalTasks';

const SUMMARY_STATUS_VARIANT: Record<string, 'ok' | 'warn' | 'gray'> = {
  SUBMITTED: 'ok',
  DRAFT: 'warn',
  NOT_STARTED: 'gray',
};

type ViewMode = 'weekly' | 'timesheet';
type CardFilter = string | null; // status filter or null for all

interface FlatMember {
  memberId: string;
  memberName: string;
  role: string;
  position: string | null;
  jobTitle: string | null;
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
      position: m.member.position ?? null,
      jobTitle: m.member.jobTitle ?? null,
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

// ──────────── 이전 주 기본값 (전주) ────────────
function getPrevWeekLabel() {
  return addWeeks(getWeekLabel(new Date()), -1);
}

// ──────────── 이전 월 기본값 (전월) ────────────
function getPrevYearMonth() {
  return getPreviousYearMonth(getCurrentYearMonth());
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { currentTeamId } = useTeamStore();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [currentWeek, setCurrentWeek] = useState(getPrevWeekLabel);
  const [currentMonth, setCurrentMonth] = useState(getPrevYearMonth);
  const [exporting, setExporting] = useState(false);
  const [cardFilter, setCardFilter] = useState<CardFilter>(null);

  const isLeader = user?.roles.includes('LEADER') ?? false;
  const isPartLeader = user?.roles.includes('PART_LEADER') ?? false;
  const teamId = currentTeamId ?? user?.teamId ?? '';

  // 개인 작업 요약
  const { data: taskSummary } = usePersonalTaskSummary(teamId || undefined);

  // PART_LEADER의 파트 ID는 TeamMembership에서 조회
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['members', teamId],
    queryFn: () => teamApi.getMembers(teamId).then((r) => r.data.data),
    enabled: isPartLeader && !!teamId,
    staleTime: 60_000,
  });
  const partId = teamMembers.find((m) => m.id === user?.id)?.partId ?? '';

  // ─── 주간업무보고 데이터 ───
  const { data: teamOverview = [] } = useQuery({
    queryKey: ['team-weekly-overview', teamId, currentWeek],
    queryFn: () =>
      partApi.getTeamWeeklyOverview(teamId, currentWeek).then((r) => r.data.data),
    enabled: viewMode === 'weekly' && (isLeader || isPartLeader) && !!teamId,
    staleTime: 30_000,
  });

  const visibleOverview: TeamWeeklyOverview[] = isLeader
    ? teamOverview
    : isPartLeader
      ? teamOverview.filter((o) => o.part.id === partId)
      : [];

  const flatMembers = buildFlatMembers(visibleOverview);
  const partSummaryRows = buildPartSummaryRows(visibleOverview);

  const weeklyTotal = flatMembers.length;
  const weeklySubmitted = flatMembers.filter((m) => m.status === 'SUBMITTED');
  const weeklyDraft = flatMembers.filter((m) => m.status === 'DRAFT');
  const weeklyNotStarted = flatMembers.filter((m) => m.status === 'NOT_STARTED');

  // 카드 필터 적용 (주간업무보고)
  const filteredWeeklyMembers = useMemo(() => {
    if (!cardFilter) return flatMembers;
    return flatMembers.filter((m) => m.status === cardFilter);
  }, [flatMembers, cardFilter]);

  // ─── 근무시간표 데이터 ───
  const { data: tsMembers = [] } = useTeamMembersStatus(
    viewMode === 'timesheet' ? currentTeamId : null,
    currentMonth,
  );

  const tsTotal = tsMembers.length;
  const tsSubmitted = tsMembers.filter((r) => r.status === 'SUBMITTED' || r.status === 'APPROVED');
  const tsDraft = tsMembers.filter((r) => r.status === 'DRAFT');
  const tsNotStarted = tsMembers.filter((r) => r.status === 'NOT_STARTED');
  const tsNotSubmitted = tsMembers.filter((r) => r.status !== 'SUBMITTED' && r.status !== 'APPROVED');

  // 카드 필터 적용 (근무시간표)
  const filteredTsMembers = useMemo(() => {
    if (!cardFilter) return tsMembers;
    if (cardFilter === 'NOT_SUBMITTED') return tsNotSubmitted;
    return tsMembers.filter((r) => r.status === cardFilter);
  }, [tsMembers, cardFilter, tsNotSubmitted]);

  const handleExcelExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportApi.downloadExcel({ type: 'team', teamId, week: currentWeek });
    } finally {
      setExporting(false);
    }
  };

  const toggleCardFilter = (status: string) => {
    setCardFilter((prev) => (prev === status ? null : status));
  };

  return (
    <div>
      {/* 툴바 카드 */}
      <div
        className="bg-white rounded-lg border border-[var(--gray-border)] flex items-center gap-3 mb-4"
        style={{ padding: '10px 16px' }}
      >
        {/* 뷰 토글 */}
        <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid var(--gray-border)' }}>
          <button
            onClick={() => { setViewMode('weekly'); setCardFilter(null); }}
            className="px-3 py-1 text-[12px] font-medium transition-colors"
            style={{
              backgroundColor: viewMode === 'weekly' ? 'var(--primary)' : 'white',
              color: viewMode === 'weekly' ? 'white' : 'var(--text-sub)',
            }}
          >
            주간업무보고
          </button>
          <button
            onClick={() => { setViewMode('timesheet'); setCardFilter(null); }}
            className="px-3 py-1 text-[12px] font-medium transition-colors"
            style={{
              backgroundColor: viewMode === 'timesheet' ? 'var(--primary)' : 'white',
              color: viewMode === 'timesheet' ? 'white' : 'var(--text-sub)',
              borderLeft: '1px solid var(--gray-border)',
            }}
          >
            근무시간표
          </button>
        </div>

        <div className="w-px h-5 bg-[var(--gray-border)]" />

        {/* 날짜 네비게이션 */}
        {viewMode === 'weekly' ? (
          <>
            <button
              onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--text-sub)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[14px] font-medium min-w-[160px] text-center" style={{ color: 'var(--text)' }}>
              {formatWeekLabel(currentWeek)}
            </span>
            <button
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--text-sub)' }}
            >
              <ChevronRight size={16} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setCurrentMonth(getPreviousYearMonth(currentMonth))}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--text-sub)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[14px] font-medium min-w-[96px] text-center" style={{ color: 'var(--text)' }}>
              {formatYearMonth(currentMonth)}
            </span>
            <button
              onClick={() => setCurrentMonth(getNextYearMonth(currentMonth))}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--text-sub)' }}
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        <div className="flex-1" />

        {viewMode === 'weekly' && isLeader && (
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

      {/* 요약 카드 */}
      {viewMode === 'weekly' ? (
        <div className="grid grid-cols-4 mb-4" style={{ gap: '12px' }}>
          <div className="cursor-pointer" onClick={() => toggleCardFilter('ALL')}>
            <SummaryCard
              icon="👥" label="전체 팀원" value={weeklyTotal} subText="명" iconBg="var(--primary-bg)"
              highlighted={cardFilter === 'ALL'}
            />
          </div>
          <div className="cursor-pointer" onClick={() => toggleCardFilter('SUBMITTED')}>
            <SummaryCard
              icon="✅" label="제출 완료" value={weeklySubmitted.length}
              subText={`/ ${weeklyTotal} 명`} iconBg="var(--ok-bg)"
              highlighted={cardFilter === 'SUBMITTED'}
            />
          </div>
          <div className="cursor-pointer" onClick={() => toggleCardFilter('DRAFT')}>
            <SummaryCard
              icon="📝" label="임시저장" value={weeklyDraft.length}
              subText={weeklyDraft.length > 0 ? weeklyDraft.map((m) => m.memberName).join(', ') : '없음'}
              iconBg="var(--warn-bg)"
              highlighted={cardFilter === 'DRAFT'}
            />
          </div>
          <div className="cursor-pointer" onClick={() => toggleCardFilter('NOT_STARTED')}>
            <SummaryCard
              icon="❌" label="미작성" value={weeklyNotStarted.length}
              subText={`/ ${weeklyTotal} 명`} iconBg="var(--danger-bg)"
              highlighted={cardFilter === 'NOT_STARTED'}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-5 mb-4" style={{ gap: '12px' }}>
          <div className="cursor-pointer" onClick={() => toggleCardFilter('ALL')}>
            <SummaryCard
              icon="👥" label="전체" value={tsTotal} subText="명" iconBg="var(--primary-bg)"
              highlighted={cardFilter === 'ALL'}
            />
          </div>
          <div className="cursor-pointer" onClick={() => toggleCardFilter('SUBMITTED')}>
            <SummaryCard
              icon="✅" label="제출" value={tsSubmitted.length}
              subText={`/ ${tsTotal} 명`} iconBg="var(--ok-bg)"
              highlighted={cardFilter === 'SUBMITTED'}
            />
          </div>
          <div className="cursor-pointer" onClick={() => toggleCardFilter('NOT_SUBMITTED')}>
            <SummaryCard
              icon="⏳" label="미제출" value={tsNotSubmitted.length}
              subText={`/ ${tsTotal} 명`} iconBg="var(--danger-bg)"
              highlighted={cardFilter === 'NOT_SUBMITTED'}
            />
          </div>
          <div className="cursor-pointer" onClick={() => toggleCardFilter('DRAFT')}>
            <SummaryCard
              icon="📝" label="작성중" value={tsDraft.length}
              subText={tsDraft.length > 0 ? tsDraft.map((r) => r.memberName).join(', ') : '없음'}
              iconBg="var(--warn-bg)"
              highlighted={cardFilter === 'DRAFT'}
            />
          </div>
          <div className="cursor-pointer" onClick={() => toggleCardFilter('NOT_STARTED')}>
            <SummaryCard
              icon="❌" label="미작성" value={tsNotStarted.length}
              subText={`/ ${tsTotal} 명`} iconBg="var(--gray-light)"
              highlighted={cardFilter === 'NOT_STARTED'}
            />
          </div>
        </div>
      )}

      {/* ─── 내 작업 현황 위젯 ─── */}
      <div className="mb-4">
        <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--text-sub)' }}>
          내 작업 현황
        </p>
        <div className="grid grid-cols-4" style={{ gap: '12px' }}>
          <div
            className="cursor-pointer"
            onClick={() => navigate('/my-tasks?period=today')}
          >
            <SummaryCard
              icon="📋"
              label="오늘 할 작업"
              value={taskSummary?.todayCount ?? 0}
              subText="건"
              iconBg="var(--primary-bg)"
            />
          </div>
          <div
            className="cursor-pointer"
            onClick={() => navigate('/my-tasks?period=this-week')}
          >
            <SummaryCard
              icon="⏰"
              label="마감 임박"
              value={taskSummary?.dueSoonCount ?? 0}
              subText="3일 이내"
              iconBg="var(--warn-bg)"
            />
          </div>
          <div
            className="cursor-pointer"
            onClick={() => navigate('/my-tasks')}
          >
            <SummaryCard
              icon="✅"
              label="이번 주 완료"
              value={taskSummary?.thisWeekDoneCount ?? 0}
              subText="건"
              iconBg="var(--ok-bg)"
            />
          </div>
          <div
            className="cursor-pointer"
            onClick={() => navigate('/my-tasks?period=overdue')}
          >
            <SummaryCard
              icon="🚨"
              label="마감 지남"
              value={taskSummary?.overdueCount ?? 0}
              subText={taskSummary?.overdueCount ? '처리 필요' : '없음'}
              iconBg="var(--danger-bg)"
            />
          </div>
        </div>
      </div>

      {/* ─── 주간업무보고 콘텐츠 ─── */}
      {viewMode === 'weekly' && (isLeader || isPartLeader) && filteredWeeklyMembers.length > 0 && (
        <>
          <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden mb-3">
            <div
              className="flex items-center justify-between border-b border-[var(--gray-border)]"
              style={{ padding: '11px 16px' }}
            >
              <p className="text-[13px] font-semibold text-[var(--text)]">
                팀원 작성현황 - 주간업무보고
              </p>
              <p className="text-[12px] text-[var(--text-sub)]">{currentWeek}</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--tbl-header)]">
                  {['성명', '직급', '파트', '직책', '역할', '업무항목 수', '작성 상태', '최종 수정'].map((h) => (
                    <th key={h} className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredWeeklyMembers.map((m, idx) => {
                  const isNotStarted = m.status === 'NOT_STARTED';
                  const statusVariant = REPORT_STATUS_VARIANT[m.status] ?? 'gray';
                  const statusLabel = REPORT_STATUS_LABEL[m.status] ?? m.status;
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
                      <td className="px-3 py-[9px] text-[12.5px] font-medium text-[var(--text)]">
                        {m.memberName}
                      </td>
                      <td className="px-3 py-[9px] text-[12.5px] text-[var(--text-sub)]">
                        {m.position ? (POSITION_LABEL[m.position] ?? m.position) : '—'}
                      </td>
                      <td className="px-3 py-[9px]">
                        <Badge variant="purple">{m.partName}</Badge>
                      </td>
                      <td className="px-3 py-[9px] text-[12.5px] text-[var(--text-sub)]">
                        {m.jobTitle ?? '—'}
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

          {/* 파트 취합 현황 */}
          {isLeader && partSummaryRows.length > 0 && (
            <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden mb-3">
              <div
                className="flex items-center justify-between border-b border-[var(--gray-border)]"
                style={{ padding: '11px 16px' }}
              >
                <p className="text-[13px] font-semibold text-[var(--text)]">보고서 취합 현황</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--tbl-header)]">
                    {['파트', '파트장', '취합 상태', '팀원 제출률'].map((h) => (
                      <th key={h} className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {partSummaryRows.map((p, idx) => {
                    const summaryVariant = SUMMARY_STATUS_VARIANT[p.summaryStatus] ?? 'gray';
                    const summaryLabel = REPORT_STATUS_LABEL[p.summaryStatus] ?? p.summaryStatus;
                    const pct = p.totalCount > 0 ? Math.round((p.submittedCount / p.totalCount) * 100) : 0;
                    return (
                      <tr
                        key={p.partId}
                        className={[
                          'border-b border-[var(--gray-border)]',
                          idx % 2 === 1 ? 'bg-[var(--row-alt)]' : '',
                          p.summaryStatus === 'SUBMITTED' ? 'cursor-pointer hover:bg-[var(--primary-bg)]' : '',
                        ].join(' ')}
                        onClick={() => { if (p.summaryStatus === 'SUBMITTED') navigate('/report-consolidation'); }}
                      >
                        <td className="px-3 py-[9px] text-[12.5px] font-medium text-[var(--text)]">{p.partName}</td>
                        <td className="px-3 py-[9px] text-[12.5px] text-[var(--text-sub)]">{p.partLeaderName}</td>
                        <td className="px-3 py-[9px]">
                          <Badge variant={summaryVariant} dot>{summaryLabel}</Badge>
                        </td>
                        <td className="px-3 py-[9px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 rounded-full overflow-hidden" style={{ height: '6px', backgroundColor: 'var(--gray-light)' }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, backgroundColor: pct === 100 ? 'var(--ok)' : pct > 0 ? 'var(--warn)' : 'var(--gray-border)' }}
                              />
                            </div>
                            <span className="text-[11px] text-[var(--text-sub)] w-8">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ─── 근무시간표 콘텐츠 ─── */}
      {viewMode === 'timesheet' && (isLeader || isPartLeader) && (
        <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden mb-3">
          <div
            className="flex items-center justify-between border-b border-[var(--gray-border)]"
            style={{ padding: '11px 16px' }}
          >
            <p className="text-[13px] font-semibold text-[var(--text)]">
              팀원 작성현황 - 근무시간표
            </p>
            <div className="flex items-center gap-2 text-[12px]">
              <span style={{ color: 'var(--text-sub)' }}>총원 <strong style={{ color: 'var(--text)' }}>{tsTotal}</strong>명</span>
              <span style={{ color: 'var(--text-sub)' }}>·</span>
              <span style={{ color: 'var(--ok)' }}>제출 <strong>{tsSubmitted.length}</strong>명</span>
              <span style={{ color: 'var(--text-sub)' }}>·</span>
              <span style={{ color: 'var(--danger)' }}>미제출 <strong>{tsNotSubmitted.length}</strong>명</span>
            </div>
          </div>

          {filteredTsMembers.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-sub)' }}>
              데이터가 없습니다.
            </div>
          ) : (
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr style={{ backgroundColor: 'var(--tbl-header)' }}>
                  {['성명', '직급', '파트', '직책', '상태', '총근무시간', '근무일수', '제출일', '팀장승인'].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left font-semibold"
                      style={{ color: 'var(--text-sub)', borderBottom: '1px solid var(--gray-border)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTsMembers.map((row, idx) => (
                  <tr
                    key={row.memberId}
                    style={{
                      backgroundColor: idx % 2 === 0 ? 'white' : 'var(--row-alt)',
                      borderBottom: '1px solid var(--gray-border)',
                    }}
                  >
                    <td className="px-3 py-2 font-medium" style={{ color: 'var(--text)' }}>
                      {row.memberName}
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-sub)' }}>
                      {row.position ? (POSITION_LABEL[row.position] ?? row.position) : '—'}
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-sub)' }}>
                      {row.partName ?? '—'}
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-sub)' }}>
                      {row.jobTitle ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={TIMESHEET_STATUS_VARIANT[row.status] ?? 'gray'} dot>
                        {TIMESHEET_STATUS_LABEL[row.status] ?? row.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-medium" style={{ color: 'var(--text)' }}>
                      {row.totalWorkHours}h
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-sub)' }}>
                      {row.workDays}일
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-sub)' }}>
                      {row.submittedAt
                        ? new Date(row.submittedAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {row.leaderApproval ? (
                        <Badge variant={TIMESHEET_STATUS_VARIANT[row.leaderApproval.status] ?? 'gray'}>
                          {TIMESHEET_STATUS_LABEL[row.leaderApproval.status] ?? row.leaderApproval.status}
                        </Badge>
                      ) : (
                        <span style={{ color: 'var(--text-sub)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
