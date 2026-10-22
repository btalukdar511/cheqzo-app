import { z } from "zod";

import { phoneSchema } from "@/lib/auth";
import type { ProjectCreateInput, ProjectRoomDraft } from "@/lib/rules";
import type { Project, Room } from "@/types";

export const PROPERTY_TYPES = ["Apartment", "Villa", "Independent House", "Penthouse"] as const;
export const BHK_OPTIONS = ["Studio", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK"] as const;

export const COVER_PRESETS = [
  { id: "courtyard", label: "Courtyard", src: "https://picsum.photos/seed/cheqzo-cover-courtyard/1200/800" },
  { id: "living", label: "Living room", src: "https://picsum.photos/seed/cheqzo-cover-living/1200/800" },
  { id: "kitchen", label: "Kitchen", src: "https://picsum.photos/seed/cheqzo-cover-kitchen/1200/800" },
  { id: "facade", label: "Facade", src: "https://picsum.photos/seed/cheqzo-cover-facade/1200/800" },
  { id: "bedroom", label: "Bedroom", src: "https://picsum.photos/seed/cheqzo-cover-bedroom/1200/800" },
  { id: "terrace", label: "Terrace", src: "https://picsum.photos/seed/cheqzo-cover-terrace/1200/800" },
] as const;

export const ROOM_PRESETS: { name: string; type: Room["type"] }[] = [
  { name: "Living", type: "living" },
  { name: "Kitchen", type: "kitchen" },
  { name: "Master Bedroom", type: "bedroom" },
  { name: "Bedroom", type: "bedroom" },
  { name: "Bathroom", type: "bathroom" },
  { name: "Balcony", type: "balcony" },
  { name: "Dining", type: "dining" },
  { name: "Study", type: "study" },
];

export const ROOM_TYPES: { value: Room["type"]; label: string }[] = [
  { value: "living", label: "Living" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bedroom", label: "Bedroom" },
  { value: "bathroom", label: "Bathroom" },
  { value: "balcony", label: "Balcony" },
  { value: "dining", label: "Dining" },
  { value: "study", label: "Study" },
];

export interface DraftRoom {
  key: string;
  name: string;
  type: Room["type"];
  areaSqft: string;
  budgetAllocation: string;
}

export interface ProjectDraft {
  name: string;
  propertyType: Project["propertyType"] | "";
  bhk: string;
  areaSqft: string;
  city: string;
  locality: string;
  coverImage: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  inviteNow: boolean;
  rooms: DraftRoom[];
  budget: string;
  startDate: string;
  originalEndDate: string;
}

export const DRAFT_KEY = "cheqzo-project-draft";

export function emptyDraft(): ProjectDraft {
  return {
    name: "",
    propertyType: "",
    bhk: "",
    areaSqft: "",
    city: "",
    locality: "",
    coverImage: COVER_PRESETS[0].src,
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    inviteNow: false,
    rooms: [],
    budget: "",
    startDate: "",
    originalEndDate: "",
  };
}

const basicsSchema = z.object({
  name: z.string().trim().min(2, "Enter a project name"),
  propertyType: z.string().refine((value) => PROPERTY_TYPES.includes(value as (typeof PROPERTY_TYPES)[number]), "Choose a property type"),
  bhk: z.string().refine((value) => BHK_OPTIONS.includes(value as (typeof BHK_OPTIONS)[number]), "Choose a BHK"),
  areaSqft: z.coerce.number().int().positive("Enter the area in sqft"),
  city: z.string().trim().min(2, "Enter a city"),
  locality: z.string().trim().min(2, "Enter a locality"),
  coverImage: z.string().min(1, "Choose a cover image"),
});

const clientSchema = z.object({
  clientName: z.string().trim().min(2, "Enter the client's name"),
  clientPhone: phoneSchema,
  clientEmail: z.string().trim().email("Enter a valid email"),
});

const budgetSchema = z
  .object({
    budget: z.coerce.number().int().positive("Enter the estimated budget"),
    startDate: z.string().min(1, "Choose a start date"),
    originalEndDate: z.string().min(1, "Choose an end date"),
  })
  .refine((value) => value.originalEndDate > value.startDate, {
    path: ["originalEndDate"],
    message: "The end date has to be after the start",
  });

function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function validateStep(step: number, draft: ProjectDraft): Record<string, string> {
  if (step === 0) {
    const parsed = basicsSchema.safeParse(draft);
    return parsed.success ? {} : fieldErrors(parsed.error);
  }
  if (step === 1) {
    const parsed = clientSchema.safeParse(draft);
    return parsed.success ? {} : fieldErrors(parsed.error);
  }
  if (step === 2) {
    const errors: Record<string, string> = {};
    draft.rooms.forEach((room, index) => {
      if (!room.name.trim()) errors[`room-${index}-name`] = "Name the room";
      const area = Number(room.areaSqft);
      if (!Number.isInteger(area) || area <= 0) errors[`room-${index}-area`] = "Enter the area";
      const allocation = Number(room.budgetAllocation);
      if (room.budgetAllocation === "" || !Number.isInteger(allocation) || allocation < 0) {
        errors[`room-${index}-budget`] = "Enter an allocation";
      }
    });
    return errors;
  }
  const parsed = budgetSchema.safeParse(draft);
  return parsed.success ? {} : fieldErrors(parsed.error);
}

export function draftToInput(draft: ProjectDraft): ProjectCreateInput {
  const basics = basicsSchema.parse(draft);
  const client = clientSchema.parse(draft);
  const budget = budgetSchema.parse(draft);
  const rooms: ProjectRoomDraft[] = draft.rooms.map((room) => ({
    name: room.name.trim(),
    type: room.type,
    areaSqft: Number(room.areaSqft),
    budgetAllocation: Number(room.budgetAllocation),
  }));
  return {
    name: basics.name,
    propertyType: basics.propertyType as Project["propertyType"],
    bhk: basics.bhk,
    areaSqft: basics.areaSqft,
    city: basics.city,
    locality: basics.locality,
    coverImage: basics.coverImage,
    clientName: client.clientName,
    clientPhone: client.clientPhone,
    clientEmail: client.clientEmail,
    inviteNow: draft.inviteNow,
    rooms,
    budget: budget.budget,
    startDate: budget.startDate,
    originalEndDate: budget.originalEndDate,
  };
}

const draftListeners = new Set<() => void>();

export function subscribeDraft(onStoreChange: () => void): () => void {
  draftListeners.add(onStoreChange);
  return () => draftListeners.delete(onStoreChange);
}

export function readRawDraft(): string {
  return window.sessionStorage.getItem(DRAFT_KEY) ?? "";
}

export function writeDraft(draft: ProjectDraft): void {
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  draftListeners.forEach((listener) => listener());
}

export function clearDraft(): void {
  window.sessionStorage.removeItem(DRAFT_KEY);
  draftListeners.forEach((listener) => listener());
}

export function parseStored(raw: string): ProjectDraft {
  if (!raw) return emptyDraft();
  try {
    const parsed = JSON.parse(raw) as Partial<ProjectDraft>;
    return { ...emptyDraft(), ...parsed, rooms: Array.isArray(parsed.rooms) ? parsed.rooms : [] };
  } catch {
    return emptyDraft();
  }
}
