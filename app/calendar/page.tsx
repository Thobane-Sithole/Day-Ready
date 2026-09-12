import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, ensureSchema } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CalendarClock } from "lucide-react";
import Navbar from "@/components/Navbar";
import CalendarView from "@/components/calendar/CalendarView";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;

  await ensureSchema();
  const allEvents = await db.select().from(events).where(eq(events.userId, userId));

  return (
    <>
      <Navbar userName={session.user.name} />
      <div className="container py-4">
        <h1 className="h3 mb-1 d-flex align-items-center gap-2">
          <span className="dr-panel-icon dr-panel-icon--marigold">
            <CalendarClock size={18} strokeWidth={2.25} />
          </span>
          Calendar &amp; bookings
        </h1>
        <p className="text-muted mb-4">Click a day to add a booking, or drag events to reschedule.</p>
        <CalendarView initialEvents={allEvents} />
      </div>
    </>
  );
}
