import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export default function DevComponentsLayout({ children }: { children: ReactNode }) {
  if (process.env.CHEQZO_DEV_COMPONENTS !== "1") notFound();
  return children;
}
