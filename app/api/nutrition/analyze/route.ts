import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { analyzeFoodImage } from "@/lib/foodVision";

const analyzeSchema = z.object({
  imageDataUrl: z.string().startsWith("data:image/"),
});

// Very small in-memory rate limiter: max 10 analyses / user / hour.
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return timestamps.length > RATE_LIMIT;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  if (isRateLimited(userId)) {
    return NextResponse.json(
      { error: "You've hit the hourly limit for meal scans. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid image is required." }, { status: 400 });
  }

  const match = parsed.data.imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "Malformed image data." }, { status: 400 });
  }
  const [, mediaType, base64Data] = match;

  try {
    const analysis = await analyzeFoodImage(base64Data, mediaType);
    return NextResponse.json(analysis);
  } catch (err) {
    console.error("food analysis error", err);
    const message = err instanceof Error ? err.message : "Analysis failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
