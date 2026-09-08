import { describe, expect, it } from "vitest";

import type { LanguageConfig, PageMeta, VersionConfig } from "./types.js";
import {
  assertVariantLayout,
  assertVariantsDisjoint,
  buildLanguageAlternates,
  defaultLanguage,
  defaultVersion,
  joinVariantSlug,
  listVariantPrefixes,
  navigationScopeKey,
  pageVariantPrefix,
  resolveVariant,
  resolveVariantFromSlug,
  sectionsForVariant,
  stripLanguagePrefix,
  toOgLocale,
  validateLanguagesConfig,
  validateVersionsConfig,
  VariantCollisionError,
} from "./variants.js";

const languages: LanguageConfig[] = [
  { code: "en", label: "English", default: true },
  { code: "de", label: "Deutsch", default: false },
  { code: "pt-br", label: "Português", default: false },
];

const versions: VersionConfig[] = [
  { slug: "", label: "v2.0", default: true },
  { slug: "v1", label: "v1.0", default: false },
];

function page(slug: string, extra: Partial<PageMeta> = {}): PageMeta {
  return {
    slug,
    title: slug || "Home",
    description: "",
    date: null,
    category: "",
    path: `${slug || "index"}.mdx`,
    categoryOrder: 0,
    order: 0,
    section: "",
    ...extra,
  };
}

describe("validateLanguagesConfig", () => {
  it("normalizes entries and treats an empty array as off", () => {
    expect(validateLanguagesConfig([])).toBeNull();
    expect(
      validateLanguagesConfig([
        { code: " en ", label: " English ", default: true },
        {
          code: "de",
          label: "Deutsch",
          strings: { searchPlaceholder: "Suche" },
        },
      ]),
    ).toEqual([
      { code: "en", label: "English", default: true },
      {
        code: "de",
        label: "Deutsch",
        default: false,
        strings: { searchPlaceholder: "Suche" },
      },
    ]);
  });

  it("rejects shapes the generator would not accept", () => {
    expect(() => validateLanguagesConfig({})).toThrow("JSON array");
    expect(() =>
      validateLanguagesConfig([{ code: "en", label: "English" }]),
    ).toThrow('exactly one entry with "default": true');
    expect(() =>
      validateLanguagesConfig([
        { code: "en", label: "English", default: true },
        { code: "de", label: "Deutsch", default: true },
      ]),
    ).toThrow('exactly one entry with "default": true');
    expect(() =>
      validateLanguagesConfig([
        { code: "pt-BR", label: "Português", default: true },
      ]),
    ).toThrow(
      'unsafe code "pt-BR"; use a lowercase URL segment such as "pt-br"',
    );
    expect(() =>
      validateLanguagesConfig([{ code: "api", label: "API", default: true }]),
    ).toThrow("reserved");
    expect(() =>
      validateLanguagesConfig([
        { code: "en", label: "English", default: true },
        { code: "en", label: "Other", default: false },
      ]),
    ).toThrow('duplicate language code "en"');
    expect(() =>
      validateLanguagesConfig([
        { code: "en", label: "English", default: true, strings: { a: 1 } },
      ]),
    ).toThrow("strings must be an object of string values");
    expect(() =>
      validateLanguagesConfig([{ code: "", label: "English", default: true }]),
    ).toThrow("needs a non-empty code");
  });
});

describe("validateVersionsConfig", () => {
  it("normalizes the default version to an empty slug", () => {
    expect(validateVersionsConfig([])).toBeNull();
    expect(
      validateVersionsConfig([
        { label: "v2.0", default: true },
        { slug: "v1", label: "v1.0" },
      ]),
    ).toEqual([
      { slug: "", label: "v2.0", default: true },
      { slug: "v1", label: "v1.0", default: false },
    ]);
  });

  it("rejects a default with a slug and a non-default without one", () => {
    expect(() =>
      validateVersionsConfig([{ slug: "v2", label: "v2.0", default: true }]),
    ).toThrow("must not set a slug");
    expect(() =>
      validateVersionsConfig([
        { label: "v2.0", default: true },
        { label: "v1.0" },
      ]),
    ).toThrow("needs a non-empty slug");
    expect(() =>
      validateVersionsConfig([
        { label: "v2.0", default: true },
        { slug: "V1", label: "v1.0" },
      ]),
    ).toThrow('unsafe slug "V1"');
    expect(() =>
      validateVersionsConfig([{ slug: "v1", label: "v1.0" }]),
    ).toThrow('exactly one entry with "default": true');
    expect(() =>
      validateVersionsConfig([
        { label: "v2.0", default: true },
        { slug: "gate", label: "Gate" },
      ]),
    ).toThrow("reserved");
  });
});

describe("resolveVariant", () => {
  it("resolves language and version folders in that order", () => {
    expect(resolveVariant("guide.mdx", languages, versions)).toEqual({
      locale: "en",
      version: "",
      prefix: "",
      rest: "guide.mdx",
    });
    expect(resolveVariant("de/guide.mdx", languages, versions)).toEqual({
      locale: "de",
      version: "",
      prefix: "de",
      rest: "guide.mdx",
    });
    expect(resolveVariant("v1/guides/intro.mdx", languages, versions)).toEqual({
      locale: "en",
      version: "v1",
      prefix: "v1",
      rest: "guides/intro.mdx",
    });
    expect(resolveVariant("de/v1/index.mdx", languages, versions)).toEqual({
      locale: "de",
      version: "v1",
      prefix: "de/v1",
      rest: "index.mdx",
    });
    expect(resolveVariant("pt-br\\v1\\a.mdx", languages, versions)).toEqual({
      locale: "pt-br",
      version: "v1",
      prefix: "pt-br/v1",
      rest: "a.mdx",
    });
  });

  it("leaves undeclared folders, files named after a code, and wrong order alone", () => {
    expect(resolveVariant("guides/de/x.mdx", languages, versions).prefix).toBe(
      "",
    );
    expect(resolveVariant("de.mdx", languages, versions)).toEqual({
      locale: "en",
      version: "",
      prefix: "",
      rest: "de.mdx",
    });
    // A version folder before a language folder consumes only the version.
    expect(resolveVariant("v1/de/x.mdx", languages, versions)).toEqual({
      locale: "en",
      version: "v1",
      prefix: "v1",
      rest: "de/x.mdx",
    });
  });

  it("omits the fields of an unconfigured feature", () => {
    expect(resolveVariant("de/x.mdx", null, null)).toEqual({
      prefix: "",
      rest: "de/x.mdx",
    });
    expect(resolveVariant("de/x.mdx", languages, null)).toEqual({
      locale: "de",
      prefix: "de",
      rest: "x.mdx",
    });
    expect(resolveVariant("v1/x.mdx", null, versions)).toEqual({
      version: "v1",
      prefix: "v1",
      rest: "x.mdx",
    });
  });
});

describe("resolveVariantFromSlug", () => {
  it("treats every segment as a candidate", () => {
    expect(resolveVariantFromSlug("de", languages, versions)).toEqual({
      locale: "de",
      version: "",
      prefix: "de",
      rest: "",
    });
    expect(resolveVariantFromSlug("/de/v1/", languages, versions)).toEqual({
      locale: "de",
      version: "v1",
      prefix: "de/v1",
      rest: "",
    });
    expect(resolveVariantFromSlug("", languages, versions)).toEqual({
      locale: "en",
      version: "",
      prefix: "",
      rest: "",
    });
    expect(resolveVariantFromSlug("v1/api/users", languages, versions)).toEqual(
      { locale: "en", version: "v1", prefix: "v1", rest: "api/users" },
    );
  });
});

describe("prefix helpers", () => {
  it("joins and keys scopes", () => {
    expect(joinVariantSlug("", "guide")).toBe("guide");
    expect(joinVariantSlug("de", "")).toBe("de");
    expect(joinVariantSlug("de/v1", "api/users")).toBe("de/v1/api/users");
    expect(navigationScopeKey("", "")).toBe("");
    expect(navigationScopeKey("", "api")).toBe("api");
    expect(navigationScopeKey("de", "")).toBe("de");
    expect(navigationScopeKey("de/v1", "api")).toBe("de/v1/api");
  });

  it("lists prefixes with the root first in file order", () => {
    expect(listVariantPrefixes(null, null)).toEqual([""]);
    expect(listVariantPrefixes(languages, null)).toEqual(["", "de", "pt-br"]);
    expect(listVariantPrefixes(null, versions)).toEqual(["", "v1"]);
    expect(listVariantPrefixes(languages, versions)).toEqual([
      "",
      "v1",
      "de",
      "de/v1",
      "pt-br",
      "pt-br/v1",
    ]);
    expect(
      listVariantPrefixes(
        [
          { code: "de", label: "Deutsch", default: false },
          { code: "en", label: "English", default: true },
        ],
        null,
      ),
    ).toEqual(["", "de"]);
  });

  it("derives a page's prefix and translation key", () => {
    expect(pageVariantPrefix(page("x"), languages, versions)).toBe("");
    expect(
      pageVariantPrefix(
        page("de/v1/x", { locale: "de", version: "v1" }),
        languages,
        versions,
      ),
    ).toBe("de/v1");
    expect(
      pageVariantPrefix(
        page("x", { locale: "en", version: "" }),
        languages,
        versions,
      ),
    ).toBe("");
    expect(stripLanguagePrefix("de/v1/x", "de", languages)).toBe("v1/x");
    expect(stripLanguagePrefix("v1/x", "en", languages)).toBe("v1/x");
    expect(stripLanguagePrefix("de", "de", languages)).toBe("");
    expect(stripLanguagePrefix("de/x", "de", null)).toBe("de/x");
    expect(stripLanguagePrefix("derived/x", "de", languages)).toBe("derived/x");
  });

  it("finds the defaults and formats Open Graph locales", () => {
    expect(defaultLanguage(languages)?.code).toBe("en");
    expect(defaultVersion(versions)?.label).toBe("v2.0");
    expect(defaultLanguage(null)).toBeNull();
    expect(toOgLocale("de")).toBe("de");
    expect(toOgLocale("pt-br")).toBe("pt_BR");
    expect(toOgLocale("zh-hant-tw")).toBe("zh-hant-tw");
  });
});

describe("buildLanguageAlternates", () => {
  it("links pages that exist in at least two languages", () => {
    const pages = [
      page("guide", { locale: "en" }),
      page("de/guide", { locale: "de" }),
      page("pt-br/guide", { locale: "pt-br" }),
      page("only-en", { locale: "en" }),
      page("de/only-de", { locale: "de" }),
      page("pt-br/shared", { locale: "pt-br" }),
      page("de/shared", { locale: "de" }),
    ];
    const alternates = buildLanguageAlternates(pages, languages);
    expect(alternates.get("guide")).toEqual({
      en: "/guide",
      de: "/de/guide",
      "pt-br": "/pt-br/guide",
      "x-default": "/guide",
    });
    expect(alternates.get("de/guide")).toBe(alternates.get("guide"));
    expect(alternates.has("only-en")).toBe(false);
    expect(alternates.has("de/only-de")).toBe(false);
    // No default-language page: x-default falls back to the first language
    // in file order that has the page.
    expect(alternates.get("de/shared")).toEqual({
      de: "/de/shared",
      "pt-br": "/pt-br/shared",
      "x-default": "/de/shared",
    });
  });

  it("is empty without at least two languages or without locales", () => {
    expect(buildLanguageAlternates([page("x")], null).size).toBe(0);
    expect(
      buildLanguageAlternates([page("x", { locale: "en" })], [languages[0]])
        .size,
    ).toBe(0);
    expect(
      buildLanguageAlternates([page("x"), page("de/x")], languages).size,
    ).toBe(0);
  });
});

describe("sectionsForVariant", () => {
  it("keeps only sections with pages in the prefix, in sections order", () => {
    const sections = [
      { label: "Docs", slug: "" },
      { label: "API", slug: "api" },
      { label: "SDKs", slug: "sdks" },
    ];
    const pages = [
      page("x", { locale: "en", section: "" }),
      page("api/x", { locale: "en", section: "api" }),
      page("de/sdks/x", { locale: "de", section: "sdks" }),
    ];
    expect(sectionsForVariant(pages, sections, "", languages, null)).toEqual([
      "",
      "api",
    ]);
    expect(sectionsForVariant(pages, sections, "de", languages, null)).toEqual([
      "sdks",
    ]);
    expect(sectionsForVariant(pages, null, "", languages, null)).toEqual([]);
  });
});

describe("assertVariantsDisjoint", () => {
  it("refuses tokens that claim the same folder", () => {
    expect(() =>
      assertVariantsDisjoint(languages, versions, null),
    ).not.toThrow();
    expect(() =>
      assertVariantsDisjoint(
        languages,
        [
          { slug: "", label: "Latest", default: true },
          { slug: "de", label: "Deutsch?", default: false },
        ],
        null,
      ),
    ).toThrow(VariantCollisionError);
    expect(() =>
      assertVariantsDisjoint(languages, versions, [
        { label: "Docs", slug: "" },
        { label: "Deutsch", slug: "de" },
      ]),
    ).toThrow(
      'languages.json: language code "de" collides with section slug "de"',
    );
    expect(() =>
      assertVariantsDisjoint(languages, versions, [
        { label: "Guides", slug: "guides", directory: "v1/guides" },
      ]),
    ).toThrow(
      'versions.json: version slug "v1" collides with section directory "v1/guides"',
    );
    // The default language code is also claimed: docs/en/ is never a folder.
    expect(() =>
      assertVariantsDisjoint(languages, null, [
        { label: "English", slug: "en" },
      ]),
    ).toThrow(VariantCollisionError);
  });
});

describe("assertVariantLayout", () => {
  it("rejects a default-language folder and a version-first layout", () => {
    expect(() =>
      assertVariantLayout(
        ["guide.mdx", "de/guide.mdx", "de/v1/x.mdx"],
        languages,
        versions,
      ),
    ).not.toThrow();
    expect(() =>
      assertVariantLayout(["en/guide.mdx"], languages, versions),
    ).toThrow('"en" is the default language and lives at the docs root');
    expect(() =>
      assertVariantLayout(["v1/de/guide.mdx"], languages, versions),
    ).toThrow('expected "de/v1/..."');
    expect(() =>
      assertVariantLayout(["en/guide.mdx"], null, null),
    ).not.toThrow();
    expect(() =>
      assertVariantLayout(["v1/de/x.mdx"], null, versions),
    ).not.toThrow();
  });
});
