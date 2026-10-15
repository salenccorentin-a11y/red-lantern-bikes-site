// Cuts the lantern out of the logo (public/brand/logo-original.png) onto a
// transparent background, and makes the favicon and app icons from it.
//
//   node scripts/brand/cut-lantern.cjs
//
// The background is removed by flood-filling near-white pixels from the image
// edges, so white highlights inside the lantern are kept.

const sharp = require("sharp");

const SRC = "public/brand/logo-original.png";
const LANTERN_FROM_X = 300; // the lantern sits on the right of the original

async function main() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const at = (x, y) => (y * width + x) * channels;
  const nearWhite = (i) => data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235;

  // Flood fill from every edge pixel through near-white pixels.
  const seen = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) stack.push([x, 0], [x, height - 1]);
  for (let y = 0; y < height; y++) stack.push([0, y], [width - 1, y]);
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height || seen[y * width + x]) continue;
    seen[y * width + x] = 1;
    const i = at(x, y);
    if (!nearWhite(i)) continue;
    data[i + 3] = 0;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // Bounding box of the remaining (lantern) pixels on the right-hand side.
  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = LANTERN_FROM_X; x < width; x++) {
      if (data[at(x, y) + 3] > 0) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const box = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  console.log("lantern box", box);

  // The white inside the handle loop is enclosed by the handle, so the flood
  // fill can't reach it. The top fifth of the lantern is only handle and cap:
  // clear near-white pixels there too.
  for (let y = minY; y < minY + box.height * 0.2; y++) {
    for (let x = minX; x <= maxX; x++) if (nearWhite(at(x, y))) data[at(x, y) + 3] = 0;
  }

  const cut = sharp(data, { raw: { width, height, channels } }).extract(box).png();
  const lantern = await cut.toBuffer();
  await sharp(lantern).toFile("public/brand/lantern.png");
  await sharp(lantern)
    .resize({ height: 160 })
    .webp({ quality: 90 })
    .toFile("public/brand/lantern.webp");

  // Square icons: the lantern centred with a little room around it.
  const square = async (size, pad, background) =>
    sharp({ create: { width: size, height: size, channels: 4, background } })
      .composite([
        {
          input: await sharp(lantern)
            .resize({
              width: size - pad * 2,
              height: size - pad * 2,
              fit: "contain",
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .toBuffer(),
          gravity: "centre",
        },
      ])
      .png()
      .toBuffer();
  const clear = { r: 0, g: 0, b: 0, alpha: 0 };
  await sharp(await square(512, 24, clear)).toFile("src/app/icon.png");
  // Apple touch icons can't be transparent: use the site's navy.
  await sharp(await square(180, 22, { r: 15, g: 27, b: 45, alpha: 1 })).toFile(
    "src/app/apple-icon.png",
  );
  console.log(
    "wrote public/brand/lantern.png, lantern.webp, src/app/icon.png, src/app/apple-icon.png",
  );
}

main();
