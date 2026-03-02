import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { TeamProject } from '../api/project.api';
import Badge from '../components/ui/Badge';

const CATEGORY_LABELS: Record<string, string> = {
  COMMON: '공통',
  EXECUTION: '수행',
};

interface SortableRowProps {
  project: TeamProject;
  isDndActive: boolean;
  idx: number;
  onRemove: (p: TeamProject) => void;
}

function SortableRow({ project, isDndActive, idx, onRemove }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.teamProjectId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={[
        'border-b border-[var(--gray-border)] hover:bg-[var(--row-alt)]',
        idx % 2 === 1 ? 'bg-[var(--row-alt)]' : '',
        isDragging ? 'shadow-lg z-10 relative' : '',
      ].join(' ')}
    >
      <td className="px-3 py-[9px] text-center w-10">
        {isDndActive ? (
          <span
            {...attributes}
            {...listeners}
            className="inline-flex items-center justify-center w-5 h-5 cursor-grab active:cursor-grabbing text-[var(--text-sub)] hover:text-[var(--text)]"
          >
            ⠿
          </span>
        ) : (
          <span className="text-[var(--text-sub)] text-[11px]">{idx + 1}</span>
        )}
      </td>
      <td className="px-3 py-[9px] text-[12.5px] font-medium" style={{ color: 'var(--text)' }}>
        {project.name}
        {project.status === 'INACTIVE' && (
          <span
            className="ml-2 text-[10px] px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'var(--gray-light)', color: 'var(--text-sub)' }}
          >
            사용안함
          </span>
        )}
      </td>
      <td className="px-3 py-[9px] text-[12.5px] font-mono" style={{ color: 'var(--text-sub)' }}>
        {project.code}
      </td>
      <td className="px-3 py-[9px]">
        <Badge variant={project.category === 'COMMON' ? 'purple' : 'blue'}>
          {CATEGORY_LABELS[project.category]}
        </Badge>
      </td>
      <td className="px-3 py-[9px]">
        <Badge variant={project.status === 'ACTIVE' ? 'ok' : 'gray'}>
          {project.status === 'ACTIVE' ? '사용중' : '사용안함'}
        </Badge>
      </td>
      <td className="px-3 py-[9px] text-right">
        <button
          onClick={() => onRemove(project)}
          className="p-1.5 rounded transition-colors"
          title="팀에서 해제"
          style={{ color: 'var(--text-sub)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--danger-bg)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-sub)';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
}

export interface ProjectDndTableProps {
  projects: TeamProject[];
  isLoading: boolean;
  isDndActive: boolean;
  onRemove: (p: TeamProject) => void;
  onReorder: (newOrder: TeamProject[]) => Promise<void>;
}

export default function ProjectDndTable({
  projects,
  isLoading,
  isDndActive,
  onRemove,
  onReorder,
}: ProjectDndTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projects.findIndex((p) => p.teamProjectId === active.id);
    const newIndex = projects.findIndex((p) => p.teamProjectId === over.id);
    const newOrder = arrayMove(projects, oldIndex, newIndex);

    try {
      await onReorder(newOrder);
    } catch {
      toast.error('순서 변경에 실패했습니다.');
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <table className="w-full">
        <thead>
          <tr
            className="border-b border-[var(--gray-border)]"
            style={{ backgroundColor: 'var(--tbl-header)' }}
          >
            <th className="text-center px-3 py-[9px] text-[12px] font-semibold w-10" style={{ color: 'var(--text-sub)' }}>
              순서
            </th>
            <th className="text-left px-3 py-[9px] text-[12px] font-semibold" style={{ color: 'var(--text-sub)' }}>
              프로젝트명
            </th>
            <th className="text-left px-3 py-[9px] text-[12px] font-semibold" style={{ color: 'var(--text-sub)' }}>
              코드
            </th>
            <th className="text-left px-3 py-[9px] text-[12px] font-semibold" style={{ color: 'var(--text-sub)' }}>
              분류
            </th>
            <th className="text-left px-3 py-[9px] text-[12px] font-semibold" style={{ color: 'var(--text-sub)' }}>
              상태
            </th>
            <th className="text-right px-3 py-[9px] text-[12px] font-semibold" style={{ color: 'var(--text-sub)' }}>
              관리
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={6} className="text-center py-10" style={{ color: 'var(--text-sub)' }}>
                불러오는 중...
              </td>
            </tr>
          )}
          {!isLoading && projects.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-10" style={{ color: 'var(--text-sub)' }}>
                등록된 프로젝트가 없습니다. "+ 프로젝트 추가" 버튼으로 등록하세요.
              </td>
            </tr>
          )}
          <SortableContext
            items={projects.map((p) => p.teamProjectId)}
            strategy={verticalListSortingStrategy}
          >
            {projects.map((project, idx) => (
              <SortableRow
                key={project.teamProjectId}
                project={project}
                isDndActive={isDndActive}
                idx={idx}
                onRemove={onRemove}
              />
            ))}
          </SortableContext>
        </tbody>
      </table>
    </DndContext>
  );
}
