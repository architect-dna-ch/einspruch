import Stripe from "stripe";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const NOTIFY_TO = "ma.akd@proton.me";
const NOTIFY_FROM = "Einspruch Fallprüfung <fallpruefung@architect-dna.ch>";

const ALLOWED = ["https://einspruch.architect-dna.ch", "http://localhost:3000"];

// Client-side fallback: called right after Stripe redirects back with ?payment=success.
// The webhook (app/api/webhook/route.ts) is the primary, reliable path — this just
// covers the case where the webhook isn't configured or hasn't fired yet.
export async function POST(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  if (!ALLOWED.includes(origin)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { session_id } = await req.json();
  if (!session_id || typeof session_id !== "string") {
    return Response.json({ error: "missing_session_id" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await stripe.checkout.sessions.retrieve(session_id);

  if (session.payment_status !== "paid") {
    return Response.json({ error: "not_paid" }, { status: 402 });
  }

  const md = session.metadata ?? {};
  if (!md.situation) {
    return Response.json({ error: "not_a_fallpruefung_session" }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: NOTIFY_FROM,
    to: NOTIFY_TO,
    replyTo: md.kontakt_email || undefined,
    subject: `Neue Fallprüfung: ${md.kategorie || "?"} · CHF ${md.betrag || "?"}`,
    text: [
      `Neue bezahlte Fallprüfung (CHF 5) eingegangen. (client-fallback)`,
      ``,
      `Name: ${md.kontakt_name || "-"}`,
      `E-Mail: ${md.kontakt_email || "-"}`,
      `Kategorie: ${md.kategorie || "-"}`,
      `Betrag: CHF ${md.betrag || "-"}`,
      ``,
      `Situation:`,
      md.situation,
      ``,
      `Stripe Session: ${session.id}`,
    ].join("\n"),
  });

  return Response.json({ sent: true });
}
