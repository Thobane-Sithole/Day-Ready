import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db, ensureSchema } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  location: z.string().max(200).optional().nullable(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  color: z.string().optional(),
  reminderMin: z.number().int().optional().nullable(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await ctx.params;

  const body = await req.json();
  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  await ensureSchema();

  const existingRows = await db.select().from(events).where(and(eq(events.id, id), eq(events.userId, userId)));
  if (!existingRows[0]) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const [updated] = await db
    .update(events)
    .set(parsed.data)
    .where(and(eq(events.id, id), eq(events.userId, userId)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await ctx.params;

  await ensureSchema();
  await db.delete(events).where(and(eq(events.id, id), eq(events.userId, userId)));
  return NextResponse.json({ ok: true });
}
