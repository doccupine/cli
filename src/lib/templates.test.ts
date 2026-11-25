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

// Every component with its look split into a sibling .styles file.
const STYLE_FILES = [
  "components/DocsSideBar.styles.ts",
  "components/SideBar.styles.ts",
  "components/layout/Accordion.styles.ts",
  "components/layout/ActionBar.styles.ts",
  "components/layout/Callout.styles.ts",
  "components/layout/Card.styles.ts",
  "components/layout/Code.styles.ts",
  "components/layout/DocsComponents.styles.ts",
  "components/layout/DocsNavigation.styles.ts",
  "components/layout/Footer.styles.ts",
  "components/layout/Header.styles.ts",
  "components/layout/StaticLinks.styles.ts",
  "components/layout/Steps.styles.ts",
  "components/layout/Tabs.styles.ts",
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
  it("is the classic structure, with the style files and tokens", () => {
    expect(appStructureFor("classic")).toEqual(appStructure);
    // The default design is modern: the classic structure plus its overrides.
    expect(appStructureFor()).toEqual(appStructureFor("modern"));
    for (const file of [...STYLE_FILES, "components/layout/designTokens.ts"]) {
      expect(appStructure[file], file).toBeTypeOf("string");
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

  it("keeps each style file a client module the logic file imports", () => {
    for (const template of SITE_TEMPLATES) {
      const structure = appStructureFor(template);
      for (const file of STYLE_FILES) {
        expect(structure[file].startsWith('"use client";\n'), file).toBe(true);
        const logicFile = Object.keys(structure).find(
          (candidate) =>
            candidate === file.replace(/\.styles\.ts$/, ".tsx") ||
            candidate === file.replace(/\.styles\.ts$/, ".ts"),
        );
        expect(logicFile, file).toBeDefined();
        expect(structure[logicFile!]).toContain(
          `from "@/${file.replace(/\.ts$/, "")}";`,
        );
      }
    }
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

  it("replaces the chrome and content block styles", () => {
    for (const file of [...STYLE_FILES, "components/layout/designTokens.ts"]) {
      expect(modernOverrides[file], file).toBeTypeOf("string");
      expect(modern[file], file).not.toBe(appStructure[file]);
    }
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
      "data-pinned={isPinned || undefined}",
    );
    expect(modern["components/layout/Code.tsx"]).not.toContain("<Dot");
    expect(modern["components/layout/Code.tsx"]).toContain(
      "<TopBarTitle theme={theme}>{title || language}</TopBarTitle>",
    );
    expect(modern["components/layout/DocsComponents.tsx"]).toContain(
      "function DocsWrapper({ children, pages = [] }: DocsWrapperProps)",
    );
    expect(modern["components/layout/ActionBar.tsx"]).toContain(
      "const category = useCurrentPage()?.category;",
    );
    expect(modern["components/layout/SharedStyled.ts"]).toContain(
      "export const inkMix",
    );
  });

  it("opens the chat from its own header pill, like Cherry's launcher", () => {
    const header = modern["components/layout/Header.tsx"];
    expect(header).not.toContain("ChatLauncher");
    expect(header).toContain("onClick={toggleChat}");
    expect(header).toContain("aria-expanded={isChatOpen}");
    expect(header).toContain("aria-label={t.askAiAssistant}");
  });

  it("gives the header and page actions one pill control style", () => {
    expect(modern["components/layout/SharedStyled.ts"]).toContain(
      "export const pillControlStyles",
    );
    expect(modern["components/layout/Header.styles.ts"]).toContain(
      "${pillControlStyles};",
    );
    expect(modern["components/layout/ActionBar.styles.ts"]).toContain(
      "export const actionPillStyles = pillControlStyles;",
    );
  });

  it("fits the search dialog to the modern controls", () => {
    const search = modern["components/SearchModalContent.tsx"];
    expect(search).toContain("${pillControlStyles};");
    expect(search).toContain("&& > button:last-child {");
    expect(search).toContain(
      "`color-mix(in srgb, ${theme.colors.accent} 7%, transparent)`",
    );
    // Same dialog semantics as classic.
    expect(search).toContain('role="dialog"');
    expect(search).toContain('aria-modal="true"');
  });

  it("restyles the chat panel without dropping the composer glow", () => {
    const chat = modern["components/Chat.tsx"];
    expect(chat).toContain("<StyledChatShell");
    expect(chat).toContain("display: contents;");
    expect(chat).toContain("min-height: ${HEADER_HEIGHT + 1}px;");
    expect(chat).toMatch(/<ChatInput\s+\$glow/);
    // The panel opens under a still cursor; its buttons wait for a real
    // pointer move before showing hover.
    expect(chat).toContain("data-pointer-moved={pointerMoved}");
    expect(chat).toContain(
      '&&[data-pointer-moved="false"] .chat-header-actions button:hover',
    );
    // The fullscreen chat's close button sits where the menu button does.
    expect(modern["components/SideBar.styles.ts"]).toContain(
      'html:has([data-chat-panel][aria-hidden="false"]) & {',
    );
  });

  it("keeps the header in normal flow until the page scrolls", () => {
    const styles = modern["components/layout/Header.styles.ts"];
    expect(styles).toMatch(/position: relative;[\s\S]*position: fixed;/);
    expect(styles.indexOf("position: relative;")).toBeLessThan(
      styles.indexOf("position: fixed;"),
    );
    // The menu button over the header is only fixed once the header pins.
    expect(modern["components/SideBar.styles.ts"]).toContain(
      "html:has(#header[data-pinned]) & {\n    position: fixed;",
    );
  });

  it("draws the sidebar footer controls like the page header's", () => {
    const sideBar = modern["components/SideBar.tsx"];
    const sideBarStyles = modern["components/SideBar.styles.ts"];
    const shared = modern["components/layout/SharedStyled.ts"];
    const actionBarStyles = modern["components/layout/ActionBar.styles.ts"];
    const focusToggle = modern["components/layout/FocusModeToggle.tsx"];

    // The theme toggle is the site's own switch, not Cherry's ThemeToggle.
    expect(sideBar).not.toMatch(/<ThemeToggle|import \{[^}]*ThemeToggle/);
    expect(sideBar).toContain("<ThemeSwitch />");
    // It flips the mode through Cherry, keeps Cherry's Cmd/Ctrl+Shift+L
    // chord, and reports its state as a switch.
    expect(sideBar).toContain("const { mode, toggleTheme } = useColorMode();");
    expect(sideBar).toContain("onClick={toggleTheme}");
    expect(sideBar).toContain('if (e.key.toLowerCase() !== "l") return;');
    expect(sideBar).toMatch(/role="switch"\s+aria-checked=\{mode === "dark"\}/);
    // The knob follows the dark class in CSS, so it never waits on React.
    expect(sideBarStyles).toMatch(
      /StyledThemeSwitch = styled\.button<\{ theme: Theme \}>`[^`]*pillSwitchStyles[^`]*:root\.dark & \{\s*\$\{pillSwitchKnobEnd\};/,
    );

    // The view toggle and the theme toggle share one switch style; the
    // markdown link and the focus-mode toggle share one round style.
    expect(shared).toContain("export const pillSwitchStyles");
    expect(shared).toContain("export const roundControlStyles");
    expect(actionBarStyles).toMatch(
      /StyledToggle[^;]*;[\s\S]*pillSwitchStyles/,
    );
    expect(actionBarStyles).toMatch(
      /StyledMarkdownLink[\s\S]*roundControlStyles/,
    );
    expect(focusToggle).toContain("${roundControlStyles};");
    expect(focusToggle).not.toContain("theme.colors.primary");
    // The focus toggle keeps its behavior and fixed placement.
    expect(focusToggle).toContain("position: fixed;");
    expect(focusToggle).toContain("aria-pressed={isFocusMode}");
    expect(focusToggle).toContain('root.setAttribute("data-focus-mode", "")');

    // Classic keeps Cherry's ThemeToggle and the outlined focus button.
    expect(appStructure["components/SideBar.tsx"]).toContain(
      "<ThemeToggle $shortcut />",
    );
    expect(appStructure["components/layout/FocusModeToggle.tsx"]).toContain(
      "${interactiveStyles};",
    );
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
