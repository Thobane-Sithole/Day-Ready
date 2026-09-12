import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { meals } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

const foodItemSchema = z.object({
  name: z.string(),
  estimated_grams: z.number(),
  calories: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
});

const createMealSchema = z.object({
  imageDataUrl: z.string().startsWith("data:image/"),
  items: z.array(foodItemSchema),
  totalCalories: z.number().int().min(0),
  totalProtein: z.number().int().min(0).default(0),
  totalCarbs: z.number().int().min(0).default(0),
  totalFat: z.number().int().min(0).default(0),
  confidence: z.string().default("medium"),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const rows = db
    .select()
    .from(meals)
    .where(eq(meals.userId, userId))
    .orderBy(desc(meals.loggedAt))
    .all();

  const parsed = rows.map((r) => ({ ...r, items: JSON.parse(r.items) }));
  return NextResponse.json(parsed);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const parsed = createMealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const inserted = db
    .insert(meals)
    .values({
      userId,
      imageDataUrl: parsed.data.imageDataUrl,
      items: JSON.stringify(parsed.data.items),
      totalCalories: parsed.data.totalCalories,
      totalProtein: parsed.data.totalProtein,
      totalCarbs: parsed.data.totalCarbs,
      totalFat: parsed.data.totalFat,
      confidence: parsed.data.confidence,
      notes: parsed.data.notes,
    })
    .returning()
    .get();

  return NextResponse.json({ ...inserted, items: JSON.parse(inserted.items) }, { status: 201 });
}
