import { describe, expect, it } from "vitest";

import { packageJsonTemplate } from "./package.js";
import { prettierignoreTemplate } from "./prettierignore.js";

// The generator emits Prettier-canonical source rather than shelling out to a
// formatter, so `pnpm smoke:generated` runs `format:check` against a real
// generated app to keep that honest. These pin the two halves that make the
// check meaningful: the script has to exist, and the files the generator
// mirrors verbatim from the project root have to stay exempt from it.
describe("generated app formatting", () => {
  it("ships a format:check script for the smoke test to run", () => {
    const packageJson = JSON.parse(packageJsonTemplate) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts["format:check"]).toBe("prettier --check .");
  });

  it("exempts every config file copied byte-for-byte from the project root", () => {
    // Mirrors MDXToNextJSGenerator's `configFiles`, `fontConfigFile`, and
    // `analyticsConfigFile`. Adding a mirrored config without listing it here
    // makes the generated app's own format:check fail on the author's file.
    const mirroredConfigFiles = [
      "analytics.json",
      "config.json",
      "fonts.json",
      "links.json",
      "navigation.json",
      "sections.json",
      "theme.json",
    ];
    const ignored = new Set(
      prettierignoreTemplate
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#")),
    );

    for (const configFile of mirroredConfigFiles) {
      expect(ignored).toContain(configFile);
    }
  });
});
