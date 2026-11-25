/**
 * config.json's "banner": a site-wide announcement above the header.
 *
 *   "banner": { "content": "Text with a [link](/changelog)", "dismissible": true }
 *
 * The generated app validates it again at runtime (utils/config.ts) and drops
 * an invalid value; this reports why, so a typo is not silently ignored.
 */
export const BANNER_MAX_LENGTH = 500;

const KEYS = new Set(["content", "dismissible"]);

/** Why config.json's "banner" will be ignored, or null when it is fine. */
export function bannerWarning(config: unknown): string | null {
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    return null;
  }
  if (!("banner" in config)) return null;
  const banner = (config as Record<string, unknown>).banner;
  const ignored = "The banner is not shown.";
  if (typeof banner !== "object" || banner === null || Array.isArray(banner)) {
    return `config.json "banner" must be an object with a "content" string. ${ignored}`;
  }
  const fields = banner as Record<string, unknown>;
  const content = fields.content;
  if (typeof content !== "string" || content.trim() === "") {
    return `config.json "banner.content" must be a non-empty string. ${ignored}`;
  }
  if (content.trim().length > BANNER_MAX_LENGTH) {
    return `config.json "banner.content" must be at most ${BANNER_MAX_LENGTH} characters. ${ignored}`;
  }
  if (
    fields.dismissible !== undefined &&
    typeof fields.dismissible !== "boolean"
  ) {
    return `config.json "banner.dismissible" must be true or false. ${ignored}`;
  }
  const unknown = Object.keys(fields).filter((key) => !KEYS.has(key));
  if (unknown.length > 0) {
    // Extra keys are dropped at runtime, but the banner still shows.
    return `config.json "banner" has unknown ${unknown.length === 1 ? "key" : "keys"} ${unknown.map((key) => JSON.stringify(key)).join(", ")}; only "content" and "dismissible" are read.`;
  }
  return null;
}

/** Same as bannerWarning, from config.json's raw source. */
export function bannerWarningFromSource(source: string | null): string | null {
  if (source === null) return null;
  try {
    return bannerWarning(JSON.parse(source));
  } catch {
    // Unparseable JSON is reported by the other config.json readers.
    return null;
  }
}
