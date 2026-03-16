"use client";

import { cn } from "@/lib/utils";

export function Orb({ className }: { className?: string }) {
  return (
    <>
      <div className={cn("orb-container", className)}>
        <div className="orb">
          <div className="orb-inner" />
          <div className="orb-inner" />
        </div>
      </div>

      <style jsx>{`
        .orb-container {
          position: relative;
          width: 200px;
          height: 200px;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          border-radius: 50%;
          rotate: 90deg;
          cursor: pointer;
          filter: drop-shadow(0 0 6px #ff3e1c88) drop-shadow(0 0 6px #1c8cff88);
          transition: all 0.3s ease;
        }

        .orb {
          position: absolute;
          width: 200px;
          aspect-ratio: 1;
          border-radius: 50%;
          background: #060606;
          filter: blur(24px);
          transition: all 0.3s ease;
        }

        .orb-container:hover .orb {
          width: 220px;
          animation: orb-rotate 6s infinite;
        }

        .orb-inner {
          position: absolute;
          left: -120%;
          top: -25%;
          width: 160%;
          aspect-ratio: 1;
          border-radius: 50%;
          background: #ff3e1c;
          clip-path: polygon(
            50% 0%,
            61% 35%,
            98% 35%,
            68% 57%,
            79% 91%,
            50% 70%,
            21% 91%,
            32% 57%,
            2% 35%,
            39% 35%
          );
          animation: orb-rotate 6s linear infinite;
          transition: all 0.3s ease;
        }

        .orb-inner:nth-child(2) {
          left: auto;
          right: -120%;
          top: auto;
          bottom: -25%;
          background: #1c8cff;
          animation-duration: 8s;
          clip-path: polygon(
            20% 0%,
            0% 20%,
            30% 50%,
            0% 80%,
            20% 100%,
            50% 70%,
            80% 100%,
            100% 80%,
            70% 50%,
            100% 20%,
            80% 0%,
            50% 30%
          );
        }

        @keyframes orb-rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .orb-container:hover .orb .orb-inner {
          width: 170%;
        }
      `}</style>
    </>
  );
}
