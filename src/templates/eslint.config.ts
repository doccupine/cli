export const eslintConfigTemplate = `import globals from "globals";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

// Hand-rolled replacement for \`eslint-config-next\`'s default config.
//
// We don't use eslint-config-next under ESLint 10: its React version detection
// (\`settings.react.version: "detect"\`) calls \`context.getFilename()\`, which
// ESLint 10 removed, so it crashes on load. Composing the same plugins
// ourselves lets us pin \`react.version\` (below) and stay in control.
//
// The recommended rule sets below mirror what eslint-config-next enables:
// React, React Hooks, Next.js and jsx-a11y. On top of that we keep a few
// project-specific rules (no-console and two @typescript-eslint rules).

const config = [
  {
    // node_modules/ and .git/ are ignored by default.
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    name: "doccupine/base",
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      import: importPlugin,
      "jsx-a11y": jsxA11yPlugin,
      "@next/next": nextPlugin,
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser, ...globals.node },
    },
    settings: {
      // Pinned (not "detect") on purpose: eslint-plugin-react 7.37.x's version
      // detection calls the ESLint-10-removed \`context.getFilename()\`. Pinning
      // skips that code path. Keep roughly in sync with the installed React.
      react: { version: "19.2" },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      "import/no-anonymous-default-export": "warn",
      "react/no-unknown-property": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "jsx-a11y/alt-text": ["warn", { elements: ["img"], img: ["Image"] }],
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
      "react/jsx-no-target-blank": "off",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default config;
`;
