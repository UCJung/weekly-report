import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertCircle, CheckCircle, CopyPlus, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getMonthDays,
  isWeekend,
  getRequiredHours,
  formatYearMonth,
  getCurrentYearMonth,
  getPreviousYearMonth,
  getNextYearMonth,
} from '@uc-teamspace/shared/constants/timesheet-utils';
import type {
  AttendanceType,
  WorkType,
  TimesheetEntry,
  TimesheetWorkLog,
} from '@uc-teamspace/shared';
import {
  ATTENDANCE_LABEL,
  WORK_TYPE_LABEL,
  TIMESHEET_STATUS_LABEL,
  TIMESHEET_STATUS_VARIANT,
} from '../constants/labels';
import {
  useMyTimesheet,
  useCreateTimesheet,
  useSaveEntry,
  useSubmitTimesheet,
} from '../hooks/useTimesheet';
import { useTeamProjects } from '../hooks/useProjects';
import { useTeamStore } from '../stores/teamStore';
import Badge from '../components/ui/Badge';

// ───────── 상수 ─────────

const ATTENDANCE_OPTIONS: AttendanceType[] = [
  'WORK',
  'HOLIDAY_WORK',
  'ANNUAL_LEAVE',
  'HALF_DAY_LEAVE',
  'HOLIDAY',
];

const WORK_TYPE_OPTIONS: WorkType[] = ['OFFICE', 'FIELD', 'REMOTE', 'BUSINESS_TRIP'];

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

// ───────── 로컬 상태 타입 ─────────

interface LocalWorkLog {
  projectId: string;
  hours: number;
  workType: WorkType;
}

interface LocalEntry {
  entryId: string;
  date: string;
  attendance: AttendanceType;
  workLogs: LocalWorkLog[];
  dirty: boolean;
}

// ───────── 헬퍼 ─────────

function dateToString(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function serverEntryToLocal(entry: TimesheetEntry): LocalEntry {
  return {
    entryId: entry.id,
    date: entry.date.slice(0, 10),
    attendance: entry.attendance,
    workLogs: entry.workLogs.map((wl: TimesheetWorkLog) => ({
      projectId: wl.projectId,
      hours: wl.hours,
      workType: wl.workType,
    })),
    dirty: false,
  };
}

function getTotalHours(entry: LocalEntry): number {
  return entry.workLogs.reduce((sum, wl) => sum + wl.hours, 0);
}

function getHoursColor(
  total: number,
  required: number,
): string {
  if (required === 0) return 'var(--text-sub)';
  if (total === required) return 'var(--ok)';
  if (required === 8 && total === 4) return 'var(--warn)'; // 반차
  if (total > 0 && total !== required) return 'var(--danger)';
  if (total === 0 && required > 0) return 'var(--text-sub)';
  return 'var(--text-sub)';
}

// ───────── 컴포넌트 ─────────

export default function MyTimesheet() {
  const { currentTeamId } = useTeamStore();
  const [yearMonth, setYearMonth] = useState<string>(getCurrentYearMonth);

  const { data: timesheet, isLoading } = useMyTimesheet(yearMonth, currentTeamId);
  const createMutation = useCreateTimesheet(yearMonth, currentTeamId);
  const saveEntryMutation = useSaveEntry(yearMonth, currentTeamId);
  const submitMutation = useSubmitTimesheet(yearMonth, currentTeamId);

  const { data: teamProjects = [] } = useTeamProjects(currentTeamId ?? '');

  // 달력에 표시할 날짜 배열
  const monthDays = useMemo(() => getMonthDays(yearMonth), [yearMonth]);

  // 전체화면 모드
  const [fullscreen, setFullscreen] = useState(false);

  // 활성 프로젝트 컬럼 목록 (사용자가 추가/제거 가능)
  const [activeProjectIds, setActiveProjectIds] = useState<string[]>([]);

  // 로컬 엔트리 상태 (날짜별 Map)
  const [localEntries, setLocalEntries] = useState<Map<string, LocalEntry>>(new Map());

  // 자동저장 debounce ref
  const saveTimerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const isSubmitted =
    timesheet?.status === 'SUBMITTED' ||
    timesheet?.status === 'APPROVED';

  // ── 시간표 로드 시 로컬 상태 동기화 ──
  useEffect(() => {
    if (!timesheet) return;

    const newMap = new Map<string, LocalEntry>();
    monthDays.forEach((d) => {
      const dateStr = dateToString(d);
      const serverEntry = timesheet.entries.find(
        (e: TimesheetEntry) => e.date.slice(0, 10) === dateStr,
      );
      if (serverEntry) {
        newMap.set(dateStr, serverEntryToLocal(serverEntry));
      } else {
        newMap.set(dateStr, {
          entryId: '',
          date: dateStr,
          attendance: isWeekend(d) ? 'HOLIDAY' : 'WORK',
          workLogs: [],
          dirty: false,
        });
      }
    });
    setLocalEntries(newMap);

    // 활성 프로젝트 초기화: 서버 데이터에 있는 프로젝트 + 기존 선택
    const serverProjectIds = new Set<string>();
    timesheet.entries.forEach((e: TimesheetEntry) => {
      e.workLogs.forEach((wl: TimesheetWorkLog) => {
        serverProjectIds.add(wl.projectId);
      });
    });
    if (serverProjectIds.size > 0) {
      setActiveProjectIds((prev) => {
        const merged = [...new Set([...prev, ...serverProjectIds])];
        return merged;
      });
    }
  }, [timesheet, monthDays]);

  // ── 시간표 자동 생성 ──
  useEffect(() => {
    if (!currentTeamId) return;
    if (isLoading) return;
    if (timesheet) return; // 이미 존재
    // timesheet가 null이면 생성 (undefined는 아직 로딩 전)
    if (timesheet === null) {
      createMutation.mutate(undefined, {
        onError: () => toast.error('시간표 생성에 실패했습니다.'),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, timesheet, currentTeamId]);

  // ── 엔트리 저장 (debounce 500ms) ──
  const scheduleAutoSave = useCallback(
    (dateStr: string, entry: LocalEntry) => {
      if (!entry.entryId) return; // entryId 없으면 저장 불가
      const existing = saveTimerRef.current.get(dateStr);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        saveEntryMutation.mutate(
          {
            entryId: entry.entryId,
            data: {
              attendance: entry.attendance,
              workLogs: entry.workLogs.map((wl) => ({
                projectId: wl.projectId,
                hours: wl.hours,
                workType: wl.workType,
              })),
            },
          },
          {
            onError: () => toast.error(`${dateStr} 저장 중 오류가 발생했습니다.`),
          },
        );
        saveTimerRef.current.delete(dateStr);
      }, 500);
      saveTimerRef.current.set(dateStr, timer);
    },
    [saveEntryMutation],
  );

  // ── 근태 변경 ──
  const handleAttendanceChange = (dateStr: string, attendance: AttendanceType) => {
    if (isSubmitted) return;
    setLocalEntries((prev) => {
      const next = new Map(prev);
      const entry = next.get(dateStr);
      if (!entry) return prev;
      // 공휴일/연차 변경 시 workLogs 초기화 (서버 검증: 워크로그 없어야 함)
      const clearLogs = attendance === 'HOLIDAY' || attendance === 'ANNUAL_LEAVE';
      const updated: LocalEntry = {
        ...entry,
        attendance,
        workLogs: clearLogs ? [] : entry.workLogs,
        dirty: true,
      };
      next.set(dateStr, updated);
      scheduleAutoSave(dateStr, updated);
      return next;
    });
  };

  // ── 투입시간 변경 ──
  const handleHoursChange = (dateStr: string, projectId: string, hours: number) => {
    if (isSubmitted) return;
    setLocalEntries((prev) => {
      const next = new Map(prev);
      const entry = next.get(dateStr);
      if (!entry) return prev;
      const workLogs = entry.workLogs.map((wl) =>
        wl.projectId === projectId ? { ...wl, hours } : wl,
      );
      // 새 프로젝트인 경우 추가
      if (!workLogs.find((wl) => wl.projectId === projectId)) {
        workLogs.push({ projectId, hours, workType: 'OFFICE' });
      }
      const updated: LocalEntry = { ...entry, workLogs, dirty: true };
      next.set(dateStr, updated);
      scheduleAutoSave(dateStr, updated);
      return next;
    });
  };

  // ── 업무방식 변경 ──
  const handleWorkTypeChange = (dateStr: string, projectId: string, workType: WorkType) => {
    if (isSubmitted) return;
    setLocalEntries((prev) => {
      const next = new Map(prev);
      const entry = next.get(dateStr);
      if (!entry) return prev;
      const workLogs = entry.workLogs.map((wl) =>
        wl.projectId === projectId ? { ...wl, workType } : wl,
      );
      if (!workLogs.find((wl) => wl.projectId === projectId)) {
        workLogs.push({ projectId, hours: 0, workType });
      }
      const updated: LocalEntry = { ...entry, workLogs, dirty: true };
      next.set(dateStr, updated);
      scheduleAutoSave(dateStr, updated);
      return next;
    });
  };

  // ── 이전 근무일 복사 (공휴일/주말 스킵) ──
  const findPrevWorkDayEntry = (dateStr: string): LocalEntry | null => {
    const idx = monthDays.findIndex((d) => dateToString(d) === dateStr);
    for (let i = idx - 1; i >= 0; i--) {
      const prevStr = dateToString(monthDays[i]);
      const entry = localEntries.get(prevStr);
      if (entry && entry.attendance !== 'HOLIDAY') return entry;
    }
    return null;
  };

  const handleCopyFromPrevWorkDay = (dateStr: string) => {
    if (isSubmitted) return;
    const srcEntry = findPrevWorkDayEntry(dateStr);
    if (!srcEntry) {
      toast.warning('복사할 이전 근무일이 없습니다.');
      return;
    }

    setLocalEntries((prev) => {
      const next = new Map(prev);
      const curEntry = next.get(dateStr);
      if (!curEntry) return prev;
      const updated: LocalEntry = {
        ...curEntry,
        attendance: srcEntry.attendance,
        workLogs: srcEntry.workLogs.map((wl) => ({ ...wl })),
        dirty: true,
      };
      next.set(dateStr, updated);
      scheduleAutoSave(dateStr, updated);
      return next;
    });
    toast.success('이전 근무일 내용을 복사했습니다.');
  };

  // ── 프로젝트 추가 (다중) ──
  const handleAddProjects = (projectIds: string[]) => {
    setActiveProjectIds((prev) => {
      const merged = [...new Set([...prev, ...projectIds])];
      return merged;
    });
  };

  // ── 프로젝트 제거 ──
  const handleRemoveProject = (projectId: string) => {
    setActiveProjectIds((prev) => prev.filter((id) => id !== projectId));
    // 모든 엔트리에서 해당 프로젝트 워크로그 제거
    setLocalEntries((prev) => {
      const next = new Map(prev);
      next.forEach((entry, dateStr) => {
        const workLogs = entry.workLogs.filter((wl) => wl.projectId !== projectId);
        if (workLogs.length !== entry.workLogs.length) {
          const updated: LocalEntry = { ...entry, workLogs, dirty: true };
          next.set(dateStr, updated);
          scheduleAutoSave(dateStr, updated);
        }
      });
      return next;
    });
  };

  // ── 검증 ──
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    localEntries.forEach((entry, dateStr) => {
      const required = getRequiredHours(entry.attendance);
      const total = getTotalHours(entry);
      if (required > 0 && total !== required) {
        const dateObj = new Date(dateStr + 'T00:00:00Z');
        const day = dateObj.getUTCDate();
        errors.push(`${day}일: 근태(${ATTENDANCE_LABEL[entry.attendance]}) 필요 ${required}h, 입력 ${total}h`);
      }
    });
    return errors;
  }, [localEntries]);

  // ── 월간 합계 계산 ──
  const monthlyTotals = useMemo(() => {
    const projectTotals: Record<string, number> = {};
    let grandTotal = 0;
    localEntries.forEach((entry) => {
      entry.workLogs.forEach((wl) => {
        projectTotals[wl.projectId] = (projectTotals[wl.projectId] ?? 0) + wl.hours;
        grandTotal += wl.hours;
      });
    });
    return { projectTotals, grandTotal };
  }, [localEntries]);

  // ── 제출 ──
  const handleSubmit = async () => {
    if (!timesheet) return;
    if (validationErrors.length > 0) {
      toast.error(`검증 오류가 있습니다.\n${validationErrors.slice(0, 3).join('\n')}${validationErrors.length > 3 ? `\n외 ${validationErrors.length - 3}건` : ''}`);
      return;
    }
    submitMutation.mutate(timesheet.id, {
      onSuccess: () => toast.success('시간표가 제출되었습니다.'),
      onError: () => toast.error('제출에 실패했습니다.'),
    });
  };

  // ── 프로젝트 정보 매핑 ──
  const projectMap = useMemo(() => {
    const map: Record<string, { id: string; name: string; code: string }> = {};
    teamProjects.forEach((p: { id: string; name: string; code: string }) => {
      map[p.id] = p;
    });
    return map;
  }, [teamProjects]);

  const allProjects = teamProjects as { id: string; name: string; code: string }[];

  // ── 렌더링 ──

  if (!currentTeamId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--text-sub)' }}>팀을 먼저 선택해주세요.</p>
      </div>
    );
  }


  // ── sticky 열 너비 / left 상수 ──
  const COL_W = { date: 46, day: 36, att: 90, total: 60, copy: 32 };
  const COL_LEFT = {
    date: 0,
    day: COL_W.date,
    att: COL_W.date + COL_W.day,
    total: COL_W.date + COL_W.day + COL_W.att,
  };
  const stickyBase: React.CSSProperties = { position: 'sticky', zIndex: 1 };
  const stickyHeadFoot: React.CSSProperties = { position: 'sticky', zIndex: 3 }; // thead/tfoot: row-sticky + col-sticky

  // ── 테이블 헤더 행 ──
  const renderHeadRow = () => (
    <tr style={{ backgroundColor: 'var(--tbl-header)' }}>
      <th className="px-2 py-2 text-left font-semibold" style={{ ...stickyHeadFoot, left: COL_LEFT.date, color: 'var(--text-sub)', borderBottom: '1px solid var(--gray-border)', width: COL_W.date, minWidth: COL_W.date, backgroundColor: 'var(--tbl-header)' }}>날짜</th>
      <th className="px-2 py-2 text-left font-semibold" style={{ ...stickyHeadFoot, left: COL_LEFT.day, color: 'var(--text-sub)', borderBottom: '1px solid var(--gray-border)', width: COL_W.day, minWidth: COL_W.day, backgroundColor: 'var(--tbl-header)' }}>요일</th>
      <th className="px-2 py-2 text-left font-semibold" style={{ ...stickyHeadFoot, left: COL_LEFT.att, color: 'var(--text-sub)', borderBottom: '1px solid var(--gray-border)', width: COL_W.att, minWidth: COL_W.att, backgroundColor: 'var(--tbl-header)' }}>근태</th>
      <th className="px-2 py-2 text-right font-semibold" style={{ ...stickyHeadFoot, left: COL_LEFT.total, color: 'var(--text-sub)', borderBottom: '1px solid var(--gray-border)', width: COL_W.total, minWidth: COL_W.total, backgroundColor: 'var(--tbl-header)', borderRight: activeProjectIds.length > 0 ? '2px solid var(--gray-border)' : undefined }}>합계</th>
      {activeProjectIds.map((pid) => (
        <th key={pid} className="px-2 py-2 font-semibold" style={{ color: 'var(--text-sub)', borderBottom: '1px solid var(--gray-border)', minWidth: '150px' }}>
          <div className="flex items-center justify-between gap-1">
            <span className="truncate">{projectMap[pid]?.name ?? pid}</span>
            {!isSubmitted && (
              <button onClick={() => handleRemoveProject(pid)} className="flex-shrink-0 p-0.5 rounded hover:bg-red-100 transition-colors" style={{ color: 'var(--danger)' }} title="프로젝트 제거"><Trash2 size={11} /></button>
            )}
          </div>
        </th>
      ))}
      {!isSubmitted && <th className="px-1 py-2" style={{ borderBottom: '1px solid var(--gray-border)', width: COL_W.copy, minWidth: COL_W.copy }} />}
    </tr>
  );

  // ── 테이블 body 행 ──
  const renderBodyRows = () =>
    monthDays.map((d) => {
      const dateStr = dateToString(d);
      const entry = localEntries.get(dateStr);
      if (!entry) return null;

      const weekend = isWeekend(d);
      const dayOfWeek = d.getUTCDay();
      const total = getTotalHours(entry);
      const required = getRequiredHours(entry.attendance);
      const hoursColor = getHoursColor(total, required);
      const isHoliday = entry.attendance === 'HOLIDAY';
      const isLeave = entry.attendance === 'ANNUAL_LEAVE';
      const noInput = isHoliday || isLeave; // 입력 불필요
      // 행 배경색: 입력불필요(회색) > 검증통과(녹색) > 검증실패(붉은색) > 기본
      const rowBg = noInput
        ? '#F3F4F6'               // 연한 회색 (공휴일/연차)
        : required > 0 && total === required
          ? '#ECFDF5'             // 연한 녹색 (검증 통과)
          : required > 0 && total > 0 && total !== required
            ? '#FEF2F2'           // 연한 붉은색 (검증 실패)
            : weekend ? 'var(--row-alt)' : 'white';
      // 시간 입력된 셀 강조색
      const cellFilledBg = noInput
        ? '#F3F4F6'
        : required > 0 && total === required
          ? '#D1FAE5'             // 진한 녹색
          : required > 0 && total > 0 && total !== required
            ? '#FEE2E2'           // 진한 붉은색
            : '#EDE9FF';          // 진한 보라 (기본 강조)
      const showCopy = !isSubmitted && !isHoliday && findPrevWorkDayEntry(dateStr) !== null;

      return (
        <tr key={dateStr} style={{ backgroundColor: rowBg, borderBottom: '1px solid var(--gray-border)' }}>
          <td className="px-2 py-1.5 font-medium" style={{ ...stickyBase, left: COL_LEFT.date, backgroundColor: rowBg, color: 'var(--text)' }}>{d.getUTCDate()}</td>
          <td className="px-2 py-1.5" style={{ ...stickyBase, left: COL_LEFT.day, backgroundColor: rowBg, color: dayOfWeek === 0 ? 'var(--danger)' : dayOfWeek === 6 ? 'var(--primary)' : 'var(--text-sub)' }}>{DAY_NAMES[dayOfWeek]}</td>
          <td className="px-1 py-1" style={{ ...stickyBase, left: COL_LEFT.att, backgroundColor: rowBg }}>
            {isSubmitted ? (
              <span style={{ color: 'var(--text)' }}>{ATTENDANCE_LABEL[entry.attendance]}</span>
            ) : (
              <select value={entry.attendance} onChange={(e) => handleAttendanceChange(dateStr, e.target.value as AttendanceType)} className="w-full rounded px-1 py-0.5 text-[12px] border" style={{ borderColor: 'var(--gray-border)', color: 'var(--text)', backgroundColor: 'white' }}>
                {ATTENDANCE_OPTIONS.map((opt) => (<option key={opt} value={opt}>{ATTENDANCE_LABEL[opt]}</option>))}
              </select>
            )}
          </td>
          {/* 합계 (근태 바로 우측) */}
          <td className="px-2 py-1.5 text-right font-medium" style={{ ...stickyBase, left: COL_LEFT.total, backgroundColor: rowBg, color: hoursColor, borderRight: activeProjectIds.length > 0 ? '2px solid var(--gray-border)' : undefined }}>
            {required > 0 ? (<>{total}<span className="text-[10px] ml-0.5" style={{ color: 'var(--text-sub)' }}>/{required}h</span></>) : (<span style={{ color: 'var(--text-sub)' }}>—</span>)}
          </td>
          {/* 프로젝트 컬럼 */}
          {activeProjectIds.map((pid) => {
            const wl = entry.workLogs.find((w) => w.projectId === pid);
            const needsInput = !noInput;
            const hasFilled = (wl?.hours ?? 0) > 0;
            return (
              <td key={pid} className="px-1 py-1" style={hasFilled && needsInput ? { backgroundColor: cellFilledBg } : undefined}>
                {needsInput ? (
                  <div className="flex gap-1">
                    {isSubmitted ? (<span className="w-14 text-center" style={{ color: 'var(--text)' }}>{wl?.hours ?? 0}h</span>) : (
                      <input type="number" min={0} max={24} step={0.5} value={wl?.hours ?? 0} onChange={(e) => handleHoursChange(dateStr, pid, parseFloat(e.target.value) || 0)} className="w-14 rounded px-1 py-0.5 text-[12px] border text-right" style={{ borderColor: 'var(--gray-border)', color: 'var(--text)', backgroundColor: 'white' }} />
                    )}
                    {isSubmitted ? (<span style={{ color: 'var(--text-sub)' }}>{WORK_TYPE_LABEL[wl?.workType ?? 'OFFICE']}</span>) : (
                      <select value={wl?.workType ?? 'OFFICE'} onChange={(e) => handleWorkTypeChange(dateStr, pid, e.target.value as WorkType)} className="flex-1 rounded px-1 py-0.5 text-[12px] border" style={{ borderColor: 'var(--gray-border)', color: 'var(--text)', backgroundColor: 'white' }}>
                        {WORK_TYPE_OPTIONS.map((opt) => (<option key={opt} value={opt}>{WORK_TYPE_LABEL[opt]}</option>))}
                      </select>
                    )}
                  </div>
                ) : (<span style={{ color: 'var(--text-sub)' }}>—</span>)}
              </td>
            );
          })}
          {/* 복사 버튼 */}
          {!isSubmitted && (
            <td className="px-1 py-1 text-center">
              {showCopy && (
                <button onClick={() => handleCopyFromPrevWorkDay(dateStr)} className="p-0.5 rounded transition-colors" style={{ color: 'var(--text-sub)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--primary-bg)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-sub)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }} title="이전 근무일 복사"><CopyPlus size={12} /></button>
              )}
            </td>
          )}
        </tr>
      );
    });

  // ── 월간 합계 행 ──
  const renderFootRow = () => (
    <tr style={{ backgroundColor: 'var(--tbl-header)', borderTop: '2px solid var(--gray-border)' }}>
      <td className="px-2 py-2 font-semibold text-[12px]" style={{ ...stickyHeadFoot, left: COL_LEFT.date, backgroundColor: 'var(--tbl-header)', color: 'var(--text)' }}>월간</td>
      <td className="px-2 py-2 font-semibold text-[12px]" style={{ ...stickyHeadFoot, left: COL_LEFT.day, backgroundColor: 'var(--tbl-header)', color: 'var(--text)' }}>합계</td>
      <td className="px-2 py-2 text-[12px]" style={{ ...stickyHeadFoot, left: COL_LEFT.att, backgroundColor: 'var(--tbl-header)' }} />
      <td className="px-2 py-2 text-right font-semibold text-[12px]" style={{ ...stickyHeadFoot, left: COL_LEFT.total, backgroundColor: 'var(--tbl-header)', color: 'var(--text)', borderRight: activeProjectIds.length > 0 ? '2px solid var(--gray-border)' : undefined }}>{monthlyTotals.grandTotal}h</td>
      {activeProjectIds.map((pid) => (
        <td key={pid} className="px-2 py-2 font-semibold text-[12px]" style={{ color: 'var(--primary)' }}>{monthlyTotals.projectTotals[pid] ?? 0}h</td>
      ))}
      {!isSubmitted && <td />}
    </tr>
  );

  // ── 테이블 공통 스타일 ──
  const tableStyle: React.CSSProperties = { width: 'max-content', minWidth: '100%' };
  const tableClass = 'border-collapse text-[12px]';

  // ── 그리드 패널 (일반/전체화면 공용) ──
  const renderGridPanel = (isFull: boolean) => (
    <div
      className="flex flex-col"
      style={{
        ...(isFull ? { flex: 1, minHeight: 0, overflow: 'hidden', height: '100vh' } : { height: '100%' }),
      }}
    >
      {/* 툴바 (전체화면 시 헤더 역할) */}
      <div
        className="flex items-center justify-between px-4 py-2 flex-shrink-0"
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid var(--gray-border)',
        }}
      >
        <div className="flex items-center gap-3">
          {isFull && (
            <span className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
              근무시간표 — {formatYearMonth(yearMonth)}
            </span>
          )}
          {isFull && timesheet && (
            <Badge variant={TIMESHEET_STATUS_VARIANT[timesheet.status] ?? 'gray'}>
              {TIMESHEET_STATUS_LABEL[timesheet.status] ?? timesheet.status}
            </Badge>
          )}
          {!isFull && (
            <span className="text-[12px]" style={{ color: 'var(--text-sub)' }}>
              {activeProjectIds.length}개 프로젝트
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFull && !isSubmitted && allProjects.length > 0 && (
            <ProjectMultiSelectDropdown projects={allProjects} selectedIds={activeProjectIds} onAdd={handleAddProjects} onRemove={handleRemoveProject} />
          )}
          {isFull && !isSubmitted && timesheet && (
            <button onClick={handleSubmit} disabled={submitMutation.isPending} className="flex items-center gap-1 px-3 py-1.5 rounded text-[13px] font-medium text-white transition-colors" style={{ backgroundColor: validationErrors.length > 0 ? 'var(--warn)' : 'var(--primary)' }}>
              {submitMutation.isPending ? '제출 중...' : '제출'}
            </button>
          )}
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="flex items-center gap-1 px-2 py-1.5 rounded text-[12px] border transition-colors"
            style={{ borderColor: 'var(--gray-border)', color: 'var(--text-sub)', backgroundColor: 'white' }}
            title={isFull ? '전체화면 닫기' : '전체화면 작성'}
          >
            {isFull ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isFull ? '닫기' : '전체화면'}</span>
          </button>
        </div>
      </div>

      {/* 검증 오류 (전체화면 시) */}
      {isFull && validationErrors.length > 0 && !isSubmitted && (
        <div className="mx-4 mt-2 px-3 py-1.5 rounded flex items-start gap-2 text-[11px] flex-shrink-0" style={{ backgroundColor: 'var(--warn-bg)', border: '1px solid var(--warn)', color: 'var(--warn)' }}>
          <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
          <span><span className="font-semibold">검증 {validationErrors.length}건</span> {validationErrors.slice(0, 3).join(' / ')}</span>
        </div>
      )}

      {/* 테이블 영역: 단일 table + sticky thead/tfoot */}
      <div className="flex-1 min-h-0" style={{ overflow: 'auto' }}>
        <table className={tableClass} style={tableStyle}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>{renderHeadRow()}</thead>
          <tbody>{renderBodyRows()}</tbody>
          <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>{renderFootRow()}</tfoot>
        </table>
      </div>
    </div>
  );

  // ── 전체화면 오버레이 ──
  if (fullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {renderGridPanel(true)}
      </div>
    );
  }

  // ── 일반 모드 ──
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
          근무시간표
        </h1>
        <div className="w-px h-5 bg-[var(--gray-border)]" />
        <button onClick={() => setYearMonth(getPreviousYearMonth(yearMonth))} className="p-1 rounded hover:bg-gray-100 transition-colors" style={{ color: 'var(--text-sub)' }}><ChevronLeft size={16} /></button>
        <span className="text-[14px] font-medium min-w-[96px] text-center" style={{ color: 'var(--text)' }}>{formatYearMonth(yearMonth)}</span>
        <button onClick={() => setYearMonth(getNextYearMonth(yearMonth))} className="p-1 rounded hover:bg-gray-100 transition-colors" style={{ color: 'var(--text-sub)' }}><ChevronRight size={16} /></button>
        {timesheet && (
          <>
            <div className="w-px h-5 bg-[var(--gray-border)]" />
            <Badge variant={TIMESHEET_STATUS_VARIANT[timesheet.status] ?? 'gray'}>
              {TIMESHEET_STATUS_LABEL[timesheet.status] ?? timesheet.status}
            </Badge>
          </>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {!isSubmitted && allProjects.length > 0 && (
            <ProjectMultiSelectDropdown projects={allProjects} selectedIds={activeProjectIds} onAdd={handleAddProjects} onRemove={handleRemoveProject} />
          )}
          {!isSubmitted && timesheet && (
            <button onClick={handleSubmit} disabled={submitMutation.isPending} className="flex items-center gap-1 px-3 py-1.5 rounded text-[13px] font-medium text-white transition-colors" style={{ backgroundColor: validationErrors.length > 0 ? 'var(--warn)' : 'var(--primary)' }}>
              {submitMutation.isPending ? '제출 중...' : '제출'}
            </button>
          )}
        </div>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <p style={{ color: 'var(--text-sub)' }}>불러오는 중...</p>
        </div>
      )}

      {/* 알림 */}
      {!isLoading && validationErrors.length > 0 && !isSubmitted && (
        <div className="rounded-lg px-4 py-2 flex items-start gap-2 text-[12px] mb-3" style={{ backgroundColor: 'var(--warn-bg)', border: '1px solid var(--warn)', color: 'var(--warn)' }}>
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">검증 오류 {validationErrors.length}건:</span>{' '}
            {validationErrors.slice(0, 3).join(' / ')}
            {validationErrors.length > 3 && ` 외 ${validationErrors.length - 3}건`}
          </div>
        </div>
      )}
      {!isLoading && isSubmitted && (
        <div className="rounded-lg px-4 py-2 flex items-center gap-2 text-[12px] mb-3" style={{ backgroundColor: 'var(--ok-bg)', border: '1px solid var(--ok)', color: 'var(--ok)' }}>
          <CheckCircle size={14} />
          <span>제출 완료 — 읽기 전용 모드입니다.</span>
        </div>
      )}

      {/* 그리드 카드 */}
      {!isLoading && (
        <div
          className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 220px)' }}
        >
          {renderGridPanel(false)}
        </div>
      )}
    </div>
  );
}

// ───────── 프로젝트 다중 선택 드롭다운 ─────────

interface ProjectMultiSelectDropdownProps {
  projects: { id: string; name: string; code: string }[];
  selectedIds: string[];
  onAdd: (projectIds: string[]) => void;
  onRemove: (projectId: string) => void;
}

function ProjectMultiSelectDropdown({
  projects,
  selectedIds,
  onAdd,
  onRemove,
}: ProjectMultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const allSelected = projects.length > 0 && projects.every((p) => selectedIds.includes(p.id));

  const handleToggle = (projectId: string) => {
    if (selectedIds.includes(projectId)) {
      onRemove(projectId);
    } else {
      onAdd([projectId]);
    }
  };

  const handleToggleAll = () => {
    if (allSelected) {
      // 전체 해제
      projects.forEach((p) => {
        if (selectedIds.includes(p.id)) onRemove(p.id);
      });
    } else {
      // 전체 선택
      const toAdd = projects.filter((p) => !selectedIds.includes(p.id)).map((p) => p.id);
      if (toAdd.length > 0) onAdd(toAdd);
    }
  };

  const selectedCount = projects.filter((p) => selectedIds.includes(p.id)).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-3 py-1.5 rounded text-[12px] font-medium border transition-colors"
        style={{
          borderColor: 'var(--gray-border)',
          color: 'var(--text)',
          backgroundColor: 'white',
        }}
      >
        <Plus size={13} />
        프로젝트 선택
        {selectedCount > 0 && (
          <span
            className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {selectedCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-lg shadow-lg z-50 py-1"
          style={{
            backgroundColor: 'white',
            border: '1px solid var(--gray-border)',
            minWidth: '260px',
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {/* 전체 선택 */}
          <label
            className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold cursor-pointer transition-colors"
            style={{
              color: 'var(--text)',
              borderBottom: '1px solid var(--gray-border)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLLabelElement).style.backgroundColor = 'var(--primary-bg)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLLabelElement).style.backgroundColor = 'transparent';
            }}
          >
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleToggleAll}
              className="accent-[var(--primary)]"
            />
            전체 선택
          </label>

          {projects.map((p) => {
            const checked = selectedIds.includes(p.id);
            return (
              <label
                key={p.id}
                className="flex items-center gap-2 px-4 py-2 text-[12px] cursor-pointer transition-colors"
                style={{ color: 'var(--text)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLLabelElement).style.backgroundColor = 'var(--primary-bg)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLLabelElement).style.backgroundColor = checked
                    ? 'rgba(107,92,231,0.06)'
                    : 'transparent';
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggle(p.id)}
                  className="accent-[var(--primary)]"
                />
                <span className="font-medium" style={{ color: 'var(--primary)' }}>
                  [{p.code}]
                </span>
                <span className="truncate">{p.name}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
