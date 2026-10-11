import { expect, it } from "vitest";
import { REFERENCE_PATTERN, generateReference } from "@/lib/reference";

it("generates references like RLB-482913", () => {
  for (let i = 0; i < 1000; i++) {
    expect(generateReference()).toMatch(REFERENCE_PATTERN);
  }
});
