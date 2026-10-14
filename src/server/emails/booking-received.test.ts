import { describe, expect, it } from "vitest";
import { bookingReceivedEmail, type BookingEmailData } from "@/server/emails/booking-received";

const data: BookingEmailData = {
  to: "rider@example.com",
  customerName: "Sam <script>",
  reference: "RLB-482913",
  bikeName: "Honda XR150",
  startDate: "2026-11-01",
  endDate: "2026-11-12",
  days: 12,
  dropoffLabel: "Hanoi (one-way)",
  totalVnd: 5_800_000,
  depositVnd: 1_500_000,
  balanceVnd: 4_300_000,
  holdExpires: "16 Oct 2026, 10:00",
  bookingUrl: "https://redlanternbikes.com/booking/abc",
};

describe("bookingReceivedEmail", () => {
  const email = bookingReceivedEmail(data);

  it("puts the reference in the subject", () => {
    expect(email.subject).toBe("Booking RLB-482913: please pay your deposit");
  });

  it("lists the amounts, the hold time and the payment link", () => {
    for (const part of [
      "5.800.000₫",
      "1.500.000₫",
      "4.300.000₫",
      "16 Oct 2026, 10:00",
      data.bookingUrl,
    ]) {
      expect(email.text).toContain(part);
      expect(email.html).toContain(part);
    }
  });

  it("escapes customer-supplied text in the HTML version", () => {
    expect(email.html).toContain("Sam &lt;script&gt;");
    expect(email.html).not.toContain("<script>");
  });
});
