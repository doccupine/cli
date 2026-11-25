import { describe, expect, it } from "vitest";

import {
  appStructure,
  appStructureFor,
  modernOverrides,
  templateDependentFiles,
} from "./structures.js";
import {
  DEFAULT_TEMPLATE,
  SITE_TEMPLATES,
  isSiteTemplate,
  resolveTemplate,
  resolveTemplateFromSource,
} from "./templates.js";
import { configTemplate } from "../templates/utils/config.js";
import { siteLayoutTemplate } from "./layout.js";

// The site's stylesheets: every design writes the same ones.
const STYLESHEETS = [
  "app/styles/reset.css",
  "app/styles/base.css",
  "app/styles/components.css",
  "app/styles/design.css",
];

describe("resolveTemplate", () => {
  it("defaults to modern", () => {
    expect(DEFAULT_TEMPLATE).toBe("modern");
    expect(resolveTemplate({})).toEqual({ template: "modern", warning: null });
    expect(resolveTemplate(null)).toEqual({
      template: "modern",
      warning: null,
    });
    expect(resolveTemplate([])).toEqual({ template: "modern", warning: null });
  });

  it("accepts every known template", () => {
    for (const template of SITE_TEMPLATES) {
      expect(isSiteTemplate(template)).toBe(true);
      expect(resolveTemplate({ template })).toEqual({
        template,
        warning: null,
      });
    }
  });

  it("falls back to the default with a warning for an unknown value", () => {
    for (const template of ["Classic", "fancy", "", 1, null, ["classic"]]) {
      const resolved = resolveTemplate({ template });
      expect(resolved.template).toBe("modern");
      expect(resolved.warning).toContain('"template" must be one of');
    }
  });

  it("reads config.json source, ignoring missing or broken JSON", () => {
    expect(resolveTemplateFromSource(null)).toEqual({
      template: "modern",
      warning: null,
    });
    expect(resolveTemplateFromSource("{ not json")).toEqual({
      template: "modern",
      warning: null,
    });
    expect(resolveTemplateFromSource('{"template":"classic"}').template).toBe(
      "classic",
    );
  });

  it("lists every template in the generated runtime schema", () => {
    expect(configTemplate).toContain(
      `template: z.enum([${SITE_TEMPLATES.map((name) => `"${name}"`).join(", ")}]).optional().catch(undefined),`,
    );
  });
});

describe("appStructureFor", () => {
  it("is the classic structure, with the stylesheets and style files", () => {
    expect(appStructureFor("classic")).toEqual(appStructure);
    // The default design is modern: the classic structure plus its overrides.
    expect(appStructureFor()).toEqual(appStructureFor("modern"));
    for (const file of STYLESHEETS) {
      expect(appStructure[file], file).toBeTypeOf("string");
    }
    // tokens.css is generated from theme.json, not a static template.
    expect(appStructure["app/styles/tokens.css"]).toBeUndefined();
  });

  it("declares the layer order before any layer, in the first stylesheet", () => {
    for (const template of SITE_TEMPLATES) {
      const structure = appStructureFor(template);
      expect(structure["app/styles/reset.css"]).toContain(
        "@layer reset, tokens, base, components, design, utilities;",
      );
      expect(structure["app/styles/design.css"]).toContain("--layout-gutter:");
    }
  });

  it("gives every design the same file list", () => {
    const classicKeys = Object.keys(appStructure).sort();
    for (const template of SITE_TEMPLATES) {
      expect(Object.keys(appStructureFor(template)).sort()).toEqual(
        classicKeys,
      );
    }
    for (const file of Object.keys(modernOverrides)) {
      expect(appStructure[file], file).toBeTypeOf("string");
    }
  });

  it("ships no styled-components or Cherry", () => {
    for (const template of SITE_TEMPLATES) {
      for (const [file, content] of Object.entries(appStructureFor(template))) {
        expect(content, `${template}: ${file}`).not.toMatch(
          /from "(styled-components|cherry-styled-components)/,
        );
        expect(file, `${template}: ${file}`).not.toMatch(/\.styles\.ts$/);
      }
    }
    const pkg = JSON.parse(appStructure["package.json"]);
    expect(pkg.dependencies["styled-components"]).toBeUndefined();
    expect(pkg.dependencies["cherry-styled-components"]).toBeUndefined();
  });

  it("reports the files a design switch has to rewrite", () => {
    expect(templateDependentFiles()).toEqual(
      Object.keys(modernOverrides).sort(),
    );
  });
});

// Names a generated module exports, read from its source.
function exportedNames(source: string): string[] {
  const names = new Set<string>();
  for (const match of source.matchAll(
    /^export (?:const|function|interface|type) (\w+)/gm,
  )) {
    names.add(match[1]);
  }
  for (const match of source.matchAll(/^export \{([^}]+)\}/gm)) {
    for (const name of match[1].split(",")) {
      if (name.trim()) names.add(name.trim());
    }
  }
  return [...names].sort();
}

describe("the modern design", () => {
  const modern = appStructureFor("modern");

  it("replaces the design stylesheet", () => {
    expect(modern["app/styles/design.css"]).not.toBe(
      appStructure["app/styles/design.css"],
    );
    // Everything else about the look is shared.
    for (const file of [
      "app/styles/reset.css",
      "app/styles/base.css",
      "app/styles/components.css",
    ]) {
      expect(modernOverrides[file], file).toBeUndefined();
    }
    expect(modern["app/styles/design.css"]).toContain(
      "--layout-sidebar-width: 264px;",
    );
    expect(appStructure["app/styles/design.css"]).toContain(
      "--layout-sidebar-width: 280px;",
    );
  });

  it("keeps every name the classic file exports", () => {
    for (const file of Object.keys(modernOverrides)) {
      const missing = exportedNames(appStructure[file]).filter(
        (name) => !exportedNames(modern[file]).includes(name),
      );
      expect(missing, file).toEqual([]);
    }
  });

  it("derives its logic files from classic with only the markup it needs", () => {
    expect(modern["components/layout/Header.tsx"]).toContain(
      'header.setAttribute("data-pinned", "")',
    );
    expect(modern["components/layout/Code.tsx"]).not.toContain(
      "dcp-code__dots",
    );
    expect(modern["components/layout/Code.tsx"]).toContain(
      '<span className="dcp-code__title">{title || language}</span>',
    );
    expect(modern["components/layout/DocsComponents.tsx"]).toContain(
      "function DocsWrapper({ children, pages = [] }: DocsWrapperProps)",
    );
    expect(modern["components/layout/ActionBar.tsx"]).toContain(
      "const category = useCurrentPage()?.category;",
    );
  });

  it("opens the chat from its own header pill, like the classic launcher", () => {
    const header = modern["components/layout/Header.tsx"];
    expect(header).not.toContain("ChatLauncher");
    expect(header).toContain("onClick={toggleChat}");
    expect(header).toContain("aria-expanded={isChatOpen}");
    expect(header).toContain("aria-label={t.askAiAssistant}");
  });

  it("gives the header and page actions one pill control style", () => {
    const css = modern["app/styles/design.css"];
    expect(css).toContain(".dcp-pill {");
    expect(css).toContain(".dcp-pill-round {");
    expect(css).toContain(".dcp-pill-switch {");
    expect(modern["components/layout/Header.tsx"]).toContain(
      'className="dcp-reset-button dcp-pill dcp-header__ask"',
    );
    const actionBar = modern["components/layout/ActionBar.tsx"];
    expect(actionBar).toContain(
      "dcp-pill dcp-pill-round dcp-action-bar__markdown",
    );
    expect(actionBar).toContain(
      "dcp-pill dcp-pill-switch dcp-action-bar__toggle",
    );
    // Classic does not style the pill classes.
    expect(appStructure["app/styles/design.css"]).not.toContain(".dcp-pill {");
    expect(appStructure["app/styles/components.css"]).not.toContain(
      ".dcp-pill {",
    );
  });

  it("opens search as a native modal dialog", () => {
    const search = modern["components/SearchModalContent.tsx"];
    // The markup is shared; the modern look is CSS only.
    expect(search).toBe(appStructure["components/SearchModalContent.tsx"]);
    expect(search).toContain("<dialog");
    expect(search).toContain("showModal()");
    expect(search).toContain('aria-modal="true"');
  });

  it("restyles the chat panel without dropping the composer glow", () => {
    const chat = modern["components/Chat.tsx"];
    expect(chat).toContain('className="dcp-chat-shell"');
    // The panel opens under a still cursor; its buttons wait for a real
    // pointer move before showing hover.
    expect(chat).toContain("data-pointer-moved={pointerMoved}");
    const css = modern["app/styles/design.css"];
    expect(css).toContain('.dcp-chat-shell[data-pointer-moved="false"]');
    // The glow is shared by both designs.
    expect(modern["app/styles/components.css"]).toContain(
      "@property --dcp-gradient-angle",
    );
    // The fullscreen chat's close button sits where the menu button does.
    expect(css).toContain(
      'html:has([data-chat-panel][aria-hidden="false"]) .dcp-sidebar-toggle {',
    );
  });

  it("keeps the header in normal flow until the page scrolls", () => {
    const header = modern["components/layout/Header.tsx"];
    // Pinning is a direct DOM write in the scroll handler (no React state),
    // so it lands in the same frame as the scroll and the header never
    // scrolls off screen on a fast scroll.
    expect(header).toContain('header.setAttribute("data-pinned", "")');
    expect(header).not.toContain("setIsPinned");
    const css = modern["app/styles/components.css"];
    const relative = css.indexOf("position: relative;");
    expect(relative).toBeGreaterThan(-1);
    expect(css).toMatch(/\.dcp-header\[data-pinned\] \{\s+position: fixed;/);
    // The menu button over the header is only fixed once the header pins.
    expect(modern["app/styles/design.css"]).toMatch(
      /html:has\(#header\[data-pinned\]\) \.dcp-sidebar-toggle \{\s+position: fixed;/,
    );
  });

  it("draws the sidebar footer controls like the page header's", () => {
    const sideBar = modern["components/SideBar.tsx"];
    const css = modern["app/styles/design.css"];
    const focusToggle = modern["components/layout/FocusModeToggle.tsx"];

    // The theme toggle is the site's own switch.
    expect(sideBar).not.toContain('from "cherry-styled-components"');
    expect(sideBar).toContain("<ThemeSwitch />");
    // It flips the mode through the local store, keeps the Cmd/Ctrl+Shift+L
    // chord, and reports its state as a switch.
    expect(sideBar).toContain(
      'import { useColorMode } from "@/components/useColorMode";',
    );
    expect(sideBar).toContain("onClick={toggleTheme}");
    expect(sideBar).toContain('if (e.key.toLowerCase() !== "l") return;');
    expect(sideBar).toMatch(/role="switch"\s+aria-checked=\{mode === "dark"\}/);
    expect(sideBar).toContain("dcp-pill dcp-pill-switch dcp-theme-switch");
    // The knob follows the dark class in CSS, so it never waits on React.
    expect(css).toContain(":root.dark .dcp-theme-switch::after {");

    // The markdown link and the focus-mode toggle share one round style.
    expect(focusToggle).toContain("dcp-pill dcp-pill-round dcp-focus-toggle");
    expect(focusToggle).toContain("aria-pressed={isFocusMode}");
    expect(focusToggle).toContain('root.setAttribute("data-focus-mode", "")');

    // Classic renders the same switch and focus button, styled by the same
    // pill rules applied to them directly, with primary icons in both.
    const classicSideBar = appStructure["components/SideBar.tsx"];
    const classicCss = appStructure["app/styles/design.css"];
    expect(classicSideBar).toBe(sideBar);
    expect(appStructure["components/layout/FocusModeToggle.tsx"]).toBe(
      focusToggle,
    );
    expect(classicCss).toContain(":root.dark .dcp-theme-switch::after {");
    expect(classicCss).not.toContain(".dcp-theme-toggle");
    for (const designCss of [css, classicCss]) {
      expect(designCss).toMatch(
        /\.dcp-theme-switch svg\.lucide,\s+\.dcp-focus-toggle svg\.lucide \{\s+color: var\(--color-primary\);/,
      );
    }
  });

  it("hands the page list to DocsWrapper in every layout shape", () => {
    const pages: Parameters<typeof siteLayoutTemplate>[0] = [];
    const sections = [{ label: "Guides", slug: "guides" }];
    const variants = {
      languages: [{ code: "en", label: "English", default: true }],
      versions: null,
    };
    const shapes: Array<
      [Parameters<typeof siteLayoutTemplate>[1], typeof variants | null]
    > = [
      [null, null],
      [sections, null],
      [null, variants],
      [sections, variants],
    ];
    for (const [sectionsConfig, variantSet] of shapes) {
      expect(
        siteLayoutTemplate(pages, sectionsConfig, variantSet, "modern"),
      ).toContain("<DocsWrapper pages={pages}>");
      const classic = siteLayoutTemplate(
        pages,
        sectionsConfig,
        variantSet,
        "classic",
      );
      expect(classic).toContain("<DocsWrapper>");
      expect(classic).not.toContain("<DocsWrapper pages");
    }
  });
});
