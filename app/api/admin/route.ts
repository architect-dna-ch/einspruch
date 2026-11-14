import { isAdmin, allow, clientIp } from "@/app/lib/guard";

export async function POST(req: Request) {
  if (!allow(`admin:${clientIp(req)}`, 5, 3_600_000)) return Response.json({ granted: 0 }, { status: 429 });
  const { token } = await req.json().catch(() => ({}));
  if (!isAdmin(token)) return Response.json({ granted: 0 }, { status: 403 });
  return Response.json({ granted: 999999 });
}
