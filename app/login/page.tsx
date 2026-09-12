"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      toast.error("Incorrect email or password.");
      return;
    }
    toast.success("Welcome back!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="dr-auth-shell">
      <div className="dr-auth-card dr-card">
        <h1 className="h3 mb-1">Welcome back</h1>
        <p className="text-muted mb-4">Sign in to get ready for today.</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
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
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <label className="form-label small fw-semibold mb-0">Password</label>
              <Link href="/forgot-password" className="small text-decoration-none">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="d-flex align-items-center gap-3 my-4">
          <hr className="flex-grow-1 m-0" />
          <span className="small text-muted">or</span>
          <hr className="flex-grow-1 m-0" />
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.97 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3.01-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
          </svg>
          Continue with Google
        </button>

        <p className="text-center mt-4 mb-0 small text-muted">
          New to DayReady? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
