import { useCallback, useEffect, useRef, useState } from 'react';

import { onToast } from '../services/api';

export interface Toast {
  id: string;
  message: string;
}

interface UseToastResult {
  toasts: Toast[];
  addToast: (message: string) => void;
  removeToast: (id: string) => void;
}

const AUTO_DISMISS_MS = 5000;

let toastIdCounter = 0;

function generateToastId(): string {
  toastIdCounter += 1;
  return `toast-${Date.now()}-${toastIdCounter}`;
}

/**
 * Manages toast notifications with auto-dismiss after 5 seconds.
 * Integrates with the onToast event from the API service layer.
 */
export function useToast(): UseToastResult {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (message: string) => {
      const id = generateToastId();
      const toast: Toast = { id, message };
      setToasts((prev) => [...prev, toast]);

      const timer = setTimeout(() => {
        removeToast(id);
      }, AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  // Subscribe to API toast events
  useEffect(() => {
    const unsubscribe = onToast((message: string) => {
      addToast(message);
    });

    return () => {
      unsubscribe();
      // Clear all pending timers on unmount
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [addToast]);

  return { toasts, addToast, removeToast };
}
