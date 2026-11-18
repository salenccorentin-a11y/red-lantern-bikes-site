// A long route guide laid out as the trip itself: an overview with the whole
// route as a strip of stops, then one stop after another down a timeline
// (number, distance, stay, the riders' tips set apart), the shop's own photos
// between legs, the northern extension on a night band, and the tips and the
// booking at the end. The guide's words are the imported ones, unchanged
// (src/lib/route-guide.ts groups them; its test checks nothing is lost).

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import ui from "@/components/ui.module.css";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { parseRouteGuide, type Block, type GuideSection, type Stop } from "@/lib/route-guide";
import beach from "../../../public/photos/beach.webp";
import karstRoad from "../../../public/photos/karst-road.webp";
import mountainSunset from "../../../public/photos/mountain-sunset.webp";
import riverCrossing from "../../../public/photos/river-crossing.webp";
import styles from "./RouteGuide.module.css";

/** Posts shown with this layout. */
export const ROUTE_GUIDE_POSTS = new Set([
  "ho-chi-minh-city-to-hanoi-by-motorbike-the-complete-route-guide-2026-3",
]);

// The shop's photos between legs of the trip, after these stops. Not of
// those places: they show the riding, so the descriptions don't name one.
const PHOTO_AFTER: Record<string, { src: StaticImageData; alt: string; position?: string }> = {
  "3": {
    src: mountainSunset,
    alt: "A rider on a loaded motorbike above a valley at sunset",
    position: "50% 60%",
  },
  "7": { src: beach, alt: "A loaded motorbike parked by the sea" },
  "11": {
    src: riverCrossing,
    alt: "A motorbike on a small ferry across a river in the mountains",
    position: "50% 55%",
  },
  "Sa Pa": {
    src: karstRoad,
    alt: "A Red Lantern bike on an empty road through karst mountains",
    position: "50% 62%",
  },
};

export function RouteGuide({ html }: { html: string }) {
  const sections = parseRouteGuide(html);
  const mainStops = sections.find((s) => s.kind === "stops")?.stops ?? [];
  let stopSections = 0;

  return (
    <div className={styles.guide}>
      {sections.map((section, i) => {
        switch (section.kind) {
          case "intro":
            return <Blocks key={i} blocks={section.blocks} className={styles.intro} />;
          case "glance":
            return <Glance key={i} section={section} stops={mainStops} />;
          case "stops":
            return <StopsSection key={i} section={section} northern={stopSections++ > 0} />;
          case "tips":
            return <Tips key={i} section={section} />;
          case "plain":
            return <Plain key={i} section={section} />;
        }
      })}
    </div>
  );
}

function Blocks({ blocks, className }: { blocks: Block[]; className?: string }) {
  return (
    <div className={`${styles.prose} ${className ?? ""}`}>
      {blocks.map((b, i) =>
        b.kind === "tip" ? (
          <aside key={i} className={styles.tip}>
            <TipIcon />
            <p>
              <b>{b.label}:</b> <span dangerouslySetInnerHTML={{ __html: b.html }} />
            </p>
          </aside>
        ) : (
          // Our own old site's text, cleaned to plain tags on import.
          <div key={i} dangerouslySetInnerHTML={{ __html: b.html }} />
        ),
      )}
    </div>
  );
}

// ─── The route at a glance ────────────────────────────────────────────────

function Glance({
  section,
  stops,
}: {
  section: Extract<GuideSection, { kind: "glance" }>;
  stops: Stop[];
}) {
  return (
    <section className={styles.section}>
      <h2>{section.title}</h2>
      <dl className={styles.facts}>
        {section.facts.map((f) => (
          <div key={f.label}>
            <dt>{f.label}</dt>
            <dd dangerouslySetInnerHTML={{ __html: f.value }} />
          </div>
        ))}
      </dl>
      {section.stops.length > 0 && (
        <nav className={styles.ribbon} aria-labelledby="route-stops">
          <h3 id="route-stops">{section.stopsLabel}</h3>
          <ol>
            {section.stops.map((name, i) => {
              // The overview lists the stops in the same order as the itinerary.
              const anchor = stops.length === section.stops.length ? stops[i].anchor : null;
              return (
                <li key={name}>
                  {anchor ? <a href={`#${anchor}`}>{name}</a> : <span>{name}</span>}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <Blocks blocks={section.blocks} />
    </section>
  );
}

// ─── Stops ────────────────────────────────────────────────────────────────

function StopsSection({
  section,
  northern,
}: {
  section: Extract<GuideSection, { kind: "stops" }>;
  northern: boolean;
}) {
  return (
    <section className={`${styles.section} ${northern ? styles.north : ""}`}>
      <h2>{section.title}</h2>
      <Blocks blocks={section.blocks} />
      <ol className={styles.timeline}>
        {section.stops.map((stop) => {
          const photo = PHOTO_AFTER[stop.number ?? stop.name];
          return (
            <li key={stop.anchor} id={stop.anchor} className={styles.stop}>
              <span className={styles.dot} aria-hidden="true">
                {stop.number ?? <PeakIcon />}
              </span>
              <h3>
                {stop.number && <span className={styles.visuallyHidden}>Stop {stop.number}: </span>}
                {stop.name}
              </h3>
              <ul className={styles.chips}>
                {stop.days && (
                  <li className={styles.days}>
                    <CalendarIcon />
                    {stop.days}
                  </li>
                )}
                {stop.facts.map((f) => (
                  <li key={f.label}>
                    {/^Distance/.test(f.label) ? <RoadIcon /> : <BedIcon />}
                    <span>
                      <small>{f.label}</small>
                      <span dangerouslySetInnerHTML={{ __html: f.value }} />
                    </span>
                  </li>
                ))}
              </ul>
              <Blocks blocks={stop.blocks} />
              {photo && (
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  placeholder="blur"
                  sizes="(max-width: 760px) 100vw, 720px"
                  className={styles.photo}
                  style={photo.position ? { objectPosition: photo.position } : undefined}
                />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ─── Tips ─────────────────────────────────────────────────────────────────

function Tips({ section }: { section: Extract<GuideSection, { kind: "tips" }> }) {
  return (
    <section className={styles.section}>
      <h2>{section.title}</h2>
      <div className={styles.tips}>
        {section.tips.map((tip) => (
          <div key={tip.title} className={tip.list.length > 0 ? styles.tipWide : undefined}>
            <h3>{tip.title}</h3>
            <Blocks blocks={tip.blocks} />
            {tip.list.length > 0 && (
              <ul className={styles.checklist}>
                {tip.list.map((item) => (
                  <li key={item}>
                    <CheckIcon />
                    <span dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Other sections: the bike choice and the closing call ────────────────

function Plain({ section }: { section: Extract<GuideSection, { kind: "plain" }> }) {
  if (/^Ready/i.test(section.title)) {
    return (
      <section className={styles.cta}>
        <h2>{section.title}</h2>
        <Blocks blocks={section.blocks} />
        <div className={ui.actions}>
          <Link href="/book?dropoff=HANOI" className={ui.primary}>
            Book a one-way to Hanoi
          </Link>
          <Link href="/one-way" className={ui.ghostDark}>
            See one-way trips
          </Link>
        </div>
        <p className={styles.ctaHelp}>
          <WhatsAppLink
            label="Ask us on WhatsApp"
            variant="link"
            message="Hi Red Lantern Bikes! I'm planning Saigon to Hanoi by motorbike."
          />
        </p>
      </section>
    );
  }
  const bikes = /bike/i.test(section.title);
  return (
    <section className={styles.section}>
      <h2>{section.title}</h2>
      <Blocks blocks={section.blocks} />
      {bikes && (
        <ul className={styles.bikes}>
          {[
            ["kawasaki-versys-x300", "Kawasaki Versys X300"],
            ["honda-cb150x", "Honda CB150X"],
          ].map(([slug, name]) => (
            <li key={slug}>
              <Link href={`/bikes/${slug}`}>
                <Image
                  src={`/bikes/${slug}.webp`}
                  alt=""
                  width={1200}
                  height={800}
                  sizes="(max-width: 760px) 45vw, 340px"
                />
                <span>{name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Icons (decorative: the text beside each says it) ─────────────────────

const icon = {
  viewBox: "0 0 24 24",
  "aria-hidden": true,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function RoadIcon() {
  return (
    <svg {...icon}>
      <path d="M8 3 4 21M16 3l4 18M12 4v2.5M12 10.5v3M12 17.5V20" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg {...icon}>
      <path d="M3 18V7M3 14h18v4M21 14v-2.5a3 3 0 0 0-3-3h-7v5.5M7 11.5a1.5 1.5 0 1 0 0-.01" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg {...icon}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

function TipIcon() {
  return (
    <svg {...icon} className={styles.tipIcon}>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z" />
    </svg>
  );
}

function PeakIcon() {
  return (
    <svg {...icon} strokeWidth={2}>
      <path d="m3 19 6.5-11 4 6.5 2.5-4L21 19z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...icon} strokeWidth={2.4} className={styles.check}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
