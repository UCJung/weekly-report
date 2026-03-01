import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
}

interface ParsedLine {
  type: 'item' | 'sub' | 'detail' | 'plain';
  content: string;
}

function parseLine(line: string): ParsedLine {
  const trimmed = line.trimStart();
  if (trimmed.startsWith('[') && trimmed.includes(']')) {
    return { type: 'item', content: trimmed };
  }
  if (trimmed.startsWith('*')) {
    return { type: 'sub', content: trimmed.slice(1).trim() };
  }
  if (trimmed.startsWith('ㄴ')) {
    return { type: 'detail', content: trimmed.slice(1).trim() };
  }
  return { type: 'plain', content: trimmed };
}

export default function FormattedText({ text, className = '' }: FormattedTextProps) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className={`text-[12.5px] leading-relaxed ${className}`}>
      {lines.map((line, idx) => {
        if (!line.trim()) {
          return <div key={idx} className="h-3" />;
        }
        const parsed = parseLine(line);

        switch (parsed.type) {
          case 'item':
            return (
              <div key={idx} className="font-semibold text-[var(--primary)]">
                {parsed.content}
              </div>
            );
          case 'sub':
            return (
              <div key={idx} className="pl-2 text-[var(--text)]">
                • {parsed.content}
              </div>
            );
          case 'detail':
            return (
              <div key={idx} className="pl-[18px] text-[var(--text-sub)] text-[11.5px]">
                ㄴ {parsed.content}
              </div>
            );
          default:
            return (
              <div key={idx} className="text-[var(--text)]">
                {parsed.content}
              </div>
            );
        }
      })}
    </div>
  );
}
