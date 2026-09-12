"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { Mail, User, Loader2 } from "lucide-react";
import GoogleButton from "@/components/auth/GoogleButton";
import PasswordField from "@/components/auth/PasswordField";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

    setLoading(true);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, timezone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Account created — please sign in.");
        router.push("/login");
        return;
      }

      toast.success("Account created. Let's get ready!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="dr-auth-shell">
      <div className="dr-auth-card dr-card">
        <h1 className="h3 mb-1">Create your account</h1>
        <p className="text-muted mb-4">Takes less than a minute.</p>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Name</label>
            <div className="dr-input-icon-group">
              <span className="dr-input-icon">
                <User size={16} />
              </span>
              <input
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                autoFocus
              />
            </div>
          </div>
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
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Password</label>
            <PasswordField value={password} onChange={setPassword} placeholder="Create a password" minLength={8} required />
            <div className="form-text">At least 8 characters.</div>
          </div>
          <div className="mb-4">
            <label className="form-label small fw-semibold">Confirm password</label>
            <PasswordField value={confirm} onChange={setConfirm} placeholder="Confirm password" minLength={8} required />
          </div>
          <button type="submit" className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2" disabled={loading}>
            {loading && <Loader2 size={16} className="dr-spin" />}
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="d-flex align-items-center gap-3 my-4">
          <hr className="flex-grow-1 m-0" />
          <span className="small text-muted">or</span>
          <hr className="flex-grow-1 m-0" />
        </div>

        <GoogleButton />

        <p className="text-center mt-4 mb-0 small text-muted">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
