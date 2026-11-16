// Route guides written for the new site (not imported from the old one).
// Same shape as the imported posts, plus `trip`: where the reading-progress
// button ("Rent a bike for this trip") goes, and what it says.
//
// Draft text from November 2026: distances and times are rounded and should be
// checked by the owner against real rides.

export type Trip = { href: string; label: string };

type Guide = {
  blogSlug: string;
  postSlug: string;
  path: string;
  category: string;
  title: string;
  subtitle: string | null;
  date: string;
  metaTitle: string;
  metaDescription: string;
  cover: string;
  html: string;
  trip: Trip;
};

const guide = (g: Omit<Guide, "blogSlug" | "path" | "category">): Guide => ({
  ...g,
  blogSlug: "news-2",
  path: `/blog/news-2/${g.postSlug}`,
  category: "News",
});

export const GUIDES: Guide[] = [
  guide({
    postSlug: "saigon-to-da-nang-by-motorbike-route-guide",
    title: "Saigon to Da Nang by Motorbike: Route Guide",
    subtitle: null,
    date: "2026-11-07",
    metaTitle: "Saigon to Da Nang by Motorbike – Route Guide | Red Lantern Bikes",
    metaDescription:
      "Ride from Saigon to Da Nang in 10 to 14 days: Da Lat's highlands, Nha Trang, the central coast and Hoi An. Route, stops, best season and which bike to rent one-way.",
    cover: "/photos/beach.webp",
    trip: { href: "/book?dropoff=DA_NANG", label: "Rent a bike for this trip" },
    html: `<p>Saigon to Da Nang is the first half of the classic north-south ride, and for many travellers it's the better half to do on two wheels: cool highlands, long empty beaches and the old town of Hoi An, all in about 1,000 kilometres. Take 10 to 14 days and you'll have time to stop, swim and get lost a little.</p>
<p>You pick the bike up at our shop in District 1 and leave it at our drop-off point in Da Nang. We bring it home, so you don't ride back.</p>
<h2>The route at a glance</h2>
<ul>
<li><strong>Saigon to Da Lat:</strong> about 300 km, through Bao Loc's tea and coffee country and up into the highlands.</li>
<li><strong>Da Lat to Nha Trang:</strong> about 135 km over the Khanh Le pass, one of the best descents in the south.</li>
<li><strong>Nha Trang to Quy Nhon:</strong> about 220 km along the coast, with quiet bays and fishing villages.</li>
<li><strong>Quy Nhon to Hoi An:</strong> about 300 km, best split in two days via Quang Ngai.</li>
<li><strong>Hoi An to Da Nang:</strong> about 30 km along the beach road.</li>
</ul>
<h2>Saigon to Da Lat (days 1 to 3)</h2>
<p>Leave Saigon early: the first hour out of the city is the hardest riding of the whole trip. Once past Dong Nai, the road climbs gently through rubber plantations and then the tea and coffee farms around Bao Loc, a good place to stop for the night if you don't want a long first day.</p>
<p>Da Lat sits at about 1,500 metres. Nights are cool, so pack a warm layer. Give yourself at least a full day here for the waterfalls, the lake, the coffee farms and the night market.</p>
<h2>Da Lat to Nha Trang (days 4 to 6)</h2>
<p>The road from Da Lat down to Nha Trang drops from pine forest to the sea in a couple of hours, through the curves of the Khanh Le pass. Ride it in the morning, when the clouds are lower and the traffic lighter. Nha Trang is busy, but the beaches just north of town are quieter.</p>
<h2>The central coast to Quy Nhon (days 7 and 8)</h2>
<p>North of Nha Trang the coast opens up: long beaches, lagoons and headlands. Quy Nhon is a relaxed city with good seafood and far fewer visitors than Nha Trang, a good place for a rest day.</p>
<h2>Quy Nhon to Hoi An and Da Nang (days 9 to 12)</h2>
<p>The last stretch runs through rice fields and fishing towns to Hoi An, whose old town is worth at least two nights. From there it's a short, flat ride up the beach road to Da Nang, where you drop the bike. If you still have time, ride the Hai Van Pass north of Da Nang as a day trip before you hand it back.</p>
<h2>When to go</h2>
<p>The central coast has its rainy season from around September to December, with the risk of storms in October and November. From January to August the weather is usually drier. The highlands around Da Lat get afternoon rain from about May to October, but mornings are often clear.</p>
<h2>Which bike?</h2>
<p>The roads are paved the whole way. A Honda XR150 or CB150X is comfortable for luggage and the mountain passes; a Honda Winner X is lighter and quick on the coast road. If you've never ridden a manual, the Honda Wave Alpha is easy to learn on, just slower on the climbs.</p>
<h2>Good to know</h2>
<ul>
<li>You need a Vietnamese motorbike licence or an International Driving Permit (1968 Vienna Convention) that covers motorbikes.</li>
<li>One-way rentals to Da Nang are at least 7 days. The one-way fee depends on the bike and is shown when you book.</li>
<li>Every rental includes a helmet, phone holder, luggage rack and roadside help by WhatsApp, wherever you are.</li>
</ul>`,
  }),
  guide({
    postSlug: "saigon-to-da-lat-by-motorbike",
    title: "Saigon to Da Lat by Motorbike: A Highland Loop",
    subtitle: null,
    date: "2026-11-06",
    metaTitle: "Saigon to Da Lat by Motorbike – Highland Loop | Red Lantern Bikes",
    metaDescription:
      "A 4 to 6 day motorbike loop from Saigon to Da Lat and back by the coast: tea country, pine forests, waterfalls and the beaches of Mui Ne. Route, tips and which bike to rent.",
    cover: "/photos/mountain-sunset.webp",
    trip: { href: "/book", label: "Rent a bike for this trip" },
    html: `<p>If you have less than a week, a loop from Saigon up to Da Lat and back along the coast is the best short ride in the south. You climb from the heat of the city into cool pine forest, then come down to the sea and ride home past fishing villages and sand dunes. Four to six days is enough; there's no need to ride far each day.</p>
<p>It's a round trip, so you pick up and return the bike at our shop in District 1.</p>
<h2>The loop</h2>
<ul>
<li><strong>Saigon to Da Lat:</strong> about 300 km, via Bao Loc's tea and coffee farms.</li>
<li><strong>Da Lat to Mui Ne:</strong> about 160 km, down from the highlands to the coast.</li>
<li><strong>Mui Ne to Saigon:</strong> about 220 km, along the coast and back into the city.</li>
</ul>
<h2>Up to Da Lat</h2>
<p>Start early to get out of the city before the traffic builds. The road is busy for the first hour, then calmer as it climbs. Bao Loc, about halfway, has tea hills and waterfalls and makes a good overnight stop if you'd rather not ride the whole way in one day.</p>
<h2>In Da Lat</h2>
<p>Da Lat is cool all year, so bring a jacket for the evenings. Spend a day or two riding out to the waterfalls and coffee farms around the city, or up towards Langbiang mountain for the views. The roads around town are hilly but well paved.</p>
<h2>Down to the coast</h2>
<p>The descent from the highlands to Mui Ne is long and winding, with big views on clear mornings. Mui Ne is known for its red and white sand dunes and its wind, and is an easy place to stop for a night or two.</p>
<h2>Back to Saigon</h2>
<p>The ride back follows the coast for a while, then heads inland to the city. Plan to arrive in daylight and avoid the evening rush hour.</p>
<h2>When to go</h2>
<p>From about December to April the weather is usually dry. From May to October, expect short, heavy afternoon showers, especially in the highlands, so ride in the mornings.</p>
<h2>Which bike?</h2>
<p>Any of our bikes can do this loop. For two people or lots of luggage, a 150cc such as the Honda XR150 or Winner X makes the climbs easier. Our weekly price applies from 7 days, if you'd like to take your time.</p>`,
  }),
  guide({
    postSlug: "ha-giang-loop-by-motorbike",
    title: "The Ha Giang Loop by Motorbike",
    subtitle: null,
    date: "2026-11-05",
    metaTitle: "The Ha Giang Loop by Motorbike – Guide | Red Lantern Bikes",
    metaDescription:
      "The Ha Giang loop in Vietnam's far north: Heaven's Gate, the Dong Van karst plateau and the Ma Pi Leng pass. Route, best season, safety and how to fit it into a Saigon to Hanoi ride.",
    cover: "/photos/karst-road.webp",
    trip: { href: "/contact", label: "Ask us about this trip" },
    html: `<p>The Ha Giang loop is the most spectacular ride in Vietnam: a few days of switchbacks, limestone peaks and deep river canyons right up against the Chinese border. It's a loop of roughly 350 kilometres from Ha Giang town, and most riders take three or four days.</p>
<p>Ha Giang is about 300 km north of Hanoi, past the end of our usual Saigon to Hanoi route. If you'd like to add it to a long ride north, message us and we'll help you plan the dates, the route and the drop-off.</p>
<h2>The loop</h2>
<ul>
<li><strong>Ha Giang town to Yen Minh:</strong> over Heaven's Gate at Quan Ba, with wide views across the karst.</li>
<li><strong>Yen Minh to Dong Van:</strong> onto the Dong Van karst plateau, a UNESCO Global Geopark.</li>
<li><strong>Dong Van to Meo Vac:</strong> over the Ma Pi Leng pass, high above the Nho Que river. The most famous stretch of the loop.</li>
<li><strong>Meo Vac back to Ha Giang:</strong> through quieter mountain villages, via Du Gia or back through Yen Minh.</li>
</ul>
<h2>When to go</h2>
<p>Autumn, from about September to November, is the favourite season: clear skies, rice terraces turning gold and, in October and November, pink buckwheat flowers. Spring is also good. Winter can be cold and foggy, and summer brings heavy rain and the risk of landslides.</p>
<h2>Is it for you?</h2>
<p>The roads are paved but steep, narrow and full of hairpins, with trucks and buses on blind corners. It's a ride for people already comfortable on a manual motorbike in the mountains. If you're not, local guides and drivers in Ha Giang offer the loop on the back of their bike.</p>
<ul>
<li>Carry your licence or International Driving Permit: police checks are common in the north.</li>
<li>Don't ride after dark, and allow extra time for fog and roadworks.</li>
<li>Pack warm, waterproof layers whatever the season.</li>
</ul>
<h2>Which bike?</h2>
<p>A dual-sport such as the Honda XR150 is ideal for the climbs, loose patches and roadworks. The Honda CB150X is more comfortable for long days with luggage. Tell us your plans and we'll suggest the right bike.</p>`,
  }),
];
