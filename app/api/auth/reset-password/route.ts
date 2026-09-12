import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db, ensureSchema } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  await ensureSchema();

  const hashedToken = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const rows = await db.select().from(users).where(eq(users.resetToken, hashedToken));
  const user = rows[0];

  if (!user || !user.resetTokenExpiresAt || new Date(user.resetTokenExpiresAt) < new Date()) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Please request a new one." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await db
    .update(users)
    .set({ passwordHash, resetToken: null, resetTokenExpiresAt: null })
    .where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
