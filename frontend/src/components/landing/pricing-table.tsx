import { Check } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying DocuVoice",
    features: [
      "1 workspace",
      "10 documents",
      "30 minutes voice/month",
      "Web voice only",
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For professionals and small teams",
    features: [
      "Unlimited workspaces",
      "100 documents",
      "500 minutes voice/month",
      "Phone + Web voice",
      "Custom plugins",
      "Export PDF/Markdown",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations",
    features: [
      "Everything in Pro",
      "Unlimited documents",
      "Unlimited voice minutes",
      "SSO & RBAC",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

export function PricingTable() {
  return (
    <section className="px-6 py-16 lg:py-24 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-[var(--dv-text-primary)] mb-4">
        Simple Pricing
      </h2>
      <p className="text-center text-[var(--dv-text-secondary)] mb-12 max-w-xl mx-auto">
        Start free, upgrade as you grow. No credit card required.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={cn(
              "bg-[var(--dv-bg-surface)] border",
              tier.featured
                ? "border-[var(--dv-wine)] shadow-[0_0_30px_rgba(59,130,246,0.1)]"
                : "border-[var(--dv-border-subtle)]"
            )}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                {tier.featured && (
                  <Badge className="bg-[var(--dv-wine)] text-white text-[10px]">
                    Popular
                  </Badge>
                )}
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-[var(--dv-text-primary)]">
                  {tier.price}
                </span>
                <span className="text-sm text-[var(--dv-text-muted)]">
                  {tier.period}
                </span>
              </div>
              <p className="text-xs text-[var(--dv-text-muted)] mt-1">
                {tier.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-[var(--dv-text-secondary)]"
                  >
                    <Check className="size-4 text-[var(--dv-green)] flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={cn(
                  "w-full",
                  tier.featured
                    ? "bg-[var(--dv-wine)] hover:bg-[var(--dv-wine)]/90 text-white"
                    : "bg-[var(--dv-bg-active)] text-[var(--dv-text-primary)] hover:bg-[var(--dv-bg-hover)]"
                )}
              >
                <Link href="/sign-up">{tier.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
