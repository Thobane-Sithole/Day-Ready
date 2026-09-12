"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Meal } from "@/lib/types";

function NutrientBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const fillRef = useRef<HTMLDivElement>(null);
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;

  useEffect(() => {
    requestAnimationFrame(() => {
      if (fillRef.current) fillRef.current.style.width = `${pct}%`;
    });
  }, [pct]);

  return (
    <div className="mb-2">
      <div className="d-flex justify-content-between small mb-1">
        <span className="text-muted">{label}</span>
        <span>
          {value}g <span className="text-muted">/ {goal}g</span>
        </span>
      </div>
      <div className="dr-nutrient-bar">
        <div ref={fillRef} className="dr-nutrient-fill" style={{ background: color }} />
      </div>
    </div>
  );
}

export default function NutritionPanel({
  meals,
  calorieGoal,
  proteinGoal,
  carbsGoal,
  fatGoal,
}: {
  meals: Meal[];
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}) {
  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.totalCalories,
      protein: acc.protein + m.totalProtein,
      carbs: acc.carbs + m.totalCarbs,
      fat: acc.fat + m.totalFat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="dr-card dr-card--top-sage h-100">
      <div className="dr-panel-title">
        <span className="dr-panel-title-left">
          <span className="dr-panel-icon dr-panel-icon--sage">🔥</span>
          Nutrition today
        </span>
        <Link href="/nutrition" className="small fw-normal text-decoration-none">
          Log a meal →
        </Link>
      </div>

      <div className="d-flex align-items-baseline gap-2 mb-3">
        <span className="fs-3 fw-semibold">{totals.calories}</span>
        <span className="text-muted">/ {calorieGoal} kcal</span>
      </div>

      <NutrientBar label="Protein" value={totals.protein} goal={proteinGoal} color="#3E9C6D" />
      <NutrientBar label="Carbs" value={totals.carbs} goal={carbsGoal} color="#F5A623" />
      <NutrientBar label="Fat" value={totals.fat} goal={fatGoal} color="#D65F5F" />

      {meals.length === 0 && (
        <div className="dr-empty pt-2">No meals logged yet today — snap a photo to get started.</div>
      )}
    </div>
  );
}
