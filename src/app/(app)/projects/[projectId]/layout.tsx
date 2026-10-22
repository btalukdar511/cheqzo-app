"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import { NotFoundScreen } from "@/components/shell/NotFoundScreen";
import { useCurrentUser, useLiveDb } from "@/data/live";
import { canSeeProject } from "@/lib/rules";

export default function ProjectLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const user = useCurrentUser();
  const db = useLiveDb();
  if (!user) return null;

  const known = db.projects.some((project) => project.id === projectId);
  if (!known || !canSeeProject(user, projectId, db.projects, db.teamMembers)) {
    return (
      <NotFoundScreen
        framed
        title={known ? "You don't have access" : "Project not found"}
        message={known ? "This project isn't on your account." : "That project isn't in this workspace."}
      />
    );
  }

  return children;
}
