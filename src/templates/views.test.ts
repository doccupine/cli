import { describe, expect, it } from "vitest";

import { rootLayoutTemplate } from "../lib/layout.js";
import { appStructure, startingDocsStructure } from "../lib/structures.js";
import { DEFAULT_UI_STRINGS } from "../lib/ui-strings.js";
import { docsTemplate } from "./components/Docs.js";
import { mdxComponentsTemplate } from "./components/MDXComponents.js";
import { actionBarTemplate } from "./components/layout/ActionBar.js";
import { viewTemplate } from "./components/layout/View.js";
import { viewSelectorTemplate } from "./components/layout/ViewSelector.js";
import { componentsMdxTemplate } from "./mdx/components.mdx.js";
import { viewsMdxTemplate } from "./mdx/views.mdx.js";
import { modernActionBarTemplate } from "./modern/components/layout/ActionBar.js";
import { designStylesheet } from "./styles/index.js";

describe("Views", () => {
  it("renders every view on the server and shows the first by default", () => {
    expect(viewTemplate).not.toContain('"use client"');
    expect(viewTemplate).toContain("data-view={title}");
    expect(viewTemplate).toContain(
      "data-default={title === defaultTitle || undefined}",
    );
    expect(docsTemplate).toContain(
      "<View {...props} defaultTitle={viewTitles[0]} />",
    );
    for (const design of ["classic", "modern"] as const) {
      const css = designStylesheet(design);
      expect(css).toMatch(/\.dcp-view \{\s*display: none;/);
      expect(css).toMatch(/\.dcp-view\[data-default\] \{\s*display: flex;/);
    }
  });

  it("restores the pick before the first paint", () => {
    expect(rootLayoutTemplate(null)).toContain(
      'try{var w=localStorage.getItem("doccupine:choice:view");if(w)r.setAttribute("data-view",w);}catch(e){}',
    );
    // The per-page rules name this page's titles, escaped for CSS.
    expect(docsTemplate).toContain(
      "{viewTitles.length > 1 && <style>{viewStyles(viewTitles)}</style>}",
    );
    expect(docsTemplate).toContain("/[A-Za-z0-9 _-]/.test(char)");
  });

  it("puts one remembered selector in the page header of both designs", () => {
    for (const template of [actionBarTemplate, modernActionBarTemplate]) {
      expect(template).toContain("{views && <ViewSelector titles={views} />}");
      // The phone layout makes room for it (action-bar.ts).
      expect(template).toContain('data-views={views ? "" : undefined}');
    }
    expect(docsTemplate).toContain(
      "views={viewTitles.length > 1 ? viewTitles : undefined}",
    );
    expect(viewSelectorTemplate).toContain('useChoice("view")');
    expect(viewSelectorTemplate).toContain(
      'document.documentElement.setAttribute("data-view", stored);',
    );
    expect(viewSelectorTemplate).toContain('role="menuitemradio"');
    expect(viewSelectorTemplate).toContain(
      "triggerLabel={`${t.view}: ${current}`}",
    );
    expect(DEFAULT_UI_STRINGS.view).toBe("View");
  });

  it("registers the component, files and page", () => {
    expect(mdxComponentsTemplate).toMatch(/\n {4}View,\n/);
    expect(appStructure["components/layout/View.tsx"]).toBe(viewTemplate);
    expect(appStructure["components/layout/ViewSelector.tsx"]).toBe(
      viewSelectorTemplate,
    );
    expect(startingDocsStructure["views.mdx"]).toBe(viewsMdxTemplate);
    expect(componentsMdxTemplate).toContain('href="/views"');
    for (const prop of ["title", "children"]) {
      expect(viewsMdxTemplate).toContain(`<Field value="${prop}"`);
    }
  });
});
