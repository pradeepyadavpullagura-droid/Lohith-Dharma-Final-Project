import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContainer = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';
        
        return (
          <div
            key={toast.id}
            className={`flex items-start justify-between p-4 rounded-xl border animate-slide-in-right glass-panel shadow-2xl ${
              isError
                ? 'border-red-500/30 text-red-200 bg-red-950/40'
                : isInfo
                ? 'border-blue-500/30 text-blue-200 bg-blue-950/40'
                : 'border-emerald-500/30 text-emerald-200 bg-emerald-950/40'
            }`}
          >
            <div className="flex items-center gap-3">
              {isError ? (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              ) : isInfo ? (
                <Info className="w-5 h-5 text-blue-400 shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
