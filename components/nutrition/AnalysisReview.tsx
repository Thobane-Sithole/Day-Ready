"use client";

import { useState } from "react";
import type { FoodItem } from "@/lib/types";

export default function AnalysisReview({
  imageDataUrl,
  items,
  confidence,
  notes,
  onCancel,
  onConfirm,
}: {
  imageDataUrl: string;
  items: FoodItem[];
  confidence: string;
  notes: string;
  onCancel: () => void;
  onConfirm: (items: FoodItem[]) => void;
}) {
  const [editableItems, setEditableItems] = useState<FoodItem[]>(items);

  function updateItem(index: number, field: keyof FoodItem, value: string) {
    setEditableItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: field === "name" ? value : Number(value) || 0 } : item))
    );
  }

  const totalCalories = editableItems.reduce((sum, i) => sum + (i.calories || 0), 0);

  return (
    <>
      <div className="modal d-block" tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content dr-card border-0">
            <div className="modal-header border-0 pb-0">
              <h2 className="h5 mb-0">Check the estimate</h2>
              <button type="button" className="btn-close" onClick={onCancel} aria-label="Close" />
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageDataUrl}
                    alt="Logged meal"
                    className="w-100 rounded-3"
                    style={{ aspectRatio: "1/1", objectFit: "cover" }}
                  />
                  <span className={`badge mt-2 ${confidence === "high" ? "bg-success" : confidence === "low" ? "bg-danger" : "bg-warning text-dark"}`}>
                    {confidence} confidence
                  </span>
                </div>
                <div className="col-md-8">
                  {editableItems.length === 0 ? (
                    <p className="text-muted">
                      {notes || "We couldn't identify any food in this photo. You can retake it, or adjust manually."}
                    </p>
                  ) : (
                    editableItems.map((item, i) => (
                      <div key={i} className="border rounded-3 p-2 mb-2" style={{ borderColor: "var(--dr-hairline)" }}>
                        <input
                          className="form-control form-control-sm mb-2 fw-semibold"
                          value={item.name}
                          onChange={(e) => updateItem(i, "name", e.target.value)}
                        />
                        <div className="row g-2">
                          <div className="col-3">
                            <label className="form-label small text-muted mb-0">Grams</label>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.estimated_grams}
                              onChange={(e) => updateItem(i, "estimated_grams", e.target.value)}
                            />
                          </div>
                          <div className="col-3">
                            <label className="form-label small text-muted mb-0">Calories</label>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.calories}
                              onChange={(e) => updateItem(i, "calories", e.target.value)}
                            />
                          </div>
                          <div className="col-2">
                            <label className="form-label small text-muted mb-0">P</label>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.protein_g}
                              onChange={(e) => updateItem(i, "protein_g", e.target.value)}
                            />
                          </div>
                          <div className="col-2">
                            <label className="form-label small text-muted mb-0">C</label>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.carbs_g}
                              onChange={(e) => updateItem(i, "carbs_g", e.target.value)}
                            />
                          </div>
                          <div className="col-2">
                            <label className="form-label small text-muted mb-0">F</label>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.fat_g}
                              onChange={(e) => updateItem(i, "fat_g", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {notes && editableItems.length > 0 && <p className="small text-muted mb-0">{notes}</p>}
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0">
              <div className="me-auto fw-semibold">Total: {totalCalories} kcal</div>
              <button className="btn btn-outline-secondary" onClick={onCancel}>
                Discard
              </button>
              <button
                className="btn btn-primary"
                disabled={editableItems.length === 0}
                onClick={() => onConfirm(editableItems)}
              >
                Save meal
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}
