import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error';
  title: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-lg border shadow-xl bg-ledger-surface transition-all ${
              isSuccess
                ? 'border-ledger-lime/40 text-ledger-text'
                : isError
                ? 'border-ledger-coral/40 text-ledger-text'
                : 'border-ledger-amber/40 text-ledger-text'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-ledger-lime shrink-0 mt-0.5" />}
            {isError && <XCircle className="w-5 h-5 text-ledger-coral shrink-0 mt-0.5" />}
            {isWarning && <AlertTriangle className="w-5 h-5 text-ledger-amber shrink-0 mt-0.5" />}

            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold font-mono tracking-wide">{toast.title}</div>
              <div className="text-xs text-ledger-muted mt-0.5 leading-relaxed">{toast.message}</div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-ledger-muted hover:text-ledger-text p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
