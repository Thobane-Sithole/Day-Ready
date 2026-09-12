import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, ensureSchema } from "@/lib/db";
import { meals, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Navbar from "@/components/Navbar";
import NutritionClient from "@/components/nutrition/NutritionClient";
import type { Meal, FoodItem } from "@/lib/types";

export default async function NutritionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;

  await ensureSchema();

  const [userRows, rows] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)),
    db.select().from(meals).where(eq(meals.userId, userId)).orderBy(desc(meals.loggedAt)),
  ]);
  const user = userRows[0];

  const allMeals: Meal[] = rows.map((r) => ({ ...r, items: JSON.parse(r.items) as FoodItem[] }));

  return (
    <>
      <Navbar userName={session.user.name} />
      <div className="container py-4" style={{ maxWidth: 800 }}>
        <h1 className="h3 mb-1">Nutrition</h1>
        <p className="text-muted mb-4">Snap a photo of your plate and we&apos;ll estimate the calories.</p>
        <NutritionClient initialMeals={allMeals} calorieGoal={user?.dailyCalorieGoal ?? 2000} />
      </div>
    </>
  );
}
