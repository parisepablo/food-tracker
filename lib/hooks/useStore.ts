"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: "ui-storage",
    }
  )
);

interface HouseholdState {
  currentHouseholdId: string | null;
  setCurrentHouseholdId: (id: string | null) => void;
}

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set) => ({
      currentHouseholdId: null,
      setCurrentHouseholdId: (id) => set({ currentHouseholdId: id }),
    }),
    {
      name: "household-storage",
    }
  )
);
