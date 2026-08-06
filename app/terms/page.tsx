import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { TERMS } from "@/components/legal/terms-doc";

export const metadata: Metadata = {
  title: "Terms & Conditions · BlackQuant",
  description:
    "The terms governing your use of BlackQuant — eligibility, licensing, billing, risk disclaimers, and dispute resolution.",
};

export default function TermsPage() {
  return <LegalPage doc={TERMS} />;
}
