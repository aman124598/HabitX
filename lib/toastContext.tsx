import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'achievement' | 'xp';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  data?: any; // For additional data like XP amounts, etc.
}

export interface ToastContextType {
  toasts: ToastData[];
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
  // Convenience methods for common toast types
  success: (title: string, message?: string, options?: Partial<ToastData>) => void;
  error: (title: string, message?: string, options?: Partial<ToastData>) => void;
  warning: (title: string, message?: string, options?: Partial<ToastData>) => void;
  info: (title: string, message?: string, options?: Partial<ToastData>) => void;
  achievement: (title: string, message?: string, xp?: number, options?: Partial<ToastData>) => void;
  xpReward: (xp: number, title?: string, subtitle?: string, options?: Partial<ToastData>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const showToast = useCallback((toastData: Omit<ToastData, 'id'>) => {
    const id = generateId();
    const newToast: ToastData = {
      id,
      duration: 4000, // Default 4 seconds
      ...toastData,
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Limit the number of toasts
      return updated.slice(0, maxToasts);
    });

    // Auto-hide toast after duration (if duration > 0)
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }
  }, [maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((title: string, message?: string, options?: Partial<ToastData>) => {
    showToast({
      type: 'success',
      title,
      message,
      icon: 'checkmark-circle',
      ...options,
    });
  }, [showToast]);

  const error = useCallback((title: string, message?: string, options?: Partial<ToastData>) => {
    showToast({
      type: 'error',
      title,
      message,
      icon: 'alert-circle',
      duration: 6000, // Errors stay longer
      ...options,
    });
  }, [showToast]);

  const warning = useCallback((title: string, message?: string, options?: Partial<ToastData>) => {
    showToast({
      type: 'warning',
      title,
      message,
      icon: 'warning',
      ...options,
    });
  }, [showToast]);

  const info = useCallback((title: string, message?: string, options?: Partial<ToastData>) => {
    showToast({
      type: 'info',
      title,
      message,
      icon: 'information-circle',
      ...options,
    });
  }, [showToast]);

  const achievement = useCallback((title: string, message?: string, xp?: number, options?: Partial<ToastData>) => {
    showToast({
      type: 'achievement',
      title,
      message: message || (xp ? `+${xp} XP earned!` : undefined),
      icon: 'trophy',
      duration: 6000, // Achievements stay longer
      data: { xp },
      ...options,
    });
  }, [showToast]);

  const xpReward = useCallback((xp: number, title?: string, subtitle?: string, options?: Partial<ToastData>) => {
    showToast({
      type: 'xp',
      title: title || `+${xp} XP`,
      message: subtitle,
      icon: 'star',
      duration: 3000,
      data: { xp },
      ...options,
    });
  }, [showToast]);

  const contextValue: ToastContextType = {
    toasts,
    showToast,
    hideToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
    achievement,
    xpReward,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}