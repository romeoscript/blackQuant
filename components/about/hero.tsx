import Image from "next/image";
import { LogoMark } from "@/components/logo";

export function AboutHero() {
  return (
    <section className="bg-bq-bg pt-[87px]">
      <div className="relative flex h-[300px] flex-col justify-end overflow-hidden md:h-[480px]">
        <Image
          src="/about-hero.webp"
          alt=""
          aria-hidden
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45"
        />
        {/* Fades the plate into the page so the stat row below reads as one surface. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-transparent from-30% to-bq-bg"
        />

        <div className="relative mx-auto flex w-full max-w-[1312px] flex-col gap-3 px-6 pb-8 sm:px-8 md:gap-4 md:px-16 md:pb-12">
          <div
            className="bq-in flex items-center gap-2"
            style={{ animationDelay: "0ms" }}
          >
            <LogoMark className="size-5 md:size-7" />
            <span className="text-[13px] font-bold text-bq-heading">
              BlackQuant
            </span>
            <span className="hidden rounded bg-bq-overlay/[0.07] px-2 py-0.5 text-[11px] text-bq-muted sm:block">
              Est. 2026 · Singapore
            </span>
          </div>

          <h1
            className="bq-in font-satoshi text-[32px] font-bold leading-[1.1] tracking-tight md:text-[64px]"
            style={{ animationDelay: "110ms" }}
          >
            <span className="block text-bq-heading">Systematic edge.</span>
            <span className="block text-bq-green">No guesswork.</span>
          </h1>

          <p
            className="bq-in max-w-[512px] text-[13px] leading-[1.7] text-bq-muted"
            style={{ animationDelay: "220ms" }}
          >
            We build institutional-grade signal intelligence for independent
            traders — giving you the same systematic rigour as the desks you
            trade against, at a fraction of the cost.
          </p>
        </div>
      </div>
    </section>
  );
}
