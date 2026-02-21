"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  className?: string;
}

/**
 * Full-screen aurora gradient background with floating star dots.
 * Wine red blob on the left, emerald/teal on the right, subtle purple in the center.
 * Stars are rendered as tiny dots with random positions and twinkle animation.
 */
export function AuroraBackground({ className }: AuroraBackgroundProps) {
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = starsRef.current;
    if (!container) return;

    // Generate star dots
    const starCount = 80;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div");
      const size = Math.random() * 2 + 0.5; // 0.5px - 2.5px
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = 2 + Math.random() * 4; // 2s - 6s
      const opacity = 0.15 + Math.random() * 0.5; // 0.15 - 0.65

      star.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: white;
        opacity: ${opacity};
        animation: star-twinkle ${duration}s ease-in-out ${delay}s infinite;
      `;
      fragment.appendChild(star);
    }

    container.appendChild(fragment);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {/* Aurora gradient blobs */}

      {/* Wine red blob — left side */}
      <div
        className="aurora-blob absolute"
        style={{
          top: "-10%",
          left: "-10%",
          width: "55%",
          height: "70%",
          background: "radial-gradient(ellipse at center, rgba(220, 38, 71, 0.18) 0%, rgba(220, 38, 71, 0.06) 40%, transparent 70%)",
          filter: "blur(60px)",
          animation: "aurora-drift-1 12s ease-in-out infinite",
        }}
      />

      {/* Deep wine secondary — left-center */}
      <div
        className="aurora-blob absolute"
        style={{
          top: "20%",
          left: "5%",
          width: "40%",
          height: "50%",
          background: "radial-gradient(ellipse at center, rgba(155, 27, 53, 0.14) 0%, transparent 60%)",
          filter: "blur(80px)",
          animation: "aurora-drift-2 15s ease-in-out infinite",
        }}
      />

      {/* Purple/violet — center bridge */}
      <div
        className="aurora-blob absolute"
        style={{
          top: "10%",
          left: "30%",
          width: "40%",
          height: "50%",
          background: "radial-gradient(ellipse at center, rgba(139, 47, 198, 0.08) 0%, transparent 60%)",
          filter: "blur(80px)",
          animation: "aurora-drift-3 18s ease-in-out infinite",
        }}
      />

      {/* Emerald/teal blob — right side */}
      <div
        className="aurora-blob absolute"
        style={{
          top: "-5%",
          right: "-10%",
          width: "50%",
          height: "65%",
          background: "radial-gradient(ellipse at center, rgba(20, 184, 166, 0.14) 0%, rgba(34, 197, 94, 0.06) 40%, transparent 70%)",
          filter: "blur(60px)",
          animation: "aurora-drift-4 14s ease-in-out infinite",
        }}
      />

      {/* Small teal accent — right-center */}
      <div
        className="aurora-blob absolute"
        style={{
          top: "30%",
          right: "10%",
          width: "30%",
          height: "40%",
          background: "radial-gradient(ellipse at center, rgba(34, 197, 94, 0.08) 0%, transparent 60%)",
          filter: "blur(70px)",
          animation: "aurora-drift-2 16s ease-in-out infinite reverse",
        }}
      />

      {/* Warm amber hint — bottom center */}
      <div
        className="aurora-blob absolute"
        style={{
          bottom: "5%",
          left: "35%",
          width: "30%",
          height: "30%",
          background: "radial-gradient(ellipse at center, rgba(245, 158, 11, 0.05) 0%, transparent 60%)",
          filter: "blur(60px)",
          animation: "aurora-drift-3 20s ease-in-out infinite",
        }}
      />

      {/* Star dots container */}
      <div ref={starsRef} className="absolute inset-0" />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
