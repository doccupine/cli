import { DEFAULT_UI_STRINGS } from "../../lib/ui-strings.js";

const defaults = Object.entries(DEFAULT_UI_STRINGS)
  .map(([key, value]) => `  ${key}: ${JSON.stringify(value)},`)
  .join("\n");

export const stringsUtilTemplate = `import { languages } from "@/utils/variants";

// The site's own chrome strings. A languages.json entry overrides them for
// its language through its \`strings\` object; anything it leaves out keeps
// the default below.
export const DEFAULT_STRINGS = {
${defaults}
};

export type UiStrings = { [K in keyof typeof DEFAULT_STRINGS]: string };

export function getStrings(locale?: string): UiStrings {
  const overrides = languages?.find(
    (language) => language.code === locale,
  )?.strings;
  return overrides ? { ...DEFAULT_STRINGS, ...overrides } : DEFAULT_STRINGS;
}

/** Fills a \`{count}\` placeholder in a string. */
export function withCount(template: string, count: number): string {
  return template.replace("{count}", String(count));
}
`;
