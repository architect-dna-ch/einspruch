import Stripe from "stripe";
import { Resend } from "resend";
import { stripe } from "@/app/lib/guard";

const NOTIFY_TO = process.env.NOTIFY_TO ?? "ma.akd@proton.me";
const NOTIFY_FROM = "Einspruch Fallprüfung <fallpruefung@architect-dna.ch>";

/** Email one paid Fallprüfung to the owner — once per payment, however often it's triggered. */
export async function notifyFallpruefung(session: Stripe.Checkout.Session, via: string): Promise<boolean> {
  const md = session.metadata ?? {};
  if (!md.situation || session.payment_status !== "paid") return false;
  const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (piId) {
    const pi = await stripe().paymentIntents.retrieve(piId);
    if (pi.metadata?.notified) return true;                       // already sent
    await stripe().paymentIntents.update(piId, { metadata: { notified: "1" } });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: NOTIFY_FROM,
    to: NOTIFY_TO,
    replyTo: md.kontakt_email || undefined,
    subject: `Neue Fallprüfung: ${md.kategorie || "?"} · CHF ${md.betrag || "?"}`,
    text: [
      `Neue bezahlte Fallprüfung (CHF 5) eingegangen. (${via})`,
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
  return true;
}
