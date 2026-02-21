"use client";

import { cn } from "@/lib/utils";
import type { SuggestedQuestion } from "@/types/voice";

interface SuggestedQuestionsProps {
  questions: SuggestedQuestion[];
  onSelect: (question: SuggestedQuestion) => void;
  className?: string;
}

export function SuggestedQuestions({
  questions,
  onSelect,
  className,
}: SuggestedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div
      className={cn(
        "flex gap-2 px-4 py-3 overflow-x-auto border-t border-[var(--dv-border-subtle)]",
        "scrollbar-none",
        className
      )}
    >
      {questions.map((q) => (
        <button
          key={q.id}
          onClick={() => onSelect(q)}
          className={cn(
            "flex-shrink-0 px-3 py-1.5 rounded-full text-xs",
            "bg-[var(--dv-bg-elevated)] border border-[var(--dv-border-subtle)]",
            "text-[var(--dv-text-secondary)]",
            "hover:bg-[var(--dv-bg-hover)] hover:text-[var(--dv-text-primary)]",
            "hover:border-[var(--dv-border-default)]",
            "transition-all duration-150",
            "whitespace-nowrap"
          )}
        >
          {q.text}
        </button>
      ))}
    </div>
  );
}
