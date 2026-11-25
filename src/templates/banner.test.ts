import { describe, expect, it } from "vitest";

import { siteLayoutTemplate } from "../lib/layout.js";
import { appStructure } from "../lib/structures.js";
import { DEFAULT_UI_STRINGS } from "../lib/ui-strings.js";
import { headerTemplate } from "./components/layout/Header.js";
import { bannerTemplate } from "./components/layout/Banner.js";
import { bannerControlsTemplate } from "./components/layout/BannerControls.js";
import { frameTemplate } from "./components/layout/Frame.js";
import { inlineMarkdownTemplate } from "./components/layout/InlineMarkdown.js";
import { globalsMdxTemplate } from "./mdx/globals.mdx.js";
import { modernHeaderTemplate } from "./modern/components/layout/Header.js";
import { componentsStylesheet, designStylesheet } from "./styles/index.js";
import { configTemplate } from "./utils/config.js";

describe("Site banner", () => {
  it("reads and validates config.json at runtime, dropping a bad value", () => {
    expect(configTemplate).toContain("banner: z");
    expect(configTemplate).toContain(
      "content: z.string().trim().min(1).max(500),",
    );
    expect(configTemplate).toContain(".optional()\n    .catch(undefined),");
  });

  it("renders above the header in every site layout", () => {
    for (const layout of [
      siteLayoutTemplate([]),
      siteLayoutTemplate([], [{ slug: "guides", label: "Guides" }]),
    ]) {
      expect(layout).toContain(
        'import { Banner } from "@/components/layout/Banner";',
      );
      expect(layout.indexOf("<Banner />")).toBeGreaterThan(-1);
      expect(layout.indexOf("<Banner />")).toBeLessThan(
        layout.indexOf("<Header"),
      );
    }
  });

  it("parses the content into elements, never raw HTML", () => {
    expect(bannerTemplate).toContain("{renderInline(banner.content)}");
    expect(bannerTemplate).not.toMatch(/__html: [^B]/);
    // The only injected script is a constant that carries no config data.
    expect(bannerTemplate).toContain(
      "dangerouslySetInnerHTML={{ __html: BANNER_INIT_SCRIPT }}",
    );
    expect(inlineMarkdownTemplate).toContain("const SAFE_HREF =");
    expect(frameTemplate).toContain(
      'import { renderInline } from "@/components/layout/InlineMarkdown";',
    );
  });

  it("hides a dismissed banner before paint, per content", () => {
    expect(bannerTemplate).toContain(
      'localStorage.getItem("doccupine:banner-dismissed")===b.getAttribute("data-banner-id"))b.hidden=true;',
    );
    expect(bannerTemplate).toContain("function contentId(text: string)");
    expect(bannerControlsTemplate).toContain(
      "window.localStorage.setItem(DISMISSED_KEY, id);",
    );
    expect(bannerControlsTemplate).toContain("aria-label={t.dismissBanner}");
    expect(DEFAULT_UI_STRINGS.dismissBanner).toBe("Dismiss announcement");
  });

  it("pins the header only once the banner has scrolled away", () => {
    for (const template of [headerTemplate, modernHeaderTemplate]) {
      expect(template).toContain(
        "const pinned = window.scrollY > shell.offsetTop;",
      );
    }
    // The scroll-driven hold that keeps the unpinned header still starts
    // after the banner's height.
    expect(componentsStylesheet).toContain(
      "animation-range: var(--dcp-banner-height, 0px)",
    );
    for (const design of ["classic", "modern"] as const) {
      const css = designStylesheet(design);
      expect(css).toContain("margin-top: var(--dcp-banner-offset, 0px);");
      expect(css).toContain(
        "height: calc(100dvh - var(--dcp-banner-offset, 0px));",
      );
      // The banner's own rules come after the rails they offset.
      expect(css.lastIndexOf(".dcp-banner")).toBeGreaterThan(
        css.indexOf(".dcp-toc {"),
      );
    }
  });

  it("animates the dismissal away, or just goes under reduced motion", () => {
    for (const design of ["classic", "modern"] as const) {
      const css = designStylesheet(design);
      expect(css).toMatch(
        /\.dcp-banner\[data-dismissing\] \{\s*grid-template-rows: 0fr;\s*opacity: 0;/,
      );
      expect(css).toMatch(
        /grid-template-rows 0\.28s ease,\s*opacity 0\.28s ease;/,
      );
      expect(css).toMatch(
        /@media \(prefers-reduced-motion: reduce\) \{\s*\.dcp-banner,\s*\.dcp-banner__dismiss \{\s*transition: none;/,
      );
      // The close button is the shared 32px ghost square.
      expect(css).toMatch(/\.dcp-banner__dismiss \{[^}]*width: 32px;/);
    }
    expect(bannerControlsTemplate).toContain(
      'banner.setAttribute("data-dismissing", "");',
    );
    expect(bannerControlsTemplate).toContain(
      '!window.matchMedia("(prefers-reduced-motion: reduce)").matches;',
    );
    // Focus lands where the skip link leads instead of being lost.
    expect(bannerControlsTemplate).toContain(
      'document.getElementById("content")?.focus({ preventScroll: true });',
    );
  });

  it("registers the files and documents the field", () => {
    expect(appStructure["components/layout/Banner.tsx"]).toBe(bannerTemplate);
    expect(appStructure["components/layout/BannerControls.tsx"]).toBe(
      bannerControlsTemplate,
    );
    expect(appStructure["components/layout/InlineMarkdown.tsx"]).toBe(
      inlineMarkdownTemplate,
    );
    expect(globalsMdxTemplate).toContain("## Banner");
    expect(globalsMdxTemplate).toContain('"dismissible": true');
  });
});
