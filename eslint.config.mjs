import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Cosmetic only: literal apostrophes/quotes in JSX text render correctly.
      // We prefer readable copy over HTML entities in source.
      "react/no-unescaped-entities": "off",
    },
  },
  {
    // global-error replaces the root layout on a crash. A plain <a> triggers a
    // full document reload, which is the safe recovery path when the React tree
    // (and the router) may be in a broken state — Link is intentionally avoided.
    files: ["app/global-error.tsx"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;
