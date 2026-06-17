'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      compact: false,
      notifOpen: false,
      toggleRail: () => set((s) => ({ compact: !s.compact })),
      setNotifOpen: (v) => set({ notifOpen: v }),
    }),
    {
      name: 'tf-ui',
      partialize: (s) => ({ compact: s.compact }),
    }
  )
);
