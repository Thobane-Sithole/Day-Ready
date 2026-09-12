"use client";

import { useMemo, useState } from "react";
import * as chrono from "chrono-node";
import toast from "react-hot-toast";
import { CheckCircle2, X } from "lucide-react";
import type { Task, Priority } from "@/lib/types";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <polyline points="4 12 9 17 20 6" />
    </svg>
  );
}

function relativeDue(dueAt: string | null): string {
  if (!dueAt) return "";
  const due = new Date(dueAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  const time = due.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (Math.abs(diffMin) < 60 * 12) return time;
  return due.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " · " + time;
}

export default function TaskPanel({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [quickAdd, setQuickAdd] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("active");
  const [submitting, setSubmitting] = useState(false);

  const visibleTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
      const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
      return aDue - bDue;
    });
    if (filter === "active") return sorted.filter((t) => !t.completed);
    if (filter === "done") return sorted.filter((t) => t.completed);
    return sorted;
  }, [tasks, filter]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const raw = quickAdd.trim();
    if (!raw) return;
    setSubmitting(true);

    // Parse natural language for a date/time, strip it from the title.
    const parsedDates = chrono.parse(raw);
    let title = raw;
    let dueAt: string | null = null;
    if (parsedDates.length > 0) {
      const p = parsedDates[0];
      dueAt = p.start.date().toISOString();
      title = (raw.slice(0, p.index) + raw.slice(p.index + p.text.length)).trim();
      title = title.replace(/\s{2,}/g, " ").trim() || raw;
    }

    let priority: Priority = "MEDIUM";
    if (/!high|!!!|urgent/i.test(title)) priority = "HIGH";
    if (/!low/i.test(title)) priority = "LOW";
    title = title.replace(/!high|!low|!!!/gi, "").trim();

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, dueAt, priority }),
      });
      if (!res.ok) throw new Error();
      const created: Task = await res.json();
      setTasks((prev) => [created, ...prev]);
      setQuickAdd("");
    } catch {
      toast.error("Couldn't add that task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleComplete(task: Task) {
    const nextCompleted = !task.completed;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t)));
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: nextCompleted }),
      });
    } catch {
      toast.error("Couldn't update the task.");
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)));
    }
  }

  async function removeTask(id: string) {
    const prevTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Couldn't remove the task.");
      setTasks(prevTasks);
    }
  }

  const doneCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="dr-card dr-card--top-indigo dr-card--interactive h-100">
      <div className="dr-panel-title">
        <span className="dr-panel-title-left">
          <span className="dr-panel-icon dr-panel-icon--indigo">
            <CheckCircle2 size={16} strokeWidth={2.25} />
          </span>
          Today&apos;s tasks
        </span>
        <span className="text-muted small fw-normal">
          {doneCount}/{tasks.length} done
        </span>
      </div>

      <form onSubmit={addTask} className="d-flex gap-2 mb-3">
        <input
          className="form-control form-control-sm"
          placeholder='Add a task — try "Call dentist tomorrow 3pm"'
          value={quickAdd}
          onChange={(e) => setQuickAdd(e.target.value)}
        />
        <button className="btn btn-primary btn-sm px-3" disabled={submitting}>
          Add
        </button>
      </form>

      <div className="btn-group btn-group-sm mb-3" role="group">
        {(["active", "all", "done"] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`btn ${filter === f ? "btn-secondary" : "btn-outline-secondary"}`}
            onClick={() => setFilter(f)}
          >
            {f === "active" ? "Active" : f === "done" ? "Done" : "All"}
          </button>
        ))}
      </div>

      {visibleTasks.length === 0 ? (
        <div className="dr-empty">
          {filter === "done"
            ? "Nothing completed yet — check something off to see it here."
            : "Nothing on the list. Add your first task above."}
        </div>
      ) : (
        <div>
          {visibleTasks.map((task) => (
            <div key={task.id} className={`dr-task ${task.completed ? "dr-task--done" : ""}`}>
              <button
                type="button"
                className={`dr-check ${task.completed ? "dr-check--done" : ""}`}
                onClick={() => toggleComplete(task)}
                aria-label={task.completed ? "Mark as not done" : "Mark as done"}
              >
                {task.completed && <CheckIcon />}
              </button>
              <div className="flex-grow-1">
                <div className="dr-task-title">
                  <span className={`dr-priority-dot dr-priority-${task.priority}`} />
                  {task.title}
                </div>
                {(task.dueAt || task.category) && (
                  <div className="small text-muted">
                    {task.dueAt && relativeDue(task.dueAt)}
                    {task.dueAt && task.category ? " · " : ""}
                    {task.category}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-muted p-0"
                onClick={() => removeTask(task.id)}
                aria-label="Delete task"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
