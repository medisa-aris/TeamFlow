'use client';
import { createContext, useContext, useCallback, useState } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((kind, title, msg) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, kind, title, msg, leaving: false }]);
    setTimeout(() => {
      setToasts((p) => p.map((t) => t.id === id ? { ...t, leaving: true } : t));
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 320);
    }, 3800);
  }, []);

  const remove = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  return (
    <ToastCtx.Provider value={{ toasts, push, remove }}>
      {children}
    </ToastCtx.Provider>
  );
}

export function useToasts() {
  return useContext(ToastCtx);
}
