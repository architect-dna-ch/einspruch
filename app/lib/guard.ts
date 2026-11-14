import Stripe from "stripe";
import { timingSafeEqual } from "crypto";

// Server-side checks for the paid parts. Credits live on the Stripe PaymentIntent of the purchase
// (metadata "used"), so they can't be faked in the browser and a payment can't be replayed.

export const CREDITS_PER_PACK = 10;

let stripeClient: Stripe | null = null;
export function stripe(): Stripe {
  // Lazy: building without STRIPE_SECRET_KEY (local, preview) must not crash.
  if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
  return stripeClient;
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}

// Best-effort limiter per server instance (no database). It caps abuse; it is not a hard quota.
const hits = new Map<string, number[]>();
export function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) { hits.set(key, list); return false; }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return true;
}

export function clip(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export function isAdmin(code: unknown): boolean {
  const real = process.env.PREMIUM_CODE ?? "";
  if (typeof code !== "string" || !real || code.length !== real.length) return false;
  return timingSafeEqual(Buffer.from(code), Buffer.from(real));
}

/** The PaymentIntent behind a paid credit pack, or null if the session isn't a paid pack. */
async function packIntent(sessionId: unknown, product: string): Promise<Stripe.PaymentIntent | null> {
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) return null;
  try {
    const s = await stripe().checkout.sessions.retrieve(sessionId, { expand: ["payment_intent"] });
    if (s.payment_status !== "paid") return null;
    const md = s.metadata ?? {};
    if (md.product && md.product !== product) return null;
    if (md.situation) return null;                          // a different purchase (Fallprüfung), not credits
    const pi = s.payment_intent;
    return pi && typeof pi !== "string" ? pi : null;
  } catch {
    return null;
  }
}

export async function creditsLeft(sessionId: unknown, product: string): Promise<number> {
  const pi = await packIntent(sessionId, product);
  if (!pi) return 0;
  return Math.max(0, CREDITS_PER_PACK - parseInt(pi.metadata?.used ?? "0", 10));
}

/** Use one credit. Returns the credits left after, or -1 if there was none to use. */
export async function spendCredit(sessionId: unknown, product: string): Promise<number> {
  const pi = await packIntent(sessionId, product);
  if (!pi) return -1;
  const used = parseInt(pi.metadata?.used ?? "0", 10);
  if (used >= CREDITS_PER_PACK) return -1;
  await stripe().paymentIntents.update(pi.id, { metadata: { used: String(used + 1) } });
  return CREDITS_PER_PACK - used - 1;
}
