import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  formatYearMonth,
  getCurrentYearMonth,
  getPreviousYearMonth,
  getNextYearMonth,
} from '@uc-teamspace/shared/constants/timesheet-utils';
import { TIMESHEET_STATUS_LABEL, TIMESHEET_STATUS_VARIANT, POSITION_LABEL } from '../constants/labels';
import {
  useTeamMembersStatus,
  useTeamSummary,
  useApproveTimesheet,
  useRejectTimesheet,
} from '../hooks/useTimesheet';
import { useTeamStore } from '../stores/teamStore';
import Badge from '../components/ui/Badge';

// ──────────── 반려 사유 모달 ────────────

interface RejectModalProps {
  memberName: string;
  onConfirm: (comment: string) => void;
  onClose: () => void;
}

function RejectModal({ memberName, onConfirm, onClose }: RejectModalProps) {
  const [comment, setComment] = useState('');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="rounded-xl shadow-xl p-6 w-[480px]"
        style={{ backgroundColor: 'white', border: '1px solid var(--gray-border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
            반려 사유 입력
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--text-sub)' }}
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-[13px] mb-3" style={{ color: 'var(--text-sub)' }}>
          <span className="font-medium" style={{ color: 'var(--text)' }}>{memberName}</span>님의 시간표를 반려합니다.
        </p>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="반려 사유를 입력하세요."
          rows={4}
          className="w-full rounded-lg px-3 py-2 text-[13px] resize-none"
          style={{
            border: '1px solid var(--gray-border)',
            color: 'var(--text)',
            backgroundColor: 'white',
          }}
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-[13px] font-medium border transition-colors"
            style={{ borderColor: 'var(--gray-border)', color: 'var(--text)', backgroundColor: 'white' }}
          >
            취소
          </button>
          <button
            onClick={() => {
              if (!comment.trim()) {
                toast.warning('반려 사유를 입력해주세요.');
                return;
              }
              onConfirm(comment.trim());
            }}
            className="px-4 py-1.5 rounded text-[13px] font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--danger)' }}
          >
            반려 확인
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────── 메인 페이지 ────────────

export default function TeamTimesheetReview() {
  const { currentTeamId } = useTeamStore();
  const [yearMonth, setYearMonth] = useState<string>(getCurrentYearMonth);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: membersStatus = [], isLoading: loadingStatus } = useTeamMembersStatus(currentTeamId, yearMonth);
  const { data: teamSummary, isLoading: loadingSummary } = useTeamSummary(currentTeamId, yearMonth);

  const approveMutation = useApproveTimesheet(currentTeamId, yearMonth);
  const rejectMutation = useRejectTimesheet(currentTeamId, yearMonth);

  const handleApprove = (timesheetId: string, memberName: string) => {
    approveMutation.mutate(timesheetId, {
      onSuccess: () => toast.success(`${memberName}님의 시간표를 승인했습니다.`),
      onError: () => toast.error('승인 처리 중 오류가 발생했습니다.'),
    });
  };

  const handleRejectConfirm = (comment: string) => {
    if (!rejectTarget) return;
    rejectMutation.mutate(
      { id: rejectTarget.id, comment },
      {
        onSuccess: () => {
          toast.success(`${rejectTarget.name}님의 시간표를 반려했습니다.`);
          setRejectTarget(null);
        },
        onError: () => toast.error('반려 처리 중 오류가 발생했습니다.'),
      },
    );
  };

  const projects = teamSummary?.projects ?? [];
  const matrix = teamSummary?.matrix ?? [];

  if (!currentTeamId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--text-sub)' }}>팀을 먼저 선택해주세요.</p>
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
          시간표 취합/승인
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
      </div>

      <div className="flex flex-col gap-4">
        {/* 팀원 제출현황 */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'white', border: '1px solid var(--gray-border)' }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: '1px solid var(--gray-border)', backgroundColor: 'var(--tbl-header)' }}
          >
            <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
              팀원 제출현황
            </h2>
          </div>

          {loadingStatus ? (
            <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-sub)' }}>
              불러오는 중...
            </div>
          ) : membersStatus.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-sub)' }}>
              팀원 데이터가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr style={{ backgroundColor: 'var(--tbl-header)' }}>
                    {['이름', '직급', '상태', '총근무시간', '근무일수', '제출일', '팀장승인', '액션'].map((h) => (
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
                  {membersStatus.map((row, idx) => (
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
                      <td className="px-3 py-2">
                        {row.timesheetId && row.status === 'SUBMITTED' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleApprove(row.timesheetId!, row.memberName)}
                              disabled={approveMutation.isPending}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-white transition-colors"
                              style={{ backgroundColor: 'var(--ok)' }}
                              title="승인"
                            >
                              <CheckCircle size={12} />
                              승인
                            </button>
                            <button
                              onClick={() => setRejectTarget({ id: row.timesheetId!, name: row.memberName })}
                              disabled={rejectMutation.isPending}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-white transition-colors"
                              style={{ backgroundColor: 'var(--danger)' }}
                              title="반려"
                            >
                              <XCircle size={12} />
                              반려
                            </button>
                          </div>
                        )}
                        {row.leaderApproval?.status === 'APPROVED' && (
                          <span className="text-[11px]" style={{ color: 'var(--ok)' }}>승인완료</span>
                        )}
                        {row.leaderApproval?.status === 'REJECTED' && (
                          <span className="text-[11px]" style={{ color: 'var(--danger)' }}>반려됨</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 팀원×프로젝트 투입 매트릭스 */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'white', border: '1px solid var(--gray-border)' }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: '1px solid var(--gray-border)', backgroundColor: 'var(--tbl-header)' }}
          >
            <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
              팀원×프로젝트 투입 매트릭스
            </h2>
          </div>

          {loadingSummary ? (
            <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-sub)' }}>
              불러오는 중...
            </div>
          ) : projects.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-sub)' }}>
              {formatYearMonth(yearMonth)} 투입 데이터가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="border-collapse text-[12px]" style={{ minWidth: `${300 + projects.length * 140}px` }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--tbl-header)' }}>
                    <th
                      className="px-3 py-2 text-left font-semibold sticky left-0"
                      style={{
                        color: 'var(--text-sub)',
                        borderBottom: '1px solid var(--gray-border)',
                        backgroundColor: 'var(--tbl-header)',
                        width: '120px',
                        zIndex: 1,
                      }}
                    >
                      이름
                    </th>
                    <th
                      className="px-3 py-2 text-right font-semibold"
                      style={{
                        color: 'var(--text-sub)',
                        borderBottom: '1px solid var(--gray-border)',
                        width: '80px',
                      }}
                    >
                      총시간
                    </th>
                    {projects.map((p) => (
                      <th
                        key={p.id}
                        className="px-3 py-2 text-center font-semibold"
                        style={{
                          color: 'var(--text-sub)',
                          borderBottom: '1px solid var(--gray-border)',
                          minWidth: '130px',
                        }}
                      >
                        <div className="truncate">{p.name}</div>
                        <div className="text-[10px] font-normal">[{p.code}]</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row, idx) => (
                    <tr
                      key={row.memberId}
                      style={{
                        backgroundColor: idx % 2 === 0 ? 'white' : 'var(--row-alt)',
                        borderBottom: '1px solid var(--gray-border)',
                      }}
                    >
                      <td
                        className="px-3 py-2 font-medium sticky left-0"
                        style={{
                          color: 'var(--text)',
                          backgroundColor: idx % 2 === 0 ? 'white' : 'var(--row-alt)',
                          zIndex: 1,
                        }}
                      >
                        {row.memberName}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold" style={{ color: 'var(--text)' }}>
                        {row.totalHours}h
                      </td>
                      {projects.map((p) => {
                        const breakdown = row.projectBreakdown.find((b) => b.projectId === p.id);
                        return (
                          <td key={p.id} className="px-3 py-2 text-center" style={{ color: 'var(--text)' }}>
                            {breakdown && breakdown.hours > 0 ? (
                              <div>
                                <span className="font-medium">{breakdown.hours}h</span>
                                <span className="text-[10px] ml-1" style={{ color: 'var(--text-sub)' }}>
                                  ({breakdown.ratio}%)
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-sub)' }}>—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 반려 모달 */}
      {rejectTarget && (
        <RejectModal
          memberName={rejectTarget.name}
          onConfirm={handleRejectConfirm}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
