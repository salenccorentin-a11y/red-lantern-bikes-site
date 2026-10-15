// Turns the original photos (OneDrive "Project vietnam/Bikes") into web-sized
// WebP files in public/. Rerun after swapping a photo in the list below.
//
//   node scripts/brand/prepare-photos.cjs ["path to the Bikes folder"]
//
// Bikes: trimmed and centred on white, 1200×800. Scenery: up to 2000px wide.
// Riders: square crops for the "rode with us" wall.

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = process.argv[2] ?? "C:/Users/33782/OneDrive/Documents/Project vietnam/Bikes";

// Studio shots of the 12 fleet models (keyed by model slug).
const BIKES = {
  "wave-alpha-110": "Without background/side/Honda Wave Alpha.jpg",
  "suzuki-gd110": "Without background/side/Gd110.jpg",
  "suzuki-en125": "Without background/side/EN125.jpg",
  "honda-cb125": "Without background/HONDA-CB-125F.jpg",
  "yamaha-nvx125": "Without background/Yamaha-NVX-125 2.jpg",
  "honda-winner-x-150": "Without background/Winner X.jpg",
  "suzuki-gsx-r150": "Without background/Suzuki-Bandit-150.jpg",
  "honda-xr150": "Without background/side/Xr150 background.jpg",
  "honda-cb150x": "Without background/side/CB150X Background.jpg",
  "honda-crf150": "Honda CRF150/honda-crf150-1-120454897.jpg",
  "yamaha-wr155r": "Yamaha WR155/Yamaha-WR155R-2-4000945470.png",
  "kawasaki-versys-x300": "Without background/Kawasaki Versys_X300.jpg",
};

// Your own riding photos for big backgrounds. crop = [top, bottom] fractions to keep.
const SCENERY = {
  "karst-road": { src: "AA posting/IMG-20250623-WA0006.jpg" },
  "river-crossing": { src: "AA posting/boat.jpeg" },
  "mountain-sunset": { src: "AA posting/WhatsApp Image 2025-11-26 at 9.59.16 AM.jpeg" },
  "versys-dirt-road": { src: "AA posting/WhatsApp Image 2025-11-30 at 2.15.51 PM.jpeg" },
  "luggage-ready": { src: "AA posting/WhatsApp Image 2025-12-19 at 4.54.55 PM.jpeg" },
  // The original has a caption baked into the top: keep the lower part.
  beach: { src: "AA posting/Suzuki at the beach.jpg", crop: [0.22, 1] },
  "saigon-city": { src: "AA posting/IMG_2153.JPG" },
  "saigon-opera": { src: "AA posting/IMG_2266.JPG" },
};

// Riders (they agreed to appear on the site).
const RIDERS = [
  "Customers/605299210_1586085739305716_1949668224589832607_n.jpg",
  "Customers/631030361_1626575318590091_2837998471266551873_n.jpg",
  "Customers/631754035_1626577211923235_5776590987823552083_n.jpg",
  "Customers/632475644_1626575535256736_2914312359573481281_n.jpg",
  "Customers/632639317_1626576145256675_7612538361612663961_n.jpg",
  "Customers/633559472_1626576898589933_3944438274405232673_n.jpg",
  "Customers/634027342_1626577088589914_418783294094140738_n.jpg",
  "Customers/634479209_1626576561923300_5611823026262666423_n.jpg",
  "Customers/632740039_1626577075256582_3791815890304670032_n.jpg",
];

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/**
 * Studio backgrounds vary (white, light grey, grey gradient). Flood-fill from
 * the edges through anything close to the edge colour and make it white, so
 * every bike sits on the same white card.
 */
async function whitenBackground(input) {
  const { data, info } = await sharp(input)
    .rotate()
    .flatten({ background: WHITE })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const at = (x, y) => (y * width + x) * channels;
  // Compare against the original colours, not the ones already whitened.
  const orig = Buffer.from(data);
  const seen = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) stack.push([x, 0, x, 0], [x, height - 1, x, height - 1]);
  for (let y = 0; y < height; y++) stack.push([0, y, 0, y], [width - 1, y, width - 1, y]);
  // Compare each pixel with its neighbour (not one fixed colour), so smooth
  // gradients are followed but the bike's edge stops the fill.
  while (stack.length) {
    const [x, y, px, py] = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height || seen[y * width + x]) continue;
    const i = at(x, y);
    const j = at(px, py);
    const step =
      Math.abs(orig[i] - orig[j]) +
      Math.abs(orig[i + 1] - orig[j + 1]) +
      Math.abs(orig[i + 2] - orig[j + 2]);
    const light = orig[i] > 150 && orig[i + 1] > 150 && orig[i + 2] > 150;
    const grey =
      Math.max(orig[i], orig[i + 1], orig[i + 2]) - Math.min(orig[i], orig[i + 1], orig[i + 2]) <
      18;
    if (step > 24 || !light || !grey) continue;
    seen[y * width + x] = 1;
    data[i] = data[i + 1] = data[i + 2] = 255;
    stack.push([x + 1, y, x, y], [x - 1, y, x, y], [x, y + 1, x, y], [x, y - 1, x, y]);
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

async function bike(slug, rel) {
  const trimmed = await sharp(await whitenBackground(path.join(ROOT, rel)))
    .trim({ background: "#ffffff", threshold: 18 })
    .toBuffer();
  await sharp(trimmed)
    .resize(1080, 700, { fit: "contain", background: WHITE })
    .extend({ top: 50, bottom: 50, left: 60, right: 60, background: WHITE })
    .webp({ quality: 82 })
    .toFile(`public/bikes/${slug}.webp`);
}

async function scenery(name, { src, crop }) {
  let img = sharp(path.join(ROOT, src)).rotate();
  if (crop) {
    const { width, height } = await sharp(await img.toBuffer()).metadata();
    img = sharp(await img.toBuffer()).extract({
      left: 0,
      top: Math.round(height * crop[0]),
      width,
      height: Math.round(height * (crop[1] - crop[0])),
    });
  }
  const out = await img
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();
  fs.writeFileSync(`public/photos/${name}.webp`, out);
  const { width, height } = await sharp(out).metadata();
  return { name, width, height };
}

async function rider(rel, i) {
  await sharp(path.join(ROOT, rel))
    .rotate()
    .resize(720, 720, { fit: "cover", position: "attention" })
    .webp({ quality: 76 })
    .toFile(`public/photos/riders/rider-${i + 1}.webp`);
}

(async () => {
  for (const dir of ["public/bikes", "public/photos", "public/photos/riders"]) {
    fs.mkdirSync(dir, { recursive: true });
  }
  for (const [slug, rel] of Object.entries(BIKES)) await bike(slug, rel);
  const sizes = [];
  for (const [name, spec] of Object.entries(SCENERY)) sizes.push(await scenery(name, spec));
  for (const [i, rel] of RIDERS.entries()) await rider(rel, i);
  // Image sizes for the code, so pages can reserve the right space.
  fs.writeFileSync(
    "src/content/photos.json",
    JSON.stringify(
      Object.fromEntries(sizes.map((s) => [s.name, { width: s.width, height: s.height }])),
      null,
      2,
    ) + "\n",
  );
  console.log(
    `${Object.keys(BIKES).length} bikes, ${sizes.length} scenery, ${RIDERS.length} riders`,
  );
})();
