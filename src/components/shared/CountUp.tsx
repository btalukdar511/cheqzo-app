"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

interface CountUpProps {
  value: number;
  format?: (value: number) => string;
  className?: string;
}

export function CountUp({ value, format = (next) => Math.round(next).toLocaleString("en-IN"), className }: CountUpProps) {
  const reduced = useReducedMotion();
  const from = useRef(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const controls = animate(from.current, value, {
      duration: 0.6,
      onUpdate: (latest) => {
        from.current = latest;
        setDisplay(latest);
      },
    });
    return () => controls.stop();
  }, [value, reduced]);

  const shown = reduced ? value : display;
  return <span className={cn("tabular-nums", className)}>{format(shown)}</span>;
}
