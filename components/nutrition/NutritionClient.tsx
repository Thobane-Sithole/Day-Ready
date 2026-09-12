"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Camera } from "lucide-react";
import CameraCapture from "./CameraCapture";
import AnalysisReview from "./AnalysisReview";
import MealCard from "./MealCard";
import type { Meal, FoodItem } from "@/lib/types";

type Stage = "idle" | "capturing" | "analyzing" | "reviewing";

export default function NutritionClient({
  initialMeals,
  calorieGoal,
}: {
  initialMeals: Meal[];
  calorieGoal: number;
}) {
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [stage, setStage] = useState<Stage>("idle");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    items: FoodItem[];
    confidence: string;
    notes: string;
  } | null>(null);

  async function handleCapture(dataUrl: string) {
    setPendingImage(dataUrl);
    setStage("analyzing");
    try {
      const res = await fetch("/api/nutrition/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      setAnalysis({ items: data.items, confidence: data.confidence, notes: data.notes });
      setStage("reviewing");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't analyze that photo.");
      setStage("idle");
      setPendingImage(null);
    }
  }

  async function handleConfirm(items: FoodItem[]) {
    if (!pendingImage) return;
    const totals = items.reduce(
      (acc, i) => ({
        calories: acc.calories + (i.calories || 0),
        protein: acc.protein + (i.protein_g || 0),
        carbs: acc.carbs + (i.carbs_g || 0),
        fat: acc.fat + (i.fat_g || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    try {
      const res = await fetch("/api/nutrition/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: pendingImage,
          items,
          totalCalories: Math.round(totals.calories),
          totalProtein: Math.round(totals.protein),
          totalCarbs: Math.round(totals.carbs),
          totalFat: Math.round(totals.fat),
          confidence: analysis?.confidence ?? "medium",
          notes: analysis?.notes,
        }),
      });
      if (!res.ok) throw new Error();
      const saved: Meal = await res.json();
      setMeals((prev) => [saved, ...prev]);
      toast.success("Meal logged.");
    } catch {
      toast.error("Couldn't save that meal.");
    } finally {
      setStage("idle");
      setPendingImage(null);
      setAnalysis(null);
    }
  }

  async function handleDelete(id: string) {
    const prev = meals;
    setMeals((m) => m.filter((meal) => meal.id !== id));
    try {
      const res = await fetch(`/api/nutrition/meals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Couldn't remove that meal.");
      setMeals(prev);
    }
  }

  const todayTotal = meals
    .filter((m) => new Date(m.loggedAt).toDateString() === new Date().toDateString())
    .reduce((sum, m) => sum + m.totalCalories, 0);

  return (
    <>
      <div className="dr-card mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <div className="text-muted small">Today so far</div>
          <div className="fs-3 fw-semibold">
            {todayTotal} <span className="fs-6 text-muted fw-normal">/ {calorieGoal} kcal</span>
          </div>
        </div>
        <button className="btn btn-primary btn-lg d-inline-flex align-items-center gap-2" onClick={() => setStage("capturing")}>
          <Camera size={20} />
          Log a meal
        </button>
      </div>

      <p className="small text-muted">
        Estimates are AI-generated from a photo and are not a substitute for precise nutrition tracking or medical
        advice.
      </p>

      {meals.length === 0 ? (
        <div className="dr-empty">No meals logged yet. Tap &ldquo;Log a meal&rdquo; to snap your first photo.</div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {stage === "capturing" && (
        <CameraCapture onCapture={handleCapture} onClose={() => setStage("idle")} />
      )}

      {stage === "analyzing" && pendingImage && (
        <div className="modal d-block" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content dr-card border-0 text-center py-5">
              <div className="spinner-border text-primary mx-auto mb-3" role="status" />
              <p className="mb-0">Analyzing your meal…</p>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </div>
      )}

      {stage === "reviewing" && analysis && pendingImage && (
        <AnalysisReview
          imageDataUrl={pendingImage}
          items={analysis.items}
          confidence={analysis.confidence}
          notes={analysis.notes}
          onCancel={() => {
            setStage("idle");
            setPendingImage(null);
            setAnalysis(null);
          }}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
