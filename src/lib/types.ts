export interface MDXFile {
  path: string;
  content: string;
  frontmatter: Record<string, any>;
  slug: string;
  /** Language code and version slug of the page's variant. Set only when
   *  `languages.json` / `versions.json` are configured. */
  locale?: string;
  version?: string;
}

export interface PageMeta {
  slug: string;
  title: string;
  description: string;
  date: string | null;
  category: string;
  path: string;
  categoryOrder: number;
  order: number;
  section: string;
  navIcon?: string;
  categoryIcon?: string;
  lastModified?: string;
  /** HTTP verb (e.g. "GET") for synthetic OpenAPI endpoint pages. Set only on
   *  generated API-reference pages so the sidebar can render a method badge;
   *  omitted on hand-written MDX pages so their serialized nav objects are
   *  unchanged. */
  httpMethod?: string;
  /** Language code (`languages.json`) and version slug (`versions.json`, ""
   *  for the default version) of the page's variant. Omitted entirely when
   *  the corresponding file is not configured so serialized nav objects are
   *  unchanged for sites that do not use the feature. */
  locale?: string;
  version?: string;
}

export interface SectionConfig {
  label: string;
  slug: string;
  directory?: string;
}

/** One entry of `languages.json`. The default language lives at the docs root
 *  and has no URL prefix; every other language lives in `docs/<code>/`. */
export interface LanguageConfig {
  /** Lowercase URL segment (`en`, `pt-br`); also the `lang`/`hreflang` value. */
  code: string;
  label: string;
  default: boolean;
  /** Per-language overrides for the generated site's UI strings. */
  strings?: Record<string, string>;
}

/** One entry of `versions.json`. The default version lives at the docs root
 *  and has `slug: ""`, mirroring the root section; every other version lives in
 *  `docs/<slug>/` (or `docs/<code>/<slug>/` inside a language folder). */
export interface VersionConfig {
  slug: string;
  label: string;
  default: boolean;
}

export interface DoccupineConfig {
  watchDir: string;
  outputDir: string;
  port: string;
  /** Force the package manager used to install and run the generated app
   *  ("pnpm" or "npm"), overriding auto-detection. Also settable per run via
   *  the `--package-manager` flag, which takes precedence over this field. */
  packageManager?: string;
  /** Optional OpenAPI spec(s) that drive the generated API reference section.
   *  Accepts a single path, a list of paths, or named-spec objects; all forms
   *  are normalized to `NormalizedOpenApiSpec[]` internally. */
  openapi?: string | string[] | OpenApiSpecConfig[];
}

/** A named OpenAPI spec entry as authored in `doccupine.json`. */
export interface OpenApiSpecConfig {
  /** Display/namespace name; defaults to the file basename when omitted. Used
   *  as the sidebar section and route namespace when more than one spec. */
  name?: string;
  /** Path to a `.json`/`.yaml`/`.yml` OpenAPI document, project-relative. */
  file: string;
}

/** Internal, fully-resolved form every `openapi` config shape collapses to. */
export interface NormalizedOpenApiSpec {
  name: string;
  file: string;
}

export interface GoogleFontConfig {
  fontName: string;
  subsets?: string[];
  weight?: string | string[];
}

export interface LocalFontSource {
  path: string;
  weight?: string;
  style?: string;
}

export interface FontConfig {
  googleFont?: GoogleFontConfig;
  localFonts?: string | { src: LocalFontSource[] };
}

export interface PostHogConfig {
  key: string;
  host?: string;
}

export interface AnalyticsConfig {
  provider: "posthog";
  posthog: PostHogConfig;
}
