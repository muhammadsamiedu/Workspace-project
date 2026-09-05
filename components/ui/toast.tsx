'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { hideToast } from '@/redux/slices/uiSlice';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const dispatch = useAppDispatch();
  const toast = useAppSelector((state) => state.ui.toast);
  const { undo } = useUndoRedo();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      dispatch(hideToast());
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-500 shrink-0" />,
  };

  const handleAction = () => {
    if (toast.action?.actionType === 'undo') {
      undo();
    }
    dispatch(hideToast());
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full animate-bounceIn pointer-events-none">
      <div
        className={cn(
          'pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl shadow-xl border glass-panel transition-all',
          toast.type === 'error' && 'border-rose-300 dark:border-rose-900 bg-rose-50/90 dark:bg-rose-950/80',
          toast.type === 'success' && 'border-emerald-300 dark:border-emerald-900 bg-emerald-50/90 dark:bg-emerald-950/80',
          toast.type === 'warning' && 'border-amber-300 dark:border-amber-900 bg-amber-50/90 dark:bg-amber-950/80',
          toast.type === 'info' && 'border-indigo-300 dark:border-indigo-900 bg-white/95 dark:bg-zinc-900/95'
        )}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {icons[toast.type]}
          <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
            {toast.message}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {toast.action && (
            <button
              onClick={handleAction}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              {toast.action.label}
            </button>
          )}

          <button
            onClick={() => dispatch(hideToast())}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
