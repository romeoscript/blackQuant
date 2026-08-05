import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * eslint-config-next 16 ships native flat configs, so the previous FlatCompat
 * bridge is unnecessary — and it crashed on load ("Converting circular structure
 * to JSON") while normalising the legacy shareable config.
 */
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "next-env.d.ts",
      "prisma/generated/**",
      "scripts/**",
    ],
  },
];

export default eslintConfig;
