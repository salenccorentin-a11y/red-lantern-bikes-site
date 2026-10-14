// Transactional email through Resend's HTTP API (https://resend.com/docs/api-reference).
// Without RESEND_API_KEY (local development), emails are printed in the
// terminal instead of sent.

export type Email = {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Where replies go, e.g. the customer who sent an enquiry. */
  replyTo?: string;
};

export async function sendEmail(email: Email): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Local development: print the email so links (like staff sign-in) can be used.
    console.info(
      `[email not sent: RESEND_API_KEY is not set] to=${email.to} "${email.subject}"\n${email.text}`,
    );
    return { sent: false };
  }
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("Missing environment variable EMAIL_FROM. See .env.example.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      html: email.html,
      ...(email.replyTo && { reply_to: email.replyTo }),
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend refused the email (${response.status}): ${await response.text()}`);
  }
  return { sent: true };
}
