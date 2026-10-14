import styles from "../../staff.module.css";

/** The "Saved." or error line after a settings form, from ?done= or ?error=. */
export async function Flash({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  if (typeof query.error === "string") return <p className={styles.error}>{query.error}</p>;
  if (typeof query.done === "string") return <p className={styles.success}>{query.done}</p>;
  return null;
}
