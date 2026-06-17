'use client';
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  me: null,
  notifPrefs: { approved: true, rejected: true, reminder: false },
  setMe: (me) => set({ me }),
  setNotifPrefs: (prefs) => set({ notifPrefs: prefs }),
  clear: () => set({ me: null }),
}));
