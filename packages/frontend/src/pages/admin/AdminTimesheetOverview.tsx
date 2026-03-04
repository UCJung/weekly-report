import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, ShieldCheck, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  formatYearMonth,
  getCurrentYearMonth,
  getPreviousYearMonth,
  getNextYearMonth,
} from '@uc-teamspace/shared/constants/timesheet-utils';
import { useAdminTimesheetOverview, useAdminApprove } from '../../hooks/useTimesheet';
import { timesheetApi } from '../../api/timesheet.api';

export default function AdminTimesheetOverview() {
  const [yearMonth, setYearMonth] = useState<string>(getCurrentYearMonth);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading } = useAdminTimesheetOverview(yearMonth);
  const adminApproveMutation = useAdminApprove(yearMonth);

  const teams = data?.teams ?? [];
  const grandTotal = data?.grandTotal;
  const totalProjects = data?.totalProjects ?? 0;
  const approvedProjects = data?.approvedProjects ?? 0;

  // 팀장 승인 완료 팀 수: 전체 인원 중 팀장 승인 인원 == 전체 인원 (인원 0인 팀 제외)
  const leaderApprovedTeams = teams.filter(
    (t) => t.totalMembers > 0 && t.leaderApproved === t.totalMembers,
  ).length;
  const totalTeamsWithMembers = teams.filter((t) => t.totalMembers > 0).length;

  // 최종 승인 가능 여부: 모든 팀에서 팀장 승인 완료된 경우
  const canFinalApprove =
    teams.length > 0 &&
    teams.every((t) => t.totalMembers === 0 || t.leaderApproved === t.totalMembers);

  const handleAdminApprove = () => {
    adminApproveMutation.mutate(undefined, {
      onSuccess: () => toast.success('최종 승인이 완료되었습니다.'),
      onError: () => toast.error('최종 승인 처리 중 오류가 발생했습니다.'),
    });
  };

  const handleExport = async () => {
    setDownloading(true);
    try {
      const res = await timesheetApi.adminExport(yearMonth);
      const blob = new Blob([res.data as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `근무시간표_${yearMonth}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('엑셀 파일을 다운로드했습니다.');
    } catch {
      toast.error('다운로드 중 오류가 발생했습니다.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 툴바 카드 */}
      <div
        className="bg-white rounded-lg border border-[var(--gray-border)] flex items-center gap-3"
        style={{ padding: '10px 16px' }}
      >
        <h1 className="text-[16px] font-semibold flex-shrink-0" style={{ color: 'var(--text)' }}>
          근무시간표 관리
        </h1>
        <div className="w-px h-5 bg-[var(--gray-border)]" />

        {/* 월 탐색 */}
        <button
          onClick={() => setYearMonth(getPreviousYearMonth(yearMonth))}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          style={{ color: 'var(--text-sub)' }}
        >
          <ChevronLeft size={16} />
        </button>
        <span
          className="text-[14px] font-medium min-w-[96px] text-center"
          style={{ color: 'var(--text)' }}
        >
          {formatYearMonth(yearMonth)}
        </span>
        <button
          onClick={() => setYearMonth(getNextYearMonth(yearMonth))}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          style={{ color: 'var(--text-sub)' }}
        >
          <ChevronRight size={16} />
        </button>

        <div className="flex-1" />

        {/* 엑셀 다운로드 */}
        <button
          onClick={handleExport}
          disabled={downloading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium border transition-colors"
          style={{
            borderColor: 'var(--gray-border)',
            color: 'var(--text)',
            backgroundColor: 'white',
          }}
        >
          <Download size={14} />
          {downloading ? '다운로드 중...' : '엑셀 다운로드'}
        </button>

        {/* 최종 승인 */}
        <button
          onClick={handleAdminApprove}
          disabled={!canFinalApprove || adminApproveMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium text-white transition-colors disabled:opacity-40"
          style={{ backgroundColor: 'var(--primary)' }}
          title={!canFinalApprove ? '모든 팀의 팀장 승인이 완료되어야 최종 승인이 가능합니다.' : ''}
        >
          <ShieldCheck size={14} />
          {adminApproveMutation.isPending ? '처리 중...' : '최종 승인'}
        </button>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="py-8 text-center text-[13px]" style={{ color: 'var(--text-sub)' }}>
          불러오는 중...
        </div>
      )}

      {/* 요약 카드 + 테이블 */}
      {!isLoading && grandTotal && (
        <>
          {/* 요약 카드 행 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '전체 팀', value: totalTeamsWithMembers, unit: '팀', color: 'var(--text)' },
              { label: '팀장 승인 완료', value: leaderApprovedTeams, unit: '팀', color: 'var(--ok)' },
              { label: '전체 프로젝트', value: totalProjects, unit: '건', color: 'var(--text)' },
              { label: 'PM 승인 완료', value: approvedProjects, unit: '건', color: 'var(--primary)' },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl px-5 py-4"
                style={{ backgroundColor: 'white', border: '1px solid var(--gray-border)' }}
              >
                <p className="text-[11px] mb-1" style={{ color: 'var(--text-sub)' }}>{card.label}</p>
                <p className="text-[24px] font-bold" style={{ color: card.color }}>
                  {card.value}
                  <span className="text-[13px] font-normal ml-1" style={{ color: 'var(--text-sub)' }}>
                    {card.unit}
                  </span>
                </p>
              </div>
            ))}
          </div>

          {/* 팀별 제출/승인 현황 테이블 */}
          <div
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: 'white', border: '1px solid var(--gray-border)' }}
          >
            <div
              className="px-4 py-3"
              style={{ borderBottom: '1px solid var(--gray-border)', backgroundColor: 'var(--tbl-header)' }}
            >
              <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>팀별 제출/승인 현황</h3>
            </div>

            {teams.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-sub)' }}>
                활성 팀이 없습니다.
              </div>
            ) : (
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr style={{ backgroundColor: 'var(--tbl-header)' }}>
                    {['팀 이름', '전체 인원', '팀장 승인', '승인 상태'].map((h) => (
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
                  {teams.map((team, idx) => {
                    const isComplete =
                      team.totalMembers > 0 && team.leaderApproved === team.totalMembers;

                    return (
                      <tr
                        key={team.teamId}
                        style={{
                          backgroundColor: idx % 2 === 0 ? 'white' : 'var(--row-alt)',
                          borderBottom: '1px solid var(--gray-border)',
                        }}
                      >
                        <td className="px-3 py-2 font-medium" style={{ color: 'var(--text)' }}>
                          {team.teamName}
                        </td>
                        <td className="px-3 py-2" style={{ color: 'var(--text-sub)' }}>
                          {team.totalMembers}명
                        </td>
                        <td className="px-3 py-2 font-semibold" style={{ color: 'var(--text)' }}>
                          {team.leaderApproved}/{team.totalMembers}
                        </td>
                        <td className="px-3 py-2">
                          {team.totalMembers === 0 ? (
                            <span style={{ color: 'var(--text-sub)' }}>—</span>
                          ) : isComplete ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium"
                              style={{ backgroundColor: 'var(--ok-bg)', color: 'var(--ok)' }}
                            >
                              <CheckCircle size={11} />
                              완료
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
                              style={{ backgroundColor: 'var(--warn-bg)', color: 'var(--warn)' }}
                            >
                              진행중
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* 최종 승인 조건 안내 */}
          {!canFinalApprove && teams.length > 0 && (
            <div
              className="rounded-lg px-4 py-3 text-[12px]"
              style={{
                backgroundColor: 'var(--warn-bg)',
                border: '1px solid var(--warn)',
                color: 'var(--warn)',
              }}
            >
              최종 승인을 하려면 모든 팀의 팀장 승인이 완료되어야 합니다.
              현재 팀장 승인 완료: {leaderApprovedTeams}팀 / {totalTeamsWithMembers}팀
            </div>
          )}
        </>
      )}
    </div>
  );
}
