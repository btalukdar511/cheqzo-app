import { Suspense } from "react";

import { PortfolioScreen } from "@/components/features/portfolio";
import { SplitSkeleton } from "@/components/shared/Skeletons";

export default function Page() {
  return (
    <Suspense fallback={<SplitSkeleton />}>
      <PortfolioScreen />
    </Suspense>
  );
}
