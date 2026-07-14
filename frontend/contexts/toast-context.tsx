'use client';

// Toasts mínimos, sin dependencias: un contexto + una pila auto-descartable.
import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error';
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<((message: string, type?: ToastType) => void) | undefined>(
  undefined
);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            aria-live={t.type === 'error' ? 'assertive' : 'polite'}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium border ${
              t.type === 'success'
                ? 'bg-success text-success-foreground border-success/70'
                : 'bg-destructive text-destructive-foreground border-destructive/70'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
