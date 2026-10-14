import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import styles from "../staff.module.css";

export default function StaffLoginPage(props: PageProps<"/staff/login">) {
  return (
    <main className={styles.narrow}>
      <h1>Staff sign-in</h1>
      <Suspense>
        <ExpiredNotice searchParams={props.searchParams} />
      </Suspense>
      <LoginForm />
    </main>
  );
}

async function ExpiredNotice({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { expired } = await searchParams;
  if (!expired) return null;
  return (
    <p className={styles.error}>
      That sign-in link has expired or was already used. Ask for a new one below.
    </p>
  );
}
