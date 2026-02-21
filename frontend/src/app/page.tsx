import { AuroraBackground } from "@/components/landing/aurora-background";
import { Hero } from "@/components/landing/hero";
import { UseCaseCards } from "@/components/landing/use-case-cards";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[var(--dv-bg-base)]">
      {/* Aurora gradient + stars — covers the whole page */}
      <AuroraBackground />

      {/* Page content on top */}
      <div className="relative z-10">
        <Hero />
        <UseCaseCards />
        <Footer />
      </div>
    </div>
  );
}
