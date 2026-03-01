import React, { useState, useCallback, useRef } from 'react';
import GridCell from './GridCell';
import ProjectDropdown from './ProjectDropdown';
import ExpandedEditor from './ExpandedEditor';
import { WorkItem } from '../../api/weekly-report.api';
import { Project } from '../../api/project.api';
import { useGridStore } from '../../stores/gridStore';
import Button from '../ui/Button';
import { ConfirmModal } from '../ui/Modal';

interface EditableGridProps {
  workItems: WorkItem[];
  disabled?: boolean;
  onUpdateItem: (id: string, data: Partial<Pick<WorkItem, 'projectId' | 'doneWork' | 'planWork' | 'remarks'>>) => void;
  onAddItem: () => void;
  onDeleteItem: (id: string) => void;
}

type EditingCell = { rowId: string; column: 'doneWork' | 'planWork' | 'remarks' } | null;

// 컬럼 너비: 11% / 8% / 30% / 30% / 18% / 3%
const COLUMNS = [
  { id: 'project', label: '프로젝트명', width: '11%' },
  { id: 'code',    label: '코드',       width: '8%' },
  { id: 'doneWork', label: '진행업무',  width: '30%' },
  { id: 'planWork', label: '예정업무',  width: '30%' },
  { id: 'remarks', label: '비고',       width: '18%' },
  { id: 'action',  label: '',           width: '3%' },
];

export default function EditableGrid({
  workItems,
  disabled = false,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
}: EditableGridProps) {
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [projectDropdownRow, setProjectDropdownRow] = useState<string | null>(null);
  const [expandedCell, setExpandedCell] = useState<EditingCell>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { markDirty } = useGridStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const startEdit = useCallback((rowId: string, column: 'doneWork' | 'planWork' | 'remarks') => {
    if (disabled) return;
    setEditingCell({ rowId, column });
  }, [disabled]);

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

  const handleProjectSelect = useCallback(
    (rowId: string, project: Project) => {
      markDirty(rowId, { projectId: project.id });
      onUpdateItem(rowId, { projectId: project.id });
      setProjectDropdownRow(null);
    },
    [markDirty, onUpdateItem],
  );

  return (
    <div>
      <div className="overflow-auto rounded-lg border border-[var(--gray-border)]">
        <table
          className="w-full border-collapse"
          style={{ tableLayout: 'fixed' }}
        >
          <colgroup>
            {COLUMNS.map((col) => (
              <col key={col.id} style={{ width: col.width }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="bg-[var(--tbl-header)]">
              {COLUMNS.map((col) => (
                <th
                  key={col.id}
                  className="text-left px-3 py-[9px] text-[12px] font-semibold text-[var(--text-sub)] border-b border-[var(--gray-border)] whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workItems.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[var(--text-sub)] text-[12.5px]">
                  업무항목이 없습니다. 아래 [+ 행 추가] 버튼을 눌러 추가하세요.
                </td>
              </tr>
            )}
            {workItems.map((item, idx) => (
              <tr
                key={item.id}
                className={[
                  'border-b border-[var(--gray-border)]',
                  idx % 2 === 1 ? 'bg-[var(--row-alt)]' : 'bg-white',
                  'hover:bg-[var(--primary-bg)]/20 transition-colors',
                ].join(' ')}
              >
                {/* 프로젝트명 */}
                <td className="px-3 py-[8px] align-top text-[12.5px]">
                  <div className="relative">
                    <button
                      disabled={disabled}
                      className={[
                        'w-full text-left px-1 py-1 min-h-[52px] rounded text-[12.5px] transition-colors',
                        !disabled ? 'hover:bg-[var(--primary-bg)] cursor-pointer' : 'cursor-default',
                        item.project ? 'text-[var(--text)] font-medium' : 'text-[var(--gray-border)]',
                      ].join(' ')}
                      onClick={() => !disabled && setProjectDropdownRow(item.id)}
                    >
                      {item.project?.name ?? '프로젝트 선택'}
                    </button>
                    {projectDropdownRow === item.id && (
                      <div ref={dropdownRef}>
                        <ProjectDropdown
                          value={item.projectId}
                          onChange={(project) => handleProjectSelect(item.id, project)}
                          onClose={() => setProjectDropdownRow(null)}
                        />
                      </div>
                    )}
                  </div>
                </td>

                {/* 프로젝트 코드 */}
                <td
                  className="px-3 py-[8px] align-top text-[12.5px]"
                  style={{ backgroundColor: 'var(--tbl-header)' }}
                >
                  <div className="px-1 py-1 min-h-[52px] text-[11px] font-mono text-[var(--text-sub)]">
                    {item.project?.code ?? ''}
                  </div>
                </td>

                {/* 진행업무 */}
                <td className="px-3 py-[8px] align-top text-[12.5px]">
                  <GridCell
                    value={item.doneWork}
                    isEditing={editingCell?.rowId === item.id && editingCell?.column === 'doneWork'}
                    onStartEdit={() => startEdit(item.id, 'doneWork')}
                    onEndEdit={endEdit}
                    onSave={(v) => handleSave(item.id, 'doneWork', v)}
                    disabled={disabled}
                    placeholder="진행업무 입력"
                    onOpenExpanded={() => setExpandedCell({ rowId: item.id, column: 'doneWork' })}
                  />
                </td>

                {/* 예정업무 */}
                <td className="px-3 py-[8px] align-top text-[12.5px]">
                  <GridCell
                    value={item.planWork}
                    isEditing={editingCell?.rowId === item.id && editingCell?.column === 'planWork'}
                    onStartEdit={() => startEdit(item.id, 'planWork')}
                    onEndEdit={endEdit}
                    onSave={(v) => handleSave(item.id, 'planWork', v)}
                    disabled={disabled}
                    placeholder="예정업무 입력"
                    onOpenExpanded={() => setExpandedCell({ rowId: item.id, column: 'planWork' })}
                  />
                </td>

                {/* 비고 */}
                <td className="px-3 py-[8px] align-top text-[12.5px]">
                  <GridCell
                    value={item.remarks ?? ''}
                    isEditing={editingCell?.rowId === item.id && editingCell?.column === 'remarks'}
                    onStartEdit={() => startEdit(item.id, 'remarks')}
                    onEndEdit={endEdit}
                    onSave={(v) => handleSave(item.id, 'remarks', v)}
                    disabled={disabled}
                    placeholder="비고"
                  />
                </td>

                {/* 액션 */}
                <td className="px-3 py-[8px] align-top text-[12.5px]">
                  {!disabled && (
                    <button
                      onClick={() => setDeleteTarget(item.id)}
                      className="mt-1.5 text-[var(--text-sub)] hover:text-[var(--danger)] text-[14px] transition-colors"
                      title="행 삭제"
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 행 추가 버튼 */}
      {!disabled && (
        <div className="mt-2">
          <Button variant="outline" size="small" onClick={onAddItem}>
            + 행 추가
          </Button>
        </div>
      )}

      {/* 확대 편집 패널 */}
      {expandedCell && (() => {
        const item = workItems.find((w) => w.id === expandedCell.rowId);
        if (!item) return null;
        const columnLabels = { doneWork: '진행업무', planWork: '예정업무', remarks: '비고' };
        return (
          <ExpandedEditor
            value={item[expandedCell.column] ?? ''}
            title={columnLabels[expandedCell.column]}
            onSave={(v) => {
              handleSave(expandedCell.rowId, expandedCell.column, v);
              setExpandedCell(null);
            }}
            onClose={() => setExpandedCell(null)}
          />
        );
      })()}

      {/* 삭제 확인 */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { onDeleteItem(deleteTarget!); setDeleteTarget(null); }}
        title="행 삭제"
        message="선택한 업무항목을 삭제하시겠습니까?"
        confirmLabel="삭제"
        danger
      />
    </div>
  );
}
