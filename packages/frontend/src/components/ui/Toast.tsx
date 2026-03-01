import React from 'react';
import { useUiStore } from '../../stores/uiStore';

type ToastType = 'success' | 'warning' | 'info' | 'danger';

const toastStyles: Record<ToastType, { borderColor: string; icon: string; iconColor: string }> = {
  success: { borderColor: 'var(--ok)',      icon: '✓', iconColor: 'var(--ok)' },
  warning: { borderColor: 'var(--warn)',    icon: '!', iconColor: 'var(--warn)' },
  info:    { borderColor: 'var(--primary)', icon: 'i', iconColor: 'var(--primary)' },
  danger:  { borderColor: 'var(--danger)',  icon: '✕', iconColor: 'var(--danger)' },
};

interface ToastItemProps {
  id: string;
  type: ToastType;
  message: string;
}

function ToastItem({ id, type, message }: ToastItemProps) {
  const { removeToast } = useUiStore();
  const styles = toastStyles[type];

  return (
    <div
      className="flex items-start gap-3 bg-white border border-[var(--gray-border)] rounded-lg px-4 py-3 min-w-[280px] max-w-[340px]"
      style={{
        borderLeft: `3px solid ${styles.borderColor}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        animation: 'toastIn 0.25s ease-out',
      }}
    >
      <span
        className="font-bold text-[13px] flex-shrink-0"
        style={{ color: styles.iconColor }}
      >
        {styles.icon}
      </span>
      <p className="flex-1 text-[12px] text-[var(--text)]">{message}</p>
      <button
        onClick={() => removeToast(id)}
        className="text-[var(--text-sub)] hover:text-[var(--text)] text-[16px] leading-none ml-1"
      >
        &times;
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-[60px] right-5 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}
