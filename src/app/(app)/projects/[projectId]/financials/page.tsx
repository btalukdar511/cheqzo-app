import { Suspense } from "react";

import { FinancialsScreen } from "@/components/features/financials";
import { CardSkeleton, TableSkeleton } from "@/components/shared/Skeletons";

function FinancialsFallback() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<FinancialsFallback />}>
      <FinancialsScreen />
    </Suspense>
  );
}
