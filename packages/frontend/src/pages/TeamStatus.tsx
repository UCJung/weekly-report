import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useQuery } from '@tanstack/react-query';
import { partApi, TeamWeeklyOverview, MemberWeeklyStatus } from '../api/part.api';
import { exportApi } from '../api/export.api';
import FormattedText from '../components/grid/FormattedText';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

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

const SUMMARY_STATUS_INFO: Record<string, { label: string; variant: 'ok' | 'warn' | 'gray' }> = {
  SUBMITTED:   { label: '제출완료', variant: 'ok' },
  DRAFT:       { label: '임시저장', variant: 'warn' },
  NOT_STARTED: { label: '미작성',   variant: 'gray' },
};

interface WorkRow {
  partName: string;
  member: MemberWeeklyStatus['member'];
  item: NonNullable<MemberWeeklyStatus['report']>['workItems'][0] | null;
  isFirstInPart: boolean;
  partRowSpan: number;
  isFirstInMember: boolean;
  memberRowSpan: number;
}

function buildRows(overviews: TeamWeeklyOverview[]): WorkRow[] {
  const rows: WorkRow[] = [];
  for (const overview of overviews) {
    const partName = overview.part.name;
    let partRowSpan = 0;
    for (const entry of overview.members) {
      const cnt = (entry.report?.workItems ?? []).length || 1;
      partRowSpan += cnt;
    }

    let partFirst = true;
    for (const entry of overview.members) {
      const items = entry.report?.workItems ?? [];
      const memberRowSpan = items.length || 1;
      let memberFirst = true;
      if (items.length === 0) {
        rows.push({
          partName,
          member: entry.member,
          item: null,
          isFirstInPart: partFirst,
          partRowSpan,
          isFirstInMember: true,
          memberRowSpan: 1,
        });
        partFirst = false;
      } else {
        for (const item of items) {
          rows.push({
            partName,
            member: entry.member,
            item,
            isFirstInPart: partFirst,
            partRowSpan,
            isFirstInMember: memberFirst,
            memberRowSpan,
          });
          partFirst = false;
          memberFirst = false;
        }
      }
    }
  }
  return rows;
}

export default function TeamStatus() {
  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const [currentWeek, setCurrentWeek] = useState(() => getWeekLabel(new Date()));
  const [activeTab, setActiveTab] = useState<'all' | string>('all');
  const [isDownloading, setIsDownloading] = useState(false);

  const teamId = (user as unknown as { teamId?: string })?.teamId ?? '1';

  const { data: overviews = [], isLoading } = useQuery({
    queryKey: ['team-weekly-overview', teamId, currentWeek],
    queryFn: () =>
      partApi.getTeamWeeklyOverview(teamId, currentWeek).then((r) => r.data.data),
    enabled: !!teamId && !!currentWeek,
  });

  const handleExcel = async () => {
    setIsDownloading(true);
    try {
      await exportApi.downloadExcel({ type: 'team', teamId, week: currentWeek });
      addToast('success', 'Excel 파일을 다운로드했습니다.');
    } catch {
      addToast('danger', 'Excel 다운로드에 실패했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredOverviews =
    activeTab === 'all'
      ? overviews
      : overviews.filter((o) => o.part.id === activeTab);

  const rows = buildRows(filteredOverviews);

  const allMembers = overviews.flatMap((o) => o.members);
  const submittedCount = allMembers.filter((m) => m.report?.status === 'SUBMITTED').length;
  const totalCount = allMembers.length;

  return (
    <div>
      {/* 주차 선택기 툴바 */}
      <div
        className="bg-white rounded-lg border border-[var(--gray-border)] flex items-center gap-3 mb-4"
        style={{ padding: '10px 16px' }}
      >
        <button
          onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
          className="text-[18px] text-[var(--text-sub)] hover:text-[var(--text)]"
        >
          ◀
        </button>
        <span className="flex-1 text-center text-[14px] font-semibold text-[var(--text)]">
          {currentWeek}
        </span>
        <button
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          className="text-[18px] text-[var(--text-sub)] hover:text-[var(--text)]"
        >
          ▶
        </button>
        <Button size="small" variant="outline" onClick={handleExcel} disabled={isDownloading}>
          {isDownloading ? '다운로드 중...' : 'Excel 내보내기'}
        </Button>
      </div>

      {/* 작성 현황 요약 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] px-4 py-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-medium text-[var(--text-sub)]">팀 작성 현황</p>
          <p className="text-[12px] font-semibold text-[var(--text)]">
            {submittedCount} / {totalCount} 명 제출
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          {overviews.map((overview) => {
            const info = SUMMARY_STATUS_INFO[overview.summaryStatus] ?? SUMMARY_STATUS_INFO.NOT_STARTED;
            return (
              <div key={overview.part.id} className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[var(--text)]">{overview.part.name}</span>
                <Badge variant={info.variant}>{info.label}</Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* 파트 탭 버튼 (height 26px) */}
      {overviews.length > 0 && (
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={[
              'px-4 rounded text-[12px] font-medium transition-colors duration-150',
              activeTab === 'all'
                ? 'text-white'
                : 'bg-white border border-[var(--gray-border)] text-[var(--text-sub)] hover:text-[var(--text)]',
            ].join(' ')}
            style={{
              height: '26px',
              backgroundColor: activeTab === 'all' ? 'var(--primary)' : undefined,
            }}
          >
            전체
          </button>
          {overviews.map((o) => (
            <button
              key={o.part.id}
              onClick={() => setActiveTab(o.part.id)}
              className={[
                'px-4 rounded text-[12px] font-medium transition-colors duration-150',
                activeTab === o.part.id
                  ? 'text-white'
                  : 'bg-white border border-[var(--gray-border)] text-[var(--text-sub)] hover:text-[var(--text)]',
              ].join(' ')}
              style={{
                height: '26px',
                backgroundColor: activeTab === o.part.id ? 'var(--primary)' : undefined,
              }}
            >
              {o.part.name}
            </button>
          ))}
        </div>
      )}

      {/* 업무 현황 테이블 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden">
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '7%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '28%' }} />
            <col style={{ width: '28%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr className="bg-[var(--tbl-header)] border-b border-[var(--gray-border)]">
              <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">파트</th>
              <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">성명</th>
              <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">프로젝트</th>
              <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">코드</th>
              <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">진행업무</th>
              <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">예정업무</th>
              <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">비고</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-[var(--text-sub)]">
                  로딩 중...
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-[var(--text-sub)]">
                  업무 데이터가 없습니다.
                </td>
              </tr>
            )}
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className={[
                  'border-b border-[var(--gray-border)]',
                  idx % 2 === 1 ? 'bg-[var(--row-alt)]' : '',
                ].join(' ')}
              >
                {row.isFirstInPart && (
                  <td
                    rowSpan={row.partRowSpan}
                    className="px-3 py-[9px] align-top font-semibold text-[12.5px] text-[var(--primary)]"
                    style={{
                      borderRight: '1px solid var(--gray-border)',
                      backgroundColor: 'var(--primary-bg)',
                    }}
                  >
                    {row.partName}
                  </td>
                )}
                {row.isFirstInMember && (
                  <td
                    rowSpan={row.memberRowSpan}
                    className="px-3 py-[9px] align-top font-medium text-[12.5px]"
                    style={{ borderRight: '1px solid var(--gray-border)' }}
                  >
                    {row.member.name}
                  </td>
                )}
                <td className="px-3 py-[9px] align-top text-[12.5px]">{row.item?.project?.name ?? ''}</td>
                <td className="px-3 py-[9px] align-top font-mono text-[11px] text-[var(--text-sub)]">
                  {row.item?.project?.code ?? ''}
                </td>
                <td className="px-3 py-[9px] align-top">
                  <FormattedText text={row.item?.doneWork ?? ''} />
                </td>
                <td className="px-3 py-[9px] align-top">
                  <FormattedText text={row.item?.planWork ?? ''} />
                </td>
                <td className="px-3 py-[9px] align-top text-[11px] text-[var(--text-sub)]">
                  {row.item?.remarks ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
