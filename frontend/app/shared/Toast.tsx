'use client';

import { useEffect, useState, useCallback } from 'react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  removing?: boolean;
}

let addToastFn: ((message: string, type: 'success' | 'error' | 'info') => void) | null = null;

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  addToastFn?.(message, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
    }, 3000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const colors = {
    success: 'bg-[var(--lime)] border-[var(--border)]',
    error: 'bg-[var(--pink)] text-white border-[var(--border)]',
    info: 'bg-[var(--yellow)] border-[var(--border)]',
  };

  const icons = { success: '✓', error: '✗', info: '★' };

  return (
    <div className="fixed top-6 right-6 z-[2000] flex flex-col gap-3">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${colors[toast.type]} px-5 py-3 border-2.5 text-base font-medium max-w-[360px] flex items-center gap-3`}
          style={{
            fontFamily: 'var(--font-body)',
            borderRadius: '4px 10px 2px 8px',
            boxShadow: 'var(--shadow)',
            animation: toast.removing ? 'toastOut 0.3s ease forwards' : 'toastSlide 0.3s ease',
          }}
        >
          <span className="text-lg">{icons[toast.type]}</span>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
