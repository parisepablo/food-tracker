"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MealType } from "@/types";

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

interface PlanEntry {
  id?: string;
  date: string;
  meal_type: MealType;
  recipe_id: string;
  recipe_name: string;
  calories_per_serving?: number;
  protein_per_serving?: number;
  carbs_per_serving?: number;
  fat_per_serving?: number;
  image_url?: string | null;
}

interface Conflict {
  date: string;
  meal_type: string;
  reason: string;
}

interface PlanDraftState {
  weekStart: string | null;
  entries: PlanEntry[];
  conflicts: Conflict[];
  aiMessage: string | null;
  isDirty: boolean;
  setWeekStart: (weekStart: string) => void;
  setEntries: (entries: PlanEntry[]) => void;
  addEntry: (entry: PlanEntry) => void;
  removeEntry: (date: string, mealType: MealType) => void;
  updateEntry: (date: string, mealType: MealType, entry: Partial<PlanEntry>) => void;
  setConflicts: (conflicts: Conflict[]) => void;
  setAIMessage: (message: string | null) => void;
  clearDraft: () => void;
  loadFromAPI: (data: { entries: PlanEntry[]; conflicts: Conflict[]; week_start: string }) => void;
}

export const usePlanDraftStore = create<PlanDraftState>()(
  persist(
    (set) => ({
      weekStart: null,
      entries: [],
      conflicts: [],
      aiMessage: null,
      isDirty: false,
      setWeekStart: (weekStart) => set({ weekStart, isDirty: false }),
      setEntries: (entries) => set({ entries, isDirty: true }),
      addEntry: (entry) =>
        set((state) => {
          const filtered = state.entries.filter(
            (e) => !(e.date === entry.date && e.meal_type === entry.meal_type)
          );
          return { entries: [...filtered, entry], isDirty: true };
        }),
      removeEntry: (date, mealType) =>
        set((state) => ({
          entries: state.entries.filter(
            (e) => !(e.date === date && e.meal_type === mealType)
          ),
          isDirty: true,
        })),
      updateEntry: (date, mealType, updates) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.date === date && e.meal_type === mealType ? { ...e, ...updates } : e
          ),
          isDirty: true,
        })),
      setConflicts: (conflicts) => set({ conflicts }),
      setAIMessage: (message) => set({ aiMessage: message }),
      clearDraft: () => set({ weekStart: null, entries: [], conflicts: [], aiMessage: null, isDirty: false }),
      loadFromAPI: (data) =>
        set({
          weekStart: data.week_start,
          entries: data.entries,
          conflicts: data.conflicts,
          isDirty: false,
        }),
    }),
    {
      name: "plan-draft-storage",
    }
  )
);
