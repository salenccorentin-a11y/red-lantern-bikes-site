import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "@/content/faq";
import styles from "../content.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/faq" },
  title: "FAQ: licence, deposit, one-way rentals | Red Lantern Bikes",
  description:
    "Which licence you need to ride in Vietnam, how the deposit works, what's included, one-way rentals to Hanoi and Da Nang, breakdowns and cancellations.",
};

export default function FaqPage() {
  return (
    <main className={styles.page}>
      <h1>Questions and answers</h1>
      <div className={`${styles.prose} ${styles.faq}`}>
        {FAQ.map((item) => (
          <details key={item.id} id={item.id}>
            <summary>{item.question}</summary>
            {item.answer.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </details>
        ))}
      </div>
      <p>
        Something else? <Link href="/contact">Send us a message</Link>.
      </p>
      <script
        type="application/ld+json"
        // Lets search engines show these answers directly in results.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer.join(" ") },
            })),
          }).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
