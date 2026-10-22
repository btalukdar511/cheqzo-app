"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SessionState {
  userId: string | null;
  /** Set after a correct OTP, before a demo role is chosen. */
  phone: string | null;
  setUserId: (userId: string | null) => void;
  setPhone: (phone: string | null) => void;
  signOut: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      userId: null,
      phone: null,
      setUserId: (userId) => set({ userId }),
      setPhone: (phone) => set({ phone }),
      signOut: () => set({ userId: null, phone: null }),
    }),
    {
      name: "cheqzo-session",
      partialize: (state) => ({ userId: state.userId, phone: state.phone }),
    },
  ),
);
