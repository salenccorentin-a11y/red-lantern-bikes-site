import { whatsappLink } from "@/content/business";
import ui from "./ui.module.css";
import styles from "./WhatsAppLink.module.css";

// "Ask on WhatsApp": opens a chat with the shop, with a first message already
// written (e.g. which bike). Most customers are travellers who use WhatsApp.
// Renders nothing if the WhatsApp number isn't set (src/content/business.ts).
//
// variant "button": an outlined button for light backgrounds (bike pages).
// variant "link": a text link for dark backgrounds (the booking summary).

export function WhatsAppLink({
  message,
  label = "Ask on WhatsApp",
  variant = "button",
}: {
  message: string;
  label?: string;
  variant?: "button" | "link";
}) {
  const href = whatsappLink(message);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={variant === "button" ? `${ui.ghostLight} ${styles.button}` : styles.link}
      data-umami-event="WhatsApp"
    >
      <ChatIcon />
      {label}
    </a>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className={styles.icon}>
      <path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5Z" />
      <path
        className={styles.phone}
        d="M9.1 7.6c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.5.7c-.1.2-.2.3 0 .6.4.7 1 1.4 1.7 1.9.4.3.8.5 1.2.7.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.4.4 0 .5-.1 1.1-.5 1.5-.5.5-1.3.8-2 .8-1.4-.1-3-1-4.1-2.1-1.2-1.1-2.2-2.6-2.4-4 0-.7.2-1.4.7-1.9"
      />
    </svg>
  );
}
