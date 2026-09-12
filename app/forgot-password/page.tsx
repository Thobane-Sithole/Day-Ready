"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      // Always show the same confirmation, whether or not the account exists.
      setLoading(false);
      setSubmitted(true);
    }
  }

  return (
    <div className="dr-auth-shell">
      <div className="dr-auth-card dr-card">
        {submitted ? (
          <>
            <h1 className="h3 mb-3">Check your email</h1>
            <p className="text-muted mb-4">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password.
              It expires in 1 hour.
            </p>
            <Link href="/login" className="btn btn-outline-secondary w-100">
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="h3 mb-1">Forgot your password?</h1>
            <p className="text-muted mb-4">Enter your email and we&apos;ll send you a reset link.</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label small fw-semibold">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <p className="text-center mt-4 mb-0 small text-muted">
              <Link href="/login">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
