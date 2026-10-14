"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { logIncident } from "@/server/incidents";
import { blockForMaintenance, liftBlock } from "@/server/maintenance";
import { requireStaff } from "@/server/staff-session";

function back(bikeId: string, message: Record<string, string>, anchor = ""): never {
  redirect(`/staff/bikes/${encodeURIComponent(bikeId)}?${new URLSearchParams(message)}${anchor}`);
}

export async function blockAction(form: FormData) {
  const staff = await requireStaff();
  const bikeId = String(form.get("bikeId"));
  const result = await blockForMaintenance(db, {
    bikeId,
    startDate: String(form.get("startDate")),
    endDate: String(form.get("endDate")),
    note: String(form.get("note") ?? "").trim() || undefined,
    createdById: staff.id,
  });
  if (result.ok) back(bikeId, { done: "Bike blocked for maintenance." }, "#maintenance");
  if (result.error.code === "INVALID_DATE") {
    back(bikeId, { error: "Check the dates: the end can't be before the start." }, "#maintenance");
  }
  const clashes = result.error.conflicts
    .map((c) => `${c.bookingReference ?? c.kind.toLowerCase()} (${c.startDate} to ${c.endDate})`)
    .join(", ");
  back(bikeId, { error: `The bike is busy on those days: ${clashes}.` }, "#maintenance");
}

export async function liftAction(form: FormData) {
  await requireStaff();
  const bikeId = String(form.get("bikeId"));
  await liftBlock(db, String(form.get("occupancyId")));
  back(bikeId, { done: "Maintenance block lifted. The bike can be booked again." }, "#maintenance");
}

export async function incidentAction(form: FormData) {
  const staff = await requireStaff();
  const bikeId = String(form.get("bikeId"));
  const optional = (name: string) => {
    const value = String(form.get(name) ?? "").trim();
    return value === "" ? undefined : value;
  };
  const result = await logIncident(
    db,
    {
      bikeId,
      bookingId: optional("bookingId"),
      kind: form.get("kind"),
      occurredOn: String(form.get("occurredOn")),
      description: String(form.get("description") ?? ""),
      odometerKm: optional("odometerKm"),
      partsVnd: optional("partsVnd"),
      labourVnd: optional("labourVnd"),
      otherVnd: optional("otherVnd"),
      recoveredVnd: optional("recoveredVnd"),
    },
    staff.id,
  );
  back(bikeId, result.ok ? { done: "Logged." } : { error: result.error }, "#incident");
}
