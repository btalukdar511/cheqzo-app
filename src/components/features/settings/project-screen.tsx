"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { ProjectFields, type ProjectFormState } from "@/components/features/settings/project-fields";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Button } from "@/components/ui/button";
import { api } from "@/data/api";
import { useCurrentUser, useLiveDb, useStoresReady } from "@/data/live";
import { parseInrInput, formatInrInput } from "@/lib/financials";
import { actorFromUser, can, summarizeProject } from "@/lib/rules";
import type { Project } from "@/types";

function fromProject(project: Project): ProjectFormState {
  return {
    name: project.name,
    area: project.location.area,
    city: project.location.city,
    coverImage: project.coverImage,
    originalEndDate: project.originalEndDate,
    budget: formatInrInput(String(project.baseBudget)),
  };
}

export function ProjectSettingsScreen() {
  const route = useParams<{ projectId: string }>();
  const ready = useStoresReady();
  const user = useCurrentUser();
  const db = useLiveDb();
  const [formProjectId, setFormProjectId] = useState("");
  const [form, setForm] = useState<ProjectFormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Project["status"] | null>(null);

  if (!ready || !user) return <div className="h-64 animate-pulse rounded-xl bg-secondary" aria-busy="true" />;
  const project = db.projects.find((item) => item.id === route.projectId);
  if (!project) return null;
  if (formProjectId !== project.id || !form) {
    setFormProjectId(project.id);
    setForm(fromProject(project));
  }
  if (!form) return null;

  const signedIn = user;
  const currentProject = project;
  const actor = actorFromUser(signedIn);
  const permission = can(actor, "edit_project");
  const summary = summarizeProject({
    project: currentProject,
    rooms: db.rooms,
    updates: db.updates,
    payments: db.payments,
    changeRequests: db.changeRequests,
  });

  function patch(next: Partial<ProjectFormState>) {
    setForm((current) => (current ? { ...current, ...next } : current));
  }

  async function save(status: Project["status"] = currentProject.status) {
    if (!form) return;
    setBusy(true);
    try {
      await api.updateProjectSettings(signedIn.id, currentProject.id, {
        name: form.name,
        area: form.area,
        city: form.city,
        coverImage: form.coverImage,
        originalEndDate: form.originalEndDate,
        baseBudget: parseInrInput(form.budget),
        status,
      });
      toast.success(status === currentProject.status ? "Project settings saved" : "Project status updated");
      setPendingStatus(null);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save the project");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-[28px] leading-9 font-semibold text-foreground">Project settings</h1>
      {permission.allowed ? null : (
        <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-foreground">{permission.reason}</p>
      )}
      <ProjectFields
        form={form}
        editable={permission.allowed}
        projectedEnd={summary.projectedEndDate}
        estimatedCost={summary.estimatedCost}
        onChange={patch}
      />
      {permission.allowed ? (
        <Button type="button" onClick={() => void save()} disabled={busy}>
          Save changes
        </Button>
      ) : null}
      <section className="space-y-3 rounded-xl border border-danger/30 bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Danger zone</h2>
        <div className="flex flex-wrap gap-2">
          <StatusButton
            allowed={permission.allowed && project.status !== "on_hold"}
            reason={permission.allowed ? "This project is already on hold" : permission.reason}
            label="Mark on hold"
            onClick={() => setPendingStatus("on_hold")}
          />
          <StatusButton
            allowed={permission.allowed && project.status !== "completed"}
            reason={permission.allowed ? "This project is already complete" : permission.reason}
            label="Mark complete"
            onClick={() => setPendingStatus("completed")}
          />
          {project.status !== "active" ? (
            <StatusButton allowed={permission.allowed} reason={permission.reason} label="Resume project" onClick={() => setPendingStatus("active")} />
          ) : null}
        </div>
      </section>
      <ConfirmDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => {
          if (!open) setPendingStatus(null);
        }}
        title="Update project status?"
        description="This shows on the project everywhere it appears."
        confirmLabel="Update"
        onConfirm={() => {
          if (pendingStatus) void save(pendingStatus);
        }}
      />
    </div>
  );
}

function StatusButton({ allowed, reason, label, onClick }: { allowed: boolean; reason: string; label: string; onClick: () => void }) {
  return (
    <RoleGuard allowed={allowed} reason={reason}>
      <Button type="button" variant="outline" onClick={onClick}>
        {label}
      </Button>
    </RoleGuard>
  );
}
