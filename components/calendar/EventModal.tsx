"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export type EventDraft = {
  id?: string;
  title: string;
  location: string;
  startAt: string; // datetime-local value
  endAt: string;
  color: string;
  reminderMin: number | "";
};

const COLORS = [
  { name: "Indigo", value: "#2B3467" },
  { name: "Marigold", value: "#F5A623" },
  { name: "Sage", value: "#3E9C6D" },
  { name: "Rose", value: "#D65F5F" },
  { name: "Sky", value: "#3D7FBF" },
];

export default function EventModal({
  draft,
  onClose,
  onSave,
  onDelete,
}: {
  draft: EventDraft;
  onClose: () => void;
  onSave: (draft: EventDraft) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
}) {
  const [form, setForm] = useState<EventDraft>(draft);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(draft), [draft]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <>
      <div className="modal d-block" tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content dr-card border-0">
            <form onSubmit={handleSave}>
              <div className="modal-header border-0 pb-0">
                <h2 className="h5 mb-0">{draft.id ? "Edit booking" : "New booking"}</h2>
                <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Title</label>
                  <input
                    className="form-control"
                    required
                    autoFocus
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Starts</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      required
                      value={form.startAt}
                      onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Ends</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      required
                      value={form.endAt}
                      onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Location (optional)</label>
                  <input
                    className="form-control"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Remind me before</label>
                  <select
                    className="form-select"
                    value={form.reminderMin}
                    onChange={(e) => setForm({ ...form, reminderMin: e.target.value ? Number(e.target.value) : "" })}
                  >
                    <option value="">No reminder</option>
                    <option value={5}>5 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={1440}>1 day</option>
                  </select>
                </div>
                <div className="mb-1">
                  <label className="form-label small fw-semibold d-block">Color</label>
                  <div className="d-flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        aria-label={c.name}
                        onClick={() => setForm({ ...form, color: c.value })}
                        className="rounded-circle border-0"
                        style={{
                          width: 28,
                          height: 28,
                          background: c.value,
                          outline: form.color === c.value ? "2px solid #12213D" : "none",
                          outlineOffset: 2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                {draft.id && onDelete && (
                  <button
                    type="button"
                    className="btn btn-outline-danger me-auto"
                    onClick={() => onDelete(draft.id!)}
                  >
                    Delete
                  </button>
                )}
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={saving}>
                  {saving && <Loader2 size={16} className="dr-spin" />}
                  {saving ? "Saving…" : "Save booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}
