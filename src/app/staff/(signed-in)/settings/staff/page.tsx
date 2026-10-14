import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireOwner } from "@/server/staff-session";
import { addStaffAction, updateStaffAction } from "../actions";
import { Flash } from "../Flash";
import styles from "../../../staff.module.css";

export default function StaffSettingsPage(props: PageProps<"/staff/settings/staff">) {
  return (
    <Suspense fallback={<p className={styles.muted}>Loading staff…</p>}>
      <Flash searchParams={props.searchParams} />
      <StaffSettings />
    </Suspense>
  );
}

async function StaffSettings() {
  const me = await requireOwner();
  const staff = await db.staffUser.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });

  return (
    <>
      <section className={styles.panel}>
        <h2>Staff</h2>
        <p className={styles.muted}>
          Owners see costs and profit and can change prices and settings. Switching someone off
          signs them out everywhere at once.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Can sign in</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => {
                const formId = `staff-${s.id}`;
                return (
                  <tr key={s.id} style={{ opacity: s.active ? 1 : 0.6 }}>
                    <td>
                      {s.name}
                      {s.id === me.id && " (you)"}
                      <form id={formId} action={updateStaffAction}>
                        <input type="hidden" name="staffId" value={s.id} />
                      </form>
                    </td>
                    <td>{s.email}</td>
                    <td>
                      <select
                        form={formId}
                        name="role"
                        defaultValue={s.role}
                        className={styles.cellInput}
                      >
                        <option value="STAFF">Staff</option>
                        <option value="OWNER">Owner</option>
                      </select>
                    </td>
                    <td>
                      <input
                        form={formId}
                        type="checkbox"
                        name="active"
                        defaultChecked={s.active}
                      />
                    </td>
                    <td>
                      <button form={formId} className={styles.secondary}>
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>Add staff</h2>
        <form
          action={addStaffAction}
          className={`${styles.form} ${styles.row}`}
          style={{ alignItems: "end" }}
        >
          <label className={styles.field}>
            <span>Name</span>
            <input name="name" required maxLength={80} />
          </label>
          <label className={styles.field}>
            <span>Email</span>
            <input name="email" type="email" required />
          </label>
          <label className={styles.field}>
            <span>Role</span>
            <select name="role" defaultValue="STAFF">
              <option value="STAFF">Staff</option>
              <option value="OWNER">Owner</option>
            </select>
          </label>
          <div>
            <button className={styles.primary}>Add</button>
          </div>
        </form>
      </section>
    </>
  );
}
