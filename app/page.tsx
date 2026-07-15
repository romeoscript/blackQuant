import { ScrollProgress } from "@/components/landing/scroll-progress";
import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Integrations } from "@/components/landing/integrations";
import { Infrastructure } from "@/components/landing/infrastructure";
import { Performance } from "@/components/landing/performance";
import { Trust } from "@/components/landing/trust";
import { CtaFooter } from "@/components/landing/cta-footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-bq-bg font-satoshi text-white">
      <ScrollProgress />
      <Nav />
      <Hero />
      <Integrations />
      <Infrastructure />
      <Performance />
      <Trust />
      <CtaFooter />
    </main>
  );
}
