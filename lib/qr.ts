import encodeQr from "@paulmillr/qr";

/**
 * Inline SVG for a QR code. Rendered server-side so nothing is sent to a
 * third-party image renderer — the payloads here are a 2FA secret and a deposit
 * address, neither of which should leave the server to be drawn.
 */
export function qrSvg(text: string, scale = 4): string {
  return encodeQr(text, "svg", { ecc: "medium", scale });
}
