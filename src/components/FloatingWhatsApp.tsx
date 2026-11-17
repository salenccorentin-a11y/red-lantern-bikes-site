import { whatsappLink } from "@/content/business";
import { getMessages } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { ChatIcon } from "./WhatsAppLink";
import styles from "./FloatingWhatsApp.module.css";

// A WhatsApp button that stays in the bottom corner of every public page:
// most customers are travellers who'd rather message than fill in a form.
// On phones it's a round icon (sitting above the price bar on bike and
// booking pages); on wider screens it also says what it does.
// Renders nothing if the WhatsApp number isn't set (src/content/business.ts).

export function FloatingWhatsApp({ lang }: { lang: Locale }) {
  const m = getMessages(lang);
  const href = whatsappLink(m.contact.whatsappMessage);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={styles.float}
      data-umami-event="WhatsApp floating button"
    >
      <ChatIcon size={30} />
      <span className={styles.label}>{m.common.chatWhatsApp}</span>
    </a>
  );
}
