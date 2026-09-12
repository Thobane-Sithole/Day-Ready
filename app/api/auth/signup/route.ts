import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, ensureSchema } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  timezone: z.string().optional(),
  dailyCalorieGoal: z.number().int().min(500).max(10000).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password, timezone, dailyCalorieGoal } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    await ensureSchema();

    const existingRows = await db.select().from(users).where(eq(users.email, normalizedEmail));
    if (existingRows[0]) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [inserted] = await db
      .insert(users)
      .values({
        name,
        email: normalizedEmail,
        passwordHash,
        timezone: timezone || "UTC",
        dailyCalorieGoal: dailyCalorieGoal || 2000,
      })
      .returning();

    return NextResponse.json({ id: inserted.id, email: inserted.email }, { status: 201 });
  } catch (err) {
    console.error("signup error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
