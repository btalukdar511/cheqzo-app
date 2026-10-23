import { Suspense } from "react";

import { AccountScreen } from "@/components/features/settings";

export default function Page() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-secondary" />}>
      <AccountScreen />
    </Suspense>
  );
}
