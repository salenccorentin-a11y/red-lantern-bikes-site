import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { MotionProvider } from "@/components/motion/MotionProvider";
import styles from "./layout.module.css";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div id="main" className={styles.content}>
        <MotionProvider>{children}</MotionProvider>
      </div>
      <SiteFooter />
    </>
  );
}
