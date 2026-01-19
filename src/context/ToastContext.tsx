import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Check, AlertCircle } from 'lucide-react';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error';
}

interface ToastContextType {
    showToast: (message: string, type: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastIdRef = useRef(0);

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        const id = ++toastIdRef.current;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast toast--${toast.type}`}>
                    <span className="toast__icon">
                        {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    </span>
                    <span className="toast__message">{toast.message}</span>
                </div>
            ))}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
