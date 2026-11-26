import { describe, expect, it } from "vitest";
import { dropoffFor, notionNote, parseBikes, recordFields } from "@/lib/notion-import";

describe("parseBikes", () => {
  it("reads one bike", () => {
    expect(parseBikes("XR150")).toEqual([{ slug: "honda-xr150", count: 1 }]);
    expect(parseBikes("Versys")).toEqual([{ slug: "kawasaki-versys-x300", count: 1 }]);
    expect(parseBikes("CB125")).toEqual([{ slug: "honda-cb125", count: 1 }]);
    expect(parseBikes("EN125")).toEqual([{ slug: "suzuki-en125", count: 1 }]);
  });

  it("reads a count in front, with or without a space or an x", () => {
    expect(parseBikes("2 Wave")).toEqual([{ slug: "wave-alpha-110", count: 2 }]);
    expect(parseBikes("2NVX")).toEqual([{ slug: "yamaha-nvx125", count: 2 }]);
    expect(parseBikes("2Winner X")).toEqual([{ slug: "honda-winner-x-150", count: 2 }]);
    expect(parseBikes("2x CB150X")).toEqual([{ slug: "honda-cb150x", count: 2 }]);
    expect(parseBikes("2 XR150")).toEqual([{ slug: "honda-xr150", count: 2 }]);
    expect(parseBikes("2XR150")).toEqual([{ slug: "honda-xr150", count: 2 }]);
  });

  it("treats an unspaced slash as one bike, a comma or spaced slash as several", () => {
    expect(parseBikes("NVX125/155")).toEqual([{ slug: "yamaha-nvx125", count: 1 }]);
    expect(parseBikes("CB150X / Versys")).toEqual([
      { slug: "honda-cb150x", count: 1 },
      { slug: "kawasaki-versys-x300", count: 1 },
    ]);
    expect(parseBikes("Wave, Nvx, Winner blue")).toHaveLength(3);
    expect(parseBikes("2 x EN - 1 x GD")).toEqual([
      { slug: "suzuki-en125", count: 2 },
      { slug: "suzuki-gd110", count: 1 },
    ]);
  });

  it("refuses bikes that aren't in the fleet", () => {
    expect(parseBikes("Honda Vision")).toBeNull();
    expect(parseBikes("XR125 red")).toBeNull();
    expect(parseBikes("GSXS XR125, GD")).toBeNull();
    expect(parseBikes("Wave, Mio")).toBeNull();
    expect(parseBikes("")).toBeNull();
  });
});

describe("dropoffFor", () => {
  it("maps the three site cities and keeps any other place for the note", () => {
    expect(dropoffFor("HCMC")).toEqual({ city: "SAIGON" });
    expect(dropoffFor("Ha Noi")).toEqual({ city: "HANOI" });
    expect(dropoffFor("Da Nang")).toEqual({ city: "DA_NANG" });
    expect(dropoffFor("Nha Trang")).toEqual({ city: "SAIGON", other: "Nha Trang" });
    expect(dropoffFor(null)).toEqual({ city: "SAIGON" });
  });
});

describe("recordFields and notionNote", () => {
  const anita = {
    url: "https://app.notion.com/abc",
    name: "Anita",
    status: "Upcoming" as const,
    bike: "2 Wave",
    start: "2027-05-03",
    end: "2027-05-27",
    destination: "Ha Noi",
    paid: "225$x2",
    deposit: "120e Coco",
    insurance: "Yes 75$x2",
    helmet: null,
    transfer: "-",
    notes: " Side and top box ",
  };

  it("keeps Notion's columns word for word, empty or '-' as nothing", () => {
    expect(recordFields(anita)).toEqual({
      paidNote: "225$x2",
      transferNote: null,
      depositNote: "120e Coco",
      insuranceNote: "Yes 75$x2",
      helmetNote: null,
      problemsNote: null,
    });
  });

  it("puts the real drop-off place before Notion's notes", () => {
    expect(notionNote(anita, "Nha Trang")).toBe("Drop-off: Nha Trang\nSide and top box");
    expect(notionNote({ ...anita, notes: null })).toBeNull();
  });
});
