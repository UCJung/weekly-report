import React, { useState, useRef, useEffect, useCallback } from 'react';
import FormattedText from './FormattedText';

interface GridCellProps {
  value: string;
  onSave: (value: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  disabled?: boolean;
  placeholder?: string;
  onOpenExpanded?: () => void;
  className?: string;
}

export default function GridCell({
  value,
  onSave,
  isEditing,
  onStartEdit,
  onEndEdit,
  disabled = false,
  placeholder = '',
  onOpenExpanded,
  className = '',
}: GridCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 편집 모드 진입 시 textarea에 포커스
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // 외부 value 변경 동기화 (편집 중이 아닐 때)
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value);
    }
  }, [value, isEditing]);

  const handleBlur = useCallback(() => {
    onSave(localValue);
    onEndEdit();
  }, [localValue, onSave, onEndEdit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setLocalValue(value);
      onEndEdit();
      e.preventDefault();
    }
    if (e.key === 'F2') {
      onOpenExpanded?.();
      e.preventDefault();
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      onSave(localValue);
      onEndEdit();
      e.preventDefault();
    }
  };

  // 자동 높이 조절
  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 60)}px`;
  };

  if (isEditing && !disabled) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            autoResize(e.target);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full min-h-[52px] px-2 py-1.5 text-[12.5px] text-[var(--text)] resize-none bg-[var(--primary-bg)] border border-[var(--primary)] rounded"
          style={{
            outline: '2px solid var(--primary)',
            outlineOffset: '-2px',
            lineHeight: '1.5',
          }}
        />
        {onOpenExpanded && (
          <button
            className="absolute top-1 right-1 text-[10px] text-[var(--primary)] opacity-60 hover:opacity-100"
            onMouseDown={(e) => {
              e.preventDefault();
              onOpenExpanded();
            }}
            title="확대 편집 (F2)"
          >
            ↗
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={[
        'w-full min-h-[52px] px-2 py-1.5 cursor-text rounded transition-colors',
        !disabled ? 'hover:bg-[var(--primary-bg)]/40' : '',
        className,
      ].join(' ')}
      onClick={() => !disabled && onStartEdit()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === 'F2') && !disabled) {
          onStartEdit();
        }
      }}
      tabIndex={disabled ? -1 : 0}
      role="gridcell"
      style={{
        outline: 'none',
      }}
    >
      {value ? (
        <FormattedText text={value} />
      ) : (
        <span className="text-[11px] text-[var(--gray-border)]">{placeholder}</span>
      )}
    </div>
  );
}
