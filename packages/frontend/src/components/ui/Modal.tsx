import React, { useEffect } from 'react';
import Button from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'default' | 'confirm';
}

export default function Modal({ open, onClose, title, children, footer, size = 'default' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const width = size === 'confirm' ? 'w-[360px]' : 'w-[480px]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(1px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${width} bg-white flex flex-col max-h-[90vh]`}
        style={{
          borderRadius: '10px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          animation: 'modalIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        {title && (
          <div
            className="flex items-center justify-between border-b border-[var(--gray-border)]"
            style={{ padding: '16px 20px' }}
          >
            <h2 className="text-[14px] font-bold text-[var(--text)]">{title}</h2>
            <button
              onClick={onClose}
              className="text-[var(--text-sub)] hover:text-[var(--text)] text-[18px] leading-none"
            >
              &times;
            </button>
          </div>
        )}
        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '20px' }}>
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div
            className="flex items-center justify-end gap-2 border-t border-[var(--gray-border)]"
            style={{ padding: '14px 20px' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="confirm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-[13px] text-[var(--text)]">{message}</p>
    </Modal>
  );
}
