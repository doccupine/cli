import { iconNames } from "lucide-react/dynamic.mjs";
import prettier from "prettier";
import { describe, expect, it } from "vitest";

import { calloutTemplate } from "../templates/components/layout/Callout.js";
import { sectionNavProviderTemplate } from "../templates/components/SectionNavProvider.js";
import { prettierrcTemplate } from "../templates/prettierrc.js";
import {
  INDIRECT_TEMPLATE_ICON_NAMES,
  collectMdxIconNames,
  collectConfigIconNames,
  collectTemplateIconNames,
  renderIconRegistry,
  resolveLucideIconName,
  toPascalIconName,
} from "./icon-registry.js";
import { appStructure } from "./structures.js";

describe("resolveLucideIconName", () => {
  it("accepts kebab-case ids and PascalCase export names", () => {
    expect(resolveLucideIconName("arrow-right")).toBe("arrow-right");
    expect(resolveLucideIconName("ArrowRight")).toBe("arrow-right");
    expect(resolveLucideIconName("ArrowDownAZ")).toBe("arrow-down-a-z");
    expect(resolveLucideIconName(" flag ")).toBe("flag");
  });

  it("rejects names Lucide does not have", () => {
    expect(resolveLucideIconName("not-an-icon")).toBeNull();
    expect(resolveLucideIconName("")).toBeNull();
  });

  it("derives the export name the way Lucide does", () => {
    expect(toPascalIconName("a-arrow-down")).toBe("AArrowDown");
    expect(toPascalIconName("clock-1")).toBe("Clock1");
    expect(toPascalIconName("ChevronDown")).toBe("ChevronDown");
  });
});

describe("collectMdxIconNames", () => {
  it("finds Icon names and icon attributes, skipping frontmatter and code", () => {
    const mdx = [
      "---",
      'title: "Icons"',
      'navIcon: "book-open"',
      "---",
      "# Icons",
      "",
      '<Icon name="flag" size={16} /> and <Icon',
      "  name='rocket'",
      "/>",
      '<Card icon="terminal" title="Run">Run it</Card>',
      '<TabContent icon={"settings"} title="Setup">Setup</TabContent>',
      "",
      "```html",
      '<Icon name="fenced-example" />',
      "```",
      "",
      'Inline `<Icon name="inline-example" />` stays documentation.',
      "",
    ].join("\n");
    expect(collectMdxIconNames(mdx)).toEqual([
      "flag",
      "rocket",
      "terminal",
      "settings",
    ]);
  });
});

describe("collectConfigIconNames", () => {
  it("walks the array form, the per-section form, and nested links", () => {
    const sectioned = JSON.stringify({
      "": [
        {
          label: "Guides",
          icon: "book-open",
          links: [
            { slug: "guides", title: "Overview", icon: "compass" },
            {
              title: "Advanced",
              icon: "settings",
              links: [{ slug: "guides/caching", title: "Caching" }],
            },
          ],
        },
      ],
    });
    expect(collectConfigIconNames(sectioned)).toEqual([
      "book-open",
      "compass",
      "settings",
    ]);
    expect(
      collectConfigIconNames(
        JSON.stringify([{ label: "Docs", icon: "rocket", links: [] }]),
      ),
    ).toEqual(["rocket"]);
  });

  it("reads the footer link icons of links.json", () => {
    expect(
      collectConfigIconNames(
        JSON.stringify([
          { title: "GitHub", url: "https://github.com", icon: "git-branch" },
          { title: "Docs", url: "https://example.com" },
        ]),
      ),
    ).toEqual(["git-branch"]);
  });

  it("contributes nothing for an empty, missing, or malformed file", () => {
    expect(collectConfigIconNames("[]")).toEqual([]);
    expect(collectConfigIconNames(null)).toEqual([]);
    expect(collectConfigIconNames("{not json")).toEqual([]);
  });
});

describe("collectTemplateIconNames", () => {
  it("reads literal names and the literals inside name expressions", () => {
    const names = collectTemplateIconNames({
      "a.tsx": [
        '<Icon name="ChevronDown" />',
        "<Icon",
        '  name={node.isFolder ? (open ? "FolderOpen" : "Folder") : "File"}',
        "  size={16}",
        "/>",
        "<Icon name={icon} />",
      ].join("\n"),
    });
    expect(names).toEqual(["ChevronDown", "FolderOpen", "Folder", "File"]);
  });

  it("resolves every icon the generated components draw", () => {
    const builtin = [
      ...collectTemplateIconNames(appStructure),
      ...INDIRECT_TEMPLATE_ICON_NAMES,
    ];
    expect(builtin.filter((name) => !resolveLucideIconName(name))).toEqual([]);
    expect(collectTemplateIconNames(appStructure)).toEqual(
      expect.arrayContaining([
        "ChevronDown",
        "chevron-right",
        "check",
        "copy",
        "FolderOpen",
        "minimize",
        "maximize",
        "rss",
      ]),
    );
  });

  it("keeps the indirect list in step with the templates using those names", () => {
    for (const name of [
      "CircleAlert",
      "Info",
      "TriangleAlert",
      "OctagonAlert",
      "Check",
    ]) {
      expect(calloutTemplate).toContain(`"${name}"`);
    }
    expect(sectionNavProviderTemplate).toContain('categoryIcon: "rocket"');
  });
});

describe("renderIconRegistry", () => {
  const prettierOptions = {
    ...(JSON.parse(prettierrcTemplate) as Record<string, unknown>),
    parser: "typescript",
  };

  it("emits Prettier-canonical output whatever the import list length", async () => {
    for (const ids of [
      [],
      ["flag"],
      ["flag", "arrow-right", "book-open"],
      iconNames.slice(0, 12),
      iconNames.slice(0, 200),
    ]) {
      const rendered = renderIconRegistry(ids);
      expect(await prettier.format(rendered, prettierOptions)).toBe(rendered);
    }
  });

  it("dedupes spellings, sorts, and keys entries by export name", () => {
    const rendered = renderIconRegistry(["flag", "arrow-right", "arrow-right"]);
    expect(rendered).toContain(
      'import { ArrowRight, Flag } from "lucide-react";',
    );
    expect(rendered).toContain(
      "export const iconRegistry: Record<string, LucideIcon> = {\n  ArrowRight,\n  Flag,\n};\n",
    );
  });

  it("renders an empty registry", () => {
    expect(renderIconRegistry([])).toContain(
      "export const iconRegistry: Record<string, LucideIcon> = {};",
    );
  });
});
