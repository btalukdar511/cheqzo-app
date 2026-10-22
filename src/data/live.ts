"use client";

import { useSyncExternalStore } from "react";

import { useDb } from "@/store/db";
import { useSession } from "@/store/session";
import type { Database, User } from "@/types";

function subscribeStores(onStoreChange: () => void): () => void {
  const unsubSession = useSession.persist.onFinishHydration(onStoreChange);
  const unsubDb = useDb.persist.onFinishHydration(onStoreChange);
  return () => {
    unsubSession();
    unsubDb();
  };
}

function storesReady(): boolean {
  return useSession.persist.hasHydrated() && useDb.persist.hasHydrated();
}

export function useStoresReady(): boolean {
  return useSyncExternalStore(subscribeStores, storesReady, () => false);
}

export function useCurrentUser(): User | null {
  const userId = useSession((state) => state.userId);
  const users = useDb((state) => state.users);
  if (!userId) return null;
  return users.find((user) => user.id === userId) ?? null;
}

export function useLiveDb(): Database {
  const users = useDb((state) => state.users);
  const projects = useDb((state) => state.projects);
  const rooms = useDb((state) => state.rooms);
  const updates = useDb((state) => state.updates);
  const payments = useDb((state) => state.payments);
  const changeRequests = useDb((state) => state.changeRequests);
  const teamMembers = useDb((state) => state.teamMembers);
  const notifications = useDb((state) => state.notifications);
  return { users, projects, rooms, updates, payments, changeRequests, teamMembers, notifications };
}
