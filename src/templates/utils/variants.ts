export const variantsUtilTemplate = `import rawLanguages from "@/languages.json";
import rawVersions from "@/versions.json";

// Languages (languages.json) and versions (versions.json) of this site. A
// variant's folder is its URL prefix - "de", "v1", "de/v1" - and the default
// language and version live at the docs root with no prefix. The CLI
// validated both files when it generated this app, so this module only has to
// read them. The resolver mirrors the CLI's src/lib/variants.ts; keep the two
// in step.

export interface LanguageConfig {
  code: string;
  label: string;
  default?: boolean;
  strings?: Record<string, string>;
}

export interface VersionConfig {
  /** URL prefix and folder name; "" for the default version at the docs root. */
  slug: string;
  label: string;
  default?: boolean;
}

export interface VariantResolution {
  /** Language code; undefined when languages.json is not configured. */
  locale?: string;
  /** Version slug ("" for the default); undefined when not configured. */
  version?: string;
  /** URL prefix: "", "de", "v1", or "de/v1". */
  prefix: string;
  /** The slug with the variant prefix removed. */
  rest: string;
}

function readLanguages(raw: unknown): LanguageConfig[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw as LanguageConfig[];
}

function readVersions(raw: unknown): VersionConfig[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return (raw as Partial<VersionConfig>[]).map((entry) => ({
    slug: entry.default ? "" : (entry.slug ?? ""),
    label: entry.label ?? "",
    default: entry.default === true,
  }));
}

export const languages = readLanguages(rawLanguages);
export const versions = readVersions(rawVersions);

export function isVariantsConfigured(): boolean {
  return languages !== null || versions !== null;
}

export function defaultLanguage(): LanguageConfig | null {
  return languages?.find((language) => language.default) ?? null;
}

export function defaultVersion(): VersionConfig | null {
  return versions?.find((version) => version.default) ?? null;
}

export function joinVariantSlug(prefix: string, slug: string): string {
  if (!prefix) return slug;
  if (slug === "") return prefix;
  return prefix + "/" + slug;
}

/**
 * Resolves the variant of a URL slug: a leading declared language folder is
 * consumed first, then a declared version folder. "de" alone is the German
 * home, "de/v1" the German v1 home.
 */
export function resolveVariantFromSlug(slug: string): VariantResolution {
  const normalized = slug.replace(/^\\/+|\\/+$/g, "");
  const segments = normalized === "" ? [] : normalized.split("/");
  let locale = languages ? (defaultLanguage()?.code ?? "") : undefined;
  let version = versions ? "" : undefined;
  let consumed = 0;
  const prefix: string[] = [];

  const language = languages?.find(
    (entry) => !entry.default && entry.code === segments[0],
  );
  if (language) {
    locale = language.code;
    prefix.push(language.code);
    consumed = 1;
  }
  const versionEntry = versions?.find(
    (entry) => !entry.default && entry.slug === segments[consumed],
  );
  if (versionEntry) {
    version = versionEntry.slug;
    prefix.push(versionEntry.slug);
    consumed += 1;
  }

  return {
    ...(locale !== undefined ? { locale } : {}),
    ...(version !== undefined ? { version } : {}),
    prefix: prefix.join("/"),
    rest: segments.slice(consumed).join("/"),
  };
}

/** Key of a navigation.json object entry: the URL prefix of the scope. */
export function navigationScopeKey(
  prefix: string,
  sectionSlug: string,
): string {
  return [prefix, sectionSlug].filter(Boolean).join("/");
}

/** URL prefix of a language/version pair; the default of either is "". */
export function variantPrefix(
  locale: string | undefined,
  version: string | undefined,
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

export function pageVariantPrefix(page: {
  locale?: string;
  version?: string;
}): string {
  return variantPrefix(page.locale, page.version);
}

/** The slug without its language prefix: the same page in every language. */
export function stripLanguagePrefix(
  slug: string,
  locale: string | undefined,
): string {
  if (!languages || locale === undefined) return slug;
  const language = languages.find((entry) => entry.code === locale);
  if (!language || language.default) return slug;
  if (slug === language.code) return "";
  if (slug.startsWith(language.code + "/")) {
    return slug.slice(language.code.length + 1);
  }
  return slug;
}

/** The slug without its whole variant prefix: the same page in every variant. */
export function stripVariantPrefix(
  slug: string,
  locale: string | undefined,
  version: string | undefined,
): string {
  const prefix = variantPrefix(locale, version);
  if (!prefix) return slug;
  if (slug === prefix) return "";
  if (slug.startsWith(prefix + "/")) return slug.slice(prefix.length + 1);
  return slug;
}
`;
