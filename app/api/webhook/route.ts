import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  if (sig) {
    const body = await req.text();
    try {
      stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
      return Response.json({ received: true });
    } catch {
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }
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
