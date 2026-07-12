import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onRemove, 4000);
        return () => clearTimeout(timer);
    }, [onRemove]);

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        error: <AlertCircle className="w-5 h-5 text-rose-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />,
    };

    const borders = {
        success: 'border-emerald-400/20',
        error: 'border-rose-400/20',
        info: 'border-blue-400/20',
    };

    return (
        <div className={`animate-fade-up bg-surface border ${borders[toast.type]} rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md`}>
            {icons[toast.type]}
            <span className="flex-1 text-sm font-medium text-text">{toast.message}</span>
            <button onClick={onRemove} className="text-textMuted hover:text-text transition-colors">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}
