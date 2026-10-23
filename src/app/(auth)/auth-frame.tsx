"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AuthGate } from "@/components/shell/AuthGate";

export function AuthFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <AuthGate area={pathname === "/role" ? "role" : "login"}>{children}</AuthGate>;
}
