import { Suspense, type ReactNode } from "react";

import { AuthFrame } from "@/app/(auth)/auth-frame";
import { AuthSkeleton } from "@/components/shell/AuthGate";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthFrame>{children}</AuthFrame>
    </Suspense>
  );
}
