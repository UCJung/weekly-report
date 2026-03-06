import React, { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import LinkedTasksPanel from './LinkedTasksPanel';

interface ExpandedEditorProps {
  value: string;
  title: string;
  onSave: (value: string) => void;
  onClose: () => void;
  workItemId?: string;
  projectId?: string;
  teamId?: string;
  weekLabel?: string;
}

export default function ExpandedEditor({
  value,
  title,
  onSave,
  onClose,
  workItemId,
  projectId,
  teamId,
  weekLabel,
}: ExpandedEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  // ESC로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'F2') {
      onSave(localValue);
      onClose();
    }
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
        onClick={onClose}
      />

      {/* 하단 고정 편집창 */}
      <div
        className="fixed bottom-0 z-50 overflow-hidden flex"
        style={{
          left: 'var(--sidebar-w)',
          right: 0,
          backgroundColor: 'var(--primary-bg)',
          borderTop: '2px solid var(--primary)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        }}
      >
        {/* 좌측 편집 영역 */}
        <div className="flex-1 flex flex-col">
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ borderBottom: '1px solid var(--gray-border)', backgroundColor: 'white' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[13px]">📝</span>
            <span className="text-[12px] font-semibold text-[var(--primary)]">
              셀 확대 편집
            </span>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--primary-bg)',
                color: 'var(--primary)',
                border: '1px solid var(--primary)',
              }}
            >
              {title}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[var(--text-sub)]">F2 저장 · ESC 닫기</span>
            <Button
              variant="ghost"
              size="small"
              onClick={onClose}
              className="text-[var(--text-sub)] hover:text-[var(--danger)]"
            >
              ✕ 닫기
            </Button>
          </div>
        </div>

        {/* 편집 영역 */}
        <div className="p-3">
          <textarea
            ref={textareaRef}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={8}
            className="w-full px-3 py-2 text-[13px] text-[var(--text)] outline-none resize-y border border-[var(--gray-border)] rounded focus:border-[var(--primary)]"
            placeholder={'[업무항목]\n*세부업무\n-상세작업'}
            style={{
              lineHeight: '1.6',
              backgroundColor: 'white',
              fontFamily: 'inherit',
            }}
          />
          <p className="text-[10px] text-[var(--text-sub)] mt-1.5 flex items-center gap-1">
            <span className="font-mono bg-[var(--gray-light)] rounded px-1">[항목]</span>
            업무항목
            <span className="mx-1 text-[var(--gray-border)]">·</span>
            <span className="font-mono bg-[var(--gray-light)] rounded px-1">*세부</span>
            세부업무
            <span className="mx-1 text-[var(--gray-border)]">·</span>
            <span className="font-mono bg-[var(--gray-light)] rounded px-1">-상세</span>
            상세작업
          </p>
        </div>

          {/* 푸터 */}
          <div
            className="flex justify-end gap-2 px-4 py-2.5"
            style={{ borderTop: '1px solid var(--gray-border)', backgroundColor: 'white' }}
          >
            <Button variant="ghost" size="small" onClick={onClose}>취소</Button>
            <Button size="small" onClick={() => { onSave(localValue); onClose(); }}>저장 (F2)</Button>
          </div>
        </div>

        {/* 우측 연관 작업 패널 */}
        {workItemId && teamId && weekLabel && (
          <LinkedTasksPanel
            workItemId={workItemId}
            projectId={projectId}
            teamId={teamId}
            weekLabel={weekLabel}
            onApplied={() => {
              // 패널에서 작업이 적용되었을 때 호출
              // 일반적으로 여기서는 추가 로직이 필요 없음 (mutation이 자동으로 캐시 업데이트)
            }}
          />
        )}
      </div>
    </>
  );
}
