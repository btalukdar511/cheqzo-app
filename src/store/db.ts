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
        users: state.users.map((user) => ({
          ...user,
          avatarUrl: user.avatarUrl?.startsWith("blob:") ? undefined : user.avatarUrl,
        })),
        projects: state.projects.map((project) => ({
          ...project,
          coverImage: project.coverImage.startsWith("blob:") ? "" : project.coverImage,
        })),
        rooms: state.rooms.map((room) => ({
          ...room,
          beforePhotos: room.beforePhotos.filter((url) => !url.startsWith("blob:")),
          inspiration: room.inspiration
            .filter((item) => !item.imageUrl.startsWith("blob:"))
            .map((item) => ({ ...item })),
        })),
        updates: state.updates.map((update) => ({
          ...update,
          photos: update.photos.filter((photo) => !photo.url.startsWith("blob:")),
        })),
        payments: state.payments.map((payment) => ({
          ...payment,
          receiptUrl: payment.receiptUrl?.startsWith("blob:") ? undefined : payment.receiptUrl,
        })),
        changeRequests: state.changeRequests,
        teamMembers: state.teamMembers,
        notifications: state.notifications,
        latencyEnabled: state.latencyEnabled,
      }),
    },
  ),
);
