import { describe, expect, it } from "vitest";

import { DEMO_NOW } from "@/lib/demo";
import { formatDate, formatINR, formatINRCompact, relativeTime } from "@/lib/format";

describe("formatINR", () => {
  it("uses Indian grouping", () => {
    expect(formatINR(1_930_000)).toBe("₹19,30,000");
    expect(formatINR(50_000)).toBe("₹50,000");
    expect(formatINR(-55_000)).toBe("-₹55,000");
  });
});

describe("formatINRCompact", () => {
  it("switches at a lakh and a crore", () => {
    expect(formatINRCompact(1_930_000)).toBe("₹19.3L");
    expect(formatINRCompact(1_790_000)).toBe("₹17.9L");
    expect(formatINRCompact(900_000)).toBe("₹9L");
    expect(formatINRCompact(250_000)).toBe("₹2.5L");
    expect(formatINRCompact(50_000)).toBe("₹50,000");
    expect(formatINRCompact(10_000_000)).toBe("₹1Cr");
    expect(formatINRCompact(12_000_000)).toBe("₹1.2Cr");
    expect(formatINRCompact(-140_000)).toBe("-₹1.4L");
  });
});

describe("dates", () => {
  it("formats calendar dates and relative time against the demo clock", () => {
    expect(formatDate("2026-10-22T12:00:00")).toBe("22 Oct 2026");
    expect(formatDate(DEMO_NOW)).toBe("22 Oct 2026");
    expect(relativeTime("2026-10-20T12:00:00")).toBe("2 days ago");
  });
});
