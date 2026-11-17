import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Monitoring } from "@/components/Monitoring";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { langFrom, langParams } from "@/i18n/route";
import styles from "../(public)/layout.module.css";

// French (/fr) and Korean (/ko) versions of the key pages and the booking
// steps. Same layout as the English site; the lang attribute tells browsers,
// screen readers and search engines which language the page is in.

// The language is read from the address before anything is drawn, so that an
// unknown one (/xx/...) is a real "page not found". Only /fr and /ko are built.
export const instant = false;
export const generateStaticParams = langParams;

export default async function LanguageLayout({ children, params }: LayoutProps<"/[lang]">) {
  const lang = await langFrom(params);
  return (
    <div lang={lang} style={{ display: "contents" }}>
      <SiteHeader lang={lang} />
      <div id="main" className={styles.content}>
        <MotionProvider>{children}</MotionProvider>
      </div>
      <SiteFooter lang={lang} />
      <FloatingWhatsApp lang={lang} />
      <Monitoring />
    </div>
  );
}
