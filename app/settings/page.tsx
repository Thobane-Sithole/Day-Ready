import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, ensureSchema } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Settings as SettingsIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import SettingsClient from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;

  await ensureSchema();
  const rows = await db.select().from(users).where(eq(users.id, userId));
  const user = rows[0];
  if (!user) redirect("/login");

  return (
    <>
      <Navbar userName={session.user.name} />
      <div className="container py-4" style={{ maxWidth: 700 }}>
        <h1 className="h3 mb-1 d-flex align-items-center gap-2">
          <span className="dr-panel-icon dr-panel-icon--indigo">
            <SettingsIcon size={18} strokeWidth={2.25} />
          </span>
          Settings
        </h1>
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
