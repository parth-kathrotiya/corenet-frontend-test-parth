'use client';

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { removeToast } from '@/redux/slices/toastSlice';

export default function ToastContainer() {
  const toasts = useAppSelector((state) => state.toast.toasts);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      dispatch(removeToast(toasts[0].id));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white text-sm font-medium min-w-[300px] max-w-sm animate-slide-in border ${
            toast.type === 'success'
              ? 'bg-[#027B51] border-[#025e3e]'
              : toast.type === 'error'
              ? 'bg-[#c0392b] border-[#922b21]'
              : 'bg-[#0D1814] border-[#1a2e26]'
          }`}
        >
          <span className="text-lg">
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
          </span>
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => dispatch(removeToast(toast.id))}
            className="ml-2 opacity-70 hover:opacity-100 transition-opacity text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
