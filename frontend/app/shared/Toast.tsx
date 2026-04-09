'use client';

import { useEffect, useState, useCallback } from 'react';

interface ToastItem { id: number; message: string; type: 'success' | 'error' | 'info'; removing?: boolean; }

let addToastFn: ((message: string, type: 'success' | 'error' | 'info') => void) | null = null;
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') { addToastFn?.(message, type); }

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
    }, 4000);
  }, []);

  useEffect(() => { addToastFn = addToast; return () => { addToastFn = null; }; }, [addToast]);

  const styles = {
    success: { bg: '#16a34a', icon: '✓' },
    error: { bg: '#dc2626', icon: '✕' },
    info: { bg: '#1e293b', icon: 'ℹ' },
  };

  return (
    <div className="fixed top-5 right-5 z-[2000] flex flex-col gap-3" style={{ maxWidth: '400px' }}>
      {toasts.map(toast => {
        const s = styles[toast.type];
        return (
          <div key={toast.id} className="px-5 py-3.5 rounded-xl text-sm font-medium flex items-center gap-3"
            style={{ background: s.bg, color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: toast.removing ? 'toastOut 0.3s ease forwards' : 'toastSlide 0.3s ease' }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>{s.icon}</span>
            <span className="leading-snug">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
