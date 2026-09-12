import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, events, meals, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Navbar from "@/components/Navbar";
import ProgressRing from "@/components/dashboard/ProgressRing";
import TaskPanel from "@/components/tasks/TaskPanel";
import SchedulePanel from "@/components/dashboard/SchedulePanel";
import NutritionPanel from "@/components/dashboard/NutritionPanel";
import type { Task, Event, Meal, FoodItem } from "@/lib/types";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;

  const user = db.select().from(users).where(eq(users.id, userId)).get();

  const allTasks = db.select().from(tasks).where(eq(tasks.userId, userId)).all() as Task[];
  const allEvents = db.select().from(events).where(eq(events.userId, userId)).all() as Event[];
  const allMealsRaw = db.select().from(meals).where(eq(meals.userId, userId)).all();

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

  const greetingHour = now.getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <Navbar userName={session.user.name} />

      <div className="dr-briefing-band">
        <div className="container">
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
      </div>

      <div className="container py-4">
        <div className="row g-4">
          <div className="col-lg-4">
            <TaskPanel initialTasks={allTasks} />
          </div>
          <div className="col-lg-4">
            <SchedulePanel events={todaysEvents} />
          </div>
          <div className="col-lg-4">
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
