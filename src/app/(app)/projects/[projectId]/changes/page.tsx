import { Suspense } from "react";

import { ChangesScreen } from "@/components/features/changes";
import { CardSkeleton, SplitSkeleton } from "@/components/shared/Skeletons";

function ChangesFallback() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <SplitSkeleton />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<ChangesFallback />}>
      <ChangesScreen />
    </Suspense>
  );
}
