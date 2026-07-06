export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token || typeof token !== "string" || token !== process.env.PREMIUM_CODE) {
    return Response.json({ granted: 0 }, { status: 403 });
  }

  return Response.json({ granted: 999999 });
}
