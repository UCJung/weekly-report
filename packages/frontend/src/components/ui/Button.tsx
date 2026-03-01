import React from 'react';

type Variant = 'primary' | 'outline' | 'danger';
type Size = 'default' | 'small';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-[var(--primary)] text-white border border-[var(--primary)] hover:bg-[var(--primary-dark)] hover:border-[var(--primary-dark)] active:opacity-90',
  outline: 'bg-white text-[var(--text)] border border-[var(--gray-border)] hover:bg-[var(--gray-light)] hover:border-[var(--primary)] hover:text-[var(--primary)]',
  danger:  'bg-[var(--danger)] text-white border border-[var(--danger)] hover:opacity-90 active:opacity-80',
};

const sizeStyles: Record<Size, string> = {
  default: 'h-[30px] px-3 text-[12.5px]',
  small:   'h-[26px] px-2 text-[11px]',
};

export default function Button({
  variant = 'primary',
  size = 'default',
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={[
        'inline-flex items-center gap-[5px] rounded-[5px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
