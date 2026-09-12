import Stripe from "stripe";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const dynamic = "force-dynamic";

const NOTIFY_TO = "ma.akd@proton.me";
const NOTIFY_FROM = "Einspruch Fallprüfung <fallpruefung@architect-dna.ch>";

async function notifyFallpruefung(session: Stripe.Checkout.Session) {
  const md = session.metadata ?? {};
  if (!md.situation) return; // not a Fallprüfung purchase

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: NOTIFY_FROM,
    to: NOTIFY_TO,
    replyTo: md.kontakt_email || undefined,
    subject: `Neue Fallprüfung: ${md.kategorie || "?"} · CHF ${md.betrag || "?"}`,
    text: [
      `Neue bezahlte Fallprüfung (CHF 5) eingegangen.`,
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
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  if (sig) {
    const body = await req.text();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch {
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      try {
        await notifyFallpruefung(event.data.object as Stripe.Checkout.Session);
      } catch (err) {
        console.error("Fallprüfung notify failed", err);
      }
    }

    return Response.json({ received: true });
  }

  const { session_id } = await req.json();
  if (!session_id || typeof session_id !== "string") {
    return Response.json({ granted: 0 }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === "paid") {
      return Response.json({ granted: 10 });
    }
    return Response.json({ granted: 0 }, { status: 402 });
  } catch {
    return Response.json({ granted: 0 }, { status: 400 });
  }
}
