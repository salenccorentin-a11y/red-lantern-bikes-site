import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Monitoring } from "@/components/Monitoring";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { RootDocument, rootMetadata, rootViewport } from "@/components/RootDocument";
import { langOrEnglish, langParams } from "@/i18n/route";
import styles from "../(en)/(public)/layout.module.css";

// Root layout of the French (/fr) and Korean (/ko) versions of the key pages
// and the booking steps. Same header, footer and look as the English site;
// being a root layout, it sets <html lang>, which tells browsers, screen
// readers, translation prompts and search engines the page's language.

// The language is read from the address before anything is drawn. Only /fr
// and /ko are built. This segment also catches unknown addresses (/nope is
// lang "nope"): the layout then draws in English and the page below returns
// the 404 (langFrom), shown by ./not-found.tsx inside the header and footer.
export const instant = false;
export const generateStaticParams = langParams;
export const metadata = rootMetadata;
export const viewport = rootViewport;

export default async function LanguageLayout({ children, params }: LayoutProps<"/[lang]">) {
  const lang = await langOrEnglish(params);
  return (
    <RootDocument lang={lang}>
      <SiteHeader lang={lang} />
      <div id="main" className={styles.content}>
        <MotionProvider>{children}</MotionProvider>
      </div>
      <SiteFooter lang={lang} />
      <FloatingWhatsApp lang={lang} />
      <Monitoring />
    </RootDocument>
  );
}
