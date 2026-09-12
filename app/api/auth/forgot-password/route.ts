import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { db, ensureSchema } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendPasswordResetEmail, sendGoogleOnlyNotice } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

// Small in-memory rate limiter: max 5 requests / email / hour, to stop
// someone from hammering the reset endpoint for a given address.
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return timestamps.length > RATE_LIMIT;
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();

  // Always return the same generic response whether or not the account
  // exists, so this endpoint can't be used to discover registered emails.
  const genericResponse = NextResponse.json({
    ok: true,
    message: "If an account exists for that email, we've sent a reset link.",
  });

  if (isRateLimited(email)) {
    return genericResponse;
  }

  await ensureSchema();
  const rows = await db.select().from(users).where(eq(users.email, email));
  const user = rows[0];
  if (!user) {
    return genericResponse;
  }

  if (!user.passwordHash) {
    // Account exists but was created via Google — nothing to reset.
    await sendGoogleOnlyNotice(email);
    return genericResponse;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await db
    .update(users)
    .set({ resetToken: hashedToken, resetTokenExpiresAt: expiresAt })
    .where(eq(users.id, user.id));

  const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch (err) {
    console.error("password reset email failed", err);
    // Still return the generic response — don't leak delivery failures either.
  }

  return genericResponse;
}
