import { iconNames } from "lucide-react/dynamic.mjs";

/**
 * Generated file, relative to the output directory, that maps the Lucide icon
 * names a site uses to statically imported glyphs. The Icon template resolves
 * every name through it, so the app bundles only those glyphs instead of the
 * whole Lucide set.
 */
export const ICON_REGISTRY_FILE = "components/layout/IconRegistry.ts";

/**
 * Project config files, copied to the output directory, whose `icon` entries
 * the registry includes: navigation.json (sidebar) and links.json (footer).
 */
export const ICON_CONFIG_FILES: readonly string[] = [
  "navigation.json",
  "links.json",
];

/** An icon name together with where it was authored, for warnings. */
export interface IconReference {
  name: string;
  /** Source description, e.g. "guide.mdx (navIcon)"; empty for built-ins. */
  source: string;
}

/** Lucide's kebab-case ids: the canonical spelling every other form resolves to. */
const KEBAB_IDS = new Set<string>(iconNames);

/**
 * Lucide derives each PascalCase export from its kebab-case id by capitalising
 * every segment ("arrow-down-a-z" -> "ArrowDownAZ"). The generated Icon
 * component applies the same transform to whatever authors write, so both
 * spellings land on one registry key.
 */
export function toPascalIconName(name: string): string {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

const KEBAB_BY_PASCAL = new Map<string, string>(
  iconNames.map((id) => [toPascalIconName(id), id]),
);

/**
 * Resolves an authored name, kebab-case id or PascalCase export name, to
 * Lucide's kebab-case id. Returns null for a name Lucide does not have.
 */
export function resolveLucideIconName(name: string): string | null {
  const trimmed = name.trim();
  if (KEBAB_IDS.has(trimmed)) return trimmed;
  return KEBAB_BY_PASCAL.get(toPascalIconName(trimmed)) ?? null;
}

// A quoted attribute value in JSX: name="x", name='x', name={"x"}, name={'x'}.
const QUOTED_VALUE = `(?:"([^"]*)"|'([^']*)'|\\{\\s*(?:"([^"]*)"|'([^']*)')\\s*\\})`;
// <Icon name="..."> in any attribute position, also across line breaks.
const ICON_TAG_LITERAL = new RegExp(
  `<Icon\\b[^>]*?\\bname=${QUOTED_VALUE}`,
  "g",
);
// icon="..." on any component that forwards it to Icon (Card, Callout, Steps,
// Tabs, Badge, Button, Prompt).
const ICON_ATTRIBUTE = new RegExp(`\\bicon=${QUOTED_VALUE}`, "g");
// <Icon name={expr}>: literals inside the expression, for templates that pick
// a glyph inline (name={copied ? "check" : "copy"}).
const ICON_TAG_EXPRESSION = /<Icon\b[^>]*?\bname=\{([^}]*)\}/g;
const STRING_LITERAL = /"([^"\\]*)"|'([^'\\]*)'/g;

const FENCED_CODE = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$/gm;
const INLINE_CODE = /`[^`\n]*`/g;
const FRONTMATTER = /^\uFEFF?---[^\n]*\r?\n[\s\S]*?\r?\n---[^\n]*\r?\n?/;

function quotedValues(pattern: RegExp, text: string): string[] {
  const names: string[] = [];
  for (const match of text.matchAll(pattern)) {
    const value = match.slice(1).find((group) => group !== undefined);
    if (value) names.push(value);
  }
  return names;
}

/**
 * Icon names an MDX document renders: `<Icon name="...">` and the `icon`
 * attribute of the authoring components. Frontmatter and code (fenced blocks
 * and inline spans) are skipped, so documenting an icon does not bundle it.
 */
export function collectMdxIconNames(content: string): string[] {
  const body = content
    .replace(FRONTMATTER, "")
    .replace(FENCED_CODE, "")
    .replace(INLINE_CODE, "");
  return [
    ...quotedValues(ICON_TAG_LITERAL, body),
    ...quotedValues(ICON_ATTRIBUTE, body),
  ];
}

/**
 * Every `icon` string in a JSON config file, at any depth: the category, link,
 * and nested link-group icons of navigation.json in either the array or the
 * per-section object form, and the footer link icons of links.json. Malformed
 * JSON contributes nothing.
 */
export function collectConfigIconNames(json: string | null): string[] {
  if (!json) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return [];
  }
  const names: string[] = [];
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (key === "icon" && typeof child === "string") names.push(child);
      else walk(child);
    }
  };
  walk(parsed);
  return names;
}

/**
 * Icon names the generated components draw themselves: `<Icon name="...">`
 * literals plus the string literals inside `name={...}` expressions, across
 * every template source.
 */
export function collectTemplateIconNames(
  templates: Record<string, string>,
): string[] {
  const names: string[] = [];
  for (const source of Object.values(templates)) {
    names.push(...quotedValues(ICON_TAG_LITERAL, source));
    for (const match of source.matchAll(ICON_TAG_EXPRESSION)) {
      names.push(...quotedValues(STRING_LITERAL, match[1]));
    }
  }
  return names;
}

/**
 * Template icons that reach `<Icon>` through a variable rather than a literal
 * `name`, so the template scan cannot see them: Callout's per-type defaults
 * and the "rocket" category icon of the placeholder navigation shown before
 * any page exists (SectionNavProvider, site layout).
 */
export const INDIRECT_TEMPLATE_ICON_NAMES: readonly string[] = [
  "CircleAlert",
  "Info",
  "TriangleAlert",
  "OctagonAlert",
  "Check",
  "rocket",
];

const PRINT_WIDTH = 80;

/**
 * Renders IconRegistry.ts for the given Lucide kebab-case ids. The output is
 * Prettier-canonical for the generated app's config (double quotes, trailing
 * commas, 80 columns), since the generator never runs a formatter.
 */
export function renderIconRegistry(kebabIds: Iterable<string>): string {
  const exportNames = [...new Set([...kebabIds].map(toPascalIconName))].sort();
  const lines = [
    "// Generated by Doccupine from the icon names your pages, navigation, and",
    "// components use, so the site bundles only those glyphs. Do not edit: it",
    "// is rewritten whenever those names change.",
    'import type { LucideIcon } from "lucide-react";',
  ];
  if (exportNames.length > 0) {
    const inline = `import { ${exportNames.join(", ")} } from "lucide-react";`;
    if (inline.length <= PRINT_WIDTH) {
      lines.push(inline);
    } else {
      lines.push(
        "import {",
        ...exportNames.map((name) => `  ${name},`),
        '} from "lucide-react";',
      );
    }
  }
  lines.push("");
  if (exportNames.length === 0) {
    lines.push("export const iconRegistry: Record<string, LucideIcon> = {};");
  } else {
    lines.push(
      "export const iconRegistry: Record<string, LucideIcon> = {",
      ...exportNames.map((name) => `  ${name},`),
      "};",
    );
  }
  return lines.join("\n") + "\n";
}
