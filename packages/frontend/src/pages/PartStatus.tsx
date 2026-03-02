import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { partApi, MemberWeeklyStatus } from '../api/part.api';
import { teamApi } from '../api/team.api';
import FormattedText from '../components/grid/FormattedText';
import Button from '../components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';

// ───── 주차 유틸 ─────

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

// ───── 타입 ─────

type ViewMode = 'by-project' | 'by-member';

interface ProjectRow {
  projectId: string;
  projectName: string;
  projectCode: string;
  projectSortOrder: number;
  memberId: string;
  memberName: string;
  partId: string;
  partName: string;
  doneWork: string;
  planWork: string;
  remarks: string;
}

// ───── 컴포넌트 ─────

export default function PartStatus() {
  const { user } = useAuthStore();
  const isLeader = user?.role === 'LEADER';

  const [currentWeek, setCurrentWeek] = useState(() => getWeekLabel(new Date()));

  // 그룹 A: 인원 필터
  const [selectedPartId, setSelectedPartId] = useState<string>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');

  // 그룹 B: 프로젝트 필터
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // 뷰 모드
  const [viewMode, setViewMode] = useState<ViewMode>('by-project');

  const teamId = user?.teamId ?? '';
  const userPartId = user?.partId ?? '';

  // ── 파트 목록 (LEADER만 사용) ──
  const { data: parts = [] } = useQuery({
    queryKey: ['parts', teamId],
    queryFn: () => teamApi.getParts(teamId).then((r) => r.data.data),
    enabled: isLeader && !!teamId,
  });

  // ── 업무 현황 데이터 조회 ──
  // LEADER: 전체 팀원 조회 (teams/:teamId/members-weekly-status)
  // PART_LEADER / MEMBER: 자기 파트만 (parts/:partId/weekly-status)
  const { data: allStatusList = [], isLoading } = useQuery({
    queryKey: isLeader
      ? ['team-members-weekly-status', teamId, currentWeek]
      : ['part-weekly-status', userPartId, currentWeek],
    queryFn: () =>
      isLeader
        ? partApi.getTeamMembersWeeklyStatus(teamId, currentWeek).then((r) => r.data.data)
        : partApi.getPartWeeklyStatus(userPartId, currentWeek).then((r) => r.data.data),
    enabled: isLeader ? !!teamId : !!userPartId,
  });

  // ── 파트별 팀원 맵 (그룹 A 종속 필터링용) ──
  const partMemberMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>();
    for (const entry of allStatusList) {
      const pid = entry.member.partId;
      if (!map.has(pid)) map.set(pid, []);
      const list = map.get(pid)!;
      if (!list.some((m) => m.id === entry.member.id)) {
        list.push({ id: entry.member.id, name: entry.member.name });
      }
    }
    return map;
  }, [allStatusList]);

  // 선택된 파트에 속한 팀원 목록
  const availableMembers = useMemo(() => {
    if (selectedPartId === 'all') {
      const seen = new Set<string>();
      const result: { id: string; name: string }[] = [];
      for (const entry of allStatusList) {
        if (!seen.has(entry.member.id)) {
          seen.add(entry.member.id);
          result.push({ id: entry.member.id, name: entry.member.name });
        }
      }
      return result;
    }
    return partMemberMap.get(selectedPartId) ?? [];
  }, [selectedPartId, partMemberMap, allStatusList]);

  // 파트 변경 시 팀원 초기화
  const handlePartChange = (value: string) => {
    setSelectedPartId(value);
    setSelectedMemberId('all');
  };

  // ── 그룹 A + B 조합 필터링 후 플랫 행 구성 ──
  const flatRows = useMemo<ProjectRow[]>(() => {
    const rows: ProjectRow[] = [];

    for (const entry of allStatusList) {
      // 그룹 A 필터: 파트
      if (selectedPartId !== 'all' && entry.member.partId !== selectedPartId) continue;
      // 그룹 A 필터: 팀원
      if (selectedMemberId !== 'all' && entry.member.id !== selectedMemberId) continue;

      const workItems = entry.report?.workItems ?? [];

      for (const item of workItems) {
        // 그룹 B 필터: 프로젝트
        if (selectedProjectId !== 'all' && item.project?.id !== selectedProjectId) continue;

        rows.push({
          projectId: item.project?.id ?? '__no_project__',
          projectName: item.project?.name ?? '(프로젝트 없음)',
          projectCode: item.project?.code ?? '',
          projectSortOrder: (item.project as { sortOrder?: number } | undefined)?.sortOrder ?? 0,
          memberId: entry.member.id,
          memberName: entry.member.name,
          partId: entry.member.partId,
          partName: entry.member.partName,
          doneWork: item.doneWork,
          planWork: item.planWork,
          remarks: item.remarks ?? '',
        });
      }

      // 업무항목이 없는 팀원도 한 행 표시 (필터에서 특정 프로젝트 선택 안 한 경우만)
      if (workItems.length === 0 && selectedProjectId === 'all') {
        rows.push({
          projectId: '__empty__',
          projectName: '',
          projectCode: '',
          projectSortOrder: 999999,
          memberId: entry.member.id,
          memberName: entry.member.name,
          partId: entry.member.partId,
          partName: entry.member.partName,
          doneWork: '',
          planWork: '',
          remarks: '',
        });
      }
    }

    return rows;
  }, [allStatusList, selectedPartId, selectedMemberId, selectedProjectId]);

  // ── 프로젝트별 보기 정렬: sortOrder → projectName → memberName ──
  const sortedRowsByProject = useMemo(() => {
    return [...flatRows].sort((a, b) => {
      if (a.projectSortOrder !== b.projectSortOrder) return a.projectSortOrder - b.projectSortOrder;
      if (a.projectName !== b.projectName) return a.projectName.localeCompare(b.projectName);
      return a.memberName.localeCompare(b.memberName);
    });
  }, [flatRows]);

  // ── 팀원별 보기 정렬: partName → memberName → sortOrder ──
  const sortedRowsByMember = useMemo(() => {
    return [...flatRows].sort((a, b) => {
      if (a.partName !== b.partName) return a.partName.localeCompare(b.partName);
      if (a.memberName !== b.memberName) return a.memberName.localeCompare(b.memberName);
      return a.projectSortOrder - b.projectSortOrder;
    });
  }, [flatRows]);

  const displayRows = viewMode === 'by-project' ? sortedRowsByProject : sortedRowsByMember;

  // ── 프로젝트 필터 옵션 (전체 데이터 기준, sortOrder 정렬) ──
  const projectOptions = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; code: string; sortOrder: number }>();
    for (const entry of allStatusList) {
      for (const item of entry.report?.workItems ?? []) {
        if (item.project && !seen.has(item.project.id)) {
          seen.set(item.project.id, {
            id: item.project.id,
            name: item.project.name,
            code: item.project.code,
            sortOrder: (item.project as { sortOrder?: number } | undefined)?.sortOrder ?? 0,
          });
        }
      }
    }
    return Array.from(seen.values()).sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
  }, [allStatusList]);

  // 파트 목록 (PART_LEADER는 자기 파트만)
  const partOptions = useMemo(() => {
    if (isLeader) return parts;
    // PART_LEADER: 자기 파트만
    return [{ id: userPartId, name: user?.partName ?? '' }];
  }, [isLeader, parts, userPartId, user]);

  const hasFilters =
    selectedPartId !== 'all' ||
    selectedMemberId !== 'all' ||
    selectedProjectId !== 'all';

  const handleReset = () => {
    setSelectedPartId('all');
    setSelectedMemberId('all');
    setSelectedProjectId('all');
  };

  // ── rowspan 계산 (프로젝트별 보기) ──
  const projectRowSpanMap = useMemo(() => {
    if (viewMode !== 'by-project') return new Map<number, number>();
    const map = new Map<number, number>();
    let i = 0;
    while (i < displayRows.length) {
      const pid = displayRows[i].projectId;
      let count = 1;
      while (i + count < displayRows.length && displayRows[i + count].projectId === pid) count++;
      map.set(i, count);
      i += count;
    }
    return map;
  }, [displayRows, viewMode]);

  // ── rowspan 계산 (팀원별 보기) ──
  const memberRowSpanMap = useMemo(() => {
    if (viewMode !== 'by-member') return new Map<number, number>();
    const map = new Map<number, number>();
    let i = 0;
    while (i < displayRows.length) {
      const mid = displayRows[i].memberId;
      let count = 1;
      while (i + count < displayRows.length && displayRows[i + count].memberId === mid) count++;
      map.set(i, count);
      i += count;
    }
    return map;
  }, [displayRows, viewMode]);

  // 각 행이 첫 번째 행인지 확인
  const getFirstInGroup = (idx: number, mode: ViewMode) => {
    if (mode === 'by-project') {
      return projectRowSpanMap.has(idx);
    }
    return memberRowSpanMap.has(idx);
  };

  const getRowSpan = (idx: number, mode: ViewMode) => {
    if (mode === 'by-project') return projectRowSpanMap.get(idx) ?? 1;
    return memberRowSpanMap.get(idx) ?? 1;
  };

  return (
    <div>
      {/* 주차 선택기 */}
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
      </div>

      {/* 필터 바 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] p-3 mb-4">
        <div className="flex items-start gap-4 flex-wrap">

          {/* 그룹 A: 인원 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-[var(--text-sub)] whitespace-nowrap">인원</span>

            {/* 파트 선택 */}
            {isLeader ? (
              <Select value={selectedPartId} onValueChange={handlePartChange}>
                <SelectTrigger className="w-[120px] h-[30px] text-[12.5px]">
                  <SelectValue placeholder="전체 파트" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 파트</SelectItem>
                  {partOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-[12.5px] font-medium text-[var(--text)] px-2 py-1 bg-[var(--tbl-header)] rounded border border-[var(--gray-border)]">
                {user?.partName}
              </span>
            )}

            {/* 팀원 선택 (파트 선택에 종속) */}
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="w-[110px] h-[30px] text-[12.5px]">
                <SelectValue placeholder="전체 팀원" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 팀원</SelectItem>
                {availableMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 구분선 */}
          <div className="w-px h-[30px] bg-[var(--gray-border)]" />

          {/* 그룹 B: 프로젝트 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[var(--text-sub)] whitespace-nowrap">프로젝트</span>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-[180px] h-[30px] text-[12.5px]">
                <SelectValue placeholder="전체 프로젝트" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 프로젝트</SelectItem>
                {projectOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 초기화 버튼 */}
          {hasFilters && (
            <Button size="small" variant="outline" onClick={handleReset}>
              초기화
            </Button>
          )}
        </div>
      </div>

      {/* 업무 현황 테이블 패널 */}
      <div className="bg-white rounded-lg border border-[var(--gray-border)] overflow-hidden">
        {/* 패널 헤더: 제목 + 뷰 모드 토글 */}
        <div
          className="flex items-center justify-between border-b border-[var(--gray-border)]"
          style={{ padding: '11px 16px' }}
        >
          <p className="text-[13px] font-semibold text-[var(--text)]">업무현황</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('by-project')}
              className={[
                'px-3 py-1 text-[12px] rounded border transition-colors',
                viewMode === 'by-project'
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-white text-[var(--text-sub)] border-[var(--gray-border)] hover:border-[var(--primary)]',
              ].join(' ')}
            >
              프로젝트별
            </button>
            <button
              onClick={() => setViewMode('by-member')}
              className={[
                'px-3 py-1 text-[12px] rounded border transition-colors',
                viewMode === 'by-member'
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-white text-[var(--text-sub)] border-[var(--gray-border)] hover:border-[var(--primary)]',
              ].join(' ')}
            >
              팀원별
            </button>
          </div>
        </div>

        {/* 프로젝트별 보기 테이블 */}
        {viewMode === 'by-project' && (
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '18%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
            <thead>
              <tr className="bg-[var(--tbl-header)] border-b border-[var(--gray-border)]">
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">프로젝트</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">팀원</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">파트</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">진행업무 (한일)</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">예정업무 (할일)</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">비고</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[var(--text-sub)]">로딩 중...</td>
                </tr>
              )}
              {!isLoading && displayRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[var(--text-sub)]">업무 데이터가 없습니다.</td>
                </tr>
              )}
              {displayRows.map((row, idx) => {
                const isFirst = getFirstInGroup(idx, 'by-project');
                const rowSpan = getRowSpan(idx, 'by-project');
                return (
                  <tr
                    key={`${row.projectId}-${row.memberId}-${idx}`}
                    className={['border-b border-[var(--gray-border)]', idx % 2 === 1 ? 'bg-[var(--row-alt)]' : ''].join(' ')}
                  >
                    {isFirst && (
                      <td
                        rowSpan={rowSpan}
                        className="px-3 py-[9px] align-top border-r border-[var(--gray-border)]"
                      >
                        <span className="text-[12.5px] font-medium text-[var(--text)] block leading-snug">
                          {row.projectName}
                        </span>
                        {row.projectCode && (
                          <span className="font-mono text-[10.5px] text-[var(--text-sub)]">
                            {row.projectCode}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-3 py-[9px] align-top text-[12.5px] font-medium text-[var(--text)]">{row.memberName}</td>
                    <td className="px-3 py-[9px] align-top text-[12px] text-[var(--text-sub)]">{row.partName}</td>
                    <td className="px-3 py-[9px] align-top">
                      <FormattedText text={row.doneWork} />
                    </td>
                    <td className="px-3 py-[9px] align-top">
                      <FormattedText text={row.planWork} />
                    </td>
                    <td className="px-3 py-[9px] align-top text-[11px] text-[var(--text-sub)]">{row.remarks}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 팀원별 보기 테이블 */}
        {viewMode === 'by-member' && (
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
            <thead>
              <tr className="bg-[var(--tbl-header)] border-b border-[var(--gray-border)]">
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">팀원</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">파트</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">프로젝트</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">진행업무 (한일)</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">예정업무 (할일)</th>
                <th className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)]">비고</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[var(--text-sub)]">로딩 중...</td>
                </tr>
              )}
              {!isLoading && displayRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[var(--text-sub)]">업무 데이터가 없습니다.</td>
                </tr>
              )}
              {displayRows.map((row, idx) => {
                const isFirst = getFirstInGroup(idx, 'by-member');
                const rowSpan = getRowSpan(idx, 'by-member');
                return (
                  <tr
                    key={`${row.memberId}-${row.projectId}-${idx}`}
                    className={['border-b border-[var(--gray-border)]', idx % 2 === 1 ? 'bg-[var(--row-alt)]' : ''].join(' ')}
                  >
                    {isFirst && (
                      <td
                        rowSpan={rowSpan}
                        className="px-3 py-[9px] align-top font-medium text-[12.5px] border-r border-[var(--gray-border)]"
                      >
                        {row.memberName}
                      </td>
                    )}
                    {isFirst && (
                      <td
                        rowSpan={rowSpan}
                        className="px-3 py-[9px] align-top text-[12px] text-[var(--text-sub)] border-r border-[var(--gray-border)]"
                      >
                        {row.partName}
                      </td>
                    )}
                    <td className="px-3 py-[9px] align-top">
                      <span className="text-[12.5px] font-medium text-[var(--text)] block leading-snug">
                        {row.projectName}
                      </span>
                      {row.projectCode && (
                        <span className="font-mono text-[10.5px] text-[var(--text-sub)]">
                          {row.projectCode}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-[9px] align-top">
                      <FormattedText text={row.doneWork} />
                    </td>
                    <td className="px-3 py-[9px] align-top">
                      <FormattedText text={row.planWork} />
                    </td>
                    <td className="px-3 py-[9px] align-top text-[11px] text-[var(--text-sub)]">{row.remarks}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
