import { Suspense } from "react";

import { UpdatesScreen } from "@/components/features/updates";
import { SplitSkeleton } from "@/components/shared/Skeletons";

export default function Page() {
  return (
    <Suspense fallback={<SplitSkeleton />}>
      <UpdatesScreen />
    </Suspense>
  );
}

