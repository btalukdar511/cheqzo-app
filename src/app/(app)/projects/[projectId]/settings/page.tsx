import { Suspense } from "react";

import { ProjectSettingsScreen } from "@/components/features/settings";

export default function Page() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-secondary" />}>
      <ProjectSettingsScreen />
    </Suspense>
  );
}
