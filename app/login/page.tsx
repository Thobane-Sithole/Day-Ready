"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { Mail, Loader2 } from "lucide-react";
import GoogleButton from "@/components/auth/GoogleButton";
import PasswordField from "@/components/auth/PasswordField";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
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
            <div className="dr-input-icon-group">
              <span className="dr-input-icon">
                <Mail size={16} />
              </span>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
          </div>
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <label className="form-label small fw-semibold mb-0">Password</label>
              <Link href="/forgot-password" className="small text-decoration-none">
                Forgot password?
              </Link>
            </div>
            <PasswordField value={password} onChange={setPassword} placeholder="Enter your password" required />
          </div>

          <div className="form-check mb-4">
            <input
              type="checkbox"
              className="form-check-input"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label className="form-check-label small" htmlFor="remember">
              Remember me
            </label>
          </div>

          <button type="submit" className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2" disabled={loading}>
            {loading && <Loader2 size={16} className="dr-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="d-flex align-items-center gap-3 my-4">
          <hr className="flex-grow-1 m-0" />
          <span className="small text-muted">or</span>
          <hr className="flex-grow-1 m-0" />
        </div>

        <GoogleButton />

        <p className="text-center mt-4 mb-0 small text-muted">
          New to DayReady? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
