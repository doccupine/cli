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
  lastModified?: string;
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
