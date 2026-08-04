import chalk from "chalk";
import fs from "fs-extra";
import { createHash } from "node:crypto";
import path from "node:path";

import { GeneratedArtifacts } from "../lib/generated-artifacts.js";
import { resolveOutputPath } from "../lib/output-safety.js";
import { writeFileAtomic } from "../lib/utils.js";
import { SecureSourceFs } from "./secure-source-fs.js";

// Next.js-style icon file conventions, read from the project root. The files
// are copied to the generated public/ directory and referenced through
// icons.json instead of Next's app/ file convention, because file-based icons
// override config-based metadata entirely and have no dark-variant form.
export const ICON_SOURCE_FILES = [
  "icon.png",
  "icon-dark.png",
  "apple-icon.png",
] as const;

type IconSourceFile = (typeof ICON_SOURCE_FILES)[number];

const ICON_MANIFEST_KEYS: Record<IconSourceFile, string> = {
  "icon.png": "icon",
  "icon-dark.png": "iconDark",
  "apple-icon.png": "appleIcon",
};

const ICONS_JSON_FILE = "icons.json";

export class IconAssetManager {
  constructor(
    private readonly rootDir: string,
    private readonly outputDir: string,
    private readonly artifacts: GeneratedArtifacts,
    private readonly sourceFs: SecureSourceFs,
    private readonly readIconSourceFile: (
      fileName: string,
    ) => Promise<Buffer | null>,
  ) {}

  private outputPath(...segments: string[]): string {
    return resolveOutputPath(this.outputDir, ...segments);
  }

  async syncIconFiles(): Promise<void> {
    console.log(chalk.blue(`🔍 Checking for icon files...`));

    const sources = new Map<IconSourceFile, Buffer>();
    for (const fileName of ICON_SOURCE_FILES) {
      const data = await this.readIconSourceFile(fileName);
      if (data !== null) sources.set(fileName, data);
    }

    // A root icon file and a user public/ file would publish the same URL.
    // Refuse before writing anything so a failed sync leaves output untouched.
    for (const fileName of sources.keys()) {
      const publicSource = await this.sourceFs.findPublicAsset(fileName);
      if (publicSource !== null) {
        throw new Error(
          `Conflicting icon sources: ${path.join(this.rootDir, fileName)} ` +
            `and ${publicSource} both publish public/${fileName}. ` +
            `Remove one of them.`,
        );
      }
    }

    if (sources.has("icon-dark.png") && !sources.has("icon.png")) {
      console.warn(
        chalk.yellow(
          `⚠️ icon-dark.png found without icon.png - the dark variant only ` +
            `applies alongside a light icon, skipping it`,
        ),
      );
      sources.delete("icon-dark.png");
    }

    const manifest: Record<string, string> = {};
    const nextFiles = new Set<string>();
    for (const fileName of ICON_SOURCE_FILES) {
      const data = sources.get(fileName);
      if (!data) continue;
      const hash = createHash("sha256").update(data).digest("hex").slice(0, 8);
      await writeFileAtomic(this.outputPath("public", fileName), data);
      manifest[ICON_MANIFEST_KEYS[fileName]] = `/${fileName}?v=${hash}`;
      nextFiles.add(fileName);
    }

    await writeFileAtomic(
      this.outputPath(ICONS_JSON_FILE),
      nextFiles.size > 0 ? `${JSON.stringify(manifest, null, 2)}\n` : `{}\n`,
    );

    for (const stale of this.artifacts.iconFiles()) {
      if (!nextFiles.has(stale)) {
        await fs.remove(this.outputPath("public", stale));
      }
    }
    this.artifacts.replaceIconFiles(nextFiles);
    await this.artifacts.save();

    if (nextFiles.size > 0) {
      console.log(
        chalk.green(`  ✓ Copied ${[...nextFiles].join(", ")} to Next.js app`),
      );
    } else {
      console.log(chalk.gray(`  ✗ no icon files found, skipping`));
    }
  }
}
