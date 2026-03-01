import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useQuery } from '@tanstack/react-query';
import { partApi, MemberWeeklyStatus, SubmissionStatus } from '../api/part.api';
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

const STATUS_INFO: Record<string, { label: string; variant: 'ok' | 'warn' | 'gray'; icon: string }> = {
  SUBMITTED:   { label: '제출완료', variant: 'ok',   icon: '✅' },
  DRAFT:       { label: '임시저장', variant: 'warn',  icon: '📝' },
  NOT_STARTED: { label: '미작성',   variant: 'gray',  icon: '❌' },
};

interface FlatRow {
  member: MemberWeeklyStatus['member'];
  item: NonNullable<MemberWeeklyStatus['report']>['workItems'][0] | null;
  memberRowSpan: number;
  isFirstInMember: boolean;
}

export default function PartStatus() {
  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const [currentWeek, setCurrentWeek] = useState(() => getWeekLabel(new Date()));
  const [isDownloading, setIsDownloading] = useState(false);

  const partId = user?.partId ?? '';

  const { data: statusList = [], isLoading } = useQuery({
    queryKey: ['part-weekly-status', partId, currentWeek],
    queryFn: () => partApi.getPartWeeklyStatus(partId, currentWeek).then((r) => r.data.data),
    enabled: !!partId && !!currentWeek,
  });

  const { data: submissionList = [] } = useQuery({
    queryKey: ['part-submission-status', partId, currentWeek],
    queryFn: () => partApi.getSubmissionStatus(partId, currentWeek).then((r) => r.data.data),
    enabled: !!partId && !!currentWeek,
  });

  const handleExcel = async () => {
    setIsDownloading(true);
    try {
      await exportApi.downloadExcel({ type: 'part', partId, week: currentWeek });
      addToast('success', 'Excel 파일을 다운로드했습니다.');
    } catch {
      addToast('danger', 'Excel 다운로드에 실패했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  // rowspan 병합을 위한 플랫 행 구성
  const rows: FlatRow[] = [];
  for (const entry of statusList) {
    const items = entry.report?.workItems ?? [];
    const memberRowSpan = items.length || 1;
    if (items.length === 0) {
      rows.push({ member: entry.member, item: null, memberRowSpan, isFirstInMember: true });
    } else {
      items.forEach((item, i) => {
        rows.push({ member: entry.member, item, memberRowSpan, isFirstInMember: i === 0 });
      });
    }
  }

  const submittedCount = (submissionList as SubmissionStatus[]).filter((s) => s.status === 'SUBMITTED').length;
  const totalCount = (submissionList as SubmissionStatus[]).length;

  return (
    <div>
      {/* 필터 바: 주차 선택 + 작성현황 인디케이터 + Excel 버튼 */}
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

        <div className="w-px h-5 bg-[var(--gray-border)]" />

        {/* 작성현황 인디케이터 */}
        <span className="text-[12px] text-[var(--text-sub)]">
          제출 <strong className="text-[var(--text)]">{submittedCount}</strong> / {totalCount}
        </span>

        <Button size="small" variant="outline" onClick={handleExcel} disabled={isDownloading}>
          {isDownloading ? '다운로드 중...' : 'Excel 내보내기'}
        </Button>
      </div>

      {/* 파트원 작성 현황 바 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] px-4 py-3 mb-4">
        <p className="text-[11px] font-medium text-[var(--text-sub)] mb-2">파트원 작성 현황</p>
        <div className="flex flex-wrap gap-2">
          {(submissionList as SubmissionStatus[]).map((s) => {
            const info = STATUS_INFO[s.status] ?? STATUS_INFO.NOT_STARTED;
            return (
              <div key={s.memberId} className="flex items-center gap-1.5">
                <span className="text-[11px]">{info.icon}</span>
                <span className="text-[11px] text-[var(--text)]">{s.memberName}</span>
                <Badge variant={info.variant}>{info.label}</Badge>
              </div>
            );
          })}
          {submissionList.length === 0 && (
            <span className="text-[11px] text-[var(--text-sub)]">파트원이 없습니다.</span>
          )}
        </div>
      </div>

      {/* 업무 현황 테이블 패널 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden">
        <div
          className="flex items-center justify-between border-b border-[var(--gray-border)]"
          style={{ padding: '11px 16px' }}
        >
          <p className="text-[13px] font-semibold text-[var(--text)]">파트 업무 현황</p>
          <p className="text-[12px] text-[var(--text-sub)]">{currentWeek}</p>
        </div>
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '8%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead>
            <tr className="bg-[var(--tbl-header)] border-b border-[var(--gray-border)]">
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
                <td colSpan={6} className="text-center py-10 text-[var(--text-sub)]">로딩 중...</td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-[var(--text-sub)]">업무 데이터가 없습니다.</td>
              </tr>
            )}
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className={['border-b border-[var(--gray-border)]', idx % 2 === 1 ? 'bg-[var(--row-alt)]' : ''].join(' ')}
              >
                {/* 이름 컬럼: rowspan 병합 */}
                {row.isFirstInMember && (
                  <td
                    rowSpan={row.memberRowSpan}
                    className="px-3 py-[9px] align-top font-medium text-[12.5px] border-r border-[var(--gray-border)]"
                  >
                    {row.member.name}
                  </td>
                )}
                <td className="px-3 py-[9px] align-top text-[12.5px]">{row.item?.project?.name ?? ''}</td>
                <td className="px-3 py-[9px] align-top font-mono text-[11px] text-[var(--text-sub)]">{row.item?.project?.code ?? ''}</td>
                <td className="px-3 py-[9px] align-top">
                  <FormattedText text={row.item?.doneWork ?? ''} />
                </td>
                <td className="px-3 py-[9px] align-top">
                  <FormattedText text={row.item?.planWork ?? ''} />
                </td>
                <td className="px-3 py-[9px] align-top text-[11px] text-[var(--text-sub)]">{row.item?.remarks ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
