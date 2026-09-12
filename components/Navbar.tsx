"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const LINKS = [
  { href: "/dashboard", label: "Today" },
  { href: "/calendar", label: "Calendar" },
  { href: "/nutrition", label: "Nutrition" },
  { href: "/settings", label: "Settings" },
];

export default function Navbar({ userName }: { userName?: string | null }) {
  const pathname = usePathname();

  return (
    <nav className="dr-navbar py-3 sticky-top">
      <div className="container d-flex align-items-center justify-content-between">
        <Link href="/dashboard" className="d-flex align-items-center gap-2 text-decoration-none">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-circle"
            style={{ width: 34, height: 34, background: "#F5A623" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
                stroke="#12213D"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="4.5" fill="#12213D" />
            </svg>
          </span>
          <span className="fw-semibold" style={{ fontFamily: "Fraunces, serif", color: "var(--dr-ink)" }}>
            DayReady
          </span>
        </Link>

        <div className="d-none d-md-flex gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`dr-nav-link ${pathname?.startsWith(link.href) ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="d-flex align-items-center gap-3">
          <span className="d-none d-sm-inline text-muted small">{userName}</span>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            Sign out
          </button>
        </div>
      </div>

      <div className="d-flex d-md-none gap-1 container mt-2 overflow-auto">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`dr-nav-link flex-shrink-0 ${pathname?.startsWith(link.href) ? "active" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
