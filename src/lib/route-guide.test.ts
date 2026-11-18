// The Hanoi guide is laid out from its own text: every word must survive.
import { describe, expect, it } from "vitest";
import posts from "@/content/blog/posts.json";
import { parseRouteGuide, type Block } from "@/lib/route-guide";

const hanoi = posts.find((p) => p.postSlug.startsWith("ho-chi-minh-city-to-hanoi"))!;
const sections = parseRouteGuide(hanoi.html);
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

describe("the Hanoi route guide", () => {
  it("finds the overview, the 15 stops, the 3 extension stops and the tips", () => {
    expect(sections.map((s) => s.kind)).toEqual([
      "intro",
      "glance",
      "plain",
      "stops",
      "stops",
      "tips",
      "plain",
    ]);
    const [main, north] = sections.filter((s) => s.kind === "stops");
    expect(main.stops.map((s) => s.number)).toEqual(
      Array.from({ length: 15 }, (_, i) => String(i + 1)),
    );
    expect(main.stops[2]).toMatchObject({
      name: "Da Lat",
      days: "Days 4–7",
      facts: [
        { label: "Distance from Cat Tien", value: "~200km | 4–5 hours" },
        { label: "Recommended stay", value: "2–3 nights" },
      ],
    });
    expect(main.stops[2].blocks.some((b) => b.kind === "tip" && b.label === "Riding tip")).toBe(
      true,
    );
    expect(north.stops.map((s) => s.name)).toEqual(["Sa Pa", "Ha Giang", "Cao Bang"]);
    const glance = sections.find((s) => s.kind === "glance");
    expect(glance?.kind === "glance" && glance.stops).toHaveLength(15);
    expect(glance?.kind === "glance" && glance.facts.map((f) => f.label)).toEqual([
      "Total distance",
      "Recommended duration",
      "Difficulty",
      "Best months",
    ]);
  });

  it("keeps every word of the original, in order", () => {
    const words: string[] = [];
    const add = (html: string) => words.push(text(html));
    const addBlocks = (blocks: Block[]) =>
      blocks.forEach((b) => add(b.kind === "tip" ? `${b.label}: ${b.html}` : b.html));
    for (const s of sections) {
      if ("title" in s) add(s.title);
      if (s.kind === "glance") {
        s.facts.forEach((f) => add(`${f.label}: ${f.value}`));
        if (s.stopsLabel) add(`${s.stopsLabel}: ${s.stops.join(" → ")}`);
        addBlocks(s.blocks);
      } else if (s.kind === "tips") {
        s.tips.forEach((t) => {
          add(t.title);
          addBlocks(t.blocks);
          t.list.forEach(add);
        });
      } else if (s.kind === "stops") {
        addBlocks(s.blocks);
        for (const stop of s.stops) {
          const number = stop.number ? `Stop ${stop.number}: ` : "";
          const days = stop.days ? ` (${stop.days})` : "";
          add(`${number}${stop.name}${days}`);
          stop.facts.forEach((f) => add(`${f.label}: ${f.value}`));
          addBlocks(stop.blocks);
        }
      } else {
        addBlocks(s.blocks);
      }
    }
    const squash = (s: string) => s.replace(/\s+/g, "");
    expect(squash(words.join(" "))).toBe(squash(text(hanoi.html)));
  });
});
