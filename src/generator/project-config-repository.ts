import chalk from "chalk";
import fs from "fs-extra";
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

export class ProjectConfigRepository {
  constructor(
    private readonly rootDir: string,
    private readonly outputDir: string,
    private readonly sourceFs: SecureSourceFs,
    private readonly configFiles: readonly string[],
    private readonly fontConfigFile: string,
    private readonly analyticsConfigFile: string,
  ) {}

  private outputPath(...segments: string[]): string {
    return resolveOutputPath(this.outputDir, ...segments);
  }

  private async copyRootSourceFile(
    sourcePath: string,
    destPath: string,
    label: string,
  ): Promise<void> {
    const { data } = await this.sourceFs.readProjectSourceFile(
      sourcePath,
      label,
    );
    await writeFileAtomic(destPath, data);
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

      if (await fs.pathExists(sourcePath)) {
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
    if (await fs.pathExists(sourcePath)) {
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
    const fontPath = path.join(this.rootDir, this.fontConfigFile);

    try {
      if (await fs.pathExists(fontPath)) {
        const { data } = await this.sourceFs.readProjectSourceFile(
          fontPath,
          "font source",
        );
        return validateFontConfig(JSON.parse(data.toString("utf8")));
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
    const analyticsPath = path.join(this.rootDir, this.analyticsConfigFile);

    try {
      if (await fs.pathExists(analyticsPath)) {
        const { data } = await this.sourceFs.readProjectSourceFile(
          analyticsPath,
          "analytics source",
        );
        return validateAnalyticsConfig(JSON.parse(data.toString("utf8")));
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
    if (await fs.pathExists(sourcePath)) {
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
    const sectionsPath = path.join(this.rootDir, "sections.json");

    try {
      if (await fs.pathExists(sectionsPath)) {
        const content = await fs.readFile(sectionsPath, "utf8");
        const parsed = JSON.parse(content) as unknown;
        return validateSectionsConfig(parsed);
      }
    } catch (error) {
      console.warn(chalk.yellow("⚠️ Error reading sections.json"), error);
    }

    return null;
  }
}
