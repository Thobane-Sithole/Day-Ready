import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  dueAt: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  category: z.string().max(50).optional().nullable(),
  completed: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await ctx.params;

  const body = await req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const existing = db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .get();
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const updates: Record<string, unknown> = { ...parsed.data };
  if (typeof parsed.data.completed === "boolean") {
    updates.completedAt = parsed.data.completed ? new Date().toISOString() : null;
  }

  const updated = db
    .update(tasks)
    .set(updates)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning()
    .get();

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await ctx.params;

  db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).run();
  return NextResponse.json({ ok: true });
}
