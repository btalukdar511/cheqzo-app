"use client";

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RoleGuardProps {
  allowed: boolean;
  reason?: string;
  mode?: "hide" | "disable";
  children: ReactNode;
}

export function RoleGuard({ allowed, reason = "You can't do that", mode = "disable", children }: RoleGuardProps) {
  if (allowed) return children;
  if (mode === "hide") return null;
  if (!isValidElement(children)) return null;
  const element = children as ReactElement<{ disabled?: boolean }>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-not-allowed rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0}>
          {cloneElement(element, { disabled: true })}
        </span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}
