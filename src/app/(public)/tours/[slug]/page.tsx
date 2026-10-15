import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnquiryForm } from "@/components/EnquiryForm";
import { TOURS, findTour } from "@/content/tours";
import styles from "../../content.module.css";

// Tours are written in src/content/tours.ts, so every tour page is built
// ahead of time. The page reads the tour from the URL before rendering
// (rather than streaming it) so that unknown tours get a real 404.
export const instant = false;

export function generateStaticParams() {
  return TOURS.map((tour) => ({ slug: tour.slug }));
}

export async function generateMetadata(props: PageProps<"/tours/[slug]">): Promise<Metadata> {
  const tour = findTour((await props.params).slug);
  if (!tour) return {};
  return {
    title: `${tour.name} motorbike tour | Red Lantern Bikes`,
    description: tour.summary,
    alternates: { canonical: `/tours/${tour.slug}` },
  };
}

export default async function TourPage(props: PageProps<"/tours/[slug]">) {
  const tour = findTour((await props.params).slug);
  if (!tour) notFound();

  const facts: [string, string | null][] = [
    ["Route", tour.route],
    ["Duration", tour.duration],
    ["Group", tour.groupSize],
    ["Price", tour.priceFrom],
  ];

  return (
    <main className={styles.page}>
      <p>
        <Link href="/tours">← All tours</Link>
      </p>
      <h1>{tour.name}</h1>
      <p className={styles.lead}>{tour.summary}</p>

      <dl className={styles.facts}>
        {facts
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>

      <div className={styles.prose}>
        {tour.description.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {tour.highlights.length > 0 && (
          <>
            <h2>Highlights</h2>
            <ul>
              {tour.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <h2 id="enquire">Ask about this tour</h2>
      <p>Tell us your dates, how many riders, and how much riding experience you have.</p>
      <EnquiryForm
        kind="TOUR"
        topic={tour.slug}
        tripDetails
        messagePlaceholder="e.g. Two of us, early December, about a week. One has never ridden a manual."
      />
    </main>
  );
}
