import { describe, expect, it } from "vitest";

import { createSeedData, IDS } from "@/data/seed";
import {
  budgetSlices,
  groupUpdates,
  nextPaymentStage,
  overviewActions,
  queryUpdates,
  recentActivity,
  updateGroupLabel,
} from "@/lib/project-view";
import { actorFromUser, addUpdateComment, postUpdate, projectProgress, rejectUpdate, requestUpdateChanges } from "@/lib/rules";
import type { User } from "@/types";

function user(id: string): User {
  const found = createSeedData().users.find((item) => item.id === id);
  if (!found) throw new Error(id);
  return found;
}

function koramangala() {
  const data = createSeedData();
  const project = data.projects.find((item) => item.id === IDS.koramangala);
  if (!project) throw new Error("missing project");
  return {
    data,
    project,
    rooms: data.rooms.filter((item) => item.projectId === IDS.koramangala),
    updates: data.updates.filter((item) => item.projectId === IDS.koramangala),
    payments: data.payments.filter((item) => item.projectId === IDS.koramangala),
    changeRequests: data.changeRequests.filter((item) => item.projectId === IDS.koramangala),
  };
}

describe("update feed", () => {
  const { updates } = koramangala();

  it("filters by status and room, then sorts", () => {
    const pending = queryUpdates(updates, { status: "pending", roomId: null, sort: "newest" });
    expect(pending.map((item) => item.id)).toEqual(["upd_kora_kitchen_cabinets", "upd_kora_living_frame"]);
    const kitchen = queryUpdates(updates, { status: "all", roomId: IDS.kitchen, sort: "oldest" });
    expect(kitchen.map((item) => item.title)).toEqual(["Plumbing rough-in done", "Base and wall cabinets installed"]);
  });

  it("groups Koramangala dates the way the feed reads", () => {
    const newest = queryUpdates(updates, { status: "all", roomId: null, sort: "newest" });
    expect(updateGroupLabel(newest[0]?.createdAt ?? "")).toBe("Yesterday");
    expect(groupUpdates(newest).map((group) => group.label)).toEqual([
      "Yesterday",
      "This week",
      "Last week",
      "September",
    ]);
  });
});

describe("overview figures", () => {
  const scope = koramangala();

  it("names the stage after the latest payment", () => {
    expect(nextPaymentStage(scope.payments)).toBe("Electrical & Plumbing");
    expect(nextPaymentStage([])).toBe("Advance");
  });

  it("splits the donut so paid, awaiting, and the rest equal the estimate", () => {
    const slices = budgetSlices({ totalPaid: 900_000, awaitingAcknowledgement: 250_000, remaining: 890_000 });
    expect(slices.map((slice) => slice.amount)).toEqual([900_000, 250_000, 640_000]);
    expect(slices.reduce((total, slice) => total + slice.amount, 0)).toBe(1_790_000);
  });

  it("leads recent activity with the newest kitchen update", () => {
    const activity = recentActivity({ projectId: scope.project.id, ...scope });
    expect(activity[0]?.title).toBe("Base and wall cabinets installed");
    expect(activity).toHaveLength(8);
  });

  it("matches homeowner action counts to the sidebar badges", () => {
    const homeowner = overviewActions({ user: user(IDS.ananya), ...scope });
    expect(homeowner.badges).toEqual({ updates: 2, payments: 1, changes: 1 });
    expect(homeowner.items).toHaveLength(4);
    const designer = overviewActions({ user: user(IDS.rohan), ...scope });
    expect(designer.badges).toEqual(homeowner.badges);
    expect(designer.items.map((item) => item.label)).toEqual(["Revise Kids Bedroom update"]);
  });
});

describe("posting and decisions", () => {
  it("posts a pending update, holds progress, and notifies the homeowner", () => {
    const { rooms } = koramangala();
    const balcony = rooms.find((room) => room.id === IDS.balcony);
    if (!balcony) throw new Error("missing balcony");
    const posted = postUpdate({
      actor: actorFromUser(user(IDS.rohan)),
      room: balcony,
      homeownerId: IDS.ananya,
      title: "Railing delivered",
      description: "The railing is on site.",
      photos: [{ url: "blob:balcony", caption: "Railing", kind: "progress" }],
      proposedProgress: 10,
      notifyClient: true,
      updateId: "upd_new",
      notificationId: "nt_new",
    });
    if (!posted.ok) throw new Error(posted.reason);
    expect(posted.value.update.status).toBe("pending");
    expect(posted.value.update.previousProgress).toBe(0);
    expect(posted.value.room.progress).toBe(0);
    expect(posted.value.room.status).toBe("awaiting_approval");
    expect(posted.value.notification?.userId).toBe(IDS.ananya);
    expect(posted.value.notification?.href).toBe(`/projects/${IDS.koramangala}/updates?update=upd_new`);

    const silent = postUpdate({
      actor: actorFromUser(user(IDS.rohan)),
      room: balcony,
      homeownerId: IDS.ananya,
      title: "Railing delivered",
      description: "",
      photos: [{ url: "blob:balcony", caption: "", kind: "before" }],
      proposedProgress: 10,
      notifyClient: false,
    });
    if (!silent.ok) throw new Error(silent.reason);
    expect(silent.value.notification).toBeUndefined();
  });

  it("rejects a post that skips the rules", () => {
    const { rooms } = koramangala();
    const kitchen = rooms.find((room) => room.id === IDS.kitchen);
    if (!kitchen) throw new Error("missing kitchen");
    expect(
      postUpdate({
        actor: actorFromUser(user(IDS.ananya)),
        room: kitchen,
        homeownerId: IDS.ananya,
        title: "Nope",
        description: "",
        photos: [{ url: "https://example.com/a.jpg", caption: "", kind: "progress" }],
        proposedProgress: 80,
        notifyClient: true,
      }).ok,
    ).toBe(false);
    expect(
      postUpdate({
        actor: actorFromUser(user(IDS.rohan)),
        room: kitchen,
        homeownerId: IDS.ananya,
        title: "Too low",
        description: "",
        photos: [{ url: "https://example.com/a.jpg", caption: "", kind: "progress" }],
        proposedProgress: 40,
        notifyClient: true,
      }).ok,
    ).toBe(false);
    expect(
      postUpdate({
        actor: actorFromUser(user(IDS.rohan)),
        room: kitchen,
        homeownerId: IDS.ananya,
        title: "No photo",
        description: "",
        photos: [],
        proposedProgress: 70,
        notifyClient: true,
      }).ok,
    ).toBe(false);
  });

  it("blocks an empty change request, an empty rejection, and an empty comment", () => {
    const data = createSeedData();
    const update = data.updates.find((item) => item.id === "upd_kora_living_frame");
    const kitchen = data.updates.find((item) => item.id === "upd_kora_kitchen_cabinets");
    const room = data.rooms.find((item) => item.id === IDS.kitchen);
    if (!update || !kitchen || !room) throw new Error("missing update");
    const ananya = actorFromUser(user(IDS.ananya));
    expect(requestUpdateChanges({ update, actor: ananya, comment: "  " }).ok).toBe(false);
    expect(rejectUpdate({ update, actor: ananya, reason: " " }).ok).toBe(false);
    expect(addUpdateComment({ update, actor: ananya, text: " " }).ok).toBe(false);
    const comment = addUpdateComment({ update, actor: actorFromUser(user(IDS.rohan)), text: "Added a closer photo" });
    if (!comment.ok) throw new Error(comment.reason);
    expect(comment.value.update.thread).toHaveLength(1);
    expect(room.progress).toBe(50);
    const nextRooms = data.rooms.map((item) => (item.id === room.id ? { ...item, progress: kitchen.proposedProgress } : item));
    const weighted = projectProgress(nextRooms.filter((item) => item.projectId === IDS.koramangala));
    expect(weighted).toBeCloseTo(50.06, 2);
  });
});
