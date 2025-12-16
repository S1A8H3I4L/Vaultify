import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const styles = {
    success: 'bg-slate-800 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-slate-800 text-white'
  };

  const icons = {
    success: <CheckCircle size={18} className="text-green-400" />,
    error: <AlertCircle size={18} className="text-white" />,
    info: <Info size={18} className="text-blue-400" />
  };

  return (
    <div className={`pointer-events-auto min-w-[300px] max-w-sm rounded-lg shadow-lg p-4 flex items-center justify-between gap-3 transform transition-all animate-in slide-in-from-bottom-5 fade-in ${styles[toast.type]}`}>
      <div className="flex items-center gap-3">
        {icons[toast.type]}
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
      <button 
        onClick={() => onDismiss(toast.id)}
        className="p-1 hover:bg-white/10 rounded-full transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};
