import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { appStructure, startingDocsStructure } from "../lib/structures.js";
import { DEFAULT_UI_STRINGS } from "../lib/ui-strings.js";
import { mdxComponentsTemplate } from "./components/MDXComponents.js";
import { previewTemplate } from "./components/layout/Preview.js";
import { previewCodeTemplate } from "./components/layout/PreviewCode.js";
import { previewDataTemplate } from "./components/layout/PreviewData.js";
import { componentsMdxTemplate } from "./mdx/components.mdx.js";
import { previewMdxTemplate } from "./mdx/preview.mdx.js";
import { designStylesheet } from "./styles/index.js";

// The CLI ships React for generated sites but not its type declarations, so
// the few calls these tests make are typed here.
type Node = unknown;
interface Element {
  type: unknown;
  props: Record<string, unknown>;
}
const React = createRequire(import.meta.url)("react") as {
  createElement(
    type: unknown,
    props: Record<string, unknown> | null,
    ...children: Node[]
  ): Element;
};

interface PreviewSource {
  code: string;
  language: string;
  title?: string;
}

interface PreviewDataModule {
  PREVIEW_COLLAPSED_LINES: number;
  isCollapsible(code: string): boolean;
  fenceSource(
    node: Node,
    isCode: (type: unknown) => boolean,
  ): PreviewSource | null;
  splitPreviewChildren(
    children: Node,
    isCode: (type: unknown) => boolean,
  ): { stage: Node[]; source: PreviewSource | null };
  collectFences(
    children: Node,
    isCode: (type: unknown) => boolean,
  ): { sources: PreviewSource[]; rest: Node[] };
}

// Stand-ins for the components the generated site maps `pre` and `code` to
// (MermaidPre and InlineCode): a fence reaches <Preview> with these types,
// never the plain tags.
function MappedPre(props: { children?: Node }) {
  return React.createElement("pre", props);
}
function InlineCode(props: { children?: Node }) {
  return React.createElement("code", props);
}
const isCode = (type: unknown) => type === "code" || type === InlineCode;

function fence(language: string | null, code: string, codeType: unknown) {
  return React.createElement(
    MappedPre,
    null,
    React.createElement(
      codeType,
      language ? { className: `language-${language}` } : null,
      code,
    ),
  );
}

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
let tempDir: string;
let data: PreviewDataModule;

// PreviewData.ts is plain TypeScript with React as its only import, so the
// generated module itself runs here: written to a temp directory whose
// node_modules points at the CLI's own React.
beforeAll(async () => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "doccupine-preview-"));
  fs.mkdirSync(path.join(tempDir, "node_modules"));
  fs.symlinkSync(
    path.join(repoRoot, "node_modules", "react"),
    path.join(tempDir, "node_modules", "react"),
    "dir",
  );
  const file = path.join(tempDir, "PreviewData.ts");
  fs.writeFileSync(file, previewDataTemplate);
  data = (await import(pathToFileURL(file).href)) as PreviewDataModule;
});

afterAll(() => {
  if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("Preview fence detection", () => {
  it("finds a fence whose code element is the mapped InlineCode", () => {
    const source = data.fenceSource(
      fence("jsx", "<Button>Go</Button>\n", InlineCode),
      isCode,
    );
    expect(source).toEqual({ code: "<Button>Go</Button>", language: "jsx" });
  });

  it("finds a fence whose code element is the plain tag", () => {
    expect(data.fenceSource(fence("bash", "npm i\n", "code"), isCode)).toEqual({
      code: "npm i",
      language: "bash",
    });
  });

  it("reads a fence's title meta and collects every fence in order", () => {
    const titled = React.createElement(
      MappedPre,
      null,
      React.createElement(
        InlineCode,
        { className: "language-bash", meta: 'title="cURL"' },
        "curl x\n",
      ),
    );
    expect(data.fenceSource(titled, isCode)).toEqual({
      code: "curl x",
      language: "bash",
      title: "cURL",
    });
    const note = React.createElement("p", null, "Note.");
    const { sources, rest } = data.collectFences(
      [titled, note, fence("json", "{}\n", InlineCode)],
      isCode,
    );
    expect(sources.map((source) => source.language)).toEqual(["bash", "json"]);
    expect(rest).toHaveLength(1);
  });

  it("ignores inline code and fences without a language", () => {
    // A paragraph holding only inline code has the same shape as a fence,
    // minus the language class.
    const paragraph = React.createElement(
      "p",
      null,
      React.createElement(InlineCode, null, "npm i"),
    );
    expect(data.fenceSource(paragraph, isCode)).toBeNull();
    expect(
      data.fenceSource(fence(null, "plain text\n", InlineCode), isCode),
    ).toBeNull();
    // A language class on an element the map does not treat as code.
    expect(
      data.fenceSource(fence("jsx", "<div />", "span"), isCode),
    ).toBeNull();
    expect(data.fenceSource("text", isCode)).toBeNull();
  });

  it("moves the first fence to the code panel and keeps the rest on stage", () => {
    const button = React.createElement("button", null, "Go");
    const first = fence("html", "<button>Go</button>\n", InlineCode);
    const second = fence("css", "button {}\n", InlineCode);
    const { stage, source } = data.splitPreviewChildren(
      [button, first, second],
      isCode,
    );
    expect(source).toEqual({ code: "<button>Go</button>", language: "html" });
    expect(stage).toHaveLength(2);
    expect((stage[0] as Element).type).toBe("button");
    expect((stage[1] as Element).type).toBe(MappedPre);
  });

  it("leaves a preview without a fence as stage only", () => {
    const { stage, source } = data.splitPreviewChildren(
      React.createElement("img", { alt: "" }),
      isCode,
    );
    expect(source).toBeNull();
    expect(stage).toHaveLength(1);
  });

  it("collapses only code longer than the collapsed lines", () => {
    const lines = (count: number) =>
      Array.from({ length: count }, (_, i) => `line ${i}`).join("\n");
    expect(data.PREVIEW_COLLAPSED_LINES).toBe(4);
    expect(data.isCollapsible(lines(4))).toBe(false);
    expect(data.isCollapsible(lines(5))).toBe(true);
  });
});

describe("Preview templates", () => {
  it("is registered with the MDX components and splits with InlineCode", () => {
    expect(mdxComponentsTemplate).toMatch(
      /import \{[^}]*\bsplitPreviewChildren\b[^}]*\} from "@\/components\/layout\/PreviewData";/,
    );
    expect(mdxComponentsTemplate).toContain(
      'return type === "code" || type === InlineCode;',
    );
    expect(mdxComponentsTemplate).toMatch(/\n {4}Preview,\n/);
  });

  it("renders on the server and ships only the toggle to the client", () => {
    expect(previewTemplate).not.toContain('"use client"');
    expect(previewDataTemplate).not.toContain('"use client"');
    expect(previewCodeTemplate.startsWith('"use client";')).toBe(true);
    // The site's own code block draws the source.
    expect(previewTemplate).toContain(
      "<Code code={source.code} language={source.language} />",
    );
  });

  it("gives the toggle an accessible, translatable button", () => {
    expect(previewCodeTemplate).toContain('type="button"');
    expect(previewCodeTemplate).toContain("aria-expanded={expanded}");
    expect(previewCodeTemplate).toContain("aria-controls={id}");
    // The cut-off code leaves the tab order while collapsed.
    expect(previewCodeTemplate).toContain(
      "if (pre) pre.tabIndex = expanded ? 0 : -1;",
    );
    expect(previewCodeTemplate).toContain(
      "{expanded ? t.hideCode : t.viewCode}",
    );
    expect(DEFAULT_UI_STRINGS.viewCode).toBe("View code");
    expect(DEFAULT_UI_STRINGS.hideCode).toBe("Hide code");
  });

  it("styles both designs with a keyboard ring and reduced motion", () => {
    for (const design of ["classic", "modern"] as const) {
      const css = designStylesheet(design);
      expect(css).toContain(".dcp-preview__stage {");
      expect(css).toContain(".dcp-preview__toggle:focus-visible {");
      expect(css).toContain("box-shadow: 0 0 0 2px var(--color-primaryLight);");
      expect(css).toContain("@media (prefers-reduced-motion: reduce)");
      // Nothing scrolls inside the cut-off code, so its untabbable <pre>
      // is never a scroll region keyboard users cannot reach.
      expect(css).toMatch(
        /\.dcp-preview__code\[data-collapsed\] \.dcp-code__body pre \{\s*overflow: clip;/,
      );
    }
    expect(designStylesheet("classic")).toMatch(
      /\.dcp-preview \{[^}]*border-radius: 12px;/,
    );
    expect(designStylesheet("modern")).toMatch(
      /\.dcp-preview \{[^}]*border-radius: 16px;/,
    );
  });

  it("lets bleed win over fill and run the stage edge to edge", () => {
    expect(previewTemplate).toContain(
      "data-fill={(fill && !bleed) || undefined}",
    );
    expect(previewTemplate).toContain("data-bleed={bleed || undefined}");
    for (const design of ["classic", "modern"] as const) {
      const css = designStylesheet(design);
      expect(css).toMatch(
        /\.dcp-preview__stage\[data-bleed\] \{[^}]*padding: 0;[^}]*min-height: var\(--dcp-preview-min-height, 0px\);/,
      );
      // Media runs flush: no radius of its own, the card clips the corners.
      expect(css).toMatch(
        /\.dcp-preview__stage\[data-bleed\] iframe \{[^}]*border-radius: 0;/,
      );
      expect(css).toMatch(
        /\.dcp-preview__stage\[data-bleed\] iframe:not\(\[height\]\) \{\s*aspect-ratio: 16 \/ 9;/,
      );
    }
  });

  it("writes the component files and the starter page", () => {
    expect(appStructure["components/layout/Preview.tsx"]).toBe(previewTemplate);
    expect(appStructure["components/layout/PreviewCode.tsx"]).toBe(
      previewCodeTemplate,
    );
    expect(appStructure["components/layout/PreviewData.ts"]).toBe(
      previewDataTemplate,
    );
    expect(startingDocsStructure["preview.mdx"]).toBe(previewMdxTemplate);
    expect(componentsMdxTemplate).toContain('href="/preview"');
  });

  it("documents every prop", () => {
    for (const prop of ["children", "minHeight", "expanded", "fill", "bleed"]) {
      expect(previewMdxTemplate).toContain(`<Field value="${prop}"`);
    }
  });

  it("keeps the Components pages in a unique order", () => {
    const orders = Object.values(startingDocsStructure)
      .map((page) => /^---\n([\s\S]*?)\n---/.exec(page)?.[1] ?? "")
      .filter((front) => /^category: "Components"$/m.test(front))
      .map((front) => Number(/^order: (\d+)$/m.exec(front)?.[1]));
    expect(new Set(orders).size).toBe(orders.length);
  });
});
