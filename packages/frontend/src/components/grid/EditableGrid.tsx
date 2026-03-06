import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import GridCell from './GridCell';
import ExpandedEditor from './ExpandedEditor';
import LinkedTasksPopover from './LinkedTasksPopover';
import { WorkItem } from '../../api/weekly-report.api';
import { useGridStore } from '../../stores/gridStore';
import { ConfirmModal } from '../ui/Modal';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/DropdownMenu';

interface EditableGridProps {
  workItems: WorkItem[];
  disabled?: boolean;
  onUpdateItem: (id: string, data: Partial<Pick<WorkItem, 'doneWork' | 'planWork' | 'remarks'>>) => void;
  onAddItem: (projectId: string) => void;
  onDeleteItem: (id: string) => void;
  onDeleteProject: (projectId: string) => void;
  teamId?: string;
  weekLabel?: string;
}

type EditingCell = { rowId: string; column: 'doneWork' | 'planWork' | 'remarks' } | null;

// 컬럼 너비: project 13% / doneWork 30% / planWork 30% / remarks 20% / action 7%
const COLUMNS = [
  { id: 'project',  label: '프로젝트',               width: '13%' },
  { id: 'doneWork', label: '진행업무 (한일)',          width: '30%' },
  { id: 'planWork', label: '예정업무 (할일)',          width: '30%' },
  { id: 'remarks',  label: '비고 및 이슈',             width: '20%' },
  { id: 'action',   label: '',                        width: '7%' },
];

interface ProjectGroup {
  projectId: string;
  project: WorkItem['project'];
  items: WorkItem[];
}

export default function EditableGrid({
  workItems,
  disabled = false,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
  onDeleteProject,
  teamId,
  weekLabel,
}: EditableGridProps) {
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [expandedCell, setExpandedCell] = useState<EditingCell>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<ProjectGroup | null>(null);
  const [popoverOpen, setPopoverOpen] = useState<string | null>(null);
  const popoverRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const { markDirty } = useGridStore();

  // workItems를 projectId 기준으로 그룹핑 (최초 등장 순서 유지)
  const groups: ProjectGroup[] = useMemo(() => {
    const map = new Map<string, ProjectGroup>();
    const order: string[] = [];

    for (const item of workItems) {
      const key = item.projectId ?? '__no_project__';
      if (!map.has(key)) {
        map.set(key, {
          projectId: key,
          project: item.project,
          items: [],
        });
        order.push(key);
      }
      map.get(key)!.items.push(item);
    }

    return order.map((k) => map.get(k)!);
  }, [workItems]);

  const startEdit = useCallback(
    (rowId: string, column: 'doneWork' | 'planWork' | 'remarks') => {
      if (disabled) return;
      setEditingCell({ rowId, column });
    },
    [disabled],
  );

  const endEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleSave = useCallback(
    (id: string, column: 'doneWork' | 'planWork' | 'remarks', value: string) => {
      const item = workItems.find((w) => w.id === id);
      if (item && item[column] === value) return;
      markDirty(id, { [column]: value });
      onUpdateItem(id, { [column]: value });
    },
    [workItems, markDirty, onUpdateItem],
  );

  const handlePopoverOpen = useCallback((itemId: string, btnElement: HTMLElement) => {
    setPopoverOpen(itemId);
    const rect = btnElement.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + 8,
      left: rect.left - 260,
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverOpen) {
        const target = e.target as HTMLElement;
        if (popoverRef.current[popoverOpen]?.contains(target)) return;
        if ((target.closest('button') as HTMLElement)?.dataset?.popoverTrigger === popoverOpen)
          return;
        setPopoverOpen(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [popoverOpen]);

  return (
    <div className="flex flex-col gap-4">
      {workItems.length === 0 && (
        <div
          className="rounded-lg border border-[var(--gray-border)] py-14 text-center text-[13px]"
          style={{ color: 'var(--text-sub)' }}
        >
          추가된 프로젝트가 없습니다. 상단 [+ 프로젝트 추가] 버튼을 눌러 프로젝트를 추가하세요.
        </div>
      )}

      {workItems.length > 0 && (
        <div className="rounded-lg border border-[var(--gray-border)] overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                {COLUMNS.map((col) => (
                  <col key={col.id} style={{ width: col.width }} />
                ))}
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: 'var(--tbl-header)' }}>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.id}
                      className="text-left px-3 py-[7px] text-[11px] font-semibold border-b border-[var(--gray-border)] whitespace-nowrap tracking-wide uppercase"
                      style={{ color: 'var(--text-sub)' }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((group) =>
                  group.items.map((item, itemIdx) => {
                    const isFirstInGroup = itemIdx === 0;
                    const isLastInGroup = itemIdx === group.items.length - 1;
                    const globalIdx = workItems.indexOf(item);

                    return (
                      <tr
                        key={item.id}
                        className="transition-colors"
                        style={{
                          backgroundColor: globalIdx % 2 === 0 ? 'var(--row-alt)' : 'white',
                          borderBottom: isLastInGroup
                            ? '2px solid var(--gray-border)'
                            : '1px solid var(--gray-border)',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                            'rgba(109, 92, 231, 0.04)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                            globalIdx % 2 === 0 ? 'var(--row-alt)' : 'white';
                        }}
                      >
                        {/* 프로젝트 컬럼: 그룹의 첫 번째 행에만 pill 배지 표시 */}
                        <td
                          className="px-2 py-[8px] align-top"
                          style={{ backgroundColor: 'var(--tbl-header)' }}
                        >
                          {isFirstInGroup ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold leading-tight break-all"
                              style={{
                                backgroundColor: 'var(--primary-bg)',
                                color: 'var(--primary)',
                                border: '1px solid var(--primary)',
                              }}
                            >
                              {group.project?.name ?? '(프로젝트 없음)'}
                            </span>
                          ) : null}
                        </td>

                        {/* 진행업무 */}
                        <td className="px-3 py-[8px] align-top text-[12.5px]">
                          <GridCell
                            value={item.doneWork}
                            isEditing={
                              editingCell?.rowId === item.id && editingCell?.column === 'doneWork'
                            }
                            onStartEdit={() => startEdit(item.id, 'doneWork')}
                            onEndEdit={endEdit}
                            onSave={(v) => handleSave(item.id, 'doneWork', v)}
                            disabled={disabled}
                            placeholder="진행업무 입력"
                            onOpenExpanded={() =>
                              setExpandedCell({ rowId: item.id, column: 'doneWork' })
                            }
                          />
                        </td>

                        {/* 예정업무 */}
                        <td className="px-3 py-[8px] align-top text-[12.5px]">
                          <GridCell
                            value={item.planWork}
                            isEditing={
                              editingCell?.rowId === item.id && editingCell?.column === 'planWork'
                            }
                            onStartEdit={() => startEdit(item.id, 'planWork')}
                            onEndEdit={endEdit}
                            onSave={(v) => handleSave(item.id, 'planWork', v)}
                            disabled={disabled}
                            placeholder="예정업무 입력"
                            onOpenExpanded={() =>
                              setExpandedCell({ rowId: item.id, column: 'planWork' })
                            }
                          />
                        </td>

                        {/* 비고 */}
                        <td className="px-3 py-[8px] align-top text-[12.5px]">
                          <GridCell
                            value={item.remarks ?? ''}
                            isEditing={
                              editingCell?.rowId === item.id && editingCell?.column === 'remarks'
                            }
                            onStartEdit={() => startEdit(item.id, 'remarks')}
                            onEndEdit={endEdit}
                            onSave={(v) => handleSave(item.id, 'remarks', v)}
                            disabled={disabled}
                            placeholder="비고"
                          />
                        </td>

                        {/* 액션 — 케밥 메뉴 (⋮) + 연관 작업 버튼 */}
                        <td className="px-2 py-[8px] align-top text-center">
                          {!disabled && (
                            <div className="flex items-center justify-center gap-1">
                              {/* 연관 작업 버튼 */}
                              {item.projectId && (
                                <button
                                  data-popover-trigger={item.id}
                                  className="mt-1.5 w-[26px] h-[26px] flex items-center justify-center rounded transition-colors text-[14px] leading-none relative"
                                  style={{
                                    color: item.projectId
                                      ? 'var(--text-sub)'
                                      : 'var(--gray-border)',
                                  }}
                                  title="연관 작업"
                                  aria-label="연관 작업 목록"
                                  onClick={(e) =>
                                    handlePopoverOpen(item.id, e.currentTarget)
                                  }
                                  onMouseEnter={(e) => {
                                    if (item.projectId) {
                                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                                        'var(--gray-light)';
                                      (e.currentTarget as HTMLButtonElement).style.color =
                                        'var(--text)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                                      'transparent';
                                    (e.currentTarget as HTMLButtonElement).style.color =
                                      item.projectId ? 'var(--text-sub)' : 'var(--gray-border)';
                                  }}
                                  disabled={!item.projectId}
                                >
                                  ✓
                                </button>
                              )}

                              {/* 옵션 메뉴 */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="mt-1.5 w-[26px] h-[26px] flex items-center justify-center rounded transition-colors text-[16px] leading-none"
                                    style={{ color: 'var(--text-sub)' }}
                                    title="행 옵션"
                                    aria-label="행 옵션 메뉴"
                                    onMouseEnter={(e) => {
                                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                                        'var(--gray-light)';
                                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                                        'transparent';
                                      (e.currentTarget as HTMLButtonElement).style.color =
                                        'var(--text-sub)';
                                    }}
                                  >
                                    ⋮
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      const col: 'doneWork' | 'planWork' | 'remarks' =
                                        editingCell?.rowId === item.id
                                          ? editingCell.column
                                          : 'doneWork';
                                      setExpandedCell({ rowId: item.id, column: col });
                                    }}
                                  >
                                    <span className="mr-1.5">↗</span>
                                    확대 편집
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => onAddItem(item.projectId ?? '')}
                                  >
                                    <span className="mr-1.5">+</span>
                                    업무 추가
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onSelect={() => setDeleteTarget(item.id)}
                                    className="text-[var(--danger)] hover:bg-[var(--danger-bg)] focus:bg-[var(--danger-bg)]"
                                  >
                                    <span className="mr-1.5">✕</span>
                                    행 삭제
                                  </DropdownMenuItem>
                                  {isLastInGroup && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onSelect={() => setDeleteProjectTarget(group)}
                                        className="text-[var(--danger)] hover:bg-[var(--danger-bg)] focus:bg-[var(--danger-bg)]"
                                      >
                                        <span className="mr-1.5">🗑</span>
                                        프로젝트 제거
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 확대 편집 패널 */}
      {expandedCell &&
        (() => {
          const item = workItems.find((w) => w.id === expandedCell.rowId);
          if (!item) return null;
          const columnLabels: Record<string, string> = {
            doneWork: '진행업무 (한일)',
            planWork: '예정업무 (할일)',
            remarks: '비고 및 이슈',
          };
          return (
            <ExpandedEditor
              value={item[expandedCell.column] ?? ''}
              title={columnLabels[expandedCell.column]}
              onSave={(v) => {
                handleSave(expandedCell.rowId, expandedCell.column, v);
                setExpandedCell(null);
              }}
              onClose={() => setExpandedCell(null)}
              workItemId={expandedCell.rowId}
              projectId={item.projectId}
              teamId={teamId}
              weekLabel={weekLabel}
            />
          );
        })()}

      {/* 행 삭제 확인 */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          onDeleteItem(deleteTarget!);
          setDeleteTarget(null);
        }}
        title="행 삭제"
        message="선택한 업무항목을 삭제하시겠습니까?"
        confirmLabel="삭제"
        danger
      />

      {/* 프로젝트 그룹 삭제 확인 */}
      <ConfirmModal
        open={!!deleteProjectTarget}
        onClose={() => setDeleteProjectTarget(null)}
        onConfirm={() => {
          onDeleteProject(deleteProjectTarget!.projectId);
          setDeleteProjectTarget(null);
        }}
        title="프로젝트 제거"
        message={`[${deleteProjectTarget?.project?.name ?? ''}] 프로젝트의 업무항목 ${deleteProjectTarget?.items.length ?? 0}개가 모두 삭제됩니다. 계속하시겠습니까?`}
        confirmLabel="제거"
        danger
      />

      {/* 연관 작업 팝오버 */}
      {popoverOpen && popoverPos && teamId && weekLabel && (
        (() => {
          const item = workItems.find((w) => w.id === popoverOpen);
          if (!item) return null;
          return (
            <div
              ref={(el) => {
                if (el) popoverRef.current[popoverOpen] = el;
              }}
              className="fixed z-[100]"
              style={{
                top: `${popoverPos.top}px`,
                left: `${popoverPos.left}px`,
              }}
            >
              <LinkedTasksPopover
                workItemId={popoverOpen}
                projectName={item.project?.name}
                weekLabel={weekLabel}
                teamId={teamId}
                onApplied={() => setPopoverOpen(null)}
                onClose={() => setPopoverOpen(null)}
              />
            </div>
          );
        })()
      )}
    </div>
  );
}
