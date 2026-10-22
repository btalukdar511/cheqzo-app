import { z } from "zod";

export const DEMO_OTP = "123456";
export const OTP_LENGTH = 6;
export const OTP_RESEND_SECONDS = 30;
export const OTP_SEND_DELAY_MS = 600;

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number starting with 6 to 9");

export interface AuthSession {
  phone: string | null;
  userId: string | null;
}

export type AuthArea = "login" | "role" | "app";

export function normalizePhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  return digits.slice(0, 10);
}

export function maskPhone(phone: string): string {
  return `${phone.slice(0, 2)}XXXXXX${phone.slice(-2)}`;
}

export function otpMatches(code: string): boolean {
  return code === DEMO_OTP;
}

export function authDestination(session: AuthSession): "/login" | "/role" | "/dashboard" {
  if (session.userId) return "/dashboard";
  if (session.phone) return "/role";
  return "/login";
}

export function isAreaAllowed(area: AuthArea, session: AuthSession): boolean {
  const destination = authDestination(session);
  if (area === "login") return destination === "/login";
  if (area === "role") return destination === "/role";
  return destination === "/dashboard";
}
