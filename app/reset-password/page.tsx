import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Reset password · BlackQuant",
};

/**
 * The token is read here rather than with useSearchParams so the page stays a
 * server component and needs no Suspense boundary around the whole form.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token ?? ""} />;
}
