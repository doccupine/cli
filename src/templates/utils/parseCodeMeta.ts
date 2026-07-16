export const parseCodeMetaTemplate = `export type CodeMetaValue = string | boolean;

export function parseCodeMeta(meta?: string): Record<string, CodeMetaValue> {
  const out: Record<string, CodeMetaValue> = {};
  if (!meta) return out;

  const pattern = /([A-Za-z_][\\w-]*)(?:=(?:"([^"]*)"|'([^']*)'|\\{([^}]*)\\}))?/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(meta)) !== null) {
    const [, key, doubleQuoted, singleQuoted, braced] = match;

    if (doubleQuoted !== undefined) {
      out[key] = doubleQuoted;
    } else if (singleQuoted !== undefined) {
      out[key] = singleQuoted;
    } else if (braced !== undefined) {
      const value = braced.trim();
      out[key] =
        value === "true"
          ? true
          : value === "false"
            ? false
            : value.replace(/^["']|["']$/g, "");
    } else {
      out[key] = true;
    }
  }

  return out;
}
`;
