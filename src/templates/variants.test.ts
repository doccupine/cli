import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

import type { LanguageConfig, VersionConfig } from "../lib/types.js";
import {
  joinVariantSlug as libJoinVariantSlug,
  listVariantPrefixes,
  navigationScopeKey as libNavigationScopeKey,
  resolveVariantFromSlug as libResolveVariantFromSlug,
  stripLanguagePrefix as libStripLanguagePrefix,
  variantPrefix as libVariantPrefix,
} from "../lib/variants.js";
import { DEFAULT_UI_STRINGS } from "../lib/ui-strings.js";
import { appStructure } from "../lib/structures.js";
import { variantsUtilTemplate } from "./utils/variants.js";
import { useVariantTemplate } from "./components/useVariant.js";
import { variantSwitchersTemplate } from "./components/layout/VariantSwitchers.js";
import { dropdownTemplate } from "./components/layout/Dropdown.js";
import { sectionBarTemplate } from "./components/layout/SectionBar.js";
import { sectionNavProviderTemplate } from "./components/SectionNavProvider.js";
import { searchDocsTemplate } from "./components/SearchDocs.js";
import { chatTemplate } from "./components/Chat.js";
import { headerTemplate } from "./components/layout/Header.js";
import { sideBarTemplate } from "./components/SideBar.js";
import { languagesMdxTemplate } from "./mdx/languages.mdx.js";
import { mcpToolsTemplate } from "./services/mcp/tools.js";
import { searchServiceTemplate } from "./services/search.js";

interface GeneratedVariantsModule {
  languages: LanguageConfig[] | null;
  versions: VersionConfig[] | null;
  isVariantsConfigured(): boolean;
  resolveVariantFromSlug(slug: string): unknown;
  joinVariantSlug(prefix: string, slug: string): string;
  navigationScopeKey(prefix: string, sectionSlug: string): string;
  variantPrefix(locale?: string, version?: string): string;
  stripLanguagePrefix(slug: string, locale?: string): string;
  stripVariantPrefix(slug: string, locale?: string, version?: string): string;
}

const temporaryDirectories: string[] = [];

/**
 * The generated `utils/variants.ts` reads its config through the app's JSON
 * imports; swap those for literals and load the module as vitest would any
 * other TypeScript file, so the template's own code runs against the same
 * table as the CLI's resolver.
 */
async function loadGeneratedVariants(
  languages: unknown,
  versions: unknown,
): Promise<GeneratedVariantsModule> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doccupine-variants-"));
  temporaryDirectories.push(dir);
  const source = variantsUtilTemplate
    .replace(
      'import rawLanguages from "@/languages.json";',
      `const rawLanguages: unknown = ${JSON.stringify(languages)};`,
    )
    .replace(
      'import rawVersions from "@/versions.json";',
      `const rawVersions: unknown = ${JSON.stringify(versions)};`,
    );
  expect(source).not.toContain("@/");
  const file = path.join(dir, "variants.ts");
  await fs.writeFile(file, source);
  return (await import(pathToFileURL(file).href)) as GeneratedVariantsModule;
}

afterAll(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((dir) => fs.remove(dir)),
  );
});

const languagesJson = [
  { code: "en", label: "English", default: true },
  { code: "de", label: "Deutsch" },
  { code: "pt-br", label: "Português" },
];
const versionsJson = [
  { label: "v2.0", default: true },
  { slug: "v1", label: "v1.0" },
];
const libLanguages: LanguageConfig[] = languagesJson.map((entry) => ({
  code: entry.code,
  label: entry.label,
  default: entry.default === true,
}));
const libVersions: VersionConfig[] = [
  { slug: "", label: "v2.0", default: true },
  { slug: "v1", label: "v1.0", default: false },
];

describe("generated variants runtime", () => {
  it("registers the runtime, hook, and switcher templates", () => {
    expect(appStructure["utils/variants.ts"]).toBe(variantsUtilTemplate);
    expect(appStructure["components/useVariant.ts"]).toBe(useVariantTemplate);
    expect(appStructure["components/layout/VariantSwitchers.tsx"]).toBe(
      variantSwitchersTemplate,
    );
    expect(appStructure["components/layout/Dropdown.tsx"]).toBe(
      dropdownTemplate,
    );
    for (const template of [
      sectionBarTemplate,
      sectionNavProviderTemplate,
      searchDocsTemplate,
      chatTemplate,
    ]) {
      expect(template).toContain('from "@/components/useVariant"');
    }
    // The switchers live on the sidebar footer row, between the focus-mode
    // and theme toggles;
    // the header knows nothing about them.
    expect(sideBarTemplate).toContain("<VariantSwitchers pages={pages} />");
    expect(sectionNavProviderTemplate).toContain("pages={allPages}");
    expect(headerTemplate).not.toContain("switchers");
    expect(headerTemplate).not.toContain("VariantSwitchers");
    expect(headerTemplate).not.toContain("isLangActive");
    expect(mcpToolsTemplate).toContain("export function resolveDocsFilter");
    expect(searchServiceTemplate).toContain("listAllDocs()");
  });

  it("documents every chrome string a language may override", () => {
    // The Languages page is the published contract for languages.json's
    // `strings` object, so a key added to DEFAULT_UI_STRINGS has to land
    // there too or authors cannot discover it.
    for (const key of Object.keys(DEFAULT_UI_STRINGS)) {
      expect(languagesMdxTemplate).toContain("`" + key + "`");
    }
  });

  it("reads every chrome string of the chat kit from the strings module", () => {
    // Cherry's chat components ship English defaults; each one a reader can
    // see has to be passed explicitly so a translation reaches it.
    expect(chatTemplate).toContain("greeting={t.chatGreeting}");
    expect(chatTemplate).toContain("placeholder={t.chatPlaceholder}");
    expect(chatTemplate).toContain("aria-label={t.chatInputLabel}");
    expect(chatTemplate).toContain(
      "<ChatTyping>{t.chatAnswering}</ChatTyping>",
    );
    expect(chatTemplate).toContain("<strong>{t.chatError}</strong>");
    expect(headerTemplate).toContain("aria-label={t.askAiAssistant}");
    expect(headerTemplate).toContain("{t.askAi}");
  });

  it("resolves slugs exactly like the CLI", async () => {
    const generated = await loadGeneratedVariants(languagesJson, versionsJson);
    expect(generated.isVariantsConfigured()).toBe(true);
    expect(generated.versions).toEqual(libVersions);

    for (const slug of [
      "",
      "guide",
      "de",
      "de/",
      "/de/guide",
      "v1",
      "v1/guides/intro",
      "de/v1",
      "de/v1/api/users",
      "pt-br/v1/x",
      "guides/de/x",
      "v1/de/x",
      "api/users",
    ]) {
      expect(generated.resolveVariantFromSlug(slug)).toEqual(
        libResolveVariantFromSlug(slug, libLanguages, libVersions),
      );
    }
    for (const [prefix, page] of [
      ["", ""],
      ["", "guide"],
      ["de", ""],
      ["de/v1", "api/users"],
    ]) {
      expect(generated.joinVariantSlug(prefix, page)).toBe(
        libJoinVariantSlug(prefix, page),
      );
      expect(generated.navigationScopeKey(prefix, page)).toBe(
        libNavigationScopeKey(prefix, page),
      );
    }
    for (const [locale, version] of [
      ["en", ""],
      ["de", ""],
      ["en", "v1"],
      ["pt-br", "v1"],
      [undefined, undefined],
    ] as const) {
      expect(generated.variantPrefix(locale, version)).toBe(
        libVariantPrefix(locale, version, libLanguages, libVersions),
      );
    }
    for (const [slug, locale] of [
      ["de/v1/x", "de"],
      ["v1/x", "en"],
      ["de", "de"],
      ["derived/x", "de"],
    ] as const) {
      expect(generated.stripLanguagePrefix(slug, locale)).toBe(
        libStripLanguagePrefix(slug, locale, libLanguages),
      );
    }
    expect(generated.stripVariantPrefix("de/v1/guide", "de", "v1")).toBe(
      "guide",
    );
    expect(generated.stripVariantPrefix("de/v1", "de", "v1")).toBe("");
    expect(generated.stripVariantPrefix("guide", "en", "")).toBe("guide");
    expect(listVariantPrefixes(libLanguages, libVersions)).toEqual([
      "",
      "v1",
      "de",
      "de/v1",
      "pt-br",
      "pt-br/v1",
    ]);
  });

  it("treats the generated empty config copies as unconfigured", async () => {
    const generated = await loadGeneratedVariants([], []);
    expect(generated.languages).toBeNull();
    expect(generated.versions).toBeNull();
    expect(generated.isVariantsConfigured()).toBe(false);
    expect(generated.resolveVariantFromSlug("de/guide")).toEqual({
      prefix: "",
      rest: "de/guide",
    });
    expect(generated.variantPrefix("de", "v1")).toBe("");
  });
});
