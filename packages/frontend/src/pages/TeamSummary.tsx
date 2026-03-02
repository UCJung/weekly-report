import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useQuery } from '@tanstack/react-query';
import { partApi, SummaryWorkItem, TeamWeeklyOverview } from '../api/part.api';
import { exportApi } from '../api/export.api';
import FormattedText from '../components/grid/FormattedText';
import SummaryCard from '../components/ui/SummaryCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../components/ui/Table';

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

function formatWeekLabel(weekLabel: string): string {
  const match = weekLabel.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return weekLabel;
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(Date.UTC(year, 0, 4 - jan4Day + 1));
  const start = new Date(week1Monday.getTime() + (week - 1) * 7 * 86400000);
  const end = new Date(start.getTime() + 4 * 86400000);
  const fmt = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  return `${year}년 ${week}주차 (${fmt(start)} ~ ${fmt(end)})`;
}

const SUMMARY_STATUS_INFO: Record<string, { label: string; variant: 'ok' | 'warn' | 'gray' }> = {
  SUBMITTED:   { label: '제출완료', variant: 'ok' },
  DRAFT:       { label: '임시저장', variant: 'warn' },
  NOT_STARTED: { label: '미작성',   variant: 'gray' },
};

interface PartSummaryRow {
  partId: string;
  partName: string;
  partLeaderName: string;
  summaryId: string | null;
  summaryStatus: 'SUBMITTED' | 'DRAFT' | 'NOT_STARTED';
  workItemCount: number;
  submittedAt: string | null;
}

function buildPartSummaryRows(overviews: TeamWeeklyOverview[]): PartSummaryRow[] {
  return overviews.map((o) => {
    const partLeader = o.members.find((m) => m.member.roles?.includes('PART_LEADER'));
    return {
      partId: o.part.id,
      partName: o.part.name,
      partLeaderName: partLeader?.member.name ?? '—',
      summaryId: null,
      summaryStatus: o.summaryStatus as 'SUBMITTED' | 'DRAFT' | 'NOT_STARTED',
      workItemCount: 0,
      submittedAt: null,
    };
  });
}

export default function TeamSummary() {
  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const [currentWeek, setCurrentWeek] = useState(() => getWeekLabel(new Date()));
  const [activeTab, setActiveTab] = useState<'all' | string>('all');
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const isLeader = user?.roles.includes('LEADER') ?? false;
  const teamId = user?.teamId ?? '';

  // PART_LEADER는 본인 파트만 접근 가능 — 초기 탭을 본인 파트로 설정
  const initialTab = isLeader ? 'all' : (user?.partId ?? 'all');

  // activeTab 초기화는 컴포넌트 마운트 때 한 번만
  const [tabInitialized, setTabInitialized] = useState(false);
  if (!tabInitialized && user) {
    setActiveTab(initialTab);
    setTabInitialized(true);
  }

  const { data: overviews = [], isLoading } = useQuery({
    queryKey: ['team-weekly-overview', teamId, currentWeek],
    queryFn: () =>
      partApi.getTeamWeeklyOverview(teamId, currentWeek).then((r) => r.data.data),
    enabled: !!teamId && !!currentWeek,
  });

  // 파트 취합보고 상세 조회 (선택된 파트)
  const { data: partSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['part-summary', selectedPartId, currentWeek],
    queryFn: () =>
      partApi.getPartSummary(selectedPartId!, currentWeek).then((r) => r.data.data),
    enabled: !!selectedPartId && !!currentWeek,
  });

  const handleExcel = async () => {
    setIsDownloading(true);
    try {
      if (isLeader) {
        await exportApi.downloadExcel({ type: 'team', teamId, week: currentWeek });
      } else if (user?.partId) {
        await exportApi.downloadExcel({ type: 'part', partId: user.partId, week: currentWeek });
      }
      addToast('success', 'Excel 파일을 다운로드했습니다.');
    } catch {
      addToast('danger', 'Excel 다운로드에 실패했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  // 파트 필터링 (PART_LEADER는 본인 파트만)
  const visibleOverviews = isLeader
    ? overviews
    : overviews.filter((o) => o.part.id === user?.partId);

  const filteredOverviews =
    activeTab === 'all'
      ? visibleOverviews
      : visibleOverviews.filter((o) => o.part.id === activeTab);

  const partRows = buildPartSummaryRows(filteredOverviews);

  // 요약 카드 계산
  const allParts = visibleOverviews;
  const submittedCount = allParts.filter((o) => o.summaryStatus === 'SUBMITTED').length;
  const draftCount = allParts.filter((o) => o.summaryStatus === 'DRAFT').length;
  const notStartedCount = allParts.filter((o) => o.summaryStatus === 'NOT_STARTED').length;

  const summaryItems: SummaryWorkItem[] = partSummary?.summaryWorkItems ?? [];

  return (
    <div>
      {/* 툴바: 주차 선택 + Excel */}
      <div
        className="bg-white rounded-lg border border-[var(--gray-border)] flex items-center gap-3 mb-4"
        style={{ padding: '10px 16px' }}
      >
        <button
          onClick={() => {
            setCurrentWeek(addWeeks(currentWeek, -1));
            setSelectedPartId(null);
          }}
          className="text-[18px] text-[var(--text-sub)] hover:text-[var(--text)]"
          aria-label="이전 주"
        >
          ◀
        </button>
        <span className="flex-1 text-center text-[14px] font-semibold text-[var(--text)]">
          {formatWeekLabel(currentWeek)}
        </span>
        <button
          onClick={() => {
            setCurrentWeek(addWeeks(currentWeek, 1));
            setSelectedPartId(null);
          }}
          className="text-[18px] text-[var(--text-sub)] hover:text-[var(--text)]"
          aria-label="다음 주"
        >
          ▶
        </button>
        <Button
          size="small"
          variant="outline"
          onClick={handleExcel}
          disabled={isDownloading}
        >
          {isDownloading ? '다운로드 중...' : 'Excel 내보내기'}
        </Button>
      </div>

      {/* 요약 카드 3개 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <SummaryCard
          icon="✅"
          label="제출 완료"
          value={submittedCount}
          iconBg="var(--ok-bg)"
        />
        <SummaryCard
          icon="📝"
          label="작성 중 (임시저장)"
          value={draftCount}
          iconBg="var(--warn-bg)"
        />
        <SummaryCard
          icon="⏳"
          label="미작성"
          value={notStartedCount}
          iconBg="var(--danger-bg)"
        />
      </div>

      {/* 파트 필터 탭 (LEADER만 전체/파트별 탭 노출) */}
      {isLeader && visibleOverviews.length > 0 && (
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => { setActiveTab('all'); setSelectedPartId(null); }}
            className={[
              'px-4 h-[26px] rounded text-[12px] font-medium transition-colors duration-150',
              activeTab === 'all'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-white border border-[var(--gray-border)] text-[var(--text-sub)] hover:text-[var(--text)]',
            ].join(' ')}
          >
            전체
          </button>
          {visibleOverviews.map((o) => (
            <button
              key={o.part.id}
              onClick={() => { setActiveTab(o.part.id); setSelectedPartId(null); }}
              className={[
                'px-4 h-[26px] rounded text-[12px] font-medium transition-colors duration-150',
                activeTab === o.part.id
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-white border border-[var(--gray-border)] text-[var(--text-sub)] hover:text-[var(--text)]',
              ].join(' ')}
            >
              {o.part.name}
            </button>
          ))}
        </div>
      )}

      {/* 취합보고서 목록 테이블 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden mb-4">
        <div
          className="flex items-center justify-between border-b border-[var(--gray-border)]"
          style={{ padding: '11px 16px' }}
        >
          <p className="text-[13px] font-semibold text-[var(--text)]">취합보고서 목록</p>
          <p className="text-[12px] text-[var(--text-sub)]">{formatWeekLabel(currentWeek)}</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">파트</TableHead>
              <TableHead className="w-[100px]">파트장</TableHead>
              <TableHead className="w-[120px]">제출 상태</TableHead>
              <TableHead className="w-[100px]">업무항목 수</TableHead>
              <TableHead className="w-[160px]">제출 일시</TableHead>
              <TableHead className="w-[80px] text-center">조회</TableHead>
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
            {!isLoading && partRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-[var(--text-sub)]">
                  취합보고서 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
            {partRows.map((row, idx) => {
              const info = SUMMARY_STATUS_INFO[row.summaryStatus] ?? SUMMARY_STATUS_INFO.NOT_STARTED;
              const isSelected = selectedPartId === row.partId;
              return (
                <TableRow
                  key={row.partId}
                  className={[
                    idx % 2 === 1 ? 'bg-[var(--row-alt)]' : '',
                    isSelected ? 'bg-[var(--primary-bg)]' : '',
                  ].join(' ')}
                >
                  <TableCell>
                    <span className="font-semibold text-[var(--primary)]">{row.partName}</span>
                  </TableCell>
                  <TableCell>{row.partLeaderName}</TableCell>
                  <TableCell>
                    <Badge variant={info.variant} dot>{info.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {row.workItemCount > 0 ? `${row.workItemCount}개` : '—'}
                  </TableCell>
                  <TableCell className="text-[var(--text-sub)]">
                    {row.submittedAt ?? '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant={isSelected ? 'primary' : 'outline'}
                      onClick={() =>
                        setSelectedPartId(isSelected ? null : row.partId)
                      }
                    >
                      {isSelected ? '닫기' : '조회'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 상세 패널: 선택된 파트의 취합보고서 내용 */}
      {selectedPartId && (
        <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden">
          <div
            className="flex items-center justify-between border-b border-[var(--gray-border)]"
            style={{ padding: '11px 16px' }}
          >
            <p className="text-[13px] font-semibold text-[var(--text)]">
              {partRows.find((r) => r.partId === selectedPartId)?.partName ?? ''} — 취합보고서 상세
            </p>
            <div className="flex items-center gap-2">
              {partSummary && (
                <Badge
                  variant={
                    partSummary.status === 'SUBMITTED'
                      ? 'ok'
                      : partSummary.status === 'DRAFT'
                      ? 'warn'
                      : 'gray'
                  }
                  dot
                >
                  {partSummary.status === 'SUBMITTED'
                    ? '제출완료'
                    : partSummary.status === 'DRAFT'
                    ? '임시저장'
                    : '미작성'}
                </Badge>
              )}
              <button
                onClick={() => setSelectedPartId(null)}
                className="text-[var(--text-sub)] hover:text-[var(--text)] text-[14px] ml-1"
                aria-label="패널 닫기"
              >
                ✕
              </button>
            </div>
          </div>

          {summaryLoading ? (
            <div className="p-10 text-center text-[var(--text-sub)] text-[13px]">
              로딩 중...
            </div>
          ) : !partSummary || summaryItems.length === 0 ? (
            <div className="p-10 text-center text-[var(--text-sub)] text-[13px]">
              {partSummary ? '취합 항목이 없습니다.' : '취합보고서가 아직 작성되지 않았습니다.'}
            </div>
          ) : (
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '12%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '30%' }} />
                <col style={{ width: '30%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
              <thead>
                <tr className="bg-[var(--tbl-header)] border-b border-[var(--gray-border)]">
                  <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">
                    프로젝트
                  </th>
                  <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">
                    코드
                  </th>
                  <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">
                    진행업무 (한일)
                  </th>
                  <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">
                    예정업무 (할일)
                  </th>
                  <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">
                    비고 및 이슈
                  </th>
                </tr>
              </thead>
              <tbody>
                {summaryItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={[
                      'border-b border-[var(--gray-border)]',
                      idx % 2 === 1 ? 'bg-[var(--row-alt)]' : 'bg-white',
                    ].join(' ')}
                  >
                    <td className="px-3 py-[8px] align-top text-[12.5px] font-medium text-[var(--text)]">
                      {item.project?.name ?? '—'}
                    </td>
                    <td
                      className="px-3 py-[8px] align-top text-[11px] font-mono text-[var(--text-sub)]"
                      style={{ backgroundColor: 'var(--tbl-header)' }}
                    >
                      {item.project?.code ?? ''}
                    </td>
                    <td className="px-3 py-[8px] align-top">
                      <FormattedText text={item.doneWork} />
                    </td>
                    <td className="px-3 py-[8px] align-top">
                      <FormattedText text={item.planWork} />
                    </td>
                    <td className="px-3 py-[8px] align-top text-[11px] text-[var(--text-sub)]">
                      {item.remarks ?? ''}
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
