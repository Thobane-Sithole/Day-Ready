"use client";

import type { Meal } from "@/lib/types";

export default function MealCard({ meal, onDelete }: { meal: Meal; onDelete: (id: string) => void }) {
  return (
    <div className="dr-card dr-card--interactive d-flex gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={meal.imageDataUrl}
        alt={meal.items.map((i) => i.name).join(", ") || "Logged meal"}
        className="rounded-3 flex-shrink-0"
        style={{ width: 84, height: 84, objectFit: "cover" }}
      />
      <div className="flex-grow-1">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="fw-semibold">{meal.items.map((i) => i.name).join(", ") || "Meal"}</div>
            <div className="small text-muted">
              {new Date(meal.loggedAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          </div>
          <button className="btn btn-sm btn-link text-muted p-0" onClick={() => onDelete(meal.id)} aria-label="Delete meal">
            ✕
          </button>
        </div>
        <div className="d-flex gap-3 mt-2 small">
          <span className="fw-semibold">{meal.totalCalories} kcal</span>
          <span className="text-muted">P {meal.totalProtein}g</span>
          <span className="text-muted">C {meal.totalCarbs}g</span>
          <span className="text-muted">F {meal.totalFat}g</span>
        </div>
      </div>
    </div>
  );
}
