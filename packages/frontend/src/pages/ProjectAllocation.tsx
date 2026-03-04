import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  formatYearMonth,
  getCurrentYearMonth,
  getPreviousYearMonth,
  getNextYearMonth,
} from '@uc-teamspace/shared/constants/timesheet-utils';
import { POSITION_LABEL, TIMESHEET_STATUS_LABEL, TIMESHEET_STATUS_VARIANT } from '../constants/labels';
import {
  useProjectAllocationSummary,
  useProjectAllocationMonthly,
  useProjectAllocationYearly,
  useApproveProjectTimesheet,
} from '../hooks/useTimesheet';
import Badge from '../components/ui/Badge';

type TabType = 'monthly' | 'yearly';

// ──────────── 월간 투입현황 (인원별) ────────────

interface MonthlyViewProps {
  projectId: string;
  yearMonth: string;
}

function MonthlyView({ projectId, yearMonth }: MonthlyViewProps) {
  const { data, isLoading } = useProjectAllocationMonthly(projectId, yearMonth);
  const approveMutation = useApproveProjectTimesheet(projectId, yearMonth);

  if (isLoading) {
    return (
      <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-sub)' }}>
        불러오는 중...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-sub)' }}>
        데이터가 없습니다.
      </div>
    );
  }

  const handleApprove = () => {
    approveMutation.mutate(undefined, {
      onSuccess: () => toast.success('월간 투입현황을 승인했습니다.'),
      onError: () => toast.error('승인 처리 중 오류가 발생했습니다.'),
    });
  };

  const isApproved = data.members.length > 0 && data.members.some((m) => m.pmApproval != null);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'white', border: '1px solid var(--gray-border)' }}
    >
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--gray-border)', backgroundColor: 'var(--tbl-header)' }}
      >
        <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>인원별 투입현황</h3>
        {isApproved ? (
          <span
            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium"
            style={{ color: 'var(--primary)' }}
          >
            <CheckCircle size={13} />
            승인완료
          </span>
        ) : (
          <button
            onClick={handleApprove}
            disabled={approveMutation.isPending || data.members.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-[12px] font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--ok)' }}
          >
            <CheckCircle size={13} />
            {approveMutation.isPending ? '처리 중...' : '월간 승인'}
          </button>
        )}
      </div>

      {data.members.length === 0 ? (
        <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-sub)' }}>
          {formatYearMonth(yearMonth)} 투입 인원이 없습니다.
        </div>
      ) : (
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr style={{ backgroundColor: 'var(--tbl-header)' }}>
              {['이름', '직급', '프로젝트 투입시간', '비율', '개인 총근무시간', 'PM 승인 상태'].map((h) => (
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
            {data.members.map((m, idx) => (
              <tr
                key={m.memberId}
                style={{
                  backgroundColor: idx % 2 === 0 ? 'white' : 'var(--row-alt)',
                  borderBottom: '1px solid var(--gray-border)',
                }}
              >
                <td className="px-3 py-2 font-medium" style={{ color: 'var(--text)' }}>
                  {m.memberName}
                </td>
                <td className="px-3 py-2" style={{ color: 'var(--text-sub)' }}>
                  {m.position ? (POSITION_LABEL[m.position] ?? m.position) : '—'}
                </td>
                <td className="px-3 py-2 font-semibold" style={{ color: 'var(--primary)' }}>
                  {m.totalHours}h
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--primary-bg)', height: '6px', minWidth: '60px' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(m.ratio, 100)}%`,
                          backgroundColor: 'var(--primary)',
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text)' }}>
                      {m.ratio}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2" style={{ color: 'var(--text-sub)' }}>
                  {m.memberTotalHours}h
                </td>
                <td className="px-3 py-2">
                  {m.pmApproval ? (
                    <div className="flex items-center gap-1">
                      <Badge variant={TIMESHEET_STATUS_VARIANT[m.pmApproval.status] ?? 'gray'}>
                        {TIMESHEET_STATUS_LABEL[m.pmApproval.status] ?? m.pmApproval.status}
                      </Badge>
                      {m.pmApproval.autoApproved && (
                        <span className="text-[10px]" style={{ color: 'var(--text-sub)' }}>(자동)</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px]" style={{ color: 'var(--text-sub)' }}>미승인</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ──────────── 연간 투입현황 ────────────

interface YearlyViewProps {
  projectId: string;
  year: string;
}

function YearlyView({ projectId, year }: YearlyViewProps) {
  const { data, isLoading } = useProjectAllocationYearly(projectId, year);

  if (isLoading) {
    return (
      <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-sub)' }}>
        불러오는 중...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-sub)' }}>
        데이터가 없습니다.
      </div>
    );
  }

  const totalHours = data.months.reduce((sum, m) => sum + m.totalHours, 0);
  const maxHours = Math.max(...data.months.map((m) => m.totalHours), 1);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'white', border: '1px solid var(--gray-border)' }}
    >
      <div
        className="px-4 py-3"
        style={{ borderBottom: '1px solid var(--gray-border)', backgroundColor: 'var(--tbl-header)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
            {year}년 월별 투입현황
          </h3>
          <span className="text-[12px]" style={{ color: 'var(--text-sub)' }}>
            연간 합계: <strong style={{ color: 'var(--primary)' }}>{totalHours}h</strong>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-[12px]" style={{ minWidth: '900px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--tbl-header)' }}>
              <th
                className="px-3 py-2 text-left font-semibold"
                style={{ color: 'var(--text-sub)', borderBottom: '1px solid var(--gray-border)', width: '60px' }}
              >
                구분
              </th>
              {data.months.map((m) => {
                const month = parseInt(m.yearMonth.split('-')[1], 10);
                return (
                  <th
                    key={m.yearMonth}
                    className="px-3 py-2 text-center font-semibold"
                    style={{
                      color: 'var(--text-sub)',
                      borderBottom: '1px solid var(--gray-border)',
                      minWidth: '70px',
                    }}
                  >
                    {month}월
                  </th>
                );
              })}
              <th
                className="px-3 py-2 text-right font-semibold"
                style={{ color: 'var(--text-sub)', borderBottom: '1px solid var(--gray-border)', width: '80px' }}
              >
                합계
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--gray-border)' }}>
              <td className="px-3 py-2 font-medium" style={{ color: 'var(--text)' }}>투입시간</td>
              {data.months.map((m) => (
                <td key={m.yearMonth} className="px-3 py-2 text-center">
                  {m.totalHours > 0 ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-medium" style={{ color: 'var(--primary)' }}>{m.totalHours}h</span>
                      <div
                        className="w-8 rounded-sm"
                        style={{
                          height: `${Math.max((m.totalHours / maxHours) * 24, 2)}px`,
                          backgroundColor: 'var(--primary-bg)',
                        }}
                      >
                        <div
                          className="w-full rounded-sm"
                          style={{
                            height: '100%',
                            backgroundColor: 'var(--primary)',
                            opacity: 0.7,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-sub)' }}>—</span>
                  )}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-bold" style={{ color: 'var(--primary)' }}>
                {totalHours}h
              </td>
            </tr>
            <tr style={{ backgroundColor: 'var(--row-alt)', borderBottom: '1px solid var(--gray-border)' }}>
              <td className="px-3 py-2 font-medium" style={{ color: 'var(--text)' }}>투입인원</td>
              {data.months.map((m) => (
                <td key={m.yearMonth} className="px-3 py-2 text-center" style={{ color: 'var(--text-sub)' }}>
                  {m.memberCount > 0 ? `${m.memberCount}명` : '—'}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-semibold" style={{ color: 'var(--text-sub)' }}>
                —
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────── 메인 페이지 ────────────

export default function ProjectAllocation() {
  const [tab, setTab] = useState<TabType>('monthly');
  const [yearMonth, setYearMonth] = useState<string>(getCurrentYearMonth);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const { data: summaryData, isLoading: loadingSummary } = useProjectAllocationSummary(yearMonth);

  const currentYear = yearMonth.split('-')[0];

  // 첫 번째 프로젝트 자동 선택
  React.useEffect(() => {
    if (summaryData && summaryData.projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(summaryData.projects[0].projectId);
    }
  }, [summaryData, selectedProjectId]);

  if (loadingSummary) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--text-sub)' }}>불러오는 중...</p>
      </div>
    );
  }

  if (!summaryData || summaryData.projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--text-sub)' }}>관리 중인 프로젝트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      {/* 툴바 카드 */}
      <div
        className="bg-white rounded-lg border border-[var(--gray-border)] flex items-center gap-3 mb-4"
        style={{ padding: '10px 16px' }}
      >
        <h1 className="text-[16px] font-semibold" style={{ color: 'var(--text)' }}>
          프로젝트 투입현황
        </h1>
        <div className="w-px h-5 bg-[var(--gray-border)]" />

        {/* 탭 */}
        <div
          className="flex rounded-lg overflow-hidden"
          style={{ border: '1px solid var(--gray-border)' }}
        >
          {(['monthly', 'yearly'] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 py-1.5 text-[12px] font-medium transition-colors"
              style={{
                backgroundColor: tab === t ? 'var(--primary)' : 'white',
                color: tab === t ? 'white' : 'var(--text-sub)',
              }}
            >
              {t === 'monthly' ? '월간' : '연간'}
            </button>
          ))}
        </div>

        {/* 월/연도 탐색 */}
        {tab === 'monthly' ? (
          <>
            <button
              onClick={() => setYearMonth(getPreviousYearMonth(yearMonth))}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--text-sub)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[14px] font-medium min-w-[96px] text-center" style={{ color: 'var(--text)' }}>
              {formatYearMonth(yearMonth)}
            </span>
            <button
              onClick={() => setYearMonth(getNextYearMonth(yearMonth))}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--text-sub)' }}
            >
              <ChevronRight size={16} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                const y = parseInt(currentYear, 10) - 1;
                setYearMonth(`${y}-${yearMonth.split('-')[1]}`);
              }}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--text-sub)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[14px] font-medium min-w-[60px] text-center" style={{ color: 'var(--text)' }}>
              {currentYear}년
            </span>
            <button
              onClick={() => {
                const y = parseInt(currentYear, 10) + 1;
                setYearMonth(`${y}-${yearMonth.split('-')[1]}`);
              }}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--text-sub)' }}
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* 프로젝트 목록 테이블 */}
      <div
        className="rounded-lg overflow-hidden mb-4"
        style={{ backgroundColor: 'white', border: '1px solid var(--gray-border)' }}
      >
        <div
          className="px-4 py-3"
          style={{ borderBottom: '1px solid var(--gray-border)', backgroundColor: 'var(--tbl-header)' }}
        >
          <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
            프로젝트 목록
          </h3>
        </div>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr style={{ backgroundColor: 'var(--tbl-header)' }}>
              {['프로젝트명', '총 투입인원', '총 투입시간', '평균 투입시간', '승인여부'].map((h) => (
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
            {summaryData.projects.map((p) => {
              const isSelected = p.projectId === selectedProjectId;
              return (
                <tr
                  key={p.projectId}
                  onClick={() => setSelectedProjectId(p.projectId)}
                  className="cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'var(--ok-bg)' : 'white',
                    borderBottom: '1px solid var(--gray-border)',
                  }}
                >
                  <td className="px-3 py-2 font-medium" style={{ color: 'var(--text)' }}>
                    [{p.projectCode}] {p.projectName}
                  </td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-sub)' }}>
                    {p.memberCount}명
                  </td>
                  <td className="px-3 py-2 font-semibold" style={{ color: 'var(--primary)' }}>
                    {p.totalHours}h
                  </td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-sub)' }}>
                    {p.avgHours}h
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
                      style={{
                        backgroundColor: p.pmApprovalStatus === 'APPROVED' ? 'var(--primary-bg)' : 'var(--warn-bg)',
                        color: p.pmApprovalStatus === 'APPROVED' ? 'var(--primary)' : 'var(--warn)',
                      }}
                    >
                      {p.pmApprovalStatus === 'APPROVED' ? '승인완료' : '미승인'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 컨텐츠 */}
      {selectedProjectId && (
        tab === 'monthly' ? (
          <MonthlyView projectId={selectedProjectId} yearMonth={yearMonth} />
        ) : (
          <YearlyView projectId={selectedProjectId} year={currentYear} />
        )
      )}
    </div>
  );
}
