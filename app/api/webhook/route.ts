import Stripe from "stripe";
import { stripe, creditsLeft } from "@/app/lib/guard";
import { notifyFallpruefung } from "@/app/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  // Real Stripe webhook (signed)
  if (sig) {
    const body = await req.text();
    let event: Stripe.Event;
    try {
      event = stripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? "");
    } catch {
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }
    if (event.type === "checkout.session.completed") {
      try {
        await notifyFallpruefung(event.data.object as Stripe.Checkout.Session, "webhook");
      } catch (err) {
        console.error("Fallprüfung notify failed", err);
      }
    }
    return Response.json({ received: true });
  }

  // After the success redirect: how many premium letters this purchase still has.
  // The session id is the token the browser keeps; credits are counted on the server.
  const { session_id } = await req.json().catch(() => ({}));
  const left = await creditsLeft(session_id, "einspruch_premium");
  if (left <= 0) return Response.json({ granted: 0 }, { status: 402 });
  return Response.json({ granted: left, token: session_id });
}
