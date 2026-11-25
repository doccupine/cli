import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { appStructure, startingDocsStructure } from "../lib/structures.js";
import { DEFAULT_UI_STRINGS } from "../lib/ui-strings.js";
import { docsTemplate } from "./components/Docs.js";
import { mdxComponentsTemplate } from "./components/MDXComponents.js";
import { apiExampleTemplate } from "./components/layout/ApiExample.js";
import { apiExamplesMdxTemplate } from "./mdx/api-examples.mdx.js";
import { apiPlaygroundMdxTemplate } from "./mdx/api-playground.mdx.js";
import { componentsMdxTemplate } from "./mdx/components.mdx.js";
import { fieldsMdxTemplate } from "./mdx/fields.mdx.js";
import { designStylesheet } from "./styles/index.js";
import { apiExamplesTemplate } from "./utils/apiExamples.js";

interface ApiExamplesModule {
  API_EXAMPLES_SLOT: string;
  splitApiExamples(source: string): { body: string; examples: string | null };
}

let tempDir: string;
let api: ApiExamplesModule;

// utils/apiExamples.ts has no imports, so the generated module runs as is.
beforeAll(async () => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "doccupine-api-examples-"));
  const file = path.join(tempDir, "apiExamples.ts");
  fs.writeFileSync(file, apiExamplesTemplate);
  api = (await import(pathToFileURL(file).href)) as ApiExamplesModule;
});

afterAll(() => {
  if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
});

const FENCE = "```";

describe("splitApiExamples", () => {
  it("moves every example into one rail at the first one's place", () => {
    const source = [
      "# Endpoint",
      "",
      "Intro.",
      "",
      "<RequestExample>",
      "",
      `${FENCE}bash`,
      "curl https://api.example.com",
      FENCE,
      "",
      "</RequestExample>",
      "",
      "Middle.",
      "",
      '<ResponseExample title="200">',
      `${FENCE}json`,
      '{ "ok": true }',
      FENCE,
      "</ResponseExample>",
      "",
      "Outro.",
    ].join("\n");
    const { body, examples } = api.splitApiExamples(source);
    expect(body).toBe(
      [
        "# Endpoint",
        "",
        "Intro.",
        "",
        api.API_EXAMPLES_SLOT,
        "",
        "Middle.",
        "",
        "",
        "Outro.",
      ].join("\n"),
    );
    expect(examples).toContain("curl https://api.example.com");
    expect(examples).toContain('<ResponseExample title="200">');
    expect(examples!.indexOf("<RequestExample>")).toBeLessThan(
      examples!.indexOf("<ResponseExample"),
    );
  });

  it("never cuts a block shown inside a code fence", () => {
    const source = [
      "````mdx",
      "<RequestExample>",
      `${FENCE}bash`,
      "curl x",
      FENCE,
      "</RequestExample>",
      "````",
    ].join("\n");
    expect(api.splitApiExamples(source)).toEqual({
      body: source,
      examples: null,
    });
  });

  it("keeps a closing tag inside an example's own fence as code", () => {
    const source = [
      "<ResponseExample>",
      `${FENCE}html`,
      "</ResponseExample>",
      FENCE,
      "</ResponseExample>",
      "After.",
    ].join("\n");
    const { body, examples } = api.splitApiExamples(source);
    expect(body).toBe(`${api.API_EXAMPLES_SLOT}\nAfter.`);
    expect(examples?.split("\n")).toHaveLength(5);
  });

  it("leaves an unclosed block in the body for MDX to report", () => {
    const source = "<RequestExample>\nno end";
    expect(api.splitApiExamples(source)).toEqual({
      body: source,
      examples: null,
    });
  });
});

describe("API example components", () => {
  it("gathers the examples into a side-panel rail and drops the table of contents", () => {
    expect(docsTemplate).toContain(
      'className="dcp-side-panel dcp-api-examples"',
    );
    expect(docsTemplate).toContain("aria-label={strings.apiExamples}");
    expect(docsTemplate).toContain(
      "const hasRail = hasSidePanel || examples !== null;",
    );
    expect(docsTemplate).toContain(
      "{!hasRail && <DocsSideBar headings={headings} />}",
    );
    // A SidePanel keeps the rail: examples stay inline there.
    expect(docsTemplate).toContain("{ body: content, examples: null }");
  });

  it("renders fences as code, or synced tabs for requests", () => {
    expect(apiExampleTemplate).not.toContain('"use client"');
    expect(apiExampleTemplate).toContain(
      'syncKey={kind === "request" ? "api-request" : undefined}',
    );
    expect(apiExampleTemplate).toContain(
      "label: source.title || source.language,",
    );
    expect(mdxComponentsTemplate).toContain(
      "const { sources, rest } = collectFences(children, isCodeType);",
    );
    expect(DEFAULT_UI_STRINGS.requestExample).toBe("Request");
    expect(DEFAULT_UI_STRINGS.responseExample).toBe("Response");
  });

  it("registers the files, styles and pages", () => {
    expect(appStructure["components/layout/ApiExample.tsx"]).toBe(
      apiExampleTemplate,
    );
    expect(appStructure["utils/apiExamples.ts"]).toBe(apiExamplesTemplate);
    expect(startingDocsStructure["api-examples.mdx"]).toBe(
      apiExamplesMdxTemplate,
    );
    expect(componentsMdxTemplate).toContain('href="/api-examples"');
    expect(apiPlaygroundMdxTemplate).toContain("](/api-examples)");
    for (const prop of ["children", "title"]) {
      expect(apiExamplesMdxTemplate).toContain(`<Field value="${prop}"`);
    }
    for (const design of ["classic", "modern"] as const) {
      const css = designStylesheet(design);
      expect(css).toContain(".dcp-api-example__label {");
      // The rail's own look wins over the side panel's shared card.
      expect(css).toContain(".dcp-api-examples {");
    }
  });
});

describe("Nested fields", () => {
  it("restyles an accordion inside a field in both designs", () => {
    for (const design of ["classic", "modern"] as const) {
      const css = designStylesheet(design);
      const accordion = css.indexOf(".dcp-accordion__title {");
      const nested = css.indexOf(".dcp-field .dcp-accordion__title {");
      expect(accordion).toBeGreaterThan(-1);
      expect(nested).toBeGreaterThan(accordion);
      expect(css).toContain(".dcp-field .dcp-accordion__title:focus-visible {");
    }
    expect(fieldsMdxTemplate).toContain("## Nested fields");
    expect(fieldsMdxTemplate).toContain('<Accordion title="Show properties">');
  });
});

describe("Right rail in the modern design", () => {
  it("draws no rule beside the side panel and the API examples rail", () => {
    expect(designStylesheet("modern")).toMatch(
      /@media screen and \(min-width: 992px\) \{\s*\.dcp-side-panel \{\s*border-left: none;/,
    );
    expect(designStylesheet("classic")).not.toContain("border-left: none;");
  });
});
