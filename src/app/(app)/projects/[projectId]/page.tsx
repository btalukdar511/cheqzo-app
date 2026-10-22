"use client";

import { useParams } from "next/navigation";

import { EmptyProjectOverview } from "@/components/features/project-wizard";
import { RoutePlaceholder } from "@/components/shell/RoutePlaceholder";
import { useLiveDb } from "@/data/live";

export default function Page() {
  const params = useParams<{ projectId: string }>();
  const db = useLiveDb();
  const project = db.projects.find((item) => item.id === params.projectId);
  if (!project) return null;
  const hasHistory =
    db.updates.some((item) => item.projectId === project.id) ||
    db.payments.some((item) => item.projectId === project.id) ||
    db.changeRequests.some((item) => item.projectId === project.id);
  if (hasHistory) return <RoutePlaceholder title="Overview" />;
  const rooms = db.rooms.filter((item) => item.projectId === project.id);
  return <EmptyProjectOverview project={project} rooms={rooms} />;
}
