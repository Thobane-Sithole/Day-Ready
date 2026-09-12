import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Camera } from "lucide-react";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="dr-briefing-band" style={{ minHeight: "100vh" }}>
      <div className="container py-5">
        <div className="d-flex align-items-center gap-2 mb-5">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-circle"
            style={{ width: 34, height: 34, background: "#F5A623" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4.5" fill="#12213D" />
            </svg>
          </span>
          <span className="fw-semibold text-white" style={{ fontFamily: "Fraunces, serif" }}>
            DayReady
          </span>
        </div>

        <div className="row align-items-center">
          <div className="col-lg-7">
            <p className="dr-briefing-date mb-3">Your morning, sorted before you finish your coffee</p>
            <h1 className="display-4 mb-4" style={{ maxWidth: "18ch" }}>
              One calm place to get ready for the day ahead.
            </h1>
            <p className="fs-5 mb-4" style={{ color: "rgba(255,255,255,0.78)", maxWidth: "48ch" }}>
              Tasks, bookings, and meals — in one dashboard. Snap a photo of your plate and
              DayReady works out the calories for you, so tracking never slows you down.
            </p>
            <div className="d-flex gap-3">
              <Link href="/signup" className="btn btn-lg btn-primary px-4">
                Get started free
              </Link>
              <Link href="/login" className="btn btn-lg btn-outline-light px-4">
                Sign in
              </Link>
            </div>
          </div>

          <div className="col-lg-5 mt-5 mt-lg-0">
            <div
              className="dr-card"
              style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)" }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-white fw-semibold">Today, at a glance</span>
                <span className="badge rounded-pill" style={{ background: "#F5A623", color: "#12213D" }}>
                  6 of 9 done
                </span>
              </div>
              <ul className="list-unstyled mb-0" style={{ color: "rgba(255,255,255,0.85)" }}>
                <li className="py-2 border-bottom d-flex align-items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <CheckCircle2 size={16} color="#8FE3B8" /> Prep standup notes
                </li>
                <li className="py-2 border-bottom d-flex align-items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <CheckCircle2 size={16} color="#8FE3B8" /> Book dentist — 3:30pm
                </li>
                <li className="py-2 d-flex align-items-center gap-2">
                  <Camera size={16} color="#F5A623" /> Breakfast logged — 410 kcal
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
