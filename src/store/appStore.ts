import { create } from 'zustand';

interface AppState {
  currentMonth: number;
  currentYear: number;
  setMonth: (month: number) => void;
  setYear: (year: number) => void;
}

const now = new Date();

export const useAppStore = create<AppState>((set) => ({
  currentMonth: now.getMonth() + 1,
  currentYear: now.getFullYear(),
  setMonth: (month) => set({ currentMonth: month }),
  setYear: (year) => set({ currentYear: year }),
}));
