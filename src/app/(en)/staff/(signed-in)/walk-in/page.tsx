import { Suspense } from "react";
import { todayInSaigon } from "@/lib/dates";
import { db } from "@/lib/db";
import { loadCatalog } from "@/server/catalog";
import { requireStaff } from "@/server/staff-session";
import { WalkInForm } from "./WalkInForm";
import styles from "../../staff.module.css";

export default function WalkInPage() {
  return (
    <>
      <h1>New walk-in booking</h1>
      <Suspense fallback={<p className={styles.muted}>Loading bikes…</p>}>
        <Loader />
      </Suspense>
    </>
  );
}

async function Loader() {
  await requireStaff();
  const [catalog, bikes] = await Promise.all([
    loadCatalog(db),
    db.bike.findMany({
      where: { status: "ACTIVE" },
      orderBy: { plate: "asc" },
      select: { id: true, plate: true, modelId: true },
    }),
  ]);
  return <WalkInForm catalog={catalog} bikes={bikes} today={todayInSaigon()} />;
}
