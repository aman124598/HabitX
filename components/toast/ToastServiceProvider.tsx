import React, { useEffect } from 'react';
import { useToast } from '../../lib/toastContext';
import { setToastInstance } from '../../lib/toastService';

/**
 * Toast Service Initializer Component
 * This component sets up the toast service instance for global use
 */
export default function ToastServiceProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();

  useEffect(() => {
    // Set the toast instance for global use
    setToastInstance(toast);
    
    // Clean up on unmount
    return () => {
      setToastInstance(null as any);
    };
  }, [toast]);

  return <>{children}</>;
}