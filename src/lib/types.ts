export interface MDXFile {
  path: string;
  content: string;
  frontmatter: Record<string, any>;
  slug: string;
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
}

export interface SectionConfig {
  label: string;
  slug: string;
  directory?: string;
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

export interface FontConfig {
  [key: string]: any;
}

export interface PostHogConfig {
  key: string;
  host?: string;
}

export interface AnalyticsConfig {
  provider: "posthog";
  posthog: PostHogConfig;
}
