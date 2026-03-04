import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import {
  formatYearMonth,
  getCurrentYearMonth,
  getPreviousYearMonth,
  getNextYearMonth,
} from '@uc-teamspace/shared/constants/timesheet-utils';
import { TIMESHEET_STATUS_LABEL, TIMESHEET_STATUS_VARIANT, POSITION_LABEL, ATTENDANCE_LABEL, WORK_TYPE_LABEL } from '../constants/labels';
import {
  useTeamMembersStatus,
  useTeamSummary,
  useApproveTimesheet,
  useRejectTimesheet,
  useBatchApproveTimesheets,
} from '../hooks/useTimesheet';
import { timesheetApi, type TeamMemberStatusRow } from '../api/timesheet.api';
import { useTeamStore } from '../stores/teamStore';
import Badge from '../components/ui/Badge';

// ──────────── 시간표 상세 팝업 (MyTimesheet 동일 레이아웃) ────────────

interface TimesheetPopupProps {
  timesheetId: string;
  memberName: string;
  onClose: () => void;
}

function TimesheetPopup({ timesheetId, memberName, onClose }: TimesheetPopupProps) {
  const { data: ts, isLoading } = useQuery({
    queryKey: ['timesheet-detail', timesheetId],
    queryFn: () => timesheetApi.getTimesheetById(timesheetId).then((r) => r.data.data),
    enabled: !!timesheetId,
    staleTime: 30_000,
  });

  // ESC 키 핸들러
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // 날짜 정렬
  const sortedEntries = useMemo(() => {
    if (!ts?.entries) return [];
    return [...ts.entries].sort((a, b) => a.date.localeCompare(b.date));
  }, [ts]);

  // 프로젝트 목록 추출 (entries의 workLogs에서 고유 프로젝트)
  const projects = useMemo(() => {
    if (!ts?.entries) return [];
    const map = new Map<string, { id: string; name: string; code: string }>();
    for (const entry of ts.entries) {
      for (const wl of entry.workLogs) {
        if (wl.project && !map.has(wl.projectId)) {
          map.set(wl.projectId, wl.project);
        }
      }
    }
    return Array.from(map.values());
  }, [ts]);

  // 프로젝트별 월간합계
  const monthlyTotals = useMemo(() => {
    let grandTotal = 0;
    const projectTotals: Record<string, number> = {};
    for (const entry of sortedEntries) {
      for (const wl of entry.workLogs) {
        grandTotal += wl.hours;
        projectTotals[wl.projectId] = (projectTotals[wl.projectId] ?? 0) + wl.hours;
      }
    }
    return { grandTotal, projectTotals };
  }, [sortedEntries]);

  const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

  // sticky 열 너비 / left 상수 (MyTimesheet 동일)
  const COL_W = { date: 46, day: 46, att: 90, total: 60 };
  const COL_LEFT = {
    date: 0,
    day: COL_W.date,
    att: COL_W.date + COL_W.day,
    total: COL_W.date + COL_W.day + COL_W.att,
  };
  const stickyBase: React.CSSProperties = { position: 'sticky', zIndex: 1 };
  const stickyHeadFoot: React.CSSProperties = { position: 'sticky', zIndex: 3 };

  const getRequiredHours = (attendance: string) => {
    if (attendance === 'WORK' || attendance === 'HOLIDAY_WORK') return 8;
    if (attendance === 'HALF_DAY_LEAVE') return 4;
    return 0;
  };

  const getHoursColor = (total: number, required: number) => {
    if (required === 0) return 'var(--text-sub)';
    if (total === required) return 'var(--ok)';
    if (total > 0) return 'var(--danger)';
    return 'var(--text-sub)';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl flex flex-col"
        style={{ width: '95vw', height: '90vh', maxWidth: '1400px' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--gray-border)' }}>
          <div className="flex items-center gap-3">
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>
              {memberName}님의 근무시간표
            </h2>
            {ts && (
              <Badge variant={TIMESHEET_STATUS_VARIANT[ts.status] ?? 'gray'}>
                {TIMESHEET_STATUS_LABEL[ts.status] ?? ts.status}
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-sub)', border: '1px solid var(--gray-border)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-[13px]" style={{ color: 'var(--text-sub)' }}>
              불러오는 중...
            </div>
          ) : !ts ? (
            <div className="flex items-center justify-center h-full text-[13px]" style={{ color: 'var(--text-sub)' }}>
              시간표 데이터가 없습니다.
            </div>
          ) : (
            <table className="border-collapse text-[12px]" style={{ width: 'max-content', minWidth: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr style={{ backgroundColor: 'var(--tbl-header)' }}>
                  <th className="px-2 py-2 text-left font-semibold" style={{ ...stickyHeadFoot, left: COL_LEFT.date, color: 'var(--text-sub)', borderBottom: '1px solid var(--gray-border)', width: COL_W.date, minWidth: COL_W.date, backgroundColor: 'var(--tbl-header)' }}>날짜</th>
                  <th className="px-2 py-2 text-left font-semibold" style={{ ...stickyHeadFoot, left: COL_LEFT.day, color: 'var(--text-sub)', borderBottom: '1px solid var(--gray-border)', width: COL_W.day, minWidth: COL_W.day, backgroundColor: 'var(--tbl-header)' }}>요일</th>
                  <th className="px-2 py-2 text-left font-semibold" style={{ ...stickyHeadFoot, left: COL_LEFT.att, color: 'var(--text-sub)', borderBottom: '1px solid var(--gray-border)', width: COL_W.att, minWidth: COL_W.att, backgroundColor: 'var(--tbl-header)' }}>근태</th>
                  <th className="px-2 py-2 text-right font-semibold" style={{ ...stickyHeadFoot, left: COL_LEFT.total, color: 'var(--text-sub)', borderBottom: '1px solid var(--gray-border)', width: COL_W.total, minWidth: COL_W.total, backgroundColor: 'var(--tbl-header)', borderRight: projects.length > 0 ? '2px solid var(--gray-border)' : undefined }}>합계</th>
                  {projects.map((p) => (
                    <th key={p.id} className="px-2 py-2 font-semibold" style={{ color: 'var(--text-sub)', borderBottom: '1px solid var(--gray-border)', minWidth: '150px' }}>
                      <div className="truncate">{p.name}</div>
                      <div className="text-[10px] font-normal">[{p.code}]</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((entry) => {
                  const d = new Date(entry.date);
                  const dayOfWeek = d.getUTCDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const totalH = entry.workLogs.reduce((s, wl) => s + wl.hours, 0);
                  const required = getRequiredHours(entry.attendance);
                  const isHoliday = entry.attendance === 'HOLIDAY';
                  const isLeave = entry.attendance === 'ANNUAL_LEAVE';
                  const noInput = isHoliday || isLeave;
                  const rowBg = noInput
                    ? '#F3F4F6'
                    : required > 0 && totalH === required
                      ? '#ECFDF5'
                      : required > 0 && totalH > 0 && totalH !== required
                        ? '#FEF2F2'
                        : isWeekend ? 'var(--row-alt)' : 'white';
                  const cellFilledBg = noInput
                    ? '#F3F4F6'
                    : required > 0 && totalH === required
                      ? '#D1FAE5'
                      : required > 0 && totalH > 0 && totalH !== required
                        ? '#FEE2E2'
                        : '#EDE9FF';

                  return (
                    <tr key={entry.id} style={{ backgroundColor: rowBg, borderBottom: '1px solid var(--gray-border)' }}>
                      <td className="px-2 py-1.5 font-medium" style={{ ...stickyBase, left: COL_LEFT.date, backgroundColor: rowBg, color: 'var(--text)' }}>{d.getUTCDate()}</td>
                      <td className="px-2 py-1.5" style={{ ...stickyBase, left: COL_LEFT.day, backgroundColor: rowBg, color: dayOfWeek === 0 ? 'var(--danger)' : dayOfWeek === 6 ? 'var(--primary)' : 'var(--text-sub)' }}>{DAY_LABELS[dayOfWeek]}</td>
                      <td className="px-2 py-1.5" style={{ ...stickyBase, left: COL_LEFT.att, backgroundColor: rowBg, color: 'var(--text)' }}>
                        {ATTENDANCE_LABEL[entry.attendance] ?? entry.attendance}
                      </td>
                      <td className="px-2 py-1.5 text-right font-medium" style={{ ...stickyBase, left: COL_LEFT.total, backgroundColor: rowBg, color: getHoursColor(totalH, required), borderRight: projects.length > 0 ? '2px solid var(--gray-border)' : undefined }}>
                        {required > 0 ? (<>{totalH}<span className="text-[10px] ml-0.5" style={{ color: 'var(--text-sub)' }}>/{required}h</span></>) : (<span style={{ color: 'var(--text-sub)' }}>—</span>)}
                      </td>
                      {projects.map((p) => {
                        const wl = entry.workLogs.find((w) => w.projectId === p.id);
                        const hasFilled = (wl?.hours ?? 0) > 0;
                        const needsDisplay = !noInput;
                        return (
                          <td key={p.id} className="px-1 py-1" style={hasFilled && needsDisplay ? { backgroundColor: cellFilledBg } : undefined}>
                            {needsDisplay && wl ? (
                              <div className="flex gap-1">
                                <span className="w-14 text-center" style={{ color: 'var(--text)' }}>{wl.hours}h</span>
                                <span style={{ color: 'var(--text-sub)' }}>{WORK_TYPE_LABEL[wl.workType] ?? wl.workType}</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-sub)' }}>—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
                <tr style={{ backgroundColor: 'var(--tbl-header)', borderTop: '2px solid var(--gray-border)' }}>
                  <td className="px-2 py-2 font-semibold text-[12px]" style={{ ...stickyHeadFoot, left: COL_LEFT.date, backgroundColor: 'var(--tbl-header)', color: 'var(--text)' }}>월간</td>
                  <td className="px-2 py-2 font-semibold text-[12px]" style={{ ...stickyHeadFoot, left: COL_LEFT.day, backgroundColor: 'var(--tbl-header)', color: 'var(--text)' }}>합계</td>
                  <td className="px-2 py-2 text-[12px]" style={{ ...stickyHeadFoot, left: COL_LEFT.att, backgroundColor: 'var(--tbl-header)' }} />
                  <td className="px-2 py-2 text-right font-semibold text-[12px]" style={{ ...stickyHeadFoot, left: COL_LEFT.total, backgroundColor: 'var(--tbl-header)', color: 'var(--text)', borderRight: projects.length > 0 ? '2px solid var(--gray-border)' : undefined }}>{monthlyTotals.grandTotal}h</td>
                  {projects.map((p) => (
                    <td key={p.id} className="px-2 py-2 font-semibold text-[12px]" style={{ color: 'var(--primary)' }}>{monthlyTotals.projectTotals[p.id] ?? 0}h</td>
                  ))}
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [filterPart, setFilterPart] = useState<string>('ALL');
  const [filterMember, setFilterMember] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [popupTarget, setPopupTarget] = useState<{ timesheetId: string; memberName: string } | null>(null);

  const { data: membersStatus = [], isLoading: loadingStatus } = useTeamMembersStatus(currentTeamId, yearMonth);
  const { data: teamSummary, isLoading: loadingSummary } = useTeamSummary(currentTeamId, yearMonth);

  const approveMutation = useApproveTimesheet(currentTeamId, yearMonth);
  const rejectMutation = useRejectTimesheet(currentTeamId, yearMonth);
  const batchApproveMutation = useBatchApproveTimesheets(currentTeamId, yearMonth);

  // 파트 목록 추출
  const partOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of membersStatus) {
      if (row.partId && row.partName) map.set(row.partId, row.partName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [membersStatus]);

  // 필터 적용
  const filteredMembers = useMemo(() => {
    let list = membersStatus;
    if (filterPart !== 'ALL') list = list.filter((r) => r.partId === filterPart);
    if (filterMember !== 'ALL') list = list.filter((r) => r.memberId === filterMember);
    return list;
  }, [membersStatus, filterPart, filterMember]);

  // 필터 적용된 팀원 기준 멤버 선택지
  const memberOptions = useMemo(() => {
    const base = filterPart === 'ALL' ? membersStatus : membersStatus.filter((r) => r.partId === filterPart);
    return base.map((r) => ({ id: r.memberId, name: r.memberName }));
  }, [membersStatus, filterPart]);

  // 카운트
  const totalCount = filteredMembers.length;
  const submittedCount = filteredMembers.filter((r) => r.status === 'SUBMITTED' || r.status === 'APPROVED').length;
  const notSubmittedCount = totalCount - submittedCount;

  // 일괄승인 가능한 행 (SUBMITTED 상태이면서 timesheetId가 있는 행)
  const approvableRows = useMemo(
    () => filteredMembers.filter((r) => r.status === 'SUBMITTED' && r.timesheetId),
    [filteredMembers],
  );

  // 데이터 변경 시 선택 초기화
  useEffect(() => { setSelectedIds(new Set()); }, [yearMonth, filterPart, filterMember]);

  const toggleSelect = useCallback((timesheetId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(timesheetId)) next.delete(timesheetId);
      else next.add(timesheetId);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === approvableRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(approvableRows.map((r) => r.timesheetId!)));
    }
  }, [approvableRows, selectedIds]);

  const handleApprove = (timesheetId: string, memberName: string) => {
    approveMutation.mutate(timesheetId, {
      onSuccess: () => toast.success(`${memberName}님의 시간표를 승인했습니다.`),
      onError: () => toast.error('승인 처리 중 오류가 발생했습니다.'),
    });
  };

  const handleBatchApprove = () => {
    if (selectedIds.size === 0) return;
    batchApproveMutation.mutate(Array.from(selectedIds), {
      onSuccess: (data) => {
        toast.success(`${data.approvedCount}건의 시간표를 일괄 승인했습니다.`);
        setSelectedIds(new Set());
      },
      onError: () => toast.error('일괄 승인 중 오류가 발생했습니다.'),
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

  const handleRowClick = (row: TeamMemberStatusRow) => {
    if (row.timesheetId) {
      setPopupTarget({ timesheetId: row.timesheetId, memberName: row.memberName });
    }
  };

  const projects = teamSummary?.projects ?? [];
  const matrix = useMemo(() => {
    let list = teamSummary?.matrix ?? [];
    if (filterPart !== 'ALL') list = list.filter((r) => r.partId === filterPart);
    if (filterMember !== 'ALL') list = list.filter((r) => r.memberId === filterMember);
    return list;
  }, [teamSummary, filterPart, filterMember]);

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

        <div className="w-px h-5 bg-[var(--gray-border)]" />

        {/* 파트 필터 */}
        <select
          value={filterPart}
          onChange={(e) => { setFilterPart(e.target.value); setFilterMember('ALL'); }}
          className="text-[12px] rounded px-2 py-1"
          style={{ border: '1px solid var(--gray-border)', color: 'var(--text)' }}
        >
          <option value="ALL">전체 파트</option>
          {partOptions.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* 팀원 필터 */}
        <select
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
          className="text-[12px] rounded px-2 py-1"
          style={{ border: '1px solid var(--gray-border)', color: 'var(--text)' }}
        >
          <option value="ALL">전체 팀원</option>
          {memberOptions.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        {/* 일괄승인 버튼 */}
        {selectedIds.size > 0 && (
          <>
            <div className="w-px h-5 bg-[var(--gray-border)]" />
            <button
              onClick={handleBatchApprove}
              disabled={batchApproveMutation.isPending}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-[12px] font-medium text-white transition-colors"
              style={{ backgroundColor: 'var(--ok)' }}
            >
              <CheckCircle size={14} />
              일괄 승인 ({selectedIds.size}건)
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* 팀원 제출현황 */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'white', border: '1px solid var(--gray-border)' }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--gray-border)', backgroundColor: 'var(--tbl-header)' }}
          >
            <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
              팀원 제출현황
            </h2>
            <div className="flex items-center gap-2 text-[12px]">
              <span style={{ color: 'var(--text-sub)' }}>총원 <strong style={{ color: 'var(--text)' }}>{totalCount}</strong>명</span>
              <span style={{ color: 'var(--text-sub)' }}>·</span>
              <span style={{ color: 'var(--ok)' }}>제출 <strong>{submittedCount}</strong>명</span>
              <span style={{ color: 'var(--text-sub)' }}>·</span>
              <span style={{ color: 'var(--danger)' }}>미제출 <strong>{notSubmittedCount}</strong>명</span>
            </div>
          </div>

          {loadingStatus ? (
            <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-sub)' }}>
              불러오는 중...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-sub)' }}>
              팀원 데이터가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr style={{ backgroundColor: 'var(--tbl-header)' }}>
                    <th
                      className="px-2 py-2 text-center"
                      style={{ color: 'var(--text-sub)', borderBottom: '1px solid var(--gray-border)', width: '40px' }}
                    >
                      <input
                        type="checkbox"
                        checked={approvableRows.length > 0 && selectedIds.size === approvableRows.length}
                        onChange={toggleAll}
                        className="accent-[var(--primary)]"
                      />
                    </th>
                    {['성명', '직급', '파트', '직책', '상태', '총근무시간', '근무일수', '제출일', '팀장승인'].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-semibold"
                        style={{ color: 'var(--text-sub)', borderBottom: '1px solid var(--gray-border)' }}
                      >
                        {h}
                      </th>
                    ))}
                    <th
                      className="px-3 py-2 text-right font-semibold whitespace-nowrap"
                      style={{ color: 'var(--text-sub)', borderBottom: '1px solid var(--gray-border)' }}
                    >
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((row, idx) => {
                    const isApprovable = row.status === 'SUBMITTED' && !!row.timesheetId;
                    const isChecked = !!row.timesheetId && selectedIds.has(row.timesheetId);

                    return (
                      <tr
                        key={row.memberId}
                        className={row.timesheetId ? 'cursor-pointer' : ''}
                        style={{
                          backgroundColor: idx % 2 === 0 ? 'white' : 'var(--row-alt)',
                          borderBottom: '1px solid var(--gray-border)',
                        }}
                        onClick={() => handleRowClick(row)}
                      >
                        <td
                          className="px-2 py-2 text-center"
                          style={{ width: '40px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isApprovable && (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelect(row.timesheetId!)}
                              className="accent-[var(--primary)]"
                            />
                          )}
                        </td>
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
                        <td
                          className="px-3 py-2 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.timesheetId && row.status === 'SUBMITTED' && (
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => handleApprove(row.timesheetId!, row.memberName)}
                                disabled={approveMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium text-white whitespace-nowrap transition-colors"
                                style={{ backgroundColor: 'var(--ok)' }}
                                title="승인"
                              >
                                <CheckCircle size={12} />
                                승인
                              </button>
                              <button
                                onClick={() => setRejectTarget({ id: row.timesheetId!, name: row.memberName })}
                                disabled={rejectMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium text-white whitespace-nowrap transition-colors"
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
                    );
                  })}
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
              <table className="border-collapse text-[12px]" style={{ minWidth: `${440 + projects.length * 140}px` }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--tbl-header)' }}>
                    {['성명', '직급', '파트', '직책'].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-semibold sticky left-0"
                        style={{
                          color: 'var(--text-sub)',
                          borderBottom: '1px solid var(--gray-border)',
                          backgroundColor: 'var(--tbl-header)',
                          ...(h === '성명' ? { width: '80px', zIndex: 1 } : {}),
                        }}
                      >
                        {h}
                      </th>
                    ))}
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
                      <td className="px-3 py-2" style={{ color: 'var(--text-sub)' }}>
                        {row.position ? (POSITION_LABEL[row.position] ?? row.position) : '—'}
                      </td>
                      <td className="px-3 py-2" style={{ color: 'var(--text-sub)' }}>
                        {row.partName ?? '—'}
                      </td>
                      <td className="px-3 py-2" style={{ color: 'var(--text-sub)' }}>
                        {row.jobTitle ?? '—'}
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

      {/* 시간표 상세 팝업 */}
      {popupTarget && (
        <TimesheetPopup
          timesheetId={popupTarget.timesheetId}
          memberName={popupTarget.memberName}
          onClose={() => setPopupTarget(null)}
        />
      )}
    </div>
  );
}
