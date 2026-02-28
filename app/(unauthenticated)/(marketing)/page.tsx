import { CompaniesSection } from "./_components/sections/companies-section"
import { CTASection } from "./_components/sections/cta-section"
import { FAQSection } from "./_components/sections/faq-section"
import { FeaturesSection } from "./_components/sections/features-section"
import { HeroSection } from "./_components/sections/hero-section"
import { PricingSection } from "./_components/sections/pricing-section"

export default function MarketingPage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <CompaniesSection />
      <FeaturesSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </main>
  )
}
