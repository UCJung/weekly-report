import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { TaskPriority, TaskSortBy, TaskPeriod } from '../../api/personal-task.api';
import { useTeamStore } from '../../stores/teamStore';
import { useTeamProjects } from '../../hooks/useProjects';
import { useTaskStatuses } from '../../hooks/useTaskStatuses';

export interface TaskFilters {
  statusId?: string | 'ALL';
  period?: TaskPeriod;
  projectId?: string;
  priority?: TaskPriority;
  q?: string;
  sortBy?: TaskSortBy;
}

interface TaskFilterBarProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
}

const PERIOD_OPTIONS: { value: TaskPeriod | ''; label: string }[] = [
  { value: '', label: '전체 기간' },
  { value: 'today', label: '오늘' },
  { value: 'this-week', label: '이번 주' },
  { value: 'this-month', label: '이번 달' },
  { value: 'overdue', label: '마감 지남' },
];

const PRIORITY_OPTIONS: { value: TaskPriority | ''; label: string }[] = [
  { value: '', label: '전체 우선순위' },
  { value: 'HIGH', label: '높음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'LOW', label: '낮음' },
];

const SORT_OPTIONS: { value: TaskSortBy; label: string }[] = [
  { value: 'dueDate', label: '마감일순' },
  { value: 'priority', label: '우선순위순' },
  { value: 'createdAt', label: '등록일순' },
];

export default function TaskFilterBar({ filters, onChange }: TaskFilterBarProps) {
  const { currentTeamId } = useTeamStore();
  const { data: teamProjects } = useTeamProjects(currentTeamId ?? '');
  const { data: statusDefs = [] } = useTaskStatuses(currentTeamId ?? '');
  const [searchValue, setSearchValue] = useState(filters.q ?? '');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.q) {
        onChange({ ...filters, q: searchValue || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const selectStyle: React.CSSProperties = {
    fontSize: '12.5px',
    color: 'var(--text)',
    backgroundColor: 'var(--white)',
    border: '1px solid var(--gray-border)',
    borderRadius: '5px',
    padding: '4px 8px',
    outline: 'none',
    cursor: 'pointer',
  };

  const currentStatusId = filters.statusId ?? 'ALL';

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-lg border"
      style={{
        backgroundColor: 'var(--white)',
        borderColor: 'var(--gray-border)',
      }}
    >
      {/* Status filter tabs — dynamic from team TaskStatusDef */}
      <div
        className="flex items-center rounded-md overflow-hidden border"
        style={{ borderColor: 'var(--gray-border)' }}
      >
        {/* All tab */}
        <button
          onClick={() => onChange({ ...filters, statusId: 'ALL' })}
          className="px-3 py-1 text-[12px] font-medium transition-colors"
          style={{
            backgroundColor: currentStatusId === 'ALL' ? 'var(--primary)' : 'var(--white)',
            color: currentStatusId === 'ALL' ? 'var(--white)' : 'var(--text-sub)',
            borderRight: '1px solid var(--gray-border)',
          }}
        >
          전체
        </button>

        {/* Dynamic status tabs */}
        {statusDefs.map((statusDef) => {
          const isActive = currentStatusId === statusDef.id;
          return (
            <button
              key={statusDef.id}
              onClick={() => onChange({ ...filters, statusId: statusDef.id })}
              className="px-3 py-1 text-[12px] font-medium transition-colors"
              style={{
                backgroundColor: isActive ? statusDef.color : 'var(--white)',
                color: isActive ? 'var(--white)' : 'var(--text-sub)',
                borderRight: '1px solid var(--gray-border)',
              }}
            >
              {statusDef.name}
            </button>
          );
        })}
      </div>

      {/* Period filter */}
      <select
        value={filters.period ?? ''}
        onChange={(e) =>
          onChange({ ...filters, period: (e.target.value as TaskPeriod) || undefined })
        }
        style={selectStyle}
      >
        {PERIOD_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Project filter */}
      {teamProjects && teamProjects.length > 0 && (
        <select
          value={filters.projectId ?? ''}
          onChange={(e) => onChange({ ...filters, projectId: e.target.value || undefined })}
          style={selectStyle}
        >
          <option value="">전체 프로젝트</option>
          {teamProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {/* Priority filter */}
      <select
        value={filters.priority ?? ''}
        onChange={(e) =>
          onChange({ ...filters, priority: (e.target.value as TaskPriority) || undefined })
        }
        style={selectStyle}
      >
        {PRIORITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={filters.sortBy ?? 'dueDate'}
        onChange={(e) => onChange({ ...filters, sortBy: e.target.value as TaskSortBy })}
        style={selectStyle}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Search */}
      <div className="ml-auto flex items-center gap-1.5 rounded-md border px-2.5 py-1"
        style={{ borderColor: 'var(--gray-border)', backgroundColor: 'var(--white)' }}
      >
        <Search size={13} style={{ color: 'var(--text-sub)' }} />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="검색..."
          className="text-[12.5px] bg-transparent outline-none w-[140px]"
          style={{ color: 'var(--text)' }}
        />
      </div>
    </div>
  );
}
