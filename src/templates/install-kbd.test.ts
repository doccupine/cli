import { describe, expect, it } from "vitest";

import { rootLayoutTemplate } from "../lib/layout.js";
import { appStructure, startingDocsStructure } from "../lib/structures.js";
import { DEFAULT_UI_STRINGS } from "../lib/ui-strings.js";
import { docsTemplate } from "./components/Docs.js";
import { mdxComponentsTemplate } from "./components/MDXComponents.js";
import { useChoiceTemplate } from "./components/useChoice.js";
import { codeTemplate } from "./components/layout/Code.js";
import { installTemplate } from "./components/layout/Install.js";
import { kbdTemplate } from "./components/layout/Kbd.js";
import { aiAssistantMdxTemplate } from "./mdx/ai-assistant.mdx.js";
import { componentsMdxTemplate } from "./mdx/components.mdx.js";
import { installMdxTemplate } from "./mdx/install.mdx.js";
import { keyboardShortcutsMdxTemplate } from "./mdx/keyboard-shortcuts.mdx.js";
import { modernCodeTemplate } from "./modern/components/layout/Code.js";
import { designStylesheet } from "./styles/index.js";

describe("Install", () => {
  it("writes each package manager's command: plain, dev, and exec", () => {
    for (const command of [
      '["npm", "npm install", "npm install -D", "npx"]',
      '["pnpm", "pnpm add", "pnpm add -D", "pnpm dlx"]',
      '["yarn", "yarn add", "yarn add -D", "yarn dlx"]',
      '["bun", "bun add", "bun add -d", "bunx"]',
    ]) {
      expect(installTemplate).toContain(command);
    }
    // exec keeps the package and its arguments as one command, in order.
    expect(installTemplate).toContain(
      "code: `${exec ? runner : dev ? devInstall : install} ${list}`,",
    );
    expect(installTemplate).toContain('const list = words.join(" ");');
    // A server component: the tabs are the existing client CodeTabs.
    expect(installTemplate).not.toContain('"use client"');
    expect(installTemplate).toContain(
      '<CodeTabs tabs={tabs} syncKey="package-manager" />',
    );
  });

  it("syncs CodeTabs through the shared choice store in both designs", () => {
    for (const template of [codeTemplate, modernCodeTemplate]) {
      expect(template).toContain(
        'import { useChoice } from "@/components/useChoice";',
      );
      expect(template).toContain(
        "if (syncKey && tabs[index]) setChosen(tabs[index].label);",
      );
    }
  });

  it("remembers a pick in storage, syncs other tabs, and renders null on the server", () => {
    expect(useChoiceTemplate.startsWith('"use client";')).toBe(true);
    expect(useChoiceTemplate).toContain('const PREFIX = "doccupine:choice:";');
    expect(useChoiceTemplate).toContain(
      'window.addEventListener("storage", onStorage);',
    );
    // getServerSnapshot: the server and hydration render the first tab.
    expect(useChoiceTemplate).toContain("() => null,");
    // Blocked storage never throws out of the store.
    expect(useChoiceTemplate.match(/try \{/g)).toHaveLength(2);
  });
});

describe("Kbd", () => {
  it("knows the documented aliases", () => {
    for (const alias of [
      "mod:",
      "cmd:",
      "ctrl:",
      "shift:",
      "alt:",
      "option:",
      "enter:",
      "esc:",
      "escape:",
      "up:",
      "arrowup:",
      "left:",
    ]) {
      expect(kbdTemplate).toContain(`  ${alias} {`);
    }
    expect(kbdTemplate).toContain('mod: { label: "Ctrl", mac: MAC_COMMAND }');
  });

  it("renders the Mac caps from the first paint without client JS", () => {
    expect(kbdTemplate).not.toContain('"use client"');
    expect(kbdTemplate).toContain('className="dcp-kbd__mac"');
    const layout = rootLayoutTemplate(null);
    expect(layout).toContain(
      'if(/Mac|iPhone|iPad|iPod/.test(navigator.platform||navigator.userAgent))r.setAttribute("data-os","mac");',
    );
    for (const design of ["classic", "modern"] as const) {
      const css = designStylesheet(design);
      expect(css).toContain(':root[data-os="mac"] .dcp-kbd__mac {');
      expect(css).toContain(':root[data-os="mac"] .dcp-kbd__other {');
      // Wins its tie with the article's own kbd rule (.dcp-docs kbd).
      expect(css.indexOf("kbd.dcp-kbd {")).toBeGreaterThan(
        css.indexOf(".dcp-docs kbd"),
      );
    }
  });

  it("keeps a cap on its own line as wide as its text", () => {
    // A <Kbd> alone on a line is a flex child of the article's stretching
    // column: without these it spanned the whole column.
    for (const design of ["classic", "modern"] as const) {
      const css = designStylesheet(design);
      for (const selector of ["kbd.dcp-kbd {", "kbd.dcp-kbd-combo {"]) {
        const rule = css.slice(
          css.indexOf(selector),
          css.indexOf("}", css.indexOf(selector)),
        );
        expect(rule).toContain("width: fit-content;");
        expect(rule).toContain("align-self: flex-start;");
      }
    }
  });

  it("names symbol keys for screen readers in the page's language", () => {
    expect(kbdTemplate).toContain('<span aria-hidden="true">{label}</span>');
    expect(kbdTemplate).toContain(
      '<span className="dcp-visually-hidden">{name}</span>',
    );
    expect(DEFAULT_UI_STRINGS.keyCommand).toBe("Command");
    expect(DEFAULT_UI_STRINGS.keyUp).toBe("Up arrow");
    expect(docsTemplate).toContain("const strings = getStrings(lang);");
    expect(docsTemplate).toContain(
      "Kbd: (props: KbdProps) => <Kbd {...props} strings={strings} />,",
    );
  });
});

describe("Install and Kbd registration", () => {
  it("registers the components, files, pages and cards", () => {
    expect(mdxComponentsTemplate).toMatch(/\n {4}Install,\n {4}Kbd,\n/);
    expect(appStructure["components/layout/Install.tsx"]).toBe(installTemplate);
    expect(appStructure["components/layout/Kbd.tsx"]).toBe(kbdTemplate);
    expect(appStructure["components/useChoice.ts"]).toBe(useChoiceTemplate);
    expect(startingDocsStructure["install.mdx"]).toBe(installMdxTemplate);
    expect(startingDocsStructure["keyboard-shortcuts.mdx"]).toBe(
      keyboardShortcutsMdxTemplate,
    );
    expect(componentsMdxTemplate).toContain('href="/install"');
    expect(componentsMdxTemplate).toContain('href="/keyboard-shortcuts"');
    for (const prop of ["children", "packages", "dev"]) {
      expect(installMdxTemplate).toContain(`<Field value="${prop}"`);
    }
    expect(keyboardShortcutsMdxTemplate).toContain('<Field value="children"');
    expect(aiAssistantMdxTemplate).toContain("<Kbd>Mod+I</Kbd>");
    expect(installMdxTemplate).toContain('<Field value="exec"');
    expect(installMdxTemplate).toContain("needs Yarn 2 or later");
  });
});
