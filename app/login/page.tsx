import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in · BlackQuant" };

/**
 * Read here rather than in the form: the Google provider is only registered
 * when its credentials exist, so the button has to be absent — not merely
 * inert — until they are set.
 */
export default function Page() {
  return <LoginForm googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID)} />;
}
