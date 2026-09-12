import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueAt: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  category: z.string().max(50).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const rows = db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(desc(tasks.createdAt))
    .all();

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const inserted = db
    .insert(tasks)
    .values({
      userId,
      title: parsed.data.title,
      description: parsed.data.description,
      dueAt: parsed.data.dueAt ?? null,
      priority: parsed.data.priority ?? "MEDIUM",
      category: parsed.data.category,
    })
    .returning()
    .get();

  return NextResponse.json(inserted, { status: 201 });
}
