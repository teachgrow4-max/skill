import { Hero } from "@/features/marketing/components/hero";
import { WhoItsFor } from "@/features/marketing/components/who-its-for";
import { HowItWorks } from "@/features/marketing/components/how-it-works";
import { CategoriesShowcase } from "@/features/marketing/components/categories-showcase";
import { CtaBanner } from "@/features/marketing/components/cta-banner";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <WhoItsFor />
      <HowItWorks />
      <CategoriesShowcase />
      <CtaBanner />
    </>
  );
}
