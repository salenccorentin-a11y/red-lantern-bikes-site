// Turns the original photos (OneDrive "Project vietnam/Bikes") into web-sized
// WebP files in public/. Rerun after swapping a photo in the list below.
//
//   node scripts/brand/prepare-photos.cjs ["path to the Bikes folder"] [--gallery]
//
// Bikes: trimmed and centred on white, 1200×800. Galleries: 4:3 frames of
// your own photos of each model. Scenery: up to 2000px wide. Riders: square
// crops for the "rode with us" wall.

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ARGS = process.argv.slice(2);
// --gallery: only redo the photos at the top of the bike pages.
const ONLY_GALLERY = ARGS.includes("--gallery");
const ROOT =
  ARGS.find((a) => !a.startsWith("--")) ??
  "C:/Users/33782/OneDrive/Documents/Project vietnam/Bikes";

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

// Your own photos of each model, at the top of its page. Only from the
// "Website image" folder (owner, 2026-11-17); the first is what the page opens
// on. box = [left, top, right, bottom], the part of the photo to keep, chosen
// so the whole bike sits in the middle. Every photo comes out 4:3; a photo
// that isn't 4:3 after the box (most upright phone photos) is shown whole over
// a blurred copy of itself rather than cut.
const W = "Website image/";
const GALLERY = {
  "wave-alpha-110": [
    [W + "IMG_2093.JPG", "A black Wave Alpha parked on a Saigon street", [0, 0.1, 0.9, 1]],
    [W + "IMG_2153.JPG", "Riding a Wave Alpha past Ben Thanh market", [0, 0.25, 1, 1]],
    [W + "IMG_2151.JPG", "A rider on a black Wave Alpha in Saigon", [0, 0.1, 1, 1]],
    [W + "IMG-20250830-WA0002.jpg", "A blue Wave Alpha, side view"],
    [W + "IMG_2266.JPG", "A Wave Alpha in front of City Hall in Saigon", [0, 0.15, 1, 1]],
  ],
  "suzuki-gd110": [
    [W + "Suzuki at the beach.jpg", "A loaded GD110 on the beach", [0, 0.22, 1, 0.97]],
    [W + "6 2.jpg", "A GD110 with leather saddlebags outside the shop", [0.08, 0.08, 1, 1]],
    [W + "6 1.jpg", "A black GD110 with leather saddlebags"],
  ],
  "suzuki-en125": [
    [W + "IMG-20250623-WA0012.jpg", "A loaded EN125 above rice terraces in the north"],
    [W + "IMG-20250623-WA0006.jpg", "An EN125 on an empty road through karst mountains"],
    [W + "EN 2.jpg", "A red EN125 by the rice fields", [0.25, 0.22, 1, 0.88]],
    [W + "IMG-20250623-WA0011.jpg", "An EN125 with luggage above the rice terraces"],
    [W + "IMG-20250623-WA0001.jpg", "An EN125 on a bridge in the mountains"],
    [W + "IMG-20250419-WA0005.jpg", "An EN125 at a mountain viewpoint", [0, 0.32, 1, 0.88]],
  ],
  "yamaha-nvx125": [
    [W + "IMG-20250815-WA0009.jpg", "A red NVX125, front three-quarter view", [0, 0.18, 1, 0.92]],
    [W + "IMG-20250815-WA0010.jpg", "A red NVX125 parked by a garden", [0, 0.05, 1, 1]],
    [W + "IMG-20250815-WA0012.jpg", "A red NVX125 from behind", [0, 0.1, 1, 1]],
    [W + "IMG-20250813-WA0001.jpg", "A black and gold NVX125, side view"],
  ],
  "honda-winner-x-150": [
    [
      W + "WhatsApp Image 2025-12-19 at 4.54.55 PM.jpeg",
      "A blue Winner X loaded for the trip",
      [0, 0.05, 0.85, 0.9],
    ],
    [
      W + "545697262_1500941047820186_3366812824896945328_n.jpg",
      "A red Winner X, side view",
      [0, 0.1, 0.9, 1],
    ],
    [W + "544899619_1500941037820187_7727859536678679195_n.jpg", "A red Winner X from the front"],
    [W + "Honda Winner X.jpg", "A black Winner X in front of a gate", [0, 0.3, 1, 0.86]],
  ],
  "suzuki-gsx-r150": [
    [
      W + "518346930_1457498255497799_3799175047607141511_n.jpg",
      "A white and black Suzuki 150 on a Saigon street at night",
      [0.06, 0.08, 0.98, 1],
    ],
    [
      W + "538916284_1494015041846120_7897132706742520960_n.jpg",
      "A rider ready to leave on a black Suzuki 150 with luggage",
    ],
    [
      W + "539758242_1494015091846115_2250211974947493514_n.jpg",
      "A black Suzuki 150, side view",
      [0, 0.1, 0.88, 0.98],
    ],
    [
      W + "541776179_1494015125179445_970348750117534548_n.jpg",
      "A black Suzuki 150 with a rear rack",
      [0, 0.1, 0.9, 1],
    ],
    [W + "IMG-20250820-WA0004.jpg", "A rider on a white and black Suzuki 150 at the shop"],
  ],
  "honda-xr150": [
    [
      W + "493267865_1399762754604683_2218561016064431293_n.jpg",
      "A red XR150 loaded with bags outside the shop",
      [0.12, 0.15, 0.97, 1],
    ],
    [W + "Black XR tr.jpeg", "A loaded XR150 on a grassy hill", [0, 0.44, 1, 1]],
    [W + "Black XR t.jpeg", "An XR150 above a misty valley", [0, 0.42, 1, 0.98]],
    [W + "boat.jpeg", "An XR150 on a ferry in the mountains", [0, 0.18, 1, 1]],
    [W + "B XR.jpeg", "A black and red XR150, side view", [0.08, 0.08, 1, 1]],
    [W + "XR 125 W.jpeg", "A white XR, side view"],
    [
      W + "WhatsApp Image 2025-10-27 at 11.53.41 AM.jpeg",
      "White XRs lined up at the shop",
      [0, 0.3, 1, 1],
    ],
    [W + "IMG-20250830-WA0010.jpg", "Two riders with a white XR at a viewpoint", [0, 0.12, 1, 1]],
  ],
  "honda-cb150x": [
    [W + "IMG-20250814-WA0004.jpg", "A black CB150X with side cases", [0, 0.3, 1, 0.92]],
    [W + "Scenery.jpeg", "A CB150X at a viewpoint above the sea", [0.5, 0, 1, 1]],
    [W + "IMG-20250814-WA0007.jpg", "A black CB150X parked on the street", [0, 0.2, 1, 0.98]],
    [
      W + "484557270_1369046717676287_3689599291219447985_n.jpg",
      "A rider on a red CB150X at the shop",
      [0, 0.18, 1, 1],
    ],
    [W + "IMG-20250814-WA0005.jpg", "The CB150X from the rider's seat", [0, 0.25, 1, 1]],
  ],
  "honda-crf150": [
    [
      W + "WhatsApp Image 2026-08-15 at 2.19.50 PM.jpeg",
      "Riders setting off on a red CRF150 and a WR155R",
      [0, 0.44, 1, 1],
    ],
  ],
  "yamaha-wr155r": [
    [
      W + "WhatsApp Image 2026-08-15 at 2.19.32 PM.jpeg",
      "A WR155R outside the shop",
      [0, 0.15, 1, 0.92],
    ],
    [W + "WhatsApp Image 2026-08-15 at 2.19.29 PM.jpeg", "A WR155R, side view", [0, 0.15, 1, 1]],
    [
      W + "WhatsApp Image 2026-08-15 at 2.19.31 PM.jpeg",
      "A WR155R with a rear rack",
      [0, 0.25, 1, 1],
    ],
  ],
  "kawasaki-versys-x300": [
    [
      W + "WhatsApp Image 2025-11-30 at 2.15.52 PM.jpeg",
      "A loaded Versys-X 300 above the mountains",
      [0, 0.38, 1, 1],
    ],
    [
      W + "WhatsApp Image 2025-11-30 at 2.15.51 PM.jpeg",
      "A Versys-X 300 with cases by the rice terraces",
      [0, 0.3, 1, 0.98],
    ],
    [
      W + "WhatsApp Image 2025-11-30 at 2.15.50 PM.jpeg",
      "A loaded Versys-X 300 on a red dirt road",
      [0, 0.36, 1, 0.92],
    ],
    [
      W + "WhatsApp Image 2025-11-26 at 9.59.16 AM.jpeg",
      "A rider on a Versys-X 300 at sunrise",
      [0, 0.34, 1, 0.9],
    ],
    [
      W + "WhatsApp Image 2025-11-30 at 2.15.53 PM.jpeg",
      "A Versys-X 300 with two helmets on the mirrors",
      [0, 0.08, 1, 1],
    ],
  ],
};

// Your own riding photos for big backgrounds. crop = [top, bottom, left, right]
// fractions to keep (left and right are optional).
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
  // From the tour folder next to Bikes. Cropped to lose the boat's roof and a
  // blurred shoulder on the left.
  "mekong-canal": {
    src: "../TOURS/Mekong Delta/MEKONG DELTA TOUR 001/post/IMG_20241110_093251.jpg",
    crop: [0.17, 1, 0.07, 1],
  },
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
    const [top, bottom, left = 0, right = 1] = crop;
    img = sharp(await img.toBuffer()).extract({
      left: Math.round(width * left),
      top: Math.round(height * top),
      width: Math.round(width * (right - left)),
      height: Math.round(height * (bottom - top)),
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

const FRAME = { width: 1200, height: 900 };

/** One gallery photo: the box cut out, then fitted to a 4:3 frame. */
async function framed(rel, box = [0, 0, 1, 1]) {
  const src = await sharp(path.join(ROOT, rel)).rotate().toBuffer();
  const { width, height } = await sharp(src).metadata();
  const [l, t, r, b] = box;
  const cut = await sharp(src)
    .extract({
      left: Math.round(width * l),
      top: Math.round(height * t),
      width: Math.round(width * (r - l)),
      height: Math.round(height * (b - t)),
    })
    .toBuffer();
  const ratio = (width * (r - l)) / (height * (b - t));
  // Already 4:3 (give or take 3%): fill the frame.
  if (Math.abs(ratio / (4 / 3) - 1) < 0.03) {
    return sharp(cut).resize(FRAME.width, FRAME.height, { fit: "cover" }).toBuffer();
  }
  // Otherwise the whole photo in the middle, over a blurred, darker copy of it.
  const back = await sharp(cut)
    .resize(FRAME.width, FRAME.height, { fit: "cover" })
    .blur(40)
    .modulate({ brightness: 0.8 })
    .toBuffer();
  const front = await sharp(cut)
    .resize(FRAME.width, FRAME.height, { fit: "inside" })
    .toBuffer({ resolveWithObject: true });
  return sharp(back)
    .composite([
      {
        input: front.data,
        left: Math.round((FRAME.width - front.info.width) / 2),
        top: Math.round((FRAME.height - front.info.height) / 2),
      },
    ])
    .toBuffer();
}

async function gallery(slug, photos) {
  const out = [];
  for (const [i, [rel, alt, box]] of photos.entries()) {
    const img = sharp(await framed(rel, box));
    const webp = await img.clone().webp({ quality: 78 }).toBuffer();
    // The name changes with the photo, so no browser keeps showing an old one.
    const hash = require("crypto").createHash("sha1").update(webp).digest("hex").slice(0, 8);
    const file = `${slug}-${i + 1}-${hash}.webp`;
    fs.writeFileSync(`public/bikes/gallery/${file}`, webp);
    // A tiny version shown blurred while the photo loads.
    const tiny = await img.clone().resize(16, 12).webp({ quality: 40 }).toBuffer();
    out.push({
      src: `/bikes/gallery/${file}`,
      alt,
      blur: `data:image/webp;base64,${tiny.toString("base64")}`,
    });
  }
  return out;
}

async function rider(rel, i) {
  await sharp(path.join(ROOT, rel))
    .rotate()
    .resize(720, 720, { fit: "cover", position: "attention" })
    .webp({ quality: 76 })
    .toFile(`public/photos/riders/rider-${i + 1}.webp`);
}

(async () => {
  for (const dir of [
    "public/bikes",
    "public/bikes/gallery",
    "public/photos",
    "public/photos/riders",
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // Start the galleries afresh, so no photo from an older list stays behind.
  for (const f of fs.readdirSync("public/bikes/gallery")) fs.unlinkSync(`public/bikes/gallery/${f}`);
  const galleries = {};
  for (const [slug, photos] of Object.entries(GALLERY))
    galleries[slug] = await gallery(slug, photos);
  fs.writeFileSync("src/content/bike-gallery.json", JSON.stringify(galleries, null, 2) + "\n");
  if (ONLY_GALLERY) {
    console.log(`${Object.values(galleries).flat().length} gallery photos`);
    return;
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
    `${Object.keys(BIKES).length} bikes, ${Object.values(galleries).flat().length} gallery photos, ${sizes.length} scenery, ${RIDERS.length} riders`,
  );
})();
