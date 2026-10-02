import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => toast({ type: 'success', title, message }), [toast]);
  const error = useCallback((title: string, message?: string) => toast({ type: 'error', title, message }), [toast]);
  const info = useCallback((title: string, message?: string) => toast({ type: 'info', title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-glass text-text-primary ${
              t.type === 'success'
                ? 'bg-background-card border-emerald-800/80 text-emerald-200'
                : t.type === 'error'
                ? 'bg-background-card border-rose-800/80 text-rose-200'
                : 'bg-background-card border-border-strong text-slate-200'
            }`}
          >
            <span className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-400" />}
              {t.type === 'info' && <Info className="h-4 w-4 text-slate-400" />}
            </span>
            <div className="flex-1">
              <div className="text-sm font-semibold">{t.title}</div>
              {t.message && (
                <div className="text-xs text-text-secondary mt-0.5">{t.message}</div>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded text-text-muted hover:text-text-primary"
              aria-label="Close notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
