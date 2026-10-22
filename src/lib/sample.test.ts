import { describe, expect, it } from "vitest";

function add(left: number, right: number): number {
  return left + right;
}

describe("sample", () => {
  it("adds two numbers", () => {
    expect(add(1, 1)).toBe(2);
  });
});
