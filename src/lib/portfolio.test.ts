import { describe, expect, it } from "vitest";

import { api } from "@/data/api";
import { createSeedData, IDS } from "@/data/seed";
import { assemblePortfolio, portfolioKpis, queryPortfolio } from "@/lib/portfolio";
import { actorFromUser, allocationStatus, buildProject, type ProjectCreateInput } from "@/lib/rules";
import { useDb } from "@/store/db";
import type { User } from "@/types";

function user(id: string): User {
  const found = createSeedData().users.find((item) => item.id === id);
  if (!found) throw new Error(id);
  return found;
}

function portfolioFor(id: string) {
  const data = createSeedData();
  return assemblePortfolio({
    user: user(id),
    projects: data.projects,
    rooms: data.rooms,
    updates: data.updates,
    payments: data.payments,
    changeRequests: data.changeRequests,
    teamMembers: data.teamMembers,
    users: data.users,
  });
}

function draft(overrides: Partial<ProjectCreateInput> = {}): ProjectCreateInput {
  return {
    name: "Jayanagar House",
    propertyType: "Independent House",
    bhk: "3 BHK",
    areaSqft: 1800,
    city: "Bengaluru",
    locality: "Jayanagar",
    coverImage: "https://picsum.photos/seed/cheqzo-cover-courtyard/1200/800",
    clientName: "Ananya Rao",
    clientPhone: "9845011101",
    clientEmail: "ananya@example.com",
    inviteNow: true,
    rooms: [
      { name: "Living", type: "living", areaSqft: 300, budgetAllocation: 400000 },
      { name: "Kitchen", type: "kitchen", areaSqft: 120, budgetAllocation: 500000 },
    ],
    budget: 1200000,
    startDate: "2026-11-01",
    originalEndDate: "2027-04-01",
    ...overrides,
  };
}

describe("portfolio", () => {
  it("gives the homeowner two projects and the designer three", () => {
    expect(portfolioFor(IDS.ananya).map((item) => item.project.name)).toEqual([
      "Koramangala Apartment",
      "Whitefield Villa",
    ]);
    expect(portfolioFor(IDS.rohan)).toHaveLength(3);
  });

  it("rolls homeowner and designer KPIs up from the same projects", () => {
    const homeowner = portfolioKpis(portfolioFor(IDS.ananya));
    expect(homeowner.activeProjects).toBe(2);
    expect(homeowner.totalBudget).toBe(6_590_000);
    expect(homeowner.totalPaid).toBe(2_370_000);
    expect(homeowner.actionItems).toBe(4);

    const designer = portfolioKpis(portfolioFor(IDS.rohan));
    expect(designer.activeProjects).toBe(3);
    expect(designer.pendingApprovals).toBe(2);
    expect(designer.awaitingAcknowledgement).toBe(250_000);
    expect(designer.projectsAtRisk).toBe(1);
  });

  it("filters and sorts together, and links the Koramangala actions", () => {
    const homeowner = portfolioFor(IDS.ananya);
    const attention = queryPortfolio(homeowner, { search: "bengaluru", health: "needs_attention", sort: "health" });
    expect(attention.map((item) => item.project.id)).toEqual([IDS.koramangala]);
    expect(attention[0]?.pendingUpdates).toBe(2);

    const byHealth = queryPortfolio(homeowner, { search: "", health: "all", sort: "health" });
    expect(byHealth.map((item) => item.project.id)).toEqual([IDS.whitefield, IDS.koramangala]);

    const hero = homeowner.find((item) => item.project.id === IDS.koramangala);
    expect(hero?.actions.slice(0, 3).map((item) => item.label)).toEqual([
      "Approve Kitchen update",
      "Approve Living Room update",
      "Acknowledge ₹2.5L payment",
    ]);
    expect(hero?.actions[0]?.href).toBe(`/projects/${IDS.koramangala}/updates`);
    expect(hero?.actions[2]?.href).toBe(`/projects/${IDS.koramangala}/financials?payment=${IDS.payAwaiting}`);
    expect(hero?.latestUpdate?.title).toBe("Base and wall cabinets installed");
  });

  it("warns when room allocations do not match the budget", () => {
    expect(allocationStatus([400000, 500000], 1_200_000).matches).toBe(false);
    expect(allocationStatus([400000, 500000], 1_200_000).remaining).toBe(300_000);
    expect(allocationStatus([400000], 0).budgetSet).toBe(false);
    expect(allocationStatus([900000], 900_000).matches).toBe(true);
  });
});

describe("create project", () => {
  const data = createSeedData();

  it("builds a project for an existing homeowner and rejects the homeowner role", () => {
    const created = buildProject({
      actor: actorFromUser(user(IDS.rohan)),
      designer: user(IDS.rohan),
      existingUsers: data.users,
      draft: draft(),
    });
    if (!created.ok) throw new Error(created.reason);
    expect(created.value.project.homeownerId).toBe(IDS.ananya);
    expect(created.value.user).toBeUndefined();
    expect(created.value.rooms.map((room) => room.name)).toEqual(["Living", "Kitchen"]);
    expect(created.value.rooms.every((room) => room.progress === 0 && room.status === "not_started")).toBe(true);
    expect(created.value.teamMembers.find((member) => member.role === "owner")?.status).toBe("invited");
    expect(created.value.notification?.userId).toBe(IDS.ananya);
    expect(created.value.project.seedDelayDays).toBe(0);

    const denied = buildProject({
      actor: actorFromUser(user(IDS.ananya)),
      designer: user(IDS.ananya),
      existingUsers: data.users,
      draft: draft(),
    });
    expect(denied.ok).toBe(false);
  });

  it("creates a homeowner for a new number and rejects a designer number", () => {
    const created = buildProject({
      actor: actorFromUser(user(IDS.rohan)),
      designer: user(IDS.rohan),
      existingUsers: data.users,
      draft: draft({ clientName: "Leela Shah", clientPhone: "9845099909", clientEmail: "leela@example.com", inviteNow: false }),
    });
    if (!created.ok) throw new Error(created.reason);
    expect(created.value.user?.phone).toBe("9845099909");
    expect(created.value.notification).toBeUndefined();

    const rejected = buildProject({
      actor: actorFromUser(user(IDS.rohan)),
      designer: user(IDS.rohan),
      existingUsers: data.users,
      draft: draft({ clientPhone: "9845022202" }),
    });
    expect(rejected.ok).toBe(false);
  });

  it("persists a created project until demo data is reset", async () => {
    localStorage.clear();
    useDb.getState().setLatencyEnabled(false);
    useDb.getState().reset();
    const created = await api.createProject(IDS.rohan, draft({ inviteNow: false }));
    expect(useDb.getState().projects.some((project) => project.id === created.id)).toBe(true);
    expect(useDb.getState().rooms.filter((room) => room.projectId === created.id)).toHaveLength(2);
    await api.reset();
    expect(useDb.getState().projects.some((project) => project.id === created.id)).toBe(false);
  });
});
