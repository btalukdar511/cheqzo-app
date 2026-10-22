"use client";

import { ProjectWizard } from "@/components/features/project-wizard";
import { NotFoundScreen } from "@/components/shell/NotFoundScreen";
import { useCurrentUser } from "@/data/live";
import { actorFromUser, can } from "@/lib/rules";

export default function NewProjectPage() {
  const user = useCurrentUser();
  if (!user) return null;
  const permission = can(actorFromUser(user), "create_project");
  if (!permission.allowed) {
    return <NotFoundScreen framed title="You don't have access" message={permission.reason} />;
  }
  return <ProjectWizard userId={user.id} />;
}
