import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, ensureSchema } from "@/lib/db";
import { tasks, events, meals, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CheckCircle2, CalendarClock, Flame } from "lucide-react";
import Navbar from "@/components/Navbar";
import ProgressRing from "@/components/dashboard/ProgressRing";
import TaskPanel from "@/components/tasks/TaskPanel";
import SchedulePanel from "@/components/dashboard/SchedulePanel";
import NutritionPanel from "@/components/dashboard/NutritionPanel";
import type { Meal, FoodItem, Task } from "@/lib/types";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;

  await ensureSchema();

  const [userRows, allTasks, allEvents, allMealsRaw] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)),
    db.select().from(tasks).where(eq(tasks.userId, userId)),
    db.select().from(events).where(eq(events.userId, userId)),
    db.select().from(meals).where(eq(meals.userId, userId)),
  ]);
  const user = userRows[0];

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const todaysEvents = allEvents.filter((e) => {
    const s = new Date(e.startAt);
    return s >= startOfDay && s < endOfDay;
  });

  const todaysMeals: Meal[] = allMealsRaw
    .filter((m) => {
      const d = new Date(m.loggedAt);
      return d >= startOfDay && d < endOfDay;
    })
    .map((m) => ({ ...m, items: JSON.parse(m.items) as FoodItem[] }));

  const doneCount = allTasks.filter((t) => t.completed).length;
  const percentDone = allTasks.length > 0 ? (doneCount / allTasks.length) * 100 : 0;
  const todaysCalories = todaysMeals.reduce((sum, m) => sum + m.totalCalories, 0);

  const greetingHour = now.getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <Navbar userName={session.user.name} />

      <div className="dr-briefing-band">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <p className="dr-briefing-date mb-2">
                {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <h1>
                {greeting}, {session.user.name?.split(" ")[0] || "there"}.
              </h1>
              <div className="mt-4">
                <ProgressRing
                  percent={percentDone}
                  label={`${doneCount} of ${allTasks.length} tasks done`}
                  sublabel={
                    todaysEvents.length > 0
                      ? `${todaysEvents.length} thing${todaysEvents.length === 1 ? "" : "s"} on today's schedule`
                      : "Nothing booked today"
                  }
                />
              </div>
            </div>
            <div className="col-lg-6">
              <div className="d-flex flex-wrap gap-3 justify-content-lg-end">
                <div className="dr-stat-chip dr-stat-chip--indigo">
                  <span className="dr-stat-chip-icon">
                    <CheckCircle2 size={18} strokeWidth={2.25} />
                  </span>
                  <div>
                    <div className="dr-stat-chip-value">{doneCount}/{allTasks.length}</div>
                    <div className="dr-stat-chip-label">Tasks done</div>
                  </div>
                </div>
                <div className="dr-stat-chip dr-stat-chip--marigold">
                  <span className="dr-stat-chip-icon">
                    <CalendarClock size={18} strokeWidth={2.25} />
                  </span>
                  <div>
                    <div className="dr-stat-chip-value">{todaysEvents.length}</div>
                    <div className="dr-stat-chip-label">On today&apos;s calendar</div>
                  </div>
                </div>
                <div className="dr-stat-chip dr-stat-chip--sage">
                  <span className="dr-stat-chip-icon">
                    <Flame size={18} strokeWidth={2.25} />
                  </span>
                  <div>
                    <div className="dr-stat-chip-value">{todaysCalories}</div>
                    <div className="dr-stat-chip-label">kcal logged</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div className="row g-4">
          <div className="col-lg-4" data-aos="fade-up" data-aos-delay="0">
            <TaskPanel initialTasks={allTasks as Task[]} />
          </div>
          <div className="col-lg-4" data-aos="fade-up" data-aos-delay="100">
            <SchedulePanel events={todaysEvents} />
          </div>
          <div className="col-lg-4" data-aos="fade-up" data-aos-delay="200">
            <NutritionPanel
              meals={todaysMeals}
              calorieGoal={user?.dailyCalorieGoal ?? 2000}
              proteinGoal={user?.proteinGoalG ?? 120}
              carbsGoal={user?.carbsGoalG ?? 250}
              fatGoal={user?.fatGoalG ?? 70}
            />
          </div>
        </div>
      </div>
    </>
  );
}
