import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, ensureSchema } from "@/lib/db";
import { meals } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await ctx.params;

  await ensureSchema();
  await db.delete(meals).where(and(eq(meals.id, id), eq(meals.userId, userId)));
  return NextResponse.json({ ok: true });
}
