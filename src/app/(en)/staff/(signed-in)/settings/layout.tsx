import Link from "next/link";
import styles from "../../staff.module.css";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1>Settings</h1>
      <nav className={styles.subnav} aria-label="Settings">
        <Link href="/staff/settings">Business and prices</Link>
        <Link href="/staff/settings/add-ons">Add-ons</Link>
        <Link href="/staff/settings/bikes">Bikes and plates</Link>
        <Link href="/staff/settings/staff">Staff</Link>
      </nav>
      {children}
    </>
  );
}
