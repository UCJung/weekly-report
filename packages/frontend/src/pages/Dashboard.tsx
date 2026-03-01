import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SummaryCard from '../components/ui/SummaryCard';
import Badge from '../components/ui/Badge';
import { useAuthStore } from '../stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { partApi } from '../api/part.api';

function getWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function addWeeks(weekLabel: string, n: number): string {
  const match = weekLabel.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return weekLabel;
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(Date.UTC(year, 0, 4 - jan4Day + 1));
  const monday = new Date(week1Monday.getTime() + (week - 1 + n) * 7 * 86400000);
  return getWeekLabel(monday);
}

const STATUS_VARIANT: Record<string, 'ok' | 'warn' | 'gray'> = {
  SUBMITTED: 'ok',
  DRAFT: 'warn',
  NOT_STARTED: 'gray',
};
const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: '제출완료',
  DRAFT: '임시저장',
  NOT_STARTED: '미작성',
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const [currentWeek] = useState(() => getWeekLabel(new Date()));

  const isLeader = user?.role === 'LEADER';
  const isPartLeader = user?.role === 'PART_LEADER';
  const partId = user?.partId ?? '';
  const teamId = (user as unknown as { teamId?: string })?.teamId ?? '1';

  const { data: teamOverview = [] } = useQuery({
    queryKey: ['team-weekly-overview', teamId, currentWeek],
    queryFn: () =>
      partApi.getTeamWeeklyOverview(teamId, currentWeek).then((r) => r.data.data),
    enabled: (isLeader || isPartLeader) && !!teamId,
  });

  const { data: submissionList = [] } = useQuery({
    queryKey: ['part-submission-status', partId, currentWeek],
    queryFn: () =>
      partApi.getSubmissionStatus(partId, currentWeek).then((r) => r.data.data),
    enabled: isPartLeader && !!partId,
  });

  const allMembers = teamOverview.flatMap((o) => o.members);
  const totalMembers = isLeader ? allMembers.length : submissionList.length;
  const submittedCount = isLeader
    ? allMembers.filter((m) => m.report?.status === 'SUBMITTED').length
    : submissionList.filter((s) => s.status === 'SUBMITTED').length;
  const notSubmittedCount = totalMembers - submittedCount;

  const partSummaries = teamOverview.map((o) => ({
    partName: o.part.name,
    status: o.summaryStatus,
  }));

  const recentWeeks = Array.from({ length: 4 }, (_, i) => addWeeks(currentWeek, -i));

  return (
    <div>
      <p className="text-[var(--text-sub)] text-[12px] mb-4">
        안녕하세요, <strong className="text-[var(--text)]">{user?.name}</strong>님. 이번 주{' '}
        <span className="font-medium text-[var(--primary)]">{currentWeek}</span> 업무 현황입니다.
      </p>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 mb-4" style={{ gap: '12px' }}>
        {isLeader ? (
          <>
            <SummaryCard
              icon="👥"
              label="전체 팀원"
              value={totalMembers}
              subText="명"
              iconBg="var(--primary-bg)"
            />
            <SummaryCard
              icon="✅"
              label="이번 주 제출"
              value={`${submittedCount} / ${totalMembers}`}
              subText="명 제출 완료"
              iconBg="var(--ok-bg)"
            />
            <SummaryCard
              icon="📋"
              label="파트 취합 현황"
              value={partSummaries.filter((p) => p.status === 'SUBMITTED').length}
              subText={`${partSummaries.length}개 파트 중 제출`}
              iconBg="var(--primary-bg)"
            />
            <SummaryCard
              icon="❌"
              label="미제출 인원"
              value={notSubmittedCount}
              subText="명"
              iconBg="var(--warn-bg)"
            />
          </>
        ) : isPartLeader ? (
          <>
            <SummaryCard
              icon="👥"
              label="파트 인원"
              value={totalMembers}
              subText="명"
              iconBg="var(--primary-bg)"
            />
            <SummaryCard
              icon="✅"
              label="이번 주 제출"
              value={`${submittedCount} / ${totalMembers}`}
              subText="명 제출 완료"
              iconBg="var(--ok-bg)"
            />
            <SummaryCard
              icon="❌"
              label="미제출 인원"
              value={notSubmittedCount}
              subText="명"
              iconBg="var(--warn-bg)"
            />
            <SummaryCard
              icon="📝"
              label="임시저장"
              value={submissionList.filter((s) => s.status === 'DRAFT').length}
              subText="명"
              iconBg="var(--warn-bg)"
            />
          </>
        ) : (
          <>
            <SummaryCard icon="📅" label="이번 주" value={currentWeek} iconBg="var(--primary-bg)" />
            <SummaryCard icon="📝" label="작업 상태" value="작성 중" subText="내 주간업무" iconBg="var(--warn-bg)" />
            <SummaryCard icon="🗂️" label="소속 파트" value={user?.partName ?? '—'} iconBg="var(--primary-bg)" />
            <SummaryCard icon="👤" label="역할" value="팀원" iconBg="var(--ok-bg)" />
          </>
        )}
      </div>

      {/* 팀원 작성 현황 패널 (파트장/팀장) */}
      {(isLeader || isPartLeader) && submissionList.length > 0 && (
        <div
          className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden mb-[var(--content-gap)]"
        >
          <div
            className="flex items-center justify-between border-b border-[var(--gray-border)]"
            style={{ padding: '11px 16px' }}
          >
            <p className="text-[13px] font-semibold text-[var(--text)]">팀원 작성 현황</p>
            <p className="text-[12px] text-[var(--text-sub)]">{currentWeek}</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--tbl-header)]">
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">이름</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">파트</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">작성 상태</th>
              </tr>
            </thead>
            <tbody>
              {(submissionList as Array<{ memberId: string; memberName: string; partName?: string; status: string }>).map((s, idx) => {
                const variant = STATUS_VARIANT[s.status] ?? 'gray';
                const label = STATUS_LABEL[s.status] ?? s.status;
                const isWarn = s.status === 'NOT_STARTED';
                return (
                  <tr
                    key={s.memberId}
                    className={[
                      'border-b border-[var(--gray-border)]',
                      isWarn ? '' : idx % 2 === 1 ? 'bg-[var(--row-alt)]' : '',
                    ].join(' ')}
                    style={isWarn ? { backgroundColor: '#fff8f0' } : undefined}
                  >
                    <td className="px-3 py-[9px] text-[12.5px] font-medium text-[var(--text)]">{s.memberName}</td>
                    <td className="px-3 py-[9px] text-[12.5px] text-[var(--text-sub)]">{s.partName ?? '—'}</td>
                    <td className="px-3 py-[9px]">
                      <Badge variant={variant} dot>{label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 파트 취합 현황 패널 (팀장) */}
      {isLeader && partSummaries.length > 0 && (
        <div
          className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden mb-[var(--content-gap)]"
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
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">파트</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">취합 상태</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)]">진행률</th>
              </tr>
            </thead>
            <tbody>
              {partSummaries.map((p, idx) => {
                const variant = STATUS_VARIANT[p.status] ?? 'gray';
                const label = STATUS_LABEL[p.status] ?? p.status;
                const pct = p.status === 'SUBMITTED' ? 100 : p.status === 'DRAFT' ? 50 : 0;
                return (
                  <tr
                    key={p.partName}
                    className={[
                      'border-b border-[var(--gray-border)]',
                      idx % 2 === 1 ? 'bg-[var(--row-alt)]' : '',
                    ].join(' ')}
                  >
                    <td className="px-3 py-[9px] text-[12.5px] font-medium text-[var(--text)]">{p.partName}</td>
                    <td className="px-3 py-[9px]">
                      <Badge variant={variant} dot>{label}</Badge>
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
                              backgroundColor: pct === 100 ? 'var(--ok)' : pct > 0 ? 'var(--warn)' : 'var(--gray-border)',
                            }}
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

      {/* 빠른 진입 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] px-5 py-4 mb-[var(--content-gap)]">
        <p className="text-[11px] font-medium text-[var(--text-sub)] mb-3">빠른 진입</p>
        <div className="flex gap-3">
          {user?.role === 'MEMBER' && (
            <Link to="/my-weekly">
              <button className="px-4 py-2 rounded text-[12.5px] font-medium transition-colors" style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
              >
                내 주간업무 작성하기
              </button>
            </Link>
          )}
          {isPartLeader && (
            <>
              <Link to="/my-weekly">
                <button className="px-4 py-2 rounded text-[12.5px] font-medium transition-colors" style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
                >
                  내 주간업무 작성하기
                </button>
              </Link>
              <Link to="/part-summary">
                <button
                  className="px-4 py-2 bg-white border rounded text-[12.5px] font-medium transition-colors"
                  style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-bg)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                >
                  파트 취합하기
                </button>
              </Link>
            </>
          )}
          {isLeader && (
            <Link to="/team-status">
              <button className="px-4 py-2 rounded text-[12.5px] font-medium transition-colors" style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
              >
                팀 현황 보기
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* 최근 주차 이력 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] px-5 py-4">
        <p className="text-[11px] font-medium text-[var(--text-sub)] mb-3">최근 4주</p>
        <div className="flex gap-2">
          {recentWeeks.map((week) => (
            <div
              key={week}
              className={[
                'flex-1 px-3 py-2.5 rounded border text-center',
                week === currentWeek
                  ? 'border-[var(--primary)] bg-[var(--primary-bg)]'
                  : 'border-[var(--gray-border)]',
              ].join(' ')}
            >
              <p
                className={[
                  'text-[12px] font-medium',
                  week === currentWeek ? 'text-[var(--primary)]' : 'text-[var(--text)]',
                ].join(' ')}
              >
                {week}
              </p>
              {week === currentWeek && (
                <p className="text-[10px] text-[var(--primary)] mt-0.5">이번 주</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
