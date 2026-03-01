import React, { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';

interface ExpandedEditorProps {
  value: string;
  title: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

export default function ExpandedEditor({ value, title, onSave, onClose }: ExpandedEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

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
    <div
      className="mt-3 overflow-hidden"
      style={{
        backgroundColor: '#fafaff',
        borderTop: '2px solid var(--primary)',
        borderLeft: '1px solid var(--gray-border)',
        borderRight: '1px solid var(--gray-border)',
        borderBottom: '1px solid var(--gray-border)',
        borderRadius: '0 0 8px 8px',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: '1px solid var(--gray-border)' }}
      >
        <span className="text-[12px] font-medium text-[var(--primary)]">
          확대 편집 — {title}
        </span>
        <span className="text-[10px] text-[var(--text-sub)]">F2 또는 저장 버튼으로 닫기</span>
      </div>
      <div className="p-3">
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={8}
          className="w-full px-3 py-2 text-[13px] text-[var(--text)] outline-none resize-y border border-[var(--gray-border)] rounded focus:border-[var(--primary)] font-mono"
          placeholder={'[업무항목]\n*세부업무\nㄴ상세작업'}
          style={{ lineHeight: '1.6', backgroundColor: '#ffffff' }}
        />
        <p className="text-[10px] text-[var(--text-sub)] mt-1">
          서식 안내: [항목] 으로 시작하면 업무항목, *으로 시작하면 세부업무, ㄴ으로 시작하면 상세작업
        </p>
      </div>
      <div
        className="flex justify-end gap-2 px-4 py-2.5"
        style={{ borderTop: '1px solid var(--gray-border)' }}
      >
        <Button variant="outline" size="small" onClick={onClose}>취소</Button>
        <Button size="small" onClick={() => { onSave(localValue); onClose(); }}>저장 (F2)</Button>
      </div>
    </div>
  );
}
