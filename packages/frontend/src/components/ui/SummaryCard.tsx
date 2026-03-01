import React from 'react';

interface SummaryCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  subText?: string;
  iconBg?: string;
  className?: string;
}

export default function SummaryCard({
  icon,
  label,
  value,
  subText,
  iconBg = 'var(--primary-bg)',
  className = '',
}: SummaryCardProps) {
  return (
    <div
      className={[
        'bg-white rounded-lg border border-[var(--gray-border)] flex items-center',
        className,
      ].join(' ')}
      style={{ padding: '14px 16px', gap: '12px' }}
    >
      {icon && (
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-[18px]"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>
      )}
      <div>
        <p className="text-[11px] text-[var(--text-sub)]">{label}</p>
        <p className="text-[22px] font-bold text-[var(--text)] leading-tight">{value}</p>
        {subText && <p className="text-[10.5px] text-[var(--text-sub)] mt-0.5">{subText}</p>}
      </div>
    </div>
  );
}
