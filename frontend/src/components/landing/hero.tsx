"use client";

import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LandingOrb } from "@/components/landing/landing-orb";

export function Hero() {
  return (
    <section className="relative flex flex-col items-center text-center px-6 pt-28 pb-16 lg:pt-36 lg:pb-24">
      {/* Animated gooey orb */}
      <div className="relative mb-6">
        <LandingOrb />
      </div>

      {/* Headline */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--dv-text-primary)] max-w-3xl leading-tight">
        Upload. Call.{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--dv-wine-bright)] via-[var(--dv-wine-light)] to-[var(--dv-wine)]">
          Discover.
        </span>
      </h1>

      {/* Tagline */}
      <p className="mt-4 text-xl text-[var(--dv-text-primary)]/80 max-w-2xl font-medium">
        Voice-powered document intelligence that finds what you&apos;d miss.
      </p>

      {/* Subheadline */}
      <p className="mt-3 text-base text-[var(--dv-text-secondary)] max-w-xl leading-relaxed">
        Open-source voice AI for insurance claims, legal contracts, and
        financial due diligence. Upload, talk, discover — in real-time.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Button
          asChild
          size="lg"
          className="bg-[var(--dv-wine)] hover:bg-[var(--dv-wine-light)] text-white px-8 shadow-[0_0_20px_var(--dv-wine-glow)]"
        >
          <Link href="/dashboard">
            Get Started
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="border-[var(--dv-border-strong)] text-[var(--dv-text-primary)] px-8 hover:bg-[var(--dv-bg-hover)] backdrop-blur-sm"
        >
          <Link href="https://github.com" target="_blank">
            <Github className="mr-2 size-4" />
            GitHub
          </Link>
        </Button>
      </div>
    </section>
  );
}
