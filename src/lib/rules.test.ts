import { beforeEach, describe, expect, it } from "vitest";

import { api } from "@/data/api";
import { createSeedData, IDS } from "@/data/seed";
import { formatINRCompact } from "@/lib/format";
import {
  acknowledgePayment,
  actorFromUser,
  approveChangeRequest,
  approveUpdate,
  can,
  delayDays,
  estimatedCost,
  impactPreview,
  projectHealth,
  projectProgress,
  remaining,
  requestUpdateChanges,
  summarizeProject,
  totalPaid,
} from "@/lib/rules";
import { useDb } from "@/store/db";
import type { Project, User } from "@/types";

function project(data: ReturnType<typeof createSeedData>, id: string): Project {
  const found = data.projects.find((item) => item.id === id);
  if (!found) throw new Error(id);
  return found;
}

function user(data: ReturnType<typeof createSeedData>, id: string): User {
  const found = data.users.find((item) => item.id === id);
  if (!found) throw new Error(id);
  return found;
}

describe("health", () => {
  const data = createSeedData();

  it("marks Koramangala as Needs Attention because a change request is pending", () => {
    const result = projectHealth({
      project: project(data, IDS.koramangala),
      updates: data.updates,
      payments: data.payments,
      changeRequests: data.changeRequests,
    });
    expect(result.health).toBe("needs_attention");
    expect(result.reasons).toContain("1 change request pending");
  });

  it("marks Whitefield as At Risk for delay, a stale update, and a dispute", () => {
    const result = projectHealth({
      project: project(data, IDS.whitefield),
      updates: data.updates,
      payments: data.payments,
      changeRequests: data.changeRequests,
    });
    expect(result.health).toBe("at_risk");
    expect(result.reasons).toEqual([
      "Projected 18 days late",
      "No update in 11 days",
      "Payment disputed",
    ]);
  });

  it("marks Indiranagar as On Track", () => {
    const result = projectHealth({
      project: project(data, IDS.indiranagar),
      updates: data.updates,
      payments: data.payments,
      changeRequests: data.changeRequests,
    });
    expect(result.health).toBe("on_track");
    expect(result.reasons).toEqual([]);
  });
});

describe("budget", () => {
  const data = createSeedData();
  const hero = project(data, IDS.koramangala);
  const payments = data.payments.filter((item) => item.projectId === hero.id);

  it("keeps seeded approvals inside the base budget", () => {
    expect(estimatedCost(hero, data.changeRequests)).toBe(1_790_000);
    expect(totalPaid(payments)).toBe(900_000);
    expect(remaining(hero, data.changeRequests, data.payments)).toBe(890_000);
    expect(delayDays(hero, data.changeRequests)).toBe(0);
  });

  it("prices the cove-lit ceiling at ₹19.3L", () => {
    const request = data.changeRequests.find((item) => item.id === IDS.cove);
    if (!request) throw new Error("missing cove request");
    const preview = impactPreview(hero, data.changeRequests, request);
    expect(preview.costAfter).toBe(1_930_000);
    expect(preview.endBefore).toBe("2026-12-15");
    expect(preview.endAfter).toBe("2026-12-20");
    expect(formatINRCompact(preview.costAfter)).toBe("₹19.3L");

    const approved = approveChangeRequest({
      request,
      actor: actorFromUser(user(data, IDS.ananya)),
    });
    if (!approved.ok) throw new Error(approved.reason);
    const next = data.changeRequests.map((item) => (item.id === request.id ? approved.value.request : item));
    expect(estimatedCost(hero, next)).toBe(1_930_000);
    expect(remaining(hero, next, data.payments)).toBe(1_030_000);
    expect(delayDays(hero, next)).toBe(5);
  });

  it("does not let the designer approve a request they raised", () => {
    const request = data.changeRequests.find((item) => item.id === IDS.cove);
    if (!request) throw new Error("missing cove request");
    const result = approveChangeRequest({
      request,
      actor: actorFromUser(user(data, IDS.rohan)),
    });
    expect(result.ok).toBe(false);
  });
});

describe("progress", () => {
  const data = createSeedData();

  it("weights Koramangala rooms by budget allocation", () => {
    const rooms = data.rooms.filter((room) => room.projectId === IDS.koramangala);
    expect(projectProgress(rooms)).toBeCloseTo(46.0335, 2);
  });

  it("keeps Indiranagar near 25%", () => {
    const summary = summarizeProject({
      project: project(data, IDS.indiranagar),
      rooms: data.rooms,
      updates: data.updates,
      payments: data.payments,
      changeRequests: data.changeRequests,
    });
    expect(summary.progress).toBe(25);
  });

  it("moves room progress only when an update is approved", () => {
    const data = createSeedData();
    const update = data.updates.find((item) => item.id === "upd_kora_kitchen_cabinets");
    const room = data.rooms.find((item) => item.id === IDS.kitchen);
    if (!update || !room) throw new Error("missing kitchen update");
    expect(room.progress).toBe(50);
    const blocked = requestUpdateChanges({
      update,
      actor: actorFromUser(user(data, IDS.ananya)),
      comment: "Show the hinge side",
    });
    expect(blocked.ok).toBe(true);
    expect(room.progress).toBe(50);
    const approved = approveUpdate({
      update,
      room,
      actor: actorFromUser(user(data, IDS.ananya)),
    });
    if (!approved.ok) throw new Error(approved.reason);
    expect(approved.value.room.progress).toBe(65);
    expect(approved.value.update.status).toBe("approved");
  });
});

describe("permissions", () => {
  const data = createSeedData();
  const ananya = actorFromUser(user(data, IDS.ananya));
  const rohan = actorFromUser(user(data, IDS.rohan));
  const meera = actorFromUser(user(data, IDS.meera));
  const familyApprover = { id: "usr_family", role: "homeowner" as const, access: "approve" as const };

  it("follows the homeowner, family, and designer matrix", () => {
    expect(can(ananya, "see_project").allowed).toBe(true);
    expect(can(ananya, "create_project").allowed).toBe(false);
    expect(can(ananya, "post_update").allowed).toBe(false);
    expect(can(ananya, "decide_update").allowed).toBe(true);
    expect(can(ananya, "record_payment").allowed).toBe(false);
    expect(can(ananya, "decide_payment").allowed).toBe(true);
    expect(can(ananya, "raise_change_request").allowed).toBe(true);
    expect(can(ananya, "edit_room").allowed).toBe(false);
    expect(can(ananya, "invite_member").allowed).toBe(true);

    expect(can(meera, "see_project").allowed).toBe(true);
    expect(can(meera, "decide_update").reason).toBe("You have view-only access");
    expect(can(meera, "decide_payment").allowed).toBe(false);
    expect(can(meera, "raise_change_request").allowed).toBe(false);
    expect(can(meera, "invite_member").allowed).toBe(false);

    expect(can(familyApprover, "decide_update").allowed).toBe(true);
    expect(can(familyApprover, "decide_payment").allowed).toBe(true);
    expect(can(familyApprover, "raise_change_request").allowed).toBe(true);
    expect(can(familyApprover, "post_update").allowed).toBe(false);
    expect(can(familyApprover, "invite_member").allowed).toBe(false);
    expect(
      can(familyApprover, "decide_change_request", { raisedByRole: "designer", raisedById: IDS.rohan }).allowed,
    ).toBe(true);

    expect(can(rohan, "create_project").allowed).toBe(true);
    expect(can(rohan, "post_update").allowed).toBe(true);
    expect(can(rohan, "record_payment").allowed).toBe(true);
    expect(can(rohan, "edit_room").allowed).toBe(true);
    expect(can(rohan, "decide_update").reason).toBe("Only the homeowner can approve");
    expect(can(rohan, "decide_payment").allowed).toBe(false);
    expect(can(rohan, "invite_member").allowed).toBe(true);
    expect(
      can(rohan, "decide_change_request", { raisedByRole: "homeowner", raisedById: IDS.ananya }).allowed,
    ).toBe(true);
    expect(
      can(rohan, "decide_change_request", { raisedByRole: "designer", raisedById: IDS.rohan }).reason,
    ).toBe("You can't decide a request you raised");
    expect(
      can(ananya, "decide_change_request", { raisedByRole: "designer", raisedById: IDS.rohan }).allowed,
    ).toBe(true);
    expect(
      can(ananya, "decide_change_request", { raisedByRole: "homeowner", raisedById: IDS.ananya }).allowed,
    ).toBe(false);
  });
});

describe("payments", () => {
  it("counts a payment only after it is acknowledged", () => {
    const data = createSeedData();
    const payment = data.payments.find((item) => item.id === IDS.payAwaiting);
    if (!payment) throw new Error("missing payment");
    const before = totalPaid(data.payments.filter((item) => item.projectId === IDS.koramangala));
    const result = acknowledgePayment({
      payment,
      actor: actorFromUser(user(data, IDS.ananya)),
      designerId: IDS.rohan,
    });
    if (!result.ok) throw new Error(result.reason);
    expect(result.value.payment.status).toBe("acknowledged");
    expect(result.value.payment.audit.at(-1)?.action).toBe("acknowledged");
    expect(before + payment.amount).toBe(1_150_000);
    expect(totalPaid([result.value.payment])).toBe(payment.amount);
  });
});

describe("mock api", () => {
  beforeEach(() => {
    localStorage.clear();
    useDb.getState().setLatencyEnabled(false);
    useDb.getState().reset();
  });

  it("resets an approved change request back to the seed", async () => {
    const approved = await api.approveChangeRequest(IDS.ananya, IDS.cove);
    expect(approved.status).toBe("approved");
    expect(formatINRCompact(1_930_000)).toBe("₹19.3L");
    const summary = await api.projectSummary(IDS.koramangala);
    expect(summary?.estimatedCost).toBe(1_930_000);
    await api.reset();
    const restored = useDb.getState().changeRequests.find((item) => item.id === IDS.cove);
    expect(restored?.status).toBe("pending");
    const again = await api.projectSummary(IDS.koramangala);
    expect(again?.estimatedCost).toBe(1_790_000);
    expect(again?.health).toBe("needs_attention");
  });
});
