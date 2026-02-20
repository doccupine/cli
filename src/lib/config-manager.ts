import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import prompts from "prompts";

import type { DoccupineConfig } from "./types.js";

export class ConfigManager {
  private configPath: string;

  constructor(configPath = "doccupine.json") {
    this.configPath = path.resolve(process.cwd(), configPath);
  }

  async loadConfig(): Promise<DoccupineConfig | null> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const configContent = await fs.readFile(this.configPath, "utf8");
        const config = JSON.parse(configContent) as DoccupineConfig;
        console.log(
          chalk.blue("📄 Using existing configuration from doccupine.json"),
        );
        return config;
      }
    } catch (error) {
      console.warn(
        chalk.yellow("⚠️ Error reading config file, will create new one"),
      );
    }
    return null;
  }

  async saveConfig(config: DoccupineConfig): Promise<void> {
    try {
      await fs.writeFile(
        this.configPath,
        JSON.stringify(config, null, 2),
        "utf8",
      );
      console.log(chalk.green("💾 Configuration saved to doccupine.json"));
    } catch (error) {
      console.error(chalk.red("❌ Error saving config file:"), error);
    }
  }

  async promptForConfig(
    existingConfig?: Partial<DoccupineConfig>,
  ): Promise<DoccupineConfig> {
    type PromptResult = { watchDir: string; outputDir: string };

    const questions: prompts.PromptObject[] = [
      {
        type: "text",
        name: "watchDir",
        message: "Enter directory to watch for MDX files:",
        initial: existingConfig?.watchDir || "docs",
      },
      {
        type: "text",
        name: "outputDir",
        message: "Enter output directory for Next.js app:",
        initial: existingConfig?.outputDir || "nextjs-app",
      },
    ];

    const { watchDir, outputDir } = (await prompts(questions)) as PromptResult;

    if (!watchDir || !outputDir) {
      console.log(chalk.yellow("\n⚠️ Setup cancelled."));
      process.exit(0);
    }

    return {
      watchDir: path.resolve(process.cwd(), watchDir),
      outputDir: path.resolve(process.cwd(), outputDir),
      port: existingConfig?.port || "3000",
    };
  }

  async getConfig(
    options: { reset?: boolean; port?: string } = {},
  ): Promise<DoccupineConfig> {
    let config: DoccupineConfig | null = null;

    if (!options.reset) {
      config = await this.loadConfig();
    }

    if (!config || options.reset) {
      console.log(chalk.blue("🔧 Setting up Doccupine configuration..."));
      config = await this.promptForConfig(config || {});
      await this.saveConfig(config);
    }

    if (options.port) {
      config.port = options.port;
      await this.saveConfig(config);
    }

    return config;
  }
}
