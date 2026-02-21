"use client";

import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface PanelResizerProps {
  onResize: (deltaX: number) => void;
  className?: string;
}

export function PanelResizer({ onResize, className }: PanelResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startXRef.current = e.clientX;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startXRef.current;
        startXRef.current = moveEvent.clientX;
        requestAnimationFrame(() => onResize(delta));
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [onResize]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      startXRef.current = touch.clientX;
      setIsDragging(true);

      const handleTouchMove = (moveEvent: TouchEvent) => {
        const delta = moveEvent.touches[0].clientX - startXRef.current;
        startXRef.current = moveEvent.touches[0].clientX;
        requestAnimationFrame(() => onResize(delta));
      };

      const handleTouchEnd = () => {
        setIsDragging(false);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };

      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    },
    [onResize]
  );

  return (
    <div
      className={cn(
        "flex w-1 cursor-col-resize items-center justify-center",
        "hover:bg-[var(--dv-border-strong)] transition-colors duration-150",
        isDragging && "bg-[var(--dv-wine)]",
        className
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      role="separator"
      aria-orientation="vertical"
      tabIndex={0}
    >
      <div
        className={cn(
          "h-8 w-0.5 rounded-full bg-[var(--dv-border-default)]",
          isDragging && "bg-[var(--dv-wine)]"
        )}
      />
    </div>
  );
}
