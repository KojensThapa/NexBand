import { CtaSection } from "@/components/marketing/cta-section";
import { ExamsSection } from "@/components/marketing/exams-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ExamsSection />
      <HowItWorksSection />
      <CtaSection />
    </>
  );
}
