import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    currency: "chf",
    line_items: [
      {
        price_data: {
          currency: "chf",
          product_data: { name: "Einspruch Premium — 10 Briefe" },
          unit_amount: 490,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_URL}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}?payment=cancelled`,
  });

  return Response.json({ url: session.url });
}
