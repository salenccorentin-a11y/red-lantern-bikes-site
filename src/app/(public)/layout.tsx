import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Monitoring } from "@/components/Monitoring";
import { MotionProvider } from "@/components/motion/MotionProvider";
import styles from "./layout.module.css";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader lang="en" />
      <div id="main" className={styles.content}>
        <MotionProvider>{children}</MotionProvider>
      </div>
      <SiteFooter lang="en" />
      <FloatingWhatsApp lang="en" />
      <Monitoring />
    </>
  );
}
