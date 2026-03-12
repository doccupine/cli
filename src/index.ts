#!/usr/bin/env node

import { program } from "commander";
import chokidar, { FSWatcher } from "chokidar";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

import matter from "gray-matter";
import chalk from "chalk";

import { appStructure, startingDocsStructure } from "./lib/structures.js";
import { layoutTemplate } from "./lib/layout.js";
import { ConfigManager } from "./lib/config-manager.js";
import {
  findAvailablePort,
  generateSlug,
  getFullSlug,
  escapeTemplateContent,
} from "./lib/utils.js";
import {
  generateMetadataBlock,
  generateRuntimeOnlyMetadataBlock,
} from "./lib/metadata.js";
import { nextConfigTemplate } from "./templates/next.config.js";
import { proxyTemplate } from "./templates/proxy.js";
import type {
  MDXFile,
  PageMeta,
  SectionConfig,
  FontConfig,
  AnalyticsConfig,
} from "./lib/types.js";

export {
  generateSlug,
  getFullSlug,
  escapeTemplateContent,
} from "./lib/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"),
);
const version = packageJson.version;

class MDXToNextJSGenerator {
  private watchDir: string;
  private outputDir: string;
  private rootDir: string;
  private watcher: FSWatcher | null = null;
  private configWatcher: FSWatcher | null = null;
  private fontWatcher: FSWatcher | null = null;
  private publicWatcher: FSWatcher | null = null;
  private rootDirWatcher: FSWatcher | null = null;
  private analyticsWatcher: FSWatcher | null = null;
  private configFiles = [
    "theme.json",
    "navigation.json",
    "config.json",
    "links.json",
    "sections.json",
  ];
  private fontConfigFile = "fonts.json";
  private analyticsConfigFile = "analytics.json";
  private analyticsConfig: AnalyticsConfig | null = null;
  private sectionsConfig: SectionConfig[] | null = null;
  /** Guards against recursive reprocessing when maybeUpdateSections() triggers processAllMDXFiles() */
  private isReprocessing = false;

  constructor(watchDir: string, outputDir: string) {
    this.watchDir = path.resolve(watchDir);
    this.outputDir = path.resolve(outputDir);
    this.rootDir = process.cwd();
  }

  async init() {
    console.log(chalk.blue("🚀 Initializing MDX to Next.js generator..."));

    await fs.ensureDir(this.watchDir);
    await fs.ensureDir(this.outputDir);

    this.sectionsConfig = await this.resolveSections();
    this.analyticsConfig = await this.loadAnalyticsConfig();

    if (this.sectionsConfig) {
      console.log(
        chalk.blue(
          `📑 Found ${this.sectionsConfig.length} section(s): ${this.sectionsConfig.map((s) => s.label).join(", ")}`,
        ),
      );
    }

    if (this.analyticsConfig) {
      console.log(
        chalk.blue(`📊 Analytics enabled: ${this.analyticsConfig.provider}`),
      );
    }

    await this.createNextJSStructure();
    await this.createStartingDocs();
    await this.copyCustomConfigFiles();
    await this.copyFontConfig();
    await this.copyAnalyticsConfig();
    await this.copyPublicFiles();
    await this.processAllMDXFiles();
    await this.generateSectionIndexPages();

    console.log(chalk.green("✅ Initial setup complete!"));
    console.log(chalk.cyan("💡 To start the Next.js dev server:"));
    console.log(
      chalk.white(`   cd ${path.relative(process.cwd(), this.outputDir)}`),
    );
    console.log(chalk.white("   npm install && npm run dev"));
  }

  async createNextJSStructure() {
    const structure: Record<string, string | Promise<string>> = {
      ...appStructure,
      "next.config.ts": nextConfigTemplate(this.analyticsConfig),
      "proxy.ts": proxyTemplate(this.analyticsConfig),
      "analytics.json": `{}\n`,
      "config.json": `{}\n`,
      "links.json": `[]\n`,
      "navigation.json": `[]\n`,
      "sections.json": `[]\n`,
      "theme.json": `{}\n`,
      "app/layout.tsx": this.generateRootLayout(),
    };

    for (const [filePath, content] of Object.entries(structure)) {
      const fullPath = path.join(this.outputDir, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, String(await content), "utf8");
    }
  }

  async createStartingDocs() {
    const structure = startingDocsStructure;

    const indexMdxExists = await fs.pathExists(
      path.join(this.watchDir, "index.mdx"),
    );

    if (!indexMdxExists) {
      for (const [filePath, content] of Object.entries(structure)) {
        const fullPath = path.join(this.watchDir, filePath);
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, String(content), "utf8");
      }
    }
  }

  async copyCustomConfigFiles() {
    console.log(
      chalk.blue(`🔍 Checking for config files in: ${this.watchDir}`),
    );

    for (const configFile of this.configFiles) {
      const sourcePath = path.join(this.rootDir, configFile);
      const destPath = path.join(this.outputDir, configFile);

      console.log(chalk.gray(`  Checking ${configFile}...`));

      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, destPath);
        console.log(chalk.green(`  ✓ Copied ${configFile} to Next.js app`));
      } else {
        console.log(chalk.gray(`  ✗ ${configFile} not found, skipping`));
      }
    }
  }

  async copyFontConfig() {
    console.log(chalk.blue(`🔍 Checking for font configuration...`));

    const sourcePath = path.join(this.rootDir, this.fontConfigFile);
    const destPath = path.join(this.outputDir, this.fontConfigFile);

    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, destPath);
      console.log(
        chalk.green(`  ✓ Copied ${this.fontConfigFile} to Next.js app`),
      );
    } else {
      console.log(chalk.gray(`  ✗ ${this.fontConfigFile} not found, skipping`));
    }
  }

  async loadFontConfig(): Promise<FontConfig | null> {
    const fontPath = path.join(this.rootDir, this.fontConfigFile);

    try {
      if (await fs.pathExists(fontPath)) {
        const fontContent = await fs.readFile(fontPath, "utf8");
        return JSON.parse(fontContent) as FontConfig;
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
        const content = await fs.readFile(analyticsPath, "utf8");
        const parsed = JSON.parse(content);
        if (parsed?.provider === "posthog" && parsed.posthog?.key) {
          return parsed as AnalyticsConfig;
        }
      }
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠️ Error reading ${this.analyticsConfigFile}`),
        error,
      );
    }

    return null;
  }

  async copyAnalyticsConfig() {
    console.log(chalk.blue(`🔍 Checking for analytics configuration...`));

    const sourcePath = path.join(this.rootDir, this.analyticsConfigFile);
    const destPath = path.join(this.outputDir, this.analyticsConfigFile);

    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, destPath);
      console.log(
        chalk.green(`  ✓ Copied ${this.analyticsConfigFile} to Next.js app`),
      );
    } else {
      console.log(
        chalk.gray(`  ✗ ${this.analyticsConfigFile} not found, skipping`),
      );
    }
  }

  async loadSectionsConfig(): Promise<SectionConfig[] | null> {
    const sectionsPath = path.join(this.rootDir, "sections.json");

    try {
      if (await fs.pathExists(sectionsPath)) {
        const content = await fs.readFile(sectionsPath, "utf8");
        const parsed = JSON.parse(content) as SectionConfig[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn(chalk.yellow("⚠️ Error reading sections.json"), error);
    }

    return null;
  }

  async discoverSectionsFromFrontmatter(): Promise<SectionConfig[] | null> {
    const files = await this.getAllMDXFiles();
    const sectionMap = new Map<string, { label: string; order: number }>();
    let hasUnsectionedPages = false;
    let defaultSectionLabel = "Docs";

    for (const file of files) {
      const fullPath = path.join(this.watchDir, file);
      const content = await fs.readFile(fullPath, "utf8");
      const { data: frontmatter } = matter(content);

      if (frontmatter.section) {
        const label = frontmatter.section as string;
        const order = (frontmatter.sectionOrder as number) || 0;
        const existing = sectionMap.get(label);
        if (!existing || order < existing.order) {
          sectionMap.set(label, { label, order });
        }
      } else {
        hasUnsectionedPages = true;
      }

      if (
        (file === "index.mdx" || file === "./index.mdx") &&
        frontmatter.sectionLabel
      ) {
        defaultSectionLabel = frontmatter.sectionLabel as string;
      }
    }

    if (sectionMap.size === 0) return null;

    const sorted = [...sectionMap.values()].sort((a, b) => a.order - b.order);

    const sections: SectionConfig[] = [];

    // Implicit root entry for pages without a section field
    if (hasUnsectionedPages) {
      sections.push({ label: defaultSectionLabel, slug: "" });
    }

    for (const s of sorted) {
      sections.push({
        label: s.label,
        slug: s.label.toLowerCase().replace(/\s+/g, "-"),
      });
    }

    return sections;
  }

  async resolveSections(): Promise<SectionConfig[] | null> {
    const fromFile = await this.loadSectionsConfig();
    if (fromFile) return fromFile;
    return this.discoverSectionsFromFrontmatter();
  }

  private async reloadSections(): Promise<void> {
    console.log(chalk.cyan("📑 Sections configuration changed"));
    this.sectionsConfig = await this.resolveSections();
    await this.processAllMDXFiles();
    await this.generateSectionIndexPages();
  }

  private async maybeUpdateSections(): Promise<void> {
    if (this.isReprocessing) return;

    // Skip if sections.json exists (explicit config takes priority)
    const fromFile = await this.loadSectionsConfig();
    if (fromFile) return;

    const newSections = await this.discoverSectionsFromFrontmatter();
    const changed =
      JSON.stringify(newSections) !== JSON.stringify(this.sectionsConfig);

    if (changed) {
      console.log(
        chalk.cyan(
          newSections
            ? `📑 Sections updated from frontmatter: ${newSections.map((s) => s.label).join(", ")}`
            : "📑 Sections cleared (no section frontmatter found)",
        ),
      );
      this.sectionsConfig = newSections;
      this.isReprocessing = true;
      try {
        await this.processAllMDXFiles();
        await this.generateSectionIndexPages();
      } finally {
        this.isReprocessing = false;
      }
    }
  }

  private determineSectionForFile(
    filePath: string,
    frontmatter: Record<string, any>,
  ): { sectionSlug: string; pageSlug: string } {
    if (!this.sectionsConfig || this.sectionsConfig.length === 0) {
      return { sectionSlug: "", pageSlug: generateSlug(filePath) };
    }

    const normalizedPath = filePath.replace(/\\/g, "/");

    const firstDir = normalizedPath.includes("/")
      ? normalizedPath.split("/")[0]
      : "";

    // Explicit directory matching (entries with a directory field)
    for (const section of this.sectionsConfig) {
      if (!section.directory) continue;
      const dirPrefix = section.directory + "/";
      if (normalizedPath.startsWith(dirPrefix)) {
        return {
          sectionSlug: section.slug,
          pageSlug: generateSlug(normalizedPath.slice(dirPrefix.length)),
        };
      }
    }

    // Directory matches section slug (auto-detect)
    if (firstDir) {
      const match = this.sectionsConfig.find((s) => s.slug === firstDir);
      if (match) {
        const pathForSlug = normalizedPath.slice(firstDir.length + 1);
        return {
          sectionSlug: match.slug,
          pageSlug: generateSlug(pathForSlug),
        };
      }
    }

    // Frontmatter section field
    if (frontmatter.section) {
      const label = frontmatter.section as string;
      const match = this.sectionsConfig.find((s) => s.label === label);
      if (match) {
        // Strip the directory if it matches the section slug
        let pathForSlug = filePath;
        if (firstDir && firstDir === match.slug) {
          pathForSlug = normalizedPath.slice(firstDir.length + 1);
        }

        return {
          sectionSlug: match.slug,
          pageSlug: generateSlug(pathForSlug),
        };
      }
    }

    // No section match - page stays at root
    return {
      sectionSlug: "",
      pageSlug: generateSlug(filePath),
    };
  }

  async handleConfigFileChange(filePath: string) {
    const fileName = path.basename(filePath);

    if (this.configFiles.includes(fileName)) {
      const sourcePath = path.join(this.rootDir, fileName);
      const destPath = path.join(this.outputDir, fileName);

      try {
        await fs.copy(sourcePath, destPath);
        console.log(chalk.green(`📋 Updated ${fileName} in Next.js app`));

        if (fileName === "sections.json") {
          await this.reloadSections();
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error copying ${fileName}:`), error);
      }
    }
  }

  async handleConfigFileDelete(filePath: string) {
    const fileName = path.basename(filePath);

    if (this.configFiles.includes(fileName)) {
      const destPath = path.join(this.outputDir, fileName);

      try {
        if (await fs.pathExists(destPath)) {
          await fs.remove(destPath);
          console.log(chalk.yellow(`🗑️ Removed ${fileName} from Next.js app`));
        }

        if (fileName === "sections.json") {
          await this.reloadSections();
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error removing ${fileName}:`), error);
      }
    }
  }

  async handleFontConfigChange() {
    console.log(chalk.cyan(`🔤 Font configuration changed`));

    const sourcePath = path.join(this.rootDir, this.fontConfigFile);
    const destPath = path.join(this.outputDir, this.fontConfigFile);

    try {
      await fs.copy(sourcePath, destPath);
      console.log(
        chalk.green(`📋 Updated ${this.fontConfigFile} in Next.js app`),
      );

      await this.updateRootLayout();
      console.log(chalk.green(`✅ Layout updated with new font configuration`));
    } catch (error) {
      console.error(chalk.red(`❌ Error updating font configuration:`), error);
    }
  }

  async handleFontConfigDelete() {
    console.log(chalk.red(`🗑️ Font configuration deleted`));

    const destPath = path.join(this.outputDir, this.fontConfigFile);

    try {
      if (await fs.pathExists(destPath)) {
        await fs.remove(destPath);
        console.log(
          chalk.yellow(`🗑️ Removed ${this.fontConfigFile} from Next.js app`),
        );

        await this.updateRootLayout();
        console.log(
          chalk.green(`✅ Layout updated without font configuration`),
        );
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error removing font configuration:`), error);
    }
  }

  async handleAnalyticsConfigChange() {
    console.log(chalk.cyan(`📊 Analytics configuration changed`));

    const sourcePath = path.join(this.rootDir, this.analyticsConfigFile);
    const destPath = path.join(this.outputDir, this.analyticsConfigFile);

    try {
      await fs.copy(sourcePath, destPath);
      console.log(
        chalk.green(`📋 Updated ${this.analyticsConfigFile} in Next.js app`),
      );

      this.analyticsConfig = await this.loadAnalyticsConfig();

      // Regenerate dynamic templates that depend on analytics config
      await fs.writeFile(
        path.join(this.outputDir, "next.config.ts"),
        nextConfigTemplate(this.analyticsConfig),
        "utf8",
      );
      await fs.writeFile(
        path.join(this.outputDir, "proxy.ts"),
        proxyTemplate(this.analyticsConfig),
        "utf8",
      );
      await this.updateRootLayout();

      console.log(chalk.green(`✅ Analytics configuration updated`));

      if (this.analyticsConfig) {
        console.log(
          chalk.yellow(
            `⚠️ Next.js dev server restart may be required for analytics proxy changes`,
          ),
        );
      }
    } catch (error) {
      console.error(
        chalk.red(`❌ Error updating analytics configuration:`),
        error,
      );
    }
  }

  async handleAnalyticsConfigDelete() {
    console.log(chalk.red(`🗑️ Analytics configuration deleted`));

    const destPath = path.join(this.outputDir, this.analyticsConfigFile);

    try {
      // Write empty analytics.json so runtime imports don't break
      await fs.writeFile(destPath, `{}\n`, "utf8");

      this.analyticsConfig = null;

      // Regenerate dynamic templates without analytics
      await fs.writeFile(
        path.join(this.outputDir, "next.config.ts"),
        nextConfigTemplate(null),
        "utf8",
      );
      await fs.writeFile(
        path.join(this.outputDir, "proxy.ts"),
        proxyTemplate(null),
        "utf8",
      );
      await this.updateRootLayout();

      console.log(chalk.green(`✅ Analytics removed from Next.js app`));
    } catch (error) {
      console.error(
        chalk.red(`❌ Error removing analytics configuration:`),
        error,
      );
    }
  }

  async copyPublicFiles() {
    const publicDir = path.join(this.rootDir, "public");
    const destDir = path.join(this.outputDir, "public");

    console.log(chalk.blue(`🔍 Checking for public directory...`));

    if (await fs.pathExists(publicDir)) {
      await fs.copy(publicDir, destDir);
      console.log(chalk.green(`  ✓ Copied public directory to Next.js app`));
    } else {
      console.log(chalk.gray(`  ✗ public directory not found, skipping`));
    }
  }

  async handlePublicFileChange(filePath: string) {
    const publicDir = path.join(this.rootDir, "public");
    const relativePath = path.relative(publicDir, filePath);
    const destPath = path.join(this.outputDir, "public", relativePath);

    try {
      await fs.ensureDir(path.dirname(destPath));
      await fs.copy(filePath, destPath);
      console.log(
        chalk.green(`📋 Updated public/${relativePath} in Next.js app`),
      );
    } catch (error) {
      console.error(
        chalk.red(`❌ Error copying public/${relativePath}:`),
        error,
      );
    }
  }

  async handlePublicFileDelete(filePath: string) {
    const publicDir = path.join(this.rootDir, "public");
    const relativePath = path.relative(publicDir, filePath);
    const destPath = path.join(this.outputDir, "public", relativePath);

    try {
      if (await fs.pathExists(destPath)) {
        await fs.remove(destPath);
        console.log(
          chalk.yellow(`🗑️ Removed public/${relativePath} from Next.js app`),
        );
      }
    } catch (error) {
      console.error(
        chalk.red(`❌ Error removing public/${relativePath}:`),
        error,
      );
    }
  }

  async startWatching() {
    console.log(chalk.yellow(`👀 Watching for changes in: ${this.watchDir}`));

    this.watcher = chokidar.watch(this.watchDir, {
      persistent: true,
      ignoreInitial: true,
      ignored: (filePath: string, stats?: fs.Stats) => {
        const isFile = stats?.isFile() ?? path.extname(filePath) !== "";
        const fileName = path.basename(filePath);

        if (this.configFiles.includes(fileName)) {
          return true;
        }

        if (isFile && !filePath.endsWith(".mdx")) {
          return true;
        }
        return false;
      },
    });

    this.watcher
      .on("add", (filePath: string) => {
        const relativePath = path.relative(this.watchDir, filePath);
        this.handleFileChange("added", relativePath);
      })
      .on("change", (filePath: string) => {
        const relativePath = path.relative(this.watchDir, filePath);
        this.handleFileChange("changed", relativePath);
      })
      .on("unlink", (filePath: string) => {
        const relativePath = path.relative(this.watchDir, filePath);
        this.handleFileDelete(relativePath);
      })
      .on("ready", () => {
        console.log(
          chalk.green("📁 Initial scan complete. Ready for changes..."),
        );
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Watcher error:"), error);
      });

    const configPaths = this.configFiles.map((f) => path.join(this.rootDir, f));

    this.configWatcher = chokidar.watch(configPaths, {
      persistent: true,
      ignoreInitial: true,
    });

    this.configWatcher
      .on("add", (filePath: string) => {
        console.log(
          chalk.cyan(`📝 Config file added: ${path.basename(filePath)}`),
        );
        this.handleConfigFileChange(filePath);
      })
      .on("change", (filePath: string) => {
        console.log(
          chalk.cyan(`📝 Config file changed: ${path.basename(filePath)}`),
        );
        this.handleConfigFileChange(filePath);
      })
      .on("unlink", (filePath: string) => {
        console.log(
          chalk.red(`🗑️ Config file deleted: ${path.basename(filePath)}`),
        );
        this.handleConfigFileDelete(filePath);
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Config watcher error:"), error);
      });

    const fontPath = path.join(this.rootDir, this.fontConfigFile);

    this.fontWatcher = chokidar.watch(fontPath, {
      persistent: true,
      ignoreInitial: true,
    });

    this.fontWatcher
      .on("add", () => {
        console.log(chalk.cyan(`🔤 Font configuration added`));
        this.handleFontConfigChange();
      })
      .on("change", () => {
        this.handleFontConfigChange();
      })
      .on("unlink", () => {
        this.handleFontConfigDelete();
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Font watcher error:"), error);
      });

    const analyticsPath = path.join(this.rootDir, this.analyticsConfigFile);

    this.analyticsWatcher = chokidar.watch(analyticsPath, {
      persistent: true,
      ignoreInitial: true,
    });

    this.analyticsWatcher
      .on("add", () => {
        console.log(chalk.cyan(`📊 Analytics configuration added`));
        this.handleAnalyticsConfigChange();
      })
      .on("change", () => {
        this.handleAnalyticsConfigChange();
      })
      .on("unlink", () => {
        this.handleAnalyticsConfigDelete();
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Analytics watcher error:"), error);
      });

    const publicDir = path.join(this.rootDir, "public");

    if (await fs.pathExists(publicDir)) {
      this.setupPublicWatcher();
    }

    // Watch rootDir for public directory creation
    this.rootDirWatcher = chokidar.watch(this.rootDir, {
      persistent: true,
      ignoreInitial: true,
      depth: 0,
    });

    this.rootDirWatcher
      .on("addDir", async (dirPath: string) => {
        if (
          path.basename(dirPath) === "public" &&
          path.dirname(dirPath) === this.rootDir &&
          !this.publicWatcher
        ) {
          console.log(chalk.cyan("📁 Public directory created"));
          await this.copyPublicFiles();
          this.setupPublicWatcher();
        }
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Root dir watcher error:"), error);
      });
  }

  private setupPublicWatcher() {
    if (this.publicWatcher) {
      return;
    }

    const publicDir = path.join(this.rootDir, "public");

    this.publicWatcher = chokidar.watch(publicDir, {
      persistent: true,
      ignoreInitial: true,
    });

    this.publicWatcher
      .on("add", (filePath: string) => {
        console.log(
          chalk.cyan(
            `📁 Public file added: ${path.relative(publicDir, filePath)}`,
          ),
        );
        this.handlePublicFileChange(filePath);
      })
      .on("change", (filePath: string) => {
        console.log(
          chalk.cyan(
            `📁 Public file changed: ${path.relative(publicDir, filePath)}`,
          ),
        );
        this.handlePublicFileChange(filePath);
      })
      .on("unlink", (filePath: string) => {
        console.log(
          chalk.red(
            `🗑️ Public file deleted: ${path.relative(publicDir, filePath)}`,
          ),
        );
        this.handlePublicFileDelete(filePath);
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Public watcher error:"), error);
      });
  }

  private async parseMDXFile(file: string): Promise<PageMeta> {
    const fullPath = path.join(this.watchDir, file);
    const content = await fs.readFile(fullPath, "utf8");
    const { data: frontmatter } = matter(content);

    const { sectionSlug, pageSlug } = this.determineSectionForFile(
      file,
      frontmatter,
    );
    const fullSlug = getFullSlug(pageSlug, sectionSlug);

    return {
      slug: fullSlug,
      title: frontmatter.title || "Untitled",
      description: frontmatter.description || "",
      date: frontmatter.date || null,
      category: frontmatter.category || "",
      path: file,
      categoryOrder: frontmatter.categoryOrder || 0,
      order: frontmatter.order || 0,
      section: sectionSlug,
    };
  }

  private async buildAllPagesMeta(): Promise<PageMeta[]> {
    const files = await this.getAllMDXFiles();
    return Promise.all(files.map((file) => this.parseMDXFile(file)));
  }

  async handleFileChange(action: string, filePath: string) {
    console.log(chalk.cyan(`📝 File ${action}: ${filePath}`));

    const fullPath = path.join(this.watchDir, filePath);

    try {
      const content = await fs.readFile(fullPath, "utf8");
      const { data: frontmatter, content: mdxContent } = matter(content);

      const { sectionSlug, pageSlug } = this.determineSectionForFile(
        filePath,
        frontmatter,
      );
      const fullSlug = getFullSlug(pageSlug, sectionSlug);

      const isIndex = filePath === "index.mdx" || filePath === "./index.mdx";
      const isSectionIndex =
        this.sectionsConfig && pageSlug === "" && sectionSlug !== "";

      if (isIndex) {
        console.log(chalk.blue("🏠 Updating homepage with index.mdx content"));
      } else {
        const mdxFile: MDXFile = {
          path: filePath,
          content: mdxContent,
          frontmatter,
          slug: fullSlug,
        };

        await this.generatePageFromMDX(mdxFile);
      }

      if (isSectionIndex) {
        await this.updateSectionIndex(sectionSlug, frontmatter, mdxContent);
      }

      await this.updatePagesIndex();
      await this.updateRootLayout();
      await this.generateSectionIndexPages();

      console.log(chalk.green(`✅ Generated page for: ${filePath}`));

      await this.maybeUpdateSections();
    } catch (error) {
      console.error(chalk.red(`❌ Error processing ${filePath}:`), error);
    }
  }

  async handleFileDelete(filePath: string) {
    console.log(chalk.red(`🗑️ File deleted: ${filePath}`));

    try {
      if (filePath === "index.mdx" || filePath === "./index.mdx") {
        console.log(chalk.blue("🏠 Updating homepage - index.mdx deleted"));
      } else {
        // We don't have frontmatter for deleted files, so use directory-based matching
        const { sectionSlug, pageSlug } = this.determineSectionForFile(
          filePath,
          {},
        );
        const fullSlug = getFullSlug(pageSlug, sectionSlug);
        const pagePath = path.join(this.outputDir, "app", fullSlug);
        await fs.remove(pagePath);
      }

      await this.updatePagesIndex();
      await this.updateRootLayout();

      console.log(chalk.green(`✅ Removed page for: ${filePath}`));

      await this.maybeUpdateSections();
    } catch (error) {
      console.error(
        chalk.red(`❌ Error removing page for ${filePath}:`),
        error,
      );
    }
  }

  async processAllMDXFiles() {
    const files = await this.getAllMDXFiles();

    for (const file of files) {
      await this.handleFileChange("processed", file);
    }
  }

  async getAllMDXFiles(): Promise<string[]> {
    const files: string[] = [];

    async function scanDir(dir: string, relativePath = "") {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath, relPath);
        } else if (entry.name.endsWith(".mdx")) {
          files.push(relPath);
        }
      }
    }

    await scanDir(this.watchDir);
    return files;
  }

  async generateRootLayout(): Promise<string> {
    const pages = await this.buildAllPagesMeta();
    const fontConfig = await this.loadFontConfig();
    const analyticsEnabled = this.analyticsConfig !== null;
    return layoutTemplate(
      pages,
      fontConfig,
      this.sectionsConfig,
      analyticsEnabled,
    );
  }

  async generateSectionIndexPages() {
    if (!this.sectionsConfig || this.sectionsConfig.length === 0) return;

    const pages = await this.buildAllPagesMeta();

    for (const section of this.sectionsConfig) {
      if (section.slug === "") continue;

      // Check if a page already exists at the section root
      const hasIndex = pages.some((p) => p.slug === section.slug);
      if (hasIndex) continue;

      // Find the first page in this section
      const sectionPages = pages
        .filter((p) => p.section === section.slug)
        .sort((a, b) => {
          if (a.categoryOrder !== b.categoryOrder)
            return a.categoryOrder - b.categoryOrder;
          return a.order - b.order;
        });

      if (sectionPages.length === 0) continue;

      const firstPage = sectionPages[0];
      const redirectContent = `import { redirect } from "next/navigation";

export default function SectionIndex() {
  redirect("/${firstPage.slug}");
}
`;

      const pagePath = path.join(
        this.outputDir,
        "app",
        section.slug,
        "page.tsx",
      );
      await fs.ensureDir(path.dirname(pagePath));
      await fs.writeFile(pagePath, redirectContent, "utf8");
      console.log(
        chalk.blue(
          `🔀 Generated section index redirect: /${section.slug} -> /${firstPage.slug}`,
        ),
      );
    }
  }

  async generatePageFromMDX(mdxFile: MDXFile) {
    const fm = mdxFile.frontmatter;

    const metadataBlock = generateMetadataBlock({
      title: fm.title,
      titleFallback: "Generated with Doccupine",
      name: fm.name,
      titleOrder: "page-first",
      description: fm.description,
      icon: fm.icon,
      image: fm.image,
    });

    const pageContent = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";
import { config } from "@/utils/config";

const content = \`${escapeTemplateContent(mdxFile.content)}\`;

${metadataBlock}

export default function Page() {
  return <Docs content={content} />;
}
`;

    const pagePath = path.join(this.outputDir, "app", mdxFile.slug, "page.tsx");
    await fs.ensureDir(path.dirname(pagePath));
    await fs.writeFile(pagePath, pageContent, "utf8");
  }

  async updatePagesIndex() {
    const files = await this.getAllMDXFiles();
    let indexMDX: {
      content: string;
      title: string;
      description: string;
      icon?: string;
      image?: string;
      name?: string;
    } | null = null;

    for (const file of files) {
      if (file === "index.mdx" || file === "./index.mdx") {
        const fullPath = path.join(this.watchDir, file);
        const content = await fs.readFile(fullPath, "utf8");
        const { data: frontmatter, content: mdxContent } = matter(content);

        indexMDX = {
          content: mdxContent,
          title: frontmatter.title || "Welcome",
          description: frontmatter.description || "",
          icon: frontmatter.icon,
          image: frontmatter.image,
          name: frontmatter.name,
        };
        break;
      }
    }

    const metadataBlock = indexMDX
      ? generateMetadataBlock({
          title: indexMDX.title,
          titleFallback: "Welcome",
          name: indexMDX.name,
          titleOrder: "name-first",
          description: indexMDX.description || undefined,
          icon: indexMDX.icon,
          image: indexMDX.image,
        })
      : generateRuntimeOnlyMetadataBlock();

    const indexContent = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";
import { config } from "@/utils/config";

${indexMDX ? `const content = \`${escapeTemplateContent(indexMDX.content)}\`;` : `const content = null;`}

${metadataBlock}

export default function Home() {
  return <Docs content={content} />;
}
`;

    await fs.writeFile(
      path.join(this.outputDir, "app", "page.tsx"),
      indexContent,
      "utf8",
    );
  }

  async updateSectionIndex(
    sectionSlug: string,
    frontmatter: Record<string, any>,
    mdxContent: string,
  ) {
    const metadataBlock = generateMetadataBlock({
      title: frontmatter.title,
      titleFallback: "Section",
      name: frontmatter.name,
      titleOrder: "name-first",
      description: frontmatter.description || undefined,
      icon: frontmatter.icon,
      image: frontmatter.image,
    });

    const indexContent = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";
import { config } from "@/utils/config";

const content = \`${escapeTemplateContent(mdxContent)}\`;

${metadataBlock}

export default function Page() {
  return <Docs content={content} />;
}
`;

    const pagePath = path.join(this.outputDir, "app", sectionSlug, "page.tsx");
    await fs.ensureDir(path.dirname(pagePath));
    await fs.writeFile(pagePath, indexContent, "utf8");
  }

  async updateRootLayout() {
    const layoutContent = await this.generateRootLayout();
    await fs.writeFile(
      path.join(this.outputDir, "app", "layout.tsx"),
      layoutContent,
      "utf8",
    );
  }

  async stop() {
    if (this.watcher) {
      await this.watcher.close();
      console.log(chalk.yellow("👋 Stopped watching for MDX changes"));
    }
    if (this.configWatcher) {
      await this.configWatcher.close();
      console.log(chalk.yellow("👋 Stopped watching for config changes"));
    }
    if (this.fontWatcher) {
      await this.fontWatcher.close();
      console.log(chalk.yellow("👋 Stopped watching for font config changes"));
    }
    if (this.analyticsWatcher) {
      await this.analyticsWatcher.close();
      console.log(
        chalk.yellow("👋 Stopped watching for analytics config changes"),
      );
    }
    if (this.publicWatcher) {
      await this.publicWatcher.close();
      console.log(
        chalk.yellow("👋 Stopped watching for public directory changes"),
      );
    }
    if (this.rootDirWatcher) {
      await this.rootDirWatcher.close();
    }
  }
}

program
  .name("doccupine")
  .description(
    "Watch MDX files and generate Next.js documentation pages automatically",
  )
  .version(version);

program
  .command("watch", { isDefault: true })
  .description("Watch a directory for MDX changes and generate Next.js app")
  .option("--port <port>", "Port for Next.js dev server", "3000")
  .option("--verbose", "Show verbose output")
  .option("--reset", "Reset configuration and prompt for new directories")
  .action(async (options) => {
    const configManager = new ConfigManager();
    const config = await configManager.getConfig({
      reset: options.reset,
      port: options.port,
    });

    const generator = new MDXToNextJSGenerator(
      config.watchDir,
      config.outputDir,
    );

    await generator.init();

    let devServer: ReturnType<typeof spawn> | null = null;

    console.log(chalk.blue("📦 Installing dependencies..."));
    const { spawn, execSync } = await import("child_process");

    // Check if pnpm is available, fallback to npm
    let packageManager = "npm";
    try {
      execSync("pnpm --version", { stdio: "ignore" });
      packageManager = "pnpm";
    } catch {
      // pnpm not available, use npm
    }

    console.log(chalk.blue(`📦 Using ${packageManager}...`));

    const install = spawn(packageManager, ["install"], {
      cwd: config.outputDir,
      stdio: "pipe",
    });

    await new Promise((resolve, reject) => {
      install.on("close", (code) => {
        if (code === 0) {
          console.log(chalk.green("✅ Dependencies installed"));
          resolve(void 0);
        } else {
          reject(
            new Error(`${packageManager} install failed with code ${code}`),
          );
        }
      });
      install.on("error", reject);
    });

    const port = await findAvailablePort(parseInt(config.port, 10));
    if (port !== parseInt(config.port, 10)) {
      console.log(
        chalk.yellow(
          `⚠️ Port ${config.port} is in use, using port ${port} instead`,
        ),
      );
    }
    console.log(
      chalk.blue(`🚀 Starting Next.js dev server on port ${port}...`),
    );
    const portStr = String(port);
    const devArgs =
      packageManager === "npm"
        ? ["run", "dev", "--", "--port", portStr]
        : ["run", "dev", "--port", portStr];
    devServer = spawn(packageManager, devArgs, {
      cwd: config.outputDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    devServer.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();
      if (output.includes("Ready") || output.includes("started")) {
        console.log(
          chalk.green(`🌐 Next.js ready at http://localhost:${port}`),
        );
      }
      if (options.verbose) {
        process.stdout.write(chalk.gray("[Next.js] ") + output);
      } else if (
        output.includes("compiled") ||
        output.includes("error") ||
        output.includes("Ready")
      ) {
        process.stdout.write(chalk.gray("[Next.js] ") + output);
      }
    });

    devServer.stderr?.on("data", (data: Buffer) => {
      const output = data.toString();
      if (
        options.verbose ||
        output.includes("Error") ||
        output.includes("error")
      ) {
        process.stderr.write(chalk.red("[Next.js] ") + output);
      }
    });

    devServer.on("error", (error: Error) => {
      console.error(chalk.red("❌ Error starting dev server:"), error);
    });

    devServer.on("close", (code: number | null) => {
      if (code && code !== 0) {
        console.error(
          chalk.red(`❌ Next.js dev server exited with code ${code}`),
        );
      }
    });

    await generator.startWatching();

    process.on("SIGINT", async () => {
      console.log(chalk.yellow("\n🛑 Shutting down..."));
      await generator.stop();
      if (devServer) {
        devServer.kill();
      }
      process.exit(0);
    });

    console.log(chalk.green("🎉 Generator is running! Press Ctrl+C to stop."));
    console.log(chalk.cyan(`📝 Edit your MDX files in: ${config.watchDir}`));
  });

program
  .command("build")
  .description("One-time build of Next.js app from MDX files")
  .option("--reset", "Reset configuration and prompt for new directories")
  .action(async (options) => {
    const configManager = new ConfigManager();
    const config = await configManager.getConfig({
      reset: options.reset,
    });

    const generator = new MDXToNextJSGenerator(
      config.watchDir,
      config.outputDir,
    );
    await generator.init();
    console.log(chalk.green("🎉 Build complete!"));
  });

program
  .command("config")
  .description("Show or reset configuration")
  .option("--show", "Show current configuration")
  .option("--reset", "Reset configuration")
  .action(async (options) => {
    const configManager = new ConfigManager();

    if (options.show) {
      const config = await configManager.loadConfig();
      if (config) {
        console.log(chalk.blue("📄 Current configuration:"));
        console.log(
          chalk.white("Watch Directory:"),
          chalk.cyan(path.relative(process.cwd(), config.watchDir)),
        );
        console.log(
          chalk.white("Output Directory:"),
          chalk.cyan(path.relative(process.cwd(), config.outputDir)),
        );
        console.log(chalk.white("Port:"), chalk.cyan(config.port || "3000"));
      } else {
        console.log(chalk.yellow("⚠️ No configuration file found"));
      }
    } else if (options.reset) {
      await configManager.getConfig({ reset: true });
      console.log(chalk.green("✅ Configuration reset"));
    } else {
      console.log(
        chalk.blue(
          "Use --show to display configuration or --reset to reset it",
        ),
      );
    }
  });

program.parse();
