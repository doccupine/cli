import { slugifySegment } from "./openapi.js";
import type {
  LanguageConfig,
  PageMeta,
  SectionConfig,
  VersionConfig,
} from "./types.js";
import { UI_STRING_KEYS } from "./ui-strings.js";

// ---------------------------------------------------------------------------
// Documentation variants: languages (`languages.json`) and versions
// (`versions.json`).
//
// A variant is a folder under the docs directory whose name is also its URL
// prefix: `docs/de/guide.mdx` publishes at `/de/guide`, `docs/v1/guide.mdx` at
// `/v1/guide`, `docs/de/v1/guide.mdx` at `/de/v1/guide` (language folder first,
// then version folder). The default language and the default version live at
// the docs root with no prefix, so a project that never configures either file
// keeps every slug it has today. Undeclared folders are ordinary docs folders.
//
// This module is pure and dependency-free on purpose: the Doccupine platform
// ports it verbatim into its publish preflight so both sides route a file to
// the same URL. Keep the algorithm here in step with `convex/docVariants.ts`.
// ---------------------------------------------------------------------------

export type VariantConfigFile = "languages.json" | "versions.json";

export const VARIANT_CONFIG_FILES: readonly string[] = [
  "languages.json",
  "versions.json",
];

/** Top-level route segments the generated app owns; never a language code or
 *  version slug. `api` and `gate` are app routes, `mcp` and `ingest` are proxy
 *  rewrites in the generated `proxy.ts`. */
export const RESERVED_VARIANT_SEGMENTS: readonly string[] = [
  "api",
  "gate",
  "mcp",
  "ingest",
];

export const MAX_VARIANT_TOKEN_LENGTH = 32;

export interface VariantSet {
  languages: LanguageConfig[] | null;
  versions: VersionConfig[] | null;
}

export interface VariantResolution {
  /** Language code; undefined when `languages.json` is not configured. */
  locale?: string;
  /** Version slug ("" for the default); undefined when not configured. */
  version?: string;
  /** URL prefix: "", "de", "v1", or "de/v1". */
  prefix: string;
  /** The input with the variant folders stripped. */
  rest: string;
}

export class VariantCollisionError extends Error {
  constructor(
    readonly file: VariantConfigFile,
    readonly value: string,
    readonly conflict: string,
  ) {
    super(
      `${file}: ${file === "languages.json" ? "language code" : "version slug"} "${value}" collides with ${conflict}. Rename one of them; a language or version folder must not share its name with anything else that publishes at that URL prefix.`,
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertSafeToken(
  file: VariantConfigFile,
  index: number,
  kind: "code" | "slug",
  value: string,
): void {
  const safe = slugifySegment(value);
  if (value !== safe) {
    throw new Error(
      `${file} entry ${index + 1}: unsafe ${kind} "${value}"; use a lowercase URL segment such as "${safe}"`,
    );
  }
  if (value.length > MAX_VARIANT_TOKEN_LENGTH) {
    throw new Error(
      `${file} entry ${index + 1}: ${kind} "${value}" is longer than ${MAX_VARIANT_TOKEN_LENGTH} characters`,
    );
  }
  if (RESERVED_VARIANT_SEGMENTS.includes(value)) {
    throw new Error(
      `${file} entry ${index + 1}: "${value}" is reserved by the generated site and cannot be a ${kind}`,
    );
  }
}

/**
 * Validates the parsed contents of `languages.json`. Returns null for an empty
 * array (the feature is off, like `sections.json`) and throws with a message
 * naming the entry for anything the generator would not accept.
 */
export function validateLanguagesConfig(
  parsed: unknown,
): LanguageConfig[] | null {
  if (!Array.isArray(parsed)) {
    throw new Error("languages.json must contain a JSON array");
  }
  if (parsed.length === 0) return null;

  const seenCodes = new Set<string>();
  const seenLabels = new Set<string>();
  let defaultCount = 0;
  const languages = parsed.map((entry, index): LanguageConfig => {
    if (!isRecord(entry)) {
      throw new Error(`languages.json entry ${index + 1} must be an object`);
    }
    if (!nonEmptyString(entry.code)) {
      throw new Error(
        `languages.json entry ${index + 1} needs a non-empty code such as "en"`,
      );
    }
    const code = entry.code.trim();
    assertSafeToken("languages.json", index, "code", code);
    if (!nonEmptyString(entry.label)) {
      throw new Error(
        `languages.json entry ${index + 1} needs a non-empty label`,
      );
    }
    const label = entry.label.trim();
    if (entry.default !== undefined && typeof entry.default !== "boolean") {
      throw new Error(
        `languages.json entry ${index + 1}: default must be true or false`,
      );
    }
    let strings: Record<string, string> | undefined;
    if (entry.strings !== undefined) {
      if (
        !isRecord(entry.strings) ||
        !Object.values(entry.strings).every(
          (value) => typeof value === "string",
        )
      ) {
        throw new Error(
          `languages.json entry ${index + 1}: strings must be an object of string values`,
        );
      }
      strings = { ...(entry.strings as Record<string, string>) };
      const unknown = Object.keys(strings).filter(
        (key) => !UI_STRING_KEYS.includes(key),
      );
      if (unknown.length > 0) {
        console.warn(
          `⚠️ languages.json entry ${index + 1}: unknown strings ${unknown
            .map((key) => `"${key}"`)
            .join(
              ", ",
            )} are ignored (known keys: ${UI_STRING_KEYS.join(", ")})`,
        );
      }
    }
    if (seenCodes.has(code)) {
      throw new Error(
        `languages.json entry ${index + 1}: duplicate language code "${code}"`,
      );
    }
    if (seenLabels.has(label)) {
      throw new Error(
        `languages.json entry ${index + 1}: duplicate language label "${label}"`,
      );
    }
    seenCodes.add(code);
    seenLabels.add(label);
    const isDefault = entry.default === true;
    if (isDefault) defaultCount += 1;
    return {
      code,
      label,
      default: isDefault,
      ...(strings ? { strings } : {}),
    };
  });

  if (defaultCount !== 1) {
    throw new Error(
      'languages.json needs exactly one entry with "default": true; that language lives at the docs root',
    );
  }
  return languages;
}

/**
 * Validates the parsed contents of `versions.json`. The default version has no
 * slug (it lives at the docs root) and is normalized to `slug: ""`.
 */
export function validateVersionsConfig(
  parsed: unknown,
): VersionConfig[] | null {
  if (!Array.isArray(parsed)) {
    throw new Error("versions.json must contain a JSON array");
  }
  if (parsed.length === 0) return null;

  const seenSlugs = new Set<string>();
  const seenLabels = new Set<string>();
  let defaultCount = 0;
  const versions = parsed.map((entry, index): VersionConfig => {
    if (!isRecord(entry)) {
      throw new Error(`versions.json entry ${index + 1} must be an object`);
    }
    if (!nonEmptyString(entry.label)) {
      throw new Error(
        `versions.json entry ${index + 1} needs a non-empty label`,
      );
    }
    const label = entry.label.trim();
    if (entry.default !== undefined && typeof entry.default !== "boolean") {
      throw new Error(
        `versions.json entry ${index + 1}: default must be true or false`,
      );
    }
    const isDefault = entry.default === true;
    let slug = "";
    if (isDefault) {
      if (entry.slug !== undefined) {
        throw new Error(
          `versions.json entry ${index + 1}: the default version lives at the docs root and must not set a slug`,
        );
      }
      defaultCount += 1;
    } else {
      if (!nonEmptyString(entry.slug)) {
        throw new Error(
          `versions.json entry ${index + 1} needs a non-empty slug such as "v1" (or "default": true for the version at the docs root)`,
        );
      }
      slug = entry.slug.trim();
      assertSafeToken("versions.json", index, "slug", slug);
      if (seenSlugs.has(slug)) {
        throw new Error(
          `versions.json entry ${index + 1}: duplicate version slug "${slug}"`,
        );
      }
      seenSlugs.add(slug);
    }
    if (seenLabels.has(label)) {
      throw new Error(
        `versions.json entry ${index + 1}: duplicate version label "${label}"`,
      );
    }
    seenLabels.add(label);
    return { slug, label, default: isDefault };
  });

  if (defaultCount !== 1) {
    throw new Error(
      'versions.json needs exactly one entry with "default": true; that version lives at the docs root',
    );
  }
  return versions;
}

export function defaultLanguage(
  languages: LanguageConfig[] | null,
): LanguageConfig | null {
  return languages?.find((language) => language.default) ?? null;
}

export function defaultVersion(
  versions: VersionConfig[] | null,
): VersionConfig | null {
  return versions?.find((version) => version.default) ?? null;
}

function resolveVariantSegments(
  segments: readonly string[],
  languages: LanguageConfig[] | null,
  versions: VersionConfig[] | null,
): { locale?: string; version?: string; prefix: string; consumed: number } {
  let locale = languages ? (defaultLanguage(languages)?.code ?? "") : undefined;
  let version = versions ? "" : undefined;
  let consumed = 0;
  const prefix: string[] = [];

  if (languages) {
    const match = languages.find(
      (language) => !language.default && language.code === segments[0],
    );
    if (match) {
      locale = match.code;
      prefix.push(match.code);
      consumed = 1;
    }
  }
  if (versions) {
    const match = versions.find(
      (entry) => !entry.default && entry.slug === segments[consumed],
    );
    if (match) {
      version = match.slug;
      prefix.push(match.slug);
      consumed += 1;
    }
  }

  return {
    ...(locale !== undefined ? { locale } : {}),
    ...(version !== undefined ? { version } : {}),
    prefix: prefix.join("/"),
    consumed,
  };
}

/**
 * Resolves the variant of a docs-relative file path. Only directory segments
 * are candidates, so a file literally named `de.mdx` is never a variant. The
 * language folder is consumed first, then the version folder.
 */
export function resolveVariant(
  relPath: string,
  languages: LanguageConfig[] | null,
  versions: VersionConfig[] | null,
): VariantResolution {
  const normalized = relPath.replace(/\\/g, "/").replace(/^(\.\/)+/, "");
  const segments = normalized.split("/");
  const directories = segments.slice(0, -1);
  const fileName = segments[segments.length - 1];
  const { consumed, ...resolved } = resolveVariantSegments(
    directories,
    languages,
    versions,
  );
  return {
    ...resolved,
    rest: [...directories.slice(consumed), fileName].join("/"),
  };
}

/**
 * Resolves the variant of a URL slug (no leading slash). Every segment is a
 * candidate, so `de` alone is the German home and `de/v1` the German v1 home.
 */
export function resolveVariantFromSlug(
  slug: string,
  languages: LanguageConfig[] | null,
  versions: VersionConfig[] | null,
): VariantResolution {
  const normalized = slug.replace(/^\/+|\/+$/g, "");
  const segments = normalized === "" ? [] : normalized.split("/");
  const { consumed, ...resolved } = resolveVariantSegments(
    segments,
    languages,
    versions,
  );
  return { ...resolved, rest: segments.slice(consumed).join("/") };
}

export function joinVariantSlug(prefix: string, slug: string): string {
  if (!prefix) return slug;
  if (slug === "") return prefix;
  return `${prefix}/${slug}`;
}

/** Key of a `navigation.json` object entry: the URL prefix of the scope. */
export function navigationScopeKey(
  prefix: string,
  sectionSlug: string,
): string {
  return [prefix, sectionSlug].filter(Boolean).join("/");
}

/** URL prefix for a language/version pair; the default of either is "". */
export function variantPrefix(
  locale: string | undefined,
  version: string | undefined,
  languages: LanguageConfig[] | null,
  versions: VersionConfig[] | null,
): string {
  const language =
    languages && locale !== undefined
      ? languages.find((entry) => entry.code === locale)
      : undefined;
  const versionEntry =
    versions && version !== undefined
      ? versions.find((entry) => entry.slug === version)
      : undefined;
  return joinVariantSlug(
    language && !language.default ? language.code : "",
    versionEntry && !versionEntry.default ? versionEntry.slug : "",
  );
}

export function pageVariantPrefix(
  page: { locale?: string; version?: string },
  languages: LanguageConfig[] | null,
  versions: VersionConfig[] | null,
): string {
  return variantPrefix(page.locale, page.version, languages, versions);
}

/** Every URL prefix a configured site publishes, "" first, then the languages
 *  and versions in file order (languages outer, versions inner). */
export function listVariantPrefixes(
  languages: LanguageConfig[] | null,
  versions: VersionConfig[] | null,
): string[] {
  const languageSlugs = languages
    ? languages.map((language) => (language.default ? "" : language.code))
    : [""];
  const versionSlugs = versions
    ? versions.map((version) => (version.default ? "" : version.slug))
    : [""];
  const prefixes = [""];
  for (const languageSlug of languageSlugs) {
    for (const versionSlug of versionSlugs) {
      const prefix = joinVariantSlug(languageSlug, versionSlug);
      if (!prefixes.includes(prefix)) prefixes.push(prefix);
    }
  }
  return prefixes;
}

/** The translation key of a slug: the slug without its language prefix, so
 *  `de/v1/guide` and `v1/guide` are the same page in two languages. */
export function stripLanguagePrefix(
  slug: string,
  locale: string | undefined,
  languages: LanguageConfig[] | null,
): string {
  if (!languages || locale === undefined) return slug;
  const language = languages.find((entry) => entry.code === locale);
  if (!language || language.default) return slug;
  if (slug === language.code) return "";
  if (slug.startsWith(`${language.code}/`)) {
    return slug.slice(language.code.length + 1);
  }
  return slug;
}

/**
 * hreflang alternates for every page that exists in at least two languages:
 * slug -> { <code>: "/<slug>", ..., "x-default": "/<default-language slug>" }.
 * Keys follow the order of `languages.json`; `x-default` points at the default
 * language's page when it exists, otherwise at the first available language.
 */
export function buildLanguageAlternates(
  pages: readonly PageMeta[],
  languages: LanguageConfig[] | null,
): Map<string, Record<string, string>> {
  const alternates = new Map<string, Record<string, string>>();
  if (!languages || languages.length < 2) return alternates;

  const groups = new Map<string, Map<string, string>>();
  for (const page of pages) {
    if (page.locale === undefined) continue;
    const key = stripLanguagePrefix(page.slug, page.locale, languages);
    let group = groups.get(key);
    if (!group) {
      group = new Map();
      groups.set(key, group);
    }
    if (!group.has(page.locale)) group.set(page.locale, page.slug);
  }

  const defaultCode = defaultLanguage(languages)?.code;
  for (const group of groups.values()) {
    if (group.size < 2) continue;
    const entries: Record<string, string> = {};
    for (const language of languages) {
      const slug = group.get(language.code);
      if (slug !== undefined) entries[language.code] = `/${slug}`;
    }
    const fallback =
      defaultCode !== undefined && group.has(defaultCode)
        ? group.get(defaultCode)!
        : group.get(languages.find((l) => group.has(l.code))!.code)!;
    entries["x-default"] = `/${fallback}`;
    for (const slug of group.values()) alternates.set(slug, entries);
  }
  return alternates;
}

/** Section slugs, in `sections` order, that have at least one page in the
 *  given variant prefix. */
export function sectionsForVariant(
  pages: readonly PageMeta[],
  sections: SectionConfig[] | null,
  prefix: string,
  languages: LanguageConfig[] | null,
  versions: VersionConfig[] | null,
): string[] {
  if (!sections) return [];
  const present = new Set<string>();
  for (const page of pages) {
    if (pageVariantPrefix(page, languages, versions) === prefix) {
      present.add(page.section || "");
    }
  }
  return sections
    .filter((section) => present.has(section.slug))
    .map((section) => section.slug);
}

/** `pt-br` -> `pt_BR`, `de` -> `de` (Open Graph locale format). */
export function toOgLocale(code: string): string {
  const [language, region, ...rest] = code.split("-");
  if (!region || rest.length > 0) return code;
  return `${language}_${region.toUpperCase()}`;
}

/**
 * Language codes and version slugs must not collide with each other, with a
 * section slug, or with the first segment of a section directory: all of them
 * claim the same top-level folder or URL prefix.
 */
export function assertVariantsDisjoint(
  languages: LanguageConfig[] | null,
  versions: VersionConfig[] | null,
  sections: SectionConfig[] | null,
): void {
  const codes = new Set((languages ?? []).map((language) => language.code));
  const versionSlugs = (versions ?? [])
    .filter((version) => !version.default)
    .map((version) => version.slug);

  for (const slug of versionSlugs) {
    if (codes.has(slug)) {
      throw new VariantCollisionError(
        "versions.json",
        slug,
        `language code "${slug}" (languages.json)`,
      );
    }
  }

  for (const section of sections ?? []) {
    const claims: Array<[string, string]> = [];
    if (section.slug)
      claims.push([section.slug, `section slug "${section.slug}"`]);
    if (section.directory) {
      const first = section.directory.split("/")[0];
      claims.push([first, `section directory "${section.directory}"`]);
    }
    for (const [value, description] of claims) {
      if (codes.has(value)) {
        throw new VariantCollisionError("languages.json", value, description);
      }
      if (versionSlugs.includes(value)) {
        throw new VariantCollisionError("versions.json", value, description);
      }
    }
  }
}

/**
 * The default language lives at the docs root, so a `docs/<default code>/`
 * folder is a mistake rather than a variant, and a language folder must come
 * before a version folder. Both would otherwise publish surprising URLs.
 */
export function assertVariantLayout(
  files: readonly string[],
  languages: LanguageConfig[] | null,
  versions: VersionConfig[] | null,
): void {
  if (!languages && !versions) return;
  const defaultCode = defaultLanguage(languages)?.code;
  const versionSlugs = new Set(
    (versions ?? [])
      .filter((version) => !version.default)
      .map((version) => version.slug),
  );
  const languageCodes = new Set(
    (languages ?? [])
      .filter((language) => !language.default)
      .map((language) => language.code),
  );

  for (const file of files) {
    const directories = file
      .replace(/\\/g, "/")
      .replace(/^(\.\/)+/, "")
      .split("/")
      .slice(0, -1);
    if (defaultCode !== undefined && directories[0] === defaultCode) {
      throw new Error(
        `languages.json: "${defaultCode}" is the default language and lives at the docs root; move "${file}" out of the "${defaultCode}/" folder`,
      );
    }
    if (
      versionSlugs.has(directories[0] ?? "") &&
      languageCodes.has(directories[1] ?? "")
    ) {
      throw new Error(
        `"${file}": the language folder must come before the version folder (expected "${directories[1]}/${directories[0]}/...")`,
      );
    }
  }
}
