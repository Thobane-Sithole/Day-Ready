import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  location: z.string().max(200).optional(),
  startAt: z.string().min(1, "Start time is required"),
  endAt: z.string().min(1, "End time is required"),
  color: z.string().optional(),
  reminderMin: z.number().int().min(0).max(10080).optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const rows = db.select().from(events).where(eq(events.userId, userId)).all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  if (new Date(parsed.data.endAt) <= new Date(parsed.data.startAt)) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  // Conflict detection: warn (but still allow) if overlapping.
  const existingEvents = db.select().from(events).where(eq(events.userId, userId)).all();
  const newStart = new Date(parsed.data.startAt).getTime();
  const newEnd = new Date(parsed.data.endAt).getTime();
  const conflict = existingEvents.some((e) => {
    const s = new Date(e.startAt).getTime();
    const en = new Date(e.endAt).getTime();
    return newStart < en && newEnd > s;
  });

  const inserted = db
    .insert(events)
    .values({
      userId,
      title: parsed.data.title,
      location: parsed.data.location,
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt,
      color: parsed.data.color ?? "#6C63FF",
      reminderMin: parsed.data.reminderMin ?? null,
    })
    .returning()
    .get();

  return NextResponse.json({ event: inserted, conflict }, { status: 201 });
}
