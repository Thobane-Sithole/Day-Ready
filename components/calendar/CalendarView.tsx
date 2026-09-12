"use client";

import { useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { type DateClickArg, type EventResizeDoneArg } from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg, DatesSetArg } from "@fullcalendar/core";
import toast from "react-hot-toast";
import EventModal, { type EventDraft } from "./EventModal";
import type { Event } from "@/lib/types";

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

const emptyDraft = (start?: Date, end?: Date): EventDraft => ({
  title: "",
  location: "",
  startAt: toLocalInput(start ?? new Date()),
  endAt: toLocalInput(end ?? new Date(Date.now() + 60 * 60 * 1000)),
  color: "#2B3467",
  reminderMin: "",
});

export default function CalendarView({ initialEvents }: { initialEvents: Event[] }) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

  function openNew(start?: Date, end?: Date) {
    setDraft(emptyDraft(start, end));
  }

  function openEdit(event: Event) {
    setDraft({
      id: event.id,
      title: event.title,
      location: event.location ?? "",
      startAt: toLocalInput(new Date(event.startAt)),
      endAt: toLocalInput(new Date(event.endAt)),
      color: event.color ?? "#2B3467",
      reminderMin: event.reminderMin ?? "",
    });
  }

  async function handleSave(form: EventDraft) {
    const payload = {
      title: form.title,
      location: form.location || undefined,
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      color: form.color,
      reminderMin: form.reminderMin === "" ? null : form.reminderMin,
    };

    try {
      if (form.id) {
        const res = await fetch(`/api/events/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const updated: Event = await res.json();
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        toast.success("Booking updated.");
      } else {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
        const { event: created, conflict } = await res.json();
        setEvents((prev) => [...prev, created]);
        if (conflict) {
          toast("Saved — heads up, this overlaps another booking.", { icon: "⚠️" });
        } else {
          toast.success("Booking added.");
        }
      }
      setDraft(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save that booking.");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setDraft(null);
      toast.success("Booking removed.");
    } catch {
      toast.error("Couldn't remove that booking.");
    }
  }

  async function handleDropOrResize(arg: EventDropArg | EventResizeDoneArg) {
    const { event } = arg;
    if (!event.start || !event.end) return;
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt: event.start.toISOString(), endAt: event.end.toISOString() }),
      });
      if (!res.ok) throw new Error();
      const updated: Event = await res.json();
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      toast.success("Booking rescheduled.");
    } catch {
      toast.error("Couldn't reschedule — reverting.");
      arg.revert();
    }
  }

  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startAt,
    end: e.endAt,
    backgroundColor: e.color ?? "#2B3467",
    borderColor: e.color ?? "#2B3467",
  }));

  return (
    <div className="dr-card" data-aos="fade-up">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 mb-0">Your calendar</h2>
        <button className="btn btn-primary btn-sm" onClick={() => openNew()}>
          + New booking
        </button>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
        selectable
        editable
        events={calendarEvents}
        height="auto"
        select={(info) => openNew(info.start, info.end)}
        dateClick={(info: DateClickArg) => openNew(info.date, new Date(info.date.getTime() + 60 * 60 * 1000))}
        eventClick={(arg: EventClickArg) => {
          const match = events.find((e) => e.id === arg.event.id);
          if (match) openEdit(match);
        }}
        eventDrop={handleDropOrResize}
        eventResize={handleDropOrResize}
        datesSet={(_arg: DatesSetArg) => {}}
      />

      {draft && (
        <EventModal
          draft={draft}
          onClose={() => setDraft(null)}
          onSave={handleSave}
          onDelete={draft.id ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
