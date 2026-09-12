"use client";

import { useEffect, useRef } from "react";

export default function ProgressRing({
  percent,
  label,
  sublabel,
  size = 96,
}: {
  percent: number;
  label: string;
  sublabel: string;
  size?: number;
}) {
  const circleRef = useRef<SVGCircleElement>(null);
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));

  useEffect(() => {
    // Animate from empty to the target value on mount (single orchestrated moment).
    const el = circleRef.current;
    if (!el) return;
    el.style.strokeDashoffset = String(circumference);
    requestAnimationFrame(() => {
      el.style.strokeDashoffset = String(circumference - (clamped / 100) * circumference);
    });
  }, [clamped, circumference]);

  return (
    <div className="d-flex align-items-center gap-3">
      <svg width={size} height={size} className="dr-progress-ring">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={8}
        />
        <circle
          ref={circleRef}
          className="dr-ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F5A623"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
        />
        <text
          x="50%"
          y="52%"
          textAnchor="middle"
          fill="#fff"
          fontSize={size * 0.22}
          fontWeight={700}
          fontFamily="Sora, sans-serif"
        >
          {Math.round(clamped)}%
        </text>
      </svg>
      <div>
        <div className="text-white fw-semibold">{label}</div>
        <div className="small" style={{ color: "rgba(255,255,255,0.7)" }}>
          {sublabel}
        </div>
      </div>
    </div>
  );
}
