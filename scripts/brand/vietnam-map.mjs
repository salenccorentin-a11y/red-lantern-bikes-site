// Draws the map for the one-way route: Vietnam, its neighbours for context,
// and the usual road from Saigon to Hanoi. Writes plain SVG path data to
// src/content/vietnam-map.json, so visitors download no map library.
//
//   node scripts/brand/vietnam-map.mjs
//
// Country shapes: Natural Earth 1:50m (public domain), via world-atlas.
// The frame stops at 110.9°E: the map shows the mainland and its coastal
// islands only, so no disputed island groups are drawn.

import fs from "node:fs";
import { createRequire } from "node:module";
import { geoMercator, geoPath } from "d3-geo";
import { curveCatmullRom, line } from "d3-shape";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const world = require("world-atlas/countries-50m.json");

const WIDTH = 400;
const FRAME = { west: 101.9, east: 110.9, south: 8.2, north: 23.6 };

const countries = feature(world, world.objects.countries).features;
const byId = (id) => countries.find((c) => c.id === id);
const vietnam = byId("704");
const neighbours = ["418", "116", "764", "156"].map(byId);

// Fit the frame to the width; the height follows from the projection.
const corners = {
  type: "MultiPoint",
  coordinates: [
    [FRAME.west, FRAME.south],
    [FRAME.east, FRAME.north],
  ],
};
const projection = geoMercator().fitWidth(WIDTH, corners);
const [[, top], [, bottom]] = geoPath(projection).bounds(corners);
const HEIGHT = Math.round(bottom - top);
projection.translate([projection.translate()[0], projection.translate()[1] - top]);
projection.clipExtent([
  [0, 0],
  [WIDTH, HEIGHT],
]);

const path = geoPath(projection).digits(1);
const point = (lon, lat) => projection([lon, lat]).map((n) => Math.round(n * 10) / 10);

// The usual ride north: QL20 to Da Lat, down to the coast at Nha Trang, QL1
// up the coast to Hoi An, Da Nang and the Hai Van Pass, Hue, then the Ho Chi
// Minh Road through Phong Nha, and on to Ninh Binh and Hanoi. Rough on
// purpose: it shows the shape of the trip, not turn-by-turn directions.
const ROAD = [
  [106.7, 10.78], // Saigon
  [107.35, 11.2],
  [107.8, 11.55], // Bao Loc
  [108.44, 11.94], // Da Lat
  [108.85, 12.12],
  [109.19, 12.24], // Nha Trang
  [109.3, 13.09], // Tuy Hoa
  [109.22, 13.78], // Quy Nhon
  [108.95, 14.6],
  [108.8, 15.12], // Quang Ngai
  [108.33, 15.88], // Hoi An
  [108.22, 16.05], // Da Nang
  [108.12, 16.2], // Hai Van Pass
  [107.59, 16.46], // Hue
  [107.1, 16.82], // Dong Ha
  [106.6, 17.25],
  [106.28, 17.59], // Phong Nha
  [105.85, 18.2],
  [105.4, 18.75],
  [105.35, 19.4],
  [105.75, 19.95],
  [105.97, 20.25], // Ninh Binh
  [105.85, 21.03], // Hanoi
];

// Places on the map. kind: start (red), dropoff (gold), stop (small white).
// side: which side of the dot the label sits on; dy nudges it down (px).
const PLACES = [
  { name: "Saigon", lon: 106.7, lat: 10.78, kind: "start", side: "left" },
  { name: "Da Lat", lon: 108.44, lat: 11.94, kind: "stop", side: "left" },
  { name: "Nha Trang", lon: 109.19, lat: 12.24, kind: "stop", side: "right" },
  { name: "Hoi An", lon: 108.33, lat: 15.88, kind: "stop", side: "right", dy: 9 },
  { name: "Da Nang", lon: 108.22, lat: 16.05, kind: "dropoff", side: "right", dy: -4 },
  { name: "Hue", lon: 107.59, lat: 16.46, kind: "stop", side: "left" },
  { name: "Phong Nha", lon: 106.28, lat: 17.59, kind: "stop", side: "left" },
  { name: "Ninh Binh", lon: 105.97, lat: 20.25, kind: "stop", side: "right" },
  { name: "Hanoi", lon: 105.85, lat: 21.03, kind: "dropoff", side: "right" },
];

// Country names, placed by hand in open space.
const LABELS = [
  { name: "Laos", lon: 103.2, lat: 19.6 },
  { name: "Cambodia", lon: 104.4, lat: 12.9 },
  { name: "Thailand", lon: 102.8, lat: 15.6 },
  { name: "China", lon: 106.6, lat: 23.0 },
];

const road = line()
  .curve(curveCatmullRom.alpha(0.5))
  .x((d) => d[0])
  .y((d) => d[1])
  .digits(1)(ROAD.map(([lon, lat]) => point(lon, lat)));

const map = {
  width: WIDTH,
  height: HEIGHT,
  vietnam: path(vietnam),
  neighbours: neighbours.map((c) => path(c)).join(""),
  road,
  places: PLACES.map(({ lon, lat, ...rest }) => ({ ...rest, at: point(lon, lat) })),
  labels: LABELS.map(({ name, lon, lat }) => ({ name, at: point(lon, lat) })),
};

fs.writeFileSync("src/content/vietnam-map.json", JSON.stringify(map, null, 2) + "\n");
console.log(`Map ${WIDTH}×${HEIGHT}, ${(JSON.stringify(map).length / 1024).toFixed(1)} KB`);
