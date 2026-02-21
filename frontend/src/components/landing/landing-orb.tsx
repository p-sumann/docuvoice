"use client";

import { cn } from "@/lib/utils";

interface LandingOrbProps {
  className?: string;
}

/**
 * Decorative animated voice orb for the landing page hero.
 * Pure CSS animations — gooey ball with rotating 3D rings and morphing blob.
 * Adapted from UIVerse with DocuVoice wine red theme.
 */
export function LandingOrb({ className }: LandingOrbProps) {
  return (
    <div className={cn("landing-orb-wrapper", className)}>
      <div className="landing-orb">
        {/* Mic icon */}
        <div className="landing-orb-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={28}
            height={28}
            viewBox="0 0 24 24"
            fill="none"
          >
            <rect
              width={8}
              height={13}
              x={8}
              y={2}
              fill="currentColor"
              rx={4}
            />
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 11a7 7 0 1 0 14 0m-7 10v-2"
            />
          </svg>
        </div>

        {/* Gooey ball */}
        <div className="landing-orb-ball">
          {/* Morphing blob overlay */}
          <div className="landing-orb-blob" />
          {/* 3D rotating rings */}
          <div className="landing-orb-rings" />
        </div>

        {/* SVG gooey filter */}
        <svg style={{ position: "absolute", width: 0, height: 0 }}>
          <filter id="landing-gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation={6} />
            <feColorMatrix
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 20 -10"
            />
          </filter>
        </svg>
      </div>
    </div>
  );
}
