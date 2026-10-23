import { TeamScreen } from "@/components/features/team";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <TeamScreen />
    </Suspense>
  );
}
