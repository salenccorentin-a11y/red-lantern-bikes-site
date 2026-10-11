import { randomInt } from "node:crypto";

/**
 * Customer-facing booking reference, e.g. "RLB-482913". Six digits are easy
 * to read out and type into a bank transfer. Uniqueness is enforced by the
 * database; the caller retries on the rare clash.
 */
export function generateReference(): string {
  return `RLB-${randomInt(100_000, 1_000_000)}`;
}

export const REFERENCE_PATTERN = /^RLB-\d{6}$/;
