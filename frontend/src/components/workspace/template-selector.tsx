"use client";

import { Check, ClipboardCheck, Scale, TrendingUp, Wrench } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DomainPlugin } from "@/types/plugin";
import type { DomainType } from "@/types/workspace";

interface TemplateSelectorGridProps {
  templates: DomainPlugin[];
  selectedTemplate: DomainType | null;
  onSelect: (template: DomainType) => void;
  className?: string;
}

const domainIcons: Record<DomainType, React.ElementType> = {
  insurance_claims: ClipboardCheck,
  legal_contracts: Scale,
  financial_dd: TrendingUp,
  custom: Wrench,
};

export function TemplateSelectorGrid({
  templates,
  selectedTemplate,
  onSelect,
  className,
}: TemplateSelectorGridProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", className)}>
      {templates.map((template) => {
        const isSelected = selectedTemplate === template.id;
        const Icon = domainIcons[template.id];

        return (
          <Card
            key={template.id}
            className={cn(
              "bg-[var(--dv-bg-surface)] border cursor-pointer",
              "hover:scale-[1.02] transition-all duration-200",
              isSelected
                ? "border-[var(--dv-wine)] bg-[var(--dv-wine)]/5"
                : "border-[var(--dv-border-subtle)] hover:border-[var(--dv-border-strong)]"
            )}
            onClick={() => onSelect(template.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--dv-bg-active)]">
                  <Icon className="size-5 text-[var(--dv-text-secondary)]" />
                </div>
                {isSelected && (
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--dv-wine)]">
                    <Check className="size-3 text-white" />
                  </div>
                )}
              </div>

              <h4 className="mt-3 text-sm font-semibold text-[var(--dv-text-primary)]">
                {template.name}
              </h4>
              <p className="mt-1 text-xs text-[var(--dv-text-muted)] line-clamp-2">
                {template.description}
              </p>

              <div className="mt-3 flex flex-wrap gap-1">
                {template.documentTypes.slice(0, 3).map((dt) => (
                  <span
                    key={dt}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--dv-bg-active)] text-[var(--dv-text-muted)]"
                  >
                    {dt}
                  </span>
                ))}
                {template.documentTypes.length > 3 && (
                  <span className="text-[10px] px-1.5 py-0.5 text-[var(--dv-text-muted)]">
                    +{template.documentTypes.length - 3} more
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
