/**
 * Site designs ("templates") a generated site can use. config.json selects
 * one with its `template` field; sites that leave it out get the modern
 * design, and `"classic"` keeps the original one. Only the chosen design's files are written (see appStructureFor in
 * structures.ts), so changing the design is a regeneration, not a runtime
 * switch.
 */
export const SITE_TEMPLATES = ["classic", "modern"] as const;

export type SiteTemplate = (typeof SITE_TEMPLATES)[number];

export const DEFAULT_TEMPLATE: SiteTemplate = "modern";

export function isSiteTemplate(value: unknown): value is SiteTemplate {
  return (
    typeof value === "string" &&
    (SITE_TEMPLATES as readonly string[]).includes(value)
  );
}

export interface ResolvedTemplate {
  template: SiteTemplate;
  /** Set when config.json names a template that does not exist. */
  warning: string | null;
}

/**
 * Reads the `template` field from config.json's parsed content. A missing
 * field means the default; an unknown value falls back to the default with a
 * warning for the caller to print, so a typo never breaks the build.
 */
export function resolveTemplate(config: unknown): ResolvedTemplate {
  const value =
    typeof config === "object" && config !== null && !Array.isArray(config)
      ? (config as Record<string, unknown>).template
      : undefined;
  if (value === undefined) {
    return { template: DEFAULT_TEMPLATE, warning: null };
  }
  if (isSiteTemplate(value)) return { template: value, warning: null };
  return {
    template: DEFAULT_TEMPLATE,
    warning: `config.json "template" must be one of ${SITE_TEMPLATES.map((name) => `"${name}"`).join(", ")}; got ${JSON.stringify(value)}. Using "${DEFAULT_TEMPLATE}".`,
  };
}

/**
 * Same as resolveTemplate, from config.json's raw source. Unparseable JSON
 * resolves to the default without a warning of its own: the other config.json
 * readers already report it.
 */
export function resolveTemplateFromSource(
  source: string | null,
): ResolvedTemplate {
  if (source === null) return { template: DEFAULT_TEMPLATE, warning: null };
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    return { template: DEFAULT_TEMPLATE, warning: null };
  }
  return resolveTemplate(parsed);
}
