"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import type { UserSettings } from "@/lib/types";

export default function SettingsClient({ initialSettings }: { initialSettings: UserSettings }) {
  const [form, setForm] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          dailyCalorieGoal: Number(form.dailyCalorieGoal),
          proteinGoalG: Number(form.proteinGoalG),
          carbsGoalG: Number(form.carbsGoalG),
          fatGoalG: Number(form.fatGoalG),
          theme: form.theme,
        }),
      });
      if (!res.ok) throw new Error();
      document.documentElement.setAttribute("data-bs-theme", form.theme);
      toast.success("Settings saved.");
    } catch {
      toast.error("Couldn't save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    const [tasksRes, eventsRes, mealsRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/events"),
      fetch("/api/nutrition/meals"),
    ]);
    const [tasks, events, meals] = await Promise.all([tasksRes.json(), eventsRes.json(), mealsRes.json()]);
    const blob = new Blob([JSON.stringify({ tasks, events, meals }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dayready-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <form onSubmit={handleSave} className="d-flex flex-column gap-4">
      <div className="dr-card">
        <h2 className="h6 mb-3">Profile</h2>
        <div className="mb-3">
          <label className="form-label small fw-semibold">Name</label>
          <input
            className="form-control"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="mb-0">
          <label className="form-label small fw-semibold">Email</label>
          <input className="form-control" value={form.email} disabled />
        </div>
      </div>

      <div className="dr-card">
        <h2 className="h6 mb-3">Daily nutrition goals</h2>
        <div className="row g-3">
          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold">Calories</label>
            <input
              type="number"
              className="form-control"
              value={form.dailyCalorieGoal}
              onChange={(e) => setForm({ ...form, dailyCalorieGoal: Number(e.target.value) })}
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold">Protein (g)</label>
            <input
              type="number"
              className="form-control"
              value={form.proteinGoalG}
              onChange={(e) => setForm({ ...form, proteinGoalG: Number(e.target.value) })}
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold">Carbs (g)</label>
            <input
              type="number"
              className="form-control"
              value={form.carbsGoalG}
              onChange={(e) => setForm({ ...form, carbsGoalG: Number(e.target.value) })}
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold">Fat (g)</label>
            <input
              type="number"
              className="form-control"
              value={form.fatGoalG}
              onChange={(e) => setForm({ ...form, fatGoalG: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="dr-card">
        <h2 className="h6 mb-3">Appearance</h2>
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn ${form.theme === "light" ? "btn-secondary" : "btn-outline-secondary"}`}
            onClick={() => setForm({ ...form, theme: "light" })}
          >
            Light
          </button>
          <button
            type="button"
            className={`btn ${form.theme === "dark" ? "btn-secondary" : "btn-outline-secondary"}`}
            onClick={() => setForm({ ...form, theme: "dark" })}
          >
            Dark
          </button>
        </div>
      </div>

      <div className="dr-card d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h2 className="h6 mb-1">Export your data</h2>
          <p className="text-muted small mb-0">Download all your tasks, bookings, and meals as JSON.</p>
        </div>
        <button type="button" className="btn btn-outline-secondary" onClick={handleExport}>
          Export data
        </button>
      </div>

      <div>
        <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={saving}>
          {saving && <Loader2 size={16} className="dr-spin" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
