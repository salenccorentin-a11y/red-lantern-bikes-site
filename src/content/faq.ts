// Frequently asked questions. Draft: answers marked "confirm" in the comments
// are not on the old site and need checking before launch.

export type Faq = { id: string; question: string; answer: string[] };

export const FAQ: Faq[] = [
  {
    id: "licence",
    question: "Which licence do I need?",
    answer: [
      "Your home country driving licence on its own is not valid in Vietnam.",
      "For bikes from 50cc to 175cc (all our bikes except the Kawasaki Versys X300), you need a Vietnamese motorcycle licence, or an International Driving Permit issued under the 1949 Geneva Convention that includes motorbikes.",
      "For bikes over 175cc, like the Versys X300, you need a full Vietnamese motorcycle licence.",
    ],
  },
  {
    id: "booking",
    question: "How does booking and the deposit work?",
    answer: [
      "Choose your dates and bike on the booking page and you'll see the full price. To hold the bike, you pay a 1,500,000₫ deposit online (or the whole price, if it's less). The deposit is part of the price, not extra, and the balance is paid when you pick up.",
      "We hold the bike for 24 hours while your deposit arrives. The deposit is non-refundable.",
    ],
  },
  {
    id: "payment",
    question: "How can I pay?",
    answer: [
      "The online deposit can be paid by bank transfer to Vietcombank or by e-wallet QR code (Momo, ZaloPay or VNPay). The balance can be paid in cash at pick-up. We don't take cards yet.",
    ],
  },
  {
    id: "prices",
    question: "How are long rentals priced?",
    answer: [
      "Every bike has a daily, weekly and monthly price per day. From 7 days the weekly price applies to every day of the rental, and from 30 days the monthly price. A rental never costs more than a longer one: if 30 days would be cheaper than 26, you pay the 30-day price.",
      "Both your pick-up day and your drop-off day count as rental days.",
    ],
  },
  {
    id: "included",
    question: "What's included?",
    answer: [
      "Every bike comes with a full-face helmet, a phone holder, a luggage rack and bungee cords, a printed map of our favourite roads, and roadside assistance anywhere in Vietnam.",
    ],
  },
  {
    // Confirm: the old site says insurance is "an optional extra at a small additional cost".
    id: "insurance",
    question: "Is insurance included?",
    answer: [
      "Insurance is available as an optional extra at a small cost. Ask us about it when you book or pick up.",
    ],
  },
  {
    id: "breakdown",
    question: "What if the bike breaks down?",
    answer: [
      "Message us on WhatsApp, wherever you are in Vietnam. We'll talk you through it, find a mechanic near you, or arrange help.",
    ],
  },
  {
    id: "one-way",
    question: "How do one-way rentals work?",
    answer: [
      "Pick up in Saigon and leave the bike at our partner drop-off point in Hanoi (rentals of 12 days or more) or Da Nang (7 days or more). A one-way fee, depending on the bike, is added to the price. We take care of getting the bike back to Saigon.",
    ],
  },
  {
    id: "start-north",
    question: "Can I start in Hanoi or Da Nang?",
    answer: [
      "We arrange trips from Hanoi or Da Nang to Saigon by hand, so they can't be booked online. Send us a message with your dates and the bike you'd like, and we'll let you know what we can do.",
    ],
  },
  {
    id: "early-return",
    question: "What if I bring the bike back early?",
    answer: ["No problem, but the price stays the same as booked: we don't refund unused days."],
  },
  {
    id: "cancel",
    question: "Can I cancel?",
    answer: [
      "Yes. The online deposit is non-refundable; you don't owe anything beyond it. If your plans change, message us and we'll try to move your dates instead.",
    ],
  },
  {
    // Confirm: the old site mentions hotel delivery in District 1 "for a small fee".
    id: "delivery",
    question: "Can you deliver the bike to my hotel?",
    answer: [
      "In District 1, yes, for a small fee. Mention it in the note when you book, or message us.",
    ],
  },
];
