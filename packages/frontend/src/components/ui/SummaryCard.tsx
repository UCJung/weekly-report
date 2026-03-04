import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './Card';

interface SummaryCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  subText?: string;
  iconBg?: string;
  className?: string;
  highlighted?: boolean;
  onClick?: () => void;
}

export default function SummaryCard({
  icon,
  label,
  value,
  subText,
  iconBg = 'var(--primary-bg)',
  className,
  highlighted,
  onClick,
}: SummaryCardProps) {
  return (
    <Card
      className={cn(
        'flex items-center gap-3 px-4 py-3.5',
        onClick && 'cursor-pointer transition-shadow hover:shadow-md',
        highlighted && 'ring-2 ring-[var(--primary)]',
        className,
      )}
      onClick={onClick}
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
    </Card>
  );
}
