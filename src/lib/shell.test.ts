import { describe, expect, it } from "vitest";

import { createSeedData, IDS } from "@/data/seed";
import { DEMO_DESIGNER_ID, DEMO_HOMEOWNER_ID } from "@/lib/demo";
import {
  DEMO_OTP,
  authDestination,
  isAreaAllowed,
  maskPhone,
  normalizePhone,
  otpMatches,
  phoneSchema,
} from "@/lib/auth";
import { activeProjectId, commandEntries, hrefForProject, isInternalHref } from "@/lib/navigation";
import { canSeeProject, projectNavBadges, projectsForUser } from "@/lib/rules";
import type { User } from "@/types";

function user(id: string): User {
  const found = createSeedData().users.find((item) => item.id === id);
  if (!found) throw new Error(id);
  return found;
}

describe("auth", () => {
  it("accepts a 10-digit mobile number starting with 6 to 9", () => {
    expect(phoneSchema.safeParse("9845011101").success).toBe(true);
    expect(phoneSchema.safeParse("5845011101").success).toBe(false);
    expect(phoneSchema.safeParse("984501110").success).toBe(false);
  });

  it("strips a leading 91 and masks the middle digits", () => {
    expect(normalizePhone("+91 98450 11101")).toBe("9845011101");
    expect(maskPhone("9845011101")).toBe("98XXXXXX01");
  });

  it("accepts only the demo OTP", () => {
    expect(otpMatches(DEMO_OTP)).toBe(true);
    expect(otpMatches("000000")).toBe(false);
  });

  it("sends signed-out visitors to login, verified phones to role, and chosen users to the dashboard", () => {
    expect(authDestination({ phone: null, userId: null })).toBe("/login");
    expect(authDestination({ phone: "9845011101", userId: null })).toBe("/role");
    expect(authDestination({ phone: null, userId: DEMO_HOMEOWNER_ID })).toBe("/dashboard");
    expect(isAreaAllowed("app", { phone: null, userId: DEMO_HOMEOWNER_ID })).toBe(true);
    expect(isAreaAllowed("login", { phone: "9845011101", userId: null })).toBe(false);
    expect(isAreaAllowed("role", { phone: "9845011101", userId: null })).toBe(true);
  });
});

describe("project access", () => {
  const data = createSeedData();

  it("shows Ananya two projects, Rohan three, and Meera only Koramangala", () => {
    expect(projectsForUser(user(IDS.ananya), data.projects, data.teamMembers).map((item) => item.id)).toEqual([
      IDS.koramangala,
      IDS.whitefield,
    ]);
    expect(projectsForUser(user(IDS.rohan), data.projects, data.teamMembers)).toHaveLength(3);
    expect(projectsForUser(user(IDS.meera), data.projects, data.teamMembers).map((item) => item.id)).toEqual([
      IDS.koramangala,
    ]);
    expect(canSeeProject(user(IDS.ananya), IDS.indiranagar, data.projects, data.teamMembers)).toBe(false);
    expect(DEMO_HOMEOWNER_ID).toBe(IDS.ananya);
    expect(DEMO_DESIGNER_ID).toBe(IDS.rohan);
  });

  it("counts pending updates, awaiting acknowledgements, and pending change requests", () => {
    expect(projectNavBadges(IDS.koramangala, data.updates, data.payments, data.changeRequests)).toEqual({
      updates: 2,
      payments: 1,
      changes: 1,
    });
    expect(projectNavBadges(IDS.indiranagar, data.updates, data.payments, data.changeRequests)).toEqual({
      updates: 0,
      payments: 0,
      changes: 0,
    });
  });
});

describe("navigation", () => {
  const data = createSeedData();

  it("keeps the current section when the project changes", () => {
    expect(hrefForProject(`/projects/${IDS.koramangala}/financials`, IDS.whitefield)).toBe(
      `/projects/${IDS.whitefield}/financials`,
    );
    expect(hrefForProject(`/projects/${IDS.koramangala}/rooms?room=rm_kora_living`, IDS.whitefield)).toBe(
      `/projects/${IDS.whitefield}/rooms`,
    );
    expect(hrefForProject("/dashboard", IDS.whitefield)).toBe(`/projects/${IDS.whitefield}`);
    expect(activeProjectId("/projects/new")).toBeNull();
    expect(activeProjectId(`/projects/${IDS.koramangala}/updates`)).toBe(IDS.koramangala);
  });

  it("hides designer-only actions from the homeowner", () => {
    const shared = {
      projects: data.projects,
      rooms: data.rooms,
      payments: data.payments,
      changeRequests: data.changeRequests,
      teamMembers: data.teamMembers,
      activeProjectId: IDS.koramangala,
    };
    const homeowner = commandEntries({ ...shared, user: user(IDS.ananya) });
    const designer = commandEntries({ ...shared, user: user(IDS.rohan) });
    expect(homeowner.some((entry) => entry.label === "Record payment")).toBe(false);
    expect(homeowner.some((entry) => entry.label === "New project")).toBe(false);
    expect(designer.some((entry) => entry.label === "Record payment")).toBe(true);
    expect(designer.filter((entry) => entry.group === "Projects")).toHaveLength(3);
    expect(isInternalHref("/projects/prj_koramangala/updates")).toBe(true);
    expect(isInternalHref("https://example.com")).toBe(false);
    expect(isInternalHref("//evil.example")).toBe(false);
  });
});
