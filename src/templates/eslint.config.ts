export const eslintConfigTemplate = `import nextConfig from "eslint-config-next";

// Find the config object that already has @typescript-eslint plugin registered
const tsConfigIndex = nextConfig.findIndex(
  (c) => c.plugins && "@typescript-eslint" in c.plugins,
);

const config = nextConfig.map((c, i) => {
  if (i === tsConfigIndex) {
    return {
      ...c,
      rules: {
        ...c.rules,
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
      },
    };
  }
  return c;
});

config.push({
  rules: {
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
});

export default config;
`;
