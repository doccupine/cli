#!/usr/bin/env node

import fs from "fs-extra";
import { fileURLToPath } from "url";

export {
  generateSlug,
  getFullSlug,
  escapeTemplateContent,
  toJsStringLiteral,
} from "./lib/utils.js";
export { MDXToNextJSGenerator } from "./mdx-to-nextjs-generator.js";

const __filename = fileURLToPath(import.meta.url);

/**
 * True when this file is what node was asked to run, rather than a module some
 * other process imported. Compares realpaths because npm installs the bin as a
 * symlink (`node_modules/.bin/doccupine` -> `dist/index.js`).
 */
export function isProcessEntrypoint(
  entry: string | undefined = process.argv[1],
  self: string = __filename,
): boolean {
  if (!entry) return false;

  // Windows paths are case-insensitive; a false negative here would make the
  // CLI exit silently without running any command.
  const normalize = (filePath: string) =>
    process.platform === "win32" ? filePath.toLowerCase() : filePath;

  try {
    return (
      normalize(fs.realpathSync(entry)) === normalize(fs.realpathSync(self))
    );
  } catch {
    return false;
  }
}

if (isProcessEntrypoint()) {
  const { runCli } = await import("./cli.js");
  await runCli();
}
