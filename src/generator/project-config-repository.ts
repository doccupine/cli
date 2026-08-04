import chalk from "chalk";
import fs from "fs-extra";
import { createHash } from "node:crypto";
import path from "node:path";

import { resolveOutputPath } from "../lib/output-safety.js";
import {
  validateAnalyticsConfig,
  validateFontConfig,
} from "../lib/project-config.js";
import type {
  AnalyticsConfig,
  FontConfig,
  SectionConfig,
} from "../lib/types.js";
import { writeFileAtomic } from "../lib/utils.js";
import { SecureSourceFs } from "./secure-source-fs.js";
import { validateSectionsConfig } from "./section-resolver.js";

const ARRAY_CONFIG_DEFAULTS = new Set([
  "links.json",
  "navigation.json",
  "sections.json",
]);

interface SourceSnapshotEntry {
  data: Buffer | null;
  state: string;
}

export class ProjectConfigRepository {
  private sourceSnapshot: Map<string, SourceSnapshotEntry> | null = null;

  constructor(
    private readonly rootDir: string,
    private readonly outputDir: string,
    private readonly sourceFs: SecureSourceFs,
    private readonly configFiles: readonly string[],
    private readonly fontConfigFile: string,
    private readonly analyticsConfigFile: string,
    private readonly iconFiles: readonly string[] = [],
  ) {}

  private outputPath(...segments: string[]): string {
    return resolveOutputPath(this.outputDir, ...segments);
  }

  private async hasRootSourceFile(fileName: string): Promise<boolean> {
    if (this.sourceSnapshot?.has(fileName)) {
      return this.sourceSnapshot.get(fileName)?.data !== null;
    }
    return fs.pathExists(path.join(this.rootDir, fileName));
  }

  private async readRootSourceFile(
    sourcePath: string,
    label: string,
  ): Promise<Buffer> {
    const fileName = path.basename(sourcePath);
    if (this.sourceSnapshot?.has(fileName)) {
      const data = this.sourceSnapshot.get(fileName)?.data;
      if (data === null || data === undefined) {
        throw new Error(`Source file ${sourcePath} is not in the snapshot`);
      }
      return data;
    }
    return (await this.sourceFs.readProjectSourceFile(sourcePath, label)).data;
  }

  private async copyRootSourceFile(
    sourcePath: string,
    destPath: string,
    label: string,
  ): Promise<void> {
    const data = await this.readRootSourceFile(sourcePath, label);
    await writeFileAtomic(destPath, data);
  }

  private async readOptionalRootSourceFile(
    fileName: string,
    label: string,
  ): Promise<string | null> {
    const sourcePath = path.join(this.rootDir, fileName);
    if (!(await this.hasRootSourceFile(fileName))) return null;
    const data = await this.readRootSourceFile(sourcePath, label);
    return data.toString("utf8");
  }

  async readConfigFile(): Promise<string | null> {
    return this.readOptionalRootSourceFile("config.json", "config source");
  }

  async readOptionalRootBinaryFile(
    fileName: string,
    label: string,
  ): Promise<Buffer | null> {
    if (!(await this.hasRootSourceFile(fileName))) return null;
    return this.readRootSourceFile(path.join(this.rootDir, fileName), label);
  }

  async preflightSourceFiles(): Promise<void> {
    const sources = [
      ...this.configFiles.map(
        (fileName) => [fileName, "config source"] as const,
      ),
      [this.fontConfigFile, "font source"] as const,
      [this.analyticsConfigFile, "analytics source"] as const,
      ...this.iconFiles.map((fileName) => [fileName, "icon source"] as const),
    ];
    const snapshot = new Map<string, SourceSnapshotEntry>();
    for (const [fileName, label] of sources) {
      const sourcePath = path.join(this.rootDir, fileName);
      if (await fs.pathExists(sourcePath)) {
        const { data, stat } = await this.sourceFs.readProjectSourceFile(
          sourcePath,
          label,
        );
        const hash = createHash("sha256").update(data).digest("hex");
        snapshot.set(fileName, {
          data,
          state: `file:${stat.size}:${stat.mtimeMs}:${stat.dev}:${stat.ino}:${hash}`,
        });
      } else {
        snapshot.set(fileName, { data: null, state: "missing" });
      }
    }
    this.sourceSnapshot = snapshot;
  }

  sourceSnapshotStates(): Record<string, string> {
    return Object.fromEntries(
      [...(this.sourceSnapshot ?? [])].map(([fileName, entry]) => [
        fileName,
        entry.state,
      ]),
    );
  }

  clearSourceSnapshot(): void {
    this.sourceSnapshot = null;
  }

  async copyConfigFile(configFile: string): Promise<void> {
    await this.copyRootSourceFile(
      path.join(this.rootDir, configFile),
      this.outputPath(configFile),
      "config source",
    );
  }

  async resetConfigFile(configFile: string): Promise<void> {
    await writeFileAtomic(
      this.outputPath(configFile),
      ARRAY_CONFIG_DEFAULTS.has(configFile) ? `[]\n` : `{}\n`,
    );
  }

  async copyCustomConfigFiles(): Promise<void> {
    console.log(chalk.blue(`🔍 Checking for config files in: ${this.rootDir}`));

    for (const configFile of this.configFiles) {
      const sourcePath = path.join(this.rootDir, configFile);

      console.log(chalk.gray(`  Checking ${configFile}...`));

      if (await this.hasRootSourceFile(configFile)) {
        await this.copyConfigFile(configFile);
        console.log(chalk.green(`  ✓ Copied ${configFile} to Next.js app`));
      } else {
        console.log(chalk.gray(`  ✗ ${configFile} not found, skipping`));
      }
    }
  }

  async copyFontConfigFile(): Promise<void> {
    await this.copyRootSourceFile(
      path.join(this.rootDir, this.fontConfigFile),
      this.outputPath(this.fontConfigFile),
      "font source",
    );
  }

  async copyFontConfig(): Promise<void> {
    console.log(chalk.blue(`🔍 Checking for font configuration...`));

    const sourcePath = path.join(this.rootDir, this.fontConfigFile);
    if (await this.hasRootSourceFile(this.fontConfigFile)) {
      await this.copyFontConfigFile();
      console.log(
        chalk.green(`  ✓ Copied ${this.fontConfigFile} to Next.js app`),
      );
    } else {
      console.log(chalk.gray(`  ✗ ${this.fontConfigFile} not found, skipping`));
    }
  }

  async removeFontConfig(): Promise<boolean> {
    const destPath = this.outputPath(this.fontConfigFile);
    if (!(await fs.pathExists(destPath))) return false;
    await fs.remove(destPath);
    return true;
  }

  async loadFontConfig(): Promise<FontConfig | null> {
    try {
      const content = await this.readOptionalRootSourceFile(
        this.fontConfigFile,
        "font source",
      );
      if (content !== null) {
        return validateFontConfig(JSON.parse(content));
      }
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠️ Error reading ${this.fontConfigFile}`),
        error,
      );
    }

    return null;
  }

  async loadAnalyticsConfig(): Promise<AnalyticsConfig | null> {
    try {
      const content = await this.readOptionalRootSourceFile(
        this.analyticsConfigFile,
        "analytics source",
      );
      if (content !== null) {
        return validateAnalyticsConfig(JSON.parse(content));
      }
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠️ Error reading ${this.analyticsConfigFile}`),
        error,
      );
    }

    return null;
  }

  async writeAnalyticsConfig(config: AnalyticsConfig | null): Promise<void> {
    await writeFileAtomic(
      this.outputPath(this.analyticsConfigFile),
      config ? `${JSON.stringify(config, null, 2)}\n` : `{}\n`,
    );
  }

  async copyAnalyticsConfig(
    loadConfig: () => Promise<AnalyticsConfig | null>,
  ): Promise<void> {
    console.log(chalk.blue(`🔍 Checking for analytics configuration...`));

    const sourcePath = path.join(this.rootDir, this.analyticsConfigFile);
    if (await this.hasRootSourceFile(this.analyticsConfigFile)) {
      await this.writeAnalyticsConfig(await loadConfig());
      console.log(
        chalk.green(`  ✓ Copied ${this.analyticsConfigFile} to Next.js app`),
      );
    } else {
      console.log(
        chalk.gray(`  ✗ ${this.analyticsConfigFile} not found, skipping`),
      );
    }
  }

  async resetAnalyticsConfig(): Promise<void> {
    await this.writeAnalyticsConfig(null);
  }

  async loadSectionsConfig(): Promise<SectionConfig[] | null> {
    try {
      const content = await this.readOptionalRootSourceFile(
        "sections.json",
        "sections source",
      );
      if (content !== null) {
        const parsed = JSON.parse(content) as unknown;
        return validateSectionsConfig(parsed);
      }
    } catch (error) {
      console.warn(chalk.yellow("⚠️ Error reading sections.json"), error);
    }

    return null;
  }
}
