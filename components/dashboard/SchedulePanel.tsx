"use client";

import Link from "next/link";
import type { Event } from "@/lib/types";

export default function SchedulePanel({ events }: { events: Event[] }) {
  const sorted = [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return (
    <div className="dr-card h-100">
      <div className="dr-panel-title">
        <span>Today&apos;s schedule</span>
        <Link href="/calendar" className="small fw-normal text-decoration-none">
          Open calendar →
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="dr-empty">
          Nothing booked for today.{" "}
          <Link href="/calendar" className="text-decoration-none">
            Add a booking
          </Link>
          .
        </div>
      ) : (
        <div>
          {sorted.map((event) => (
            <div key={event.id} className="d-flex gap-3 py-2 border-bottom" style={{ borderColor: "var(--dr-hairline)" }}>
              <div
                className="rounded-pill flex-shrink-0"
                style={{ width: 6, background: event.color || "#6C63FF", alignSelf: "stretch" }}
              />
              <div>
                <div className="fw-semibold">{event.title}</div>
                <div className="small text-muted">
                  {new Date(event.startAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  {" – "}
                  {new Date(event.endAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  {event.location ? ` · ${event.location}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
