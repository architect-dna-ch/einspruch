import { stripe, allow, clientIp, clip } from "@/app/lib/guard";

export async function POST(req: Request) {
  if (!allow(`checkout:${clientIp(req)}`, 10, 3_600_000)) return Response.json({ error: "rate_limited" }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const { kategorie, betrag, situation, email, name } = body ?? {};

  if (!situation || typeof situation !== "string" || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }

  const session = await stripe().checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    currency: "chf",
    customer_email: email.slice(0, 200),
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
      product: "einspruch_fallpruefung",
      kategorie: clip(kategorie, 200),
      betrag: clip(String(betrag ?? ""), 200),
      situation: clip(situation, 480),
      kontakt_name: clip(name, 200),
      kontakt_email: email.slice(0, 200),
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/fallpruefung?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/fallpruefung?payment=cancelled`,
  });

  return Response.json({ url: session.url });
}
