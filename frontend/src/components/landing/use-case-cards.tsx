import { ClipboardCheck, Scale, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const useCases = [
  {
    icon: ClipboardCheck,
    title: "Insurance Claims",
    description:
      "Analyze FNOL forms, policies, and medical bills. Detect discrepancies across documents and surface findings in real-time during voice conversations.",
    bullets: [
      "Cross-document field comparison",
      "Policy limit exposure alerts",
      "Passenger count verification",
    ],
    color: "text-[var(--dv-wine-bright)]",
    dotColor: "bg-[var(--dv-wine-bright)]",
    bgColor: "bg-[var(--dv-wine)]/10",
  },
  {
    icon: Scale,
    title: "Legal Contracts",
    description:
      "Review contracts, NDAs, and amendments. Identify key clauses, obligations, and risk areas through natural voice interaction.",
    bullets: [
      "Key clause extraction",
      "Obligation tracking",
      "Risk flag identification",
    ],
    color: "text-[var(--dv-rose)]",
    dotColor: "bg-[var(--dv-rose)]",
    bgColor: "bg-[var(--dv-rose)]/10",
  },
  {
    icon: TrendingUp,
    title: "Financial Due Diligence",
    description:
      "Analyze financial statements and audit reports. Verify figures, detect anomalies, and generate due diligence summaries.",
    bullets: [
      "Balance sheet analysis",
      "Revenue verification",
      "Anomaly detection",
    ],
    color: "text-[var(--dv-amber)]",
    dotColor: "bg-[var(--dv-amber)]",
    bgColor: "bg-[var(--dv-amber)]/10",
  },
];

export function UseCaseCards() {
  return (
    <section className="px-6 py-16 lg:py-24 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-[var(--dv-text-primary)] mb-4">
        Built for Document-Heavy Industries
      </h2>
      <p className="text-center text-[var(--dv-text-secondary)] mb-12 max-w-2xl mx-auto">
        DocuVoice understands the specific document types and analysis patterns
        for your industry.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {useCases.map((useCase) => (
          <Card
            key={useCase.title}
            className="bg-[var(--dv-bg-surface)]/70 backdrop-blur-sm border-[var(--dv-border-subtle)] hover:border-[var(--dv-border-default)] transition-all duration-300 hover:translate-y-[-2px]"
          >
            <CardContent className="p-6">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-xl ${useCase.bgColor} mb-4`}
              >
                <useCase.icon className={`size-6 ${useCase.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-[var(--dv-text-primary)] mb-2">
                {useCase.title}
              </h3>
              <p className="text-sm text-[var(--dv-text-muted)] mb-4 leading-relaxed">
                {useCase.description}
              </p>
              <ul className="space-y-2">
                {useCase.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-center gap-2 text-xs text-[var(--dv-text-secondary)]"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${useCase.dotColor}`} />
                    {bullet}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
