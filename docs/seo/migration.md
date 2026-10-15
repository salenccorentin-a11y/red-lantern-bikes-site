# Moving from the Odoo site: addresses, titles and redirects

Checked 15 October 2026 against a production build.

## What was recorded

`npm run seo:crawl-old-site` crawled www.redlanternbikes.com (sitemap plus links, all 7 languages) into `old-site-crawl.json`: 454 addresses, 49 pages per language, with each page's title, description and redirects.

## What happens to each old address

| Old address | New site |
| --- | --- |
| `/`, `/terms`, `/blog`, `/blog/news-2`, `/blog/our-blog-1` and the 3 blog posts | Same address, same title (blog moved unchanged) |
| `/about-us` | 301 to `/about` (title kept) |
| `/contactus`, `/appointment`, `/calendar`, `/helpdesk/…` | 301 to `/contact` |
| `/shop` and `/shop/category/…` | 301 to `/bikes` (old `/shop` title kept) |
| `/shop/<product>` and `/shop/<category>/<product>` | 301 to the bike's page, e.g. `/bikes/honda-xr150` (old title and description wording kept, without the price) |
| `/shop/yamaha-r15v3-19` | 301 to `/bikes` (not in the current fleet) |
| `/shop/cart`, `/shop/wishlist` | 301 to `/book` |
| `/blog/success-stories-3` (empty) | 301 to `/blog` |
| `/website/social/…` | 301 to the Facebook, Instagram, YouTube and TikTok pages |
| `/vi/…`, `/fr/…`, `/nl/…`, `/ja/…`, `/ko_KR/…`, `/zh_CN/…` | 301 straight to the English page (one hop), including translated blog category names |

The rules are in `src/seo/redirects.ts`. `npm run seo:check-redirects -- <site>` requests every recorded old address against a running site and fails unless each loads (200) or redirects once with a 301 to a page that loads. Result: 400 of 400 pass (8 load directly, 364 redirect, 28 go to social pages); the old site's own 404s and Odoo actions are skipped.

## Search engines

- `sitemap.xml` lists every public page (32), built from the content files.
- `robots.txt` keeps `/staff`, `/booking/` (customers' private pages) and `/api/` out of search.
- Every public page has a canonical address on `SITE_URL`.
- Home and Contact carry LocalBusiness structured data (no self-published rating, which search engines ignore).

## At launch (step 12)

- Set `SITE_URL=https://www.redlanternbikes.com`: the old site's main address is the `www` one.
- Redirect `redlanternbikes.com` (no www) and plain `http://` to `https://www.redlanternbikes.com`. Today `https://redlanternbikes.com/about-us` returns 404 on the old site.
- Submit the new sitemap in Google Search Console and watch the "Pages" report for 404s in the weeks after launch.
