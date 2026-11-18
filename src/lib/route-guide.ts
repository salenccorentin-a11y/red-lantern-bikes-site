// Splits a long route guide (HTML imported from the old site) into parts the
// page can lay out as a route: the overview, each stop with its distance and
// stay, tips, and so on. The words are never changed, only grouped; anything
// not recognised stays as plain HTML in its place.

export type Stop = {
  /** "3" for "Stop 3: Da Lat"; null for the northern extension's stops. */
  number: string | null;
  name: string;
  /** "Days 4–7", if the heading gives them. */
  days: string | null;
  anchor: string;
  /** "Distance from Cat Tien" → "~200km | 4–5 hours", "Recommended stay" → "2–3 nights". */
  facts: { label: string; value: string }[];
  /** The stop's text, in order: paragraphs as HTML, and tips set apart. */
  blocks: Block[];
};

export type Block = { kind: "html"; html: string } | { kind: "tip"; label: string; html: string };

export type GuideSection =
  | { kind: "intro"; blocks: Block[] }
  | {
      kind: "glance";
      title: string;
      facts: { label: string; value: string }[];
      stopsLabel: string | null;
      stops: string[];
      blocks: Block[];
    }
  | { kind: "stops"; title: string; blocks: Block[]; stops: Stop[] }
  | { kind: "tips"; title: string; tips: { title: string; blocks: Block[]; list: string[] }[] }
  | { kind: "plain"; title: string; blocks: Block[] };

const TIP = /^<p>(Practical tip|Riding tip|Riding note):\s*([\s\S]*)<\/p>$/;
const FACT = /^<p><b>([^<]+?):\s*<\/b>([\s\S]*)<\/p>$/;
const GLANCE_FACT = /^<p>([A-Z][A-Za-z ]{2,30}):\s*([\s\S]*)<\/p>$/;

/** The top-level blocks of an HTML fragment: paragraphs, lists, other tags. */
function blocksOf(html: string): string[] {
  return html.match(/<(p|ul|ol|table|blockquote)\b[\s\S]*?<\/\1>/g) ?? [];
}

function toBlocks(parts: string[]): Block[] {
  return parts.map((html) => {
    const tip = html.match(TIP);
    return tip ? { kind: "tip", label: tip[1], html: tip[2] } : { kind: "html", html };
  });
}

/** Splits on a heading tag: [text before, [title, body], [title, body], …]. */
function splitOn(html: string, tag: "h2" | "h3"): { before: string; parts: [string, string][] } {
  const pieces = html.split(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  const parts: [string, string][] = [];
  for (let i = 1; i < pieces.length; i += 2) parts.push([pieces[i].trim(), pieces[i + 1] ?? ""]);
  return { before: pieces[0], parts };
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function parseStop(heading: string, body: string): Stop | null {
  const m = heading.match(/^(?:Stop (\d+):\s*)?(.+?)(?:\s*\((Days? [^)]+)\))?$/);
  if (!m || (!m[1] && !m[3])) return null;
  const facts: Stop["facts"] = [];
  const rest: string[] = [];
  for (const part of blocksOf(body)) {
    const fact = part.match(FACT);
    if (fact && rest.length === 0) facts.push({ label: fact[1].trim(), value: fact[2].trim() });
    else rest.push(part);
  }
  const name = m[2].trim();
  return {
    number: m[1] ?? null,
    name,
    days: m[3] ?? null,
    anchor: `stop-${slugify(name.split(/\s+—\s+/)[0])}`,
    facts,
    blocks: toBlocks(rest),
  };
}

export function parseRouteGuide(html: string): GuideSection[] {
  const { before, parts } = splitOn(html, "h2");
  const sections: GuideSection[] = [{ kind: "intro", blocks: toBlocks(blocksOf(before)) }];

  for (const [title, body] of parts) {
    const { before: lead, parts: subs } = splitOn(body, "h3");
    const stops = subs.map(([h, b]) => parseStop(h, b));

    if (subs.length > 0 && stops.every((s) => s !== null)) {
      sections.push({
        kind: "stops",
        title,
        blocks: toBlocks(blocksOf(lead)),
        stops: stops as Stop[],
      });
      continue;
    }

    if (subs.length > 0) {
      sections.push({
        kind: "tips",
        title,
        tips: subs.map(([h, b]) => {
          const blocks = blocksOf(b);
          const list = blocks
            .filter((x) => x.startsWith("<ul"))
            .flatMap((ul) => ul.match(/<li>([\s\S]*?)<\/li>/g) ?? [])
            .map((li) => li.replace(/^<li>|<\/li>$/g, ""));
          return {
            title: h,
            blocks: toBlocks(blocks.filter((x) => !x.startsWith("<ul"))),
            list,
          };
        }),
      });
      continue;
    }

    const blocks = blocksOf(body);
    const glance = blocks.map((b) => b.match(GLANCE_FACT));
    const stopsLine = blocks.map((b) => b.match(/^<p><b>([^<]+?):\s*<\/b>([\s\S]*→[\s\S]*)<\/p>$/));
    if (glance.filter(Boolean).length >= 3) {
      const line = stopsLine.find(Boolean);
      sections.push({
        kind: "glance",
        title,
        facts: glance.flatMap((g) => (g ? [{ label: g[1], value: g[2].trim() }] : [])),
        stopsLabel: line ? line[1] : null,
        stops: line ? line[2].split("→").map((s) => s.trim()) : [],
        blocks: toBlocks(blocks.filter((_, i) => !glance[i] && !stopsLine[i])),
      });
      continue;
    }

    sections.push({ kind: "plain", title, blocks: toBlocks(blocks) });
  }
  return sections;
}
