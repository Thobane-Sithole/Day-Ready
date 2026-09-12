import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Navbar from "@/components/Navbar";
import SettingsClient from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;

  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) redirect("/login");

  return (
    <>
      <Navbar userName={session.user.name} />
      <div className="container py-4" style={{ maxWidth: 700 }}>
        <h1 className="h3 mb-1">Settings</h1>
        <p className="text-muted mb-4">Manage your profile, goals, and data.</p>
        <SettingsClient
          initialSettings={{
            id: user.id,
            name: user.name,
            email: user.email,
            timezone: user.timezone,
            dailyCalorieGoal: user.dailyCalorieGoal,
            proteinGoalG: user.proteinGoalG,
            carbsGoalG: user.carbsGoalG,
            fatGoalG: user.fatGoalG,
            theme: user.theme as "light" | "dark",
          }}
        />
      </div>
    </>
  );
}
