import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { meals } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await ctx.params;

  db.delete(meals).where(and(eq(meals.id, id), eq(meals.userId, userId))).run();
  return NextResponse.json({ ok: true });
}
