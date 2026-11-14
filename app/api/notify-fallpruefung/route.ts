import { stripe } from "@/app/lib/guard";
import { notifyFallpruefung } from "@/app/lib/notify";

export const dynamic = "force-dynamic";

const ALLOWED = ["https://einspruch.architect-dna.ch", "http://localhost:3000"];

// Client-side fallback right after Stripe redirects back with ?payment=success.
// The webhook (app/api/webhook/route.ts) is the primary path; either one sends the email once.
export async function POST(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  if (!ALLOWED.includes(origin)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { session_id } = await req.json().catch(() => ({}));
  if (!session_id || typeof session_id !== "string" || !session_id.startsWith("cs_")) {
    return Response.json({ error: "missing_session_id" }, { status: 400 });
  }
  try {
    const session = await stripe().checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") return Response.json({ error: "not_paid" }, { status: 402 });
    if (!session.metadata?.situation) return Response.json({ error: "not_a_fallpruefung_session" }, { status: 400 });
    await notifyFallpruefung(session, "client-fallback");
    return Response.json({ sent: true });
  } catch {
    return Response.json({ error: "notify_failed" }, { status: 500 });
  }
}
