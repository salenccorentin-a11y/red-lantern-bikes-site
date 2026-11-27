// Which view a staff page opens on: the address (?view=…) first, then the
// choice saved by ViewSwitch, then the page's default.

import "server-only";
import { cookies } from "next/headers";

export async function viewPreference<T extends string>(
  cookie: string,
  fromAddress: string | string[] | undefined,
  allowed: readonly T[],
  fallback: T,
): Promise<T> {
  const pick = (v: string | undefined) => (allowed.includes(v as T) ? (v as T) : undefined);
  const asked = typeof fromAddress === "string" ? pick(fromAddress) : undefined;
  return asked ?? pick((await cookies()).get(cookie)?.value) ?? fallback;
}
