import { Suspense } from "react";

import { RoomsScreen } from "@/components/features/rooms";
import { SplitSkeleton } from "@/components/shared/Skeletons";

export default function Page() {
  return (
    <Suspense fallback={<SplitSkeleton />}>
      <RoomsScreen />
    </Suspense>
  );
}
