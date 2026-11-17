import type { Metadata } from "next";
import styles from "./staff.module.css";

export const metadata: Metadata = {
  title: "Staff | Red Lantern Bikes",
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: LayoutProps<"/staff">) {
  return <div className={styles.shell}>{children}</div>;
}
