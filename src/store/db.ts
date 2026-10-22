"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createSeedData } from "@/data/seed";
import type { Database } from "@/types";

interface DbState extends Database {
  latencyEnabled: boolean;
  reset: () => void;
  setLatencyEnabled: (enabled: boolean) => void;
  replace: (data: Database) => void;
}

function seedState(): Database {
  return createSeedData();
}

export const useDb = create<DbState>()(
  persist(
    (set, get) => ({
      ...seedState(),
      latencyEnabled: true,
      reset: () => set({ ...seedState(), latencyEnabled: get().latencyEnabled }),
      setLatencyEnabled: (enabled) => set({ latencyEnabled: enabled }),
      replace: (data) => set(data),
    }),
    {
      name: "cheqzo-db",
      partialize: (state) => ({
        users: state.users,
        projects: state.projects,
        rooms: state.rooms,
        updates: state.updates,
        payments: state.payments,
        changeRequests: state.changeRequests,
        teamMembers: state.teamMembers,
        notifications: state.notifications,
        latencyEnabled: state.latencyEnabled,
      }),
    },
  ),
);
