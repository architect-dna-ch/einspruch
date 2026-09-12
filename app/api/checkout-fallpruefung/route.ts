import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.json();
  const { kategorie, betrag, situation, email, name } = body ?? {};

  if (!situation || typeof situation !== "string" || !email || typeof email !== "string") {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    currency: "chf",
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: "chf",
          product_data: {
            name: "Fallprüfung — Ersteinschätzung",
            description: "Einmalige Ersteinschätzung: weiterverfolgen oder nicht, mit Begründung.",
          },
          unit_amount: 500,
        },
        quantity: 1,
      },
    ],
    metadata: {
      kategorie: String(kategorie ?? "").slice(0, 200),
      betrag: String(betrag ?? "").slice(0, 200),
      situation: String(situation).slice(0, 480),
      kontakt_name: String(name ?? "").slice(0, 200),
      kontakt_email: String(email).slice(0, 200),
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/fallpruefung?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/fallpruefung?payment=cancelled`,
  });

  return Response.json({ url: session.url });
}
