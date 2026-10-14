import { Suspense } from "react";
import { findTour } from "@/content/tours";
import { formatSaigonDateTime, toIsoDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { requireStaff } from "@/server/staff-session";
import { toggleHandledAction } from "./actions";
import styles from "../../staff.module.css";

const KIND: Record<string, string> = {
  TOUR: "Tour",
  REVERSE_ROUTE: "From Hanoi / Da Nang",
  GENERAL: "Question",
};

export default function EnquiriesPage(props: PageProps<"/staff/enquiries">) {
  return (
    <>
      <h1>Enquiries</h1>
      <Suspense fallback={<p className={styles.muted}>Loading enquiries…</p>}>
        <Enquiries searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Enquiries({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const { show } = await searchParams;
  const showAll = show === "all";
  const enquiries = await db.enquiry.findMany({
    where: showAll ? {} : { handledAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { handledBy: { select: { name: true } } },
  });

  return (
    <>
      <p>
        {showAll ? (
          <a href="/staff/enquiries">Show open only</a>
        ) : (
          <a href="/staff/enquiries?show=all">Show handled ones too</a>
        )}
      </p>
      {enquiries.length === 0 && <p className={styles.muted}>Nothing waiting. 🎉</p>}
      {enquiries.map((e) => (
        <article key={e.id} className={styles.panel} style={{ opacity: e.handledAt ? 0.6 : 1 }}>
          <h2>
            {e.name} <span className={styles.badge}>{KIND[e.kind]}</span>
            {e.topic && (
              <span className={styles.muted}> · {findTour(e.topic)?.name ?? e.topic}</span>
            )}
          </h2>
          <p className={styles.muted}>
            {formatSaigonDateTime(e.createdAt)} · <a href={`mailto:${e.email}`}>{e.email}</a>
            {e.phone && <> · {e.phone}</>}
            {e.preferredStart && <> · from {toIsoDate(e.preferredStart)}</>}
            {e.riders && (
              <>
                {" "}
                · {e.riders} rider{e.riders === 1 ? "" : "s"}
              </>
            )}
          </p>
          <p style={{ whiteSpace: "pre-wrap" }}>{e.message}</p>
          <form action={toggleHandledAction}>
            <input type="hidden" name="id" value={e.id} />
            <input type="hidden" name="handled" value={e.handledAt ? "no" : "yes"} />
            {e.handledAt ? (
              <span className={styles.muted}>
                Handled by {e.handledBy?.name ?? "staff"} ·{" "}
                <button className={styles.linkButton}>Reopen</button>
              </span>
            ) : (
              <button className={styles.secondary}>Mark as handled</button>
            )}
          </form>
        </article>
      ))}
    </>
  );
}
