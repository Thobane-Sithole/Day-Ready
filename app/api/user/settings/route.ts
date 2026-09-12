import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db, ensureSchema } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const settingsSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  timezone: z.string().optional(),
  dailyCalorieGoal: z.number().int().min(500).max(10000).optional(),
  proteinGoalG: z.number().int().min(0).max(1000).optional(),
  carbsGoalG: z.number().int().min(0).max(2000).optional(),
  fatGoalG: z.number().int().min(0).max(1000).optional(),
  theme: z.enum(["light", "dark"]).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  await ensureSchema();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      timezone: users.timezone,
      dailyCalorieGoal: users.dailyCalorieGoal,
      proteinGoalG: users.proteinGoalG,
      carbsGoalG: users.carbsGoalG,
      fatGoalG: users.fatGoalG,
      theme: users.theme,
    })
    .from(users)
    .where(eq(users.id, userId));

  return NextResponse.json(rows[0]);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  await ensureSchema();
  const [updated] = await db.update(users).set(parsed.data).where(eq(users.id, userId)).returning();
  const { passwordHash: _passwordHash, ...safeUser } = updated;
  return NextResponse.json(safeUser);
}
