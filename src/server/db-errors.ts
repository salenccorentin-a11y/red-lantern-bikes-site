// Recognise the database refusals that booking code handles on purpose.

/** Searches an error (and its nested causes and metadata) for a value. */
function errorMentions(error: unknown, needle: string): boolean {
  const seen = new Set<unknown>();
  const visit = (value: unknown): boolean => {
    if (typeof value === "string") return value.includes(needle);
    if (!value || typeof value !== "object" || seen.has(value)) return false;
    seen.add(value);
    const record = value as Record<string, unknown>;
    return ["message", "code", "meta", "cause", "driverAdapterError", "originalMessage"].some(
      (key) => visit(record[key]),
    );
  };
  return visit(error);
}

/** The bike already has a booking or block on one of these days. */
export function isOverlapViolation(error: unknown): boolean {
  return errorMentions(error, "BikeOccupancy_no_overlap");
}

/** A unique field clashed, e.g. two bookings drew the same reference. */
export function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: unknown })?.code === "P2002" || errorMentions(error, "23505");
}

/**
 * Postgres cancelled the write to resolve a deadlock or serialization clash
 * between concurrent transactions (40P01, 40001). Safe to retry.
 */
export function isTransientConflict(error: unknown): boolean {
  return (
    (error as { code?: unknown })?.code === "P2034" ||
    errorMentions(error, "40P01") ||
    errorMentions(error, "40001")
  );
}

/**
 * Runs a write, retrying after a short random pause if Postgres cancelled it to
 * break a tie with another write at the same instant. Any other error,
 * including an overlap refusal, is passed straight back to the caller.
 */
export async function withTransientRetry<T>(write: () => Promise<T>, attempts = 5): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await write();
    } catch (error) {
      if (attempt >= attempts || !isTransientConflict(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 20 + Math.random() * 80 * attempt));
    }
  }
}
