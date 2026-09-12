"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (!token) {
      setError("This reset link is missing its token. Please request a new one.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      toast.success("Password updated. Please sign in.");
      router.push("/login");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <>
        <h1 className="h3 mb-3">Invalid link</h1>
        <p className="text-muted mb-4">
          This password reset link is missing or malformed. Please request a new one.
        </p>
        <Link href="/forgot-password" className="btn btn-primary w-100">
          Request a new link
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="h3 mb-1">Set a new password</h1>
      <p className="text-muted mb-4">Choose a new password for your account.</p>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label small fw-semibold">New password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            autoFocus
          />
          <div className="form-text">At least 8 characters.</div>
        </div>
        <div className="mb-4">
          <label className="form-label small fw-semibold">Confirm password</label>
          <input
            type="password"
            className="form-control"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Saving…" : "Reset password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="dr-auth-shell">
      <div className="dr-auth-card dr-card">
        <Suspense fallback={<p className="text-muted mb-0">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
