#!/usr/bin/env node

import { program } from "commander";
import chokidar, { FSWatcher } from "chokidar";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

import matter from "gray-matter";
import chalk from "chalk";
import prompts from "prompts";

import { envExampleTemplate } from "./templates/env.example.js";
import { gitignoreTemplate } from "./templates/gitignore.js";
import { eslintConfigTemplate } from "./templates/eslint.config.js";
import { nextConfigTemplate } from "./templates/next.config.js";
import { packageJsonTemplate } from "./templates/package.js";
import { prettierrcTemplate } from "./templates/prettierrc.js";
import { prettierignoreTemplate } from "./templates/prettierignore.js";
import { proxyTemplate } from "./templates/proxy.js";
import { tsconfigTemplate } from "./templates/tsconfig.js";

import { mcpRoutesTemplate } from "./templates/app/api/mcp/route.js";
import { ragRoutesTemplate } from "./templates/app/api/rag/route.js";
import { routesTemplate } from "./templates/app/api/theme/routes.js";
import { layoutTemplate } from "./templates/app/layout.js";
import { notFoundTemplate } from "./templates/app/not-found.js";
import { themeTemplate } from "./templates/app/theme.js";

import { chatTemplate } from "./templates/components/Chat.js";
import { clickOutsideTemplate } from "./templates/components/ClickOutside.js";
import { docsTemplate } from "./templates/components/Docs.js";
import { docsSideBarTemplate } from "./templates/components/DocsSideBar.js";
import { mdxComponentsTemplate } from "./templates/components/MDXComponents.js";
import { sectionNavProviderTemplate } from "./templates/components/SectionNavProvider.js";
import { sideBarTemplate } from "./templates/components/SideBar.js";

import { sectionBarTemplate } from "./templates/components/layout/SectionBar.js";
import { accordionTemplate } from "./templates/components/layout/Accordion.js";
import { actionBarTemplate } from "./templates/components/layout/ActionBar.js";
import { buttonTemplate } from "./templates/components/layout/Button.js";
import { calloutTemplate } from "./templates/components/layout/Callout.js";
import { cardTemplate } from "./templates/components/layout/Card.js";
import { cherryThemeProviderTemplate } from "./templates/components/layout/CherryThemeProvider.js";
import { clientThemeProviderTemplate } from "./templates/components/layout/ClientThemeProvider.js";
import { codeTemplate } from "./templates/components/layout/Code.js";
import { columnsTemplate } from "./templates/components/layout/Columns.js";
import { demoThemeTemplate } from "./templates/components/layout/DemoTheme.js";
import { docsComponentsTemplate } from "./templates/components/layout/DocsComponents.js";
import { docsNavigationTemplate } from "./templates/components/layout/DocsNavigation.js";
import { fieldTemplate } from "./templates/components/layout/Field.js";
import { footerTemplate } from "./templates/components/layout/Footer.js";
import { globalStylesTemplate } from "./templates/components/layout/GlobalStyles.js";
import { headerTemplate } from "./templates/components/layout/Header.js";
import { iconTemplate } from "./templates/components/layout/Icon.js";
import { pictogramsTemplate } from "./templates/components/layout/Pictograms.js";
import { sharedStyledTemplate } from "./templates/components/layout/SharedStyles.js";
import { staticLinksTemplate } from "./templates/components/layout/StaticLinks.js";
import { stepsTemplate } from "./templates/components/layout/Steps.js";
import { tabsTemplate } from "./templates/components/layout/Tabs.js";
import { themeToggleTemplate } from "./templates/components/layout/ThemeToggle.js";
import { typographyTemplate } from "./templates/components/layout/Typography.js";
import { updateTemplate } from "./templates/components/layout/Update.js";

import { mcpIndexTemplate } from "./templates/services/mcp/index.js";
import { mcpServerTemplate } from "./templates/services/mcp/server.js";
import { mcpToolsTemplate } from "./templates/services/mcp/tools.js";
import { mcpTypesTemplate } from "./templates/services/mcp/types.js";
import { llmConfigTemplate } from "./templates/services/llm/config.js";
import { llmFactoryTemplate } from "./templates/services/llm/factory.js";
import { llmIndexTemplate } from "./templates/services/llm/index.js";
import { llmTypesTemplate } from "./templates/services/llm/types.js";

import { styledDTemplate } from "./templates/types/styled.js";

import { orderNavItemsTemplate } from "./templates/utils/orderNavItems.js";
import { rateLimitTemplate } from "./templates/utils/rateLimit.js";
import { brandingTemplate } from "./templates/utils/branding.js";
import { configTemplate } from "./templates/utils/config.js";

import { accordionMdxTemplate } from "./templates/mdx/accordion.mdx.js";
import { aiAssistantMdxTemplate } from "./templates/mdx/ai-assistant.mdx.js";
import { buttonsMdxTemplate } from "./templates/mdx/buttons.mdx.js";
import { calloutsMdxTemplate } from "./templates/mdx/callouts.mdx.js";
import { cardsMdxTemplate } from "./templates/mdx/cards.mdx.js";
import { codeMdxTemplate } from "./templates/mdx/code.mdx.js";
import { columnsMdxTemplate } from "./templates/mdx/columns.mdx.js";
import { commandsMdxTemplate } from "./templates/mdx/commands.mdx.js";
import { deploymentMdxTemplate } from "./templates/mdx/deployment.mdx.js";
import { fieldsMdxTemplate } from "./templates/mdx/fields.mdx.js";
import { fontsMdxTemplate } from "./templates/mdx/fonts.mdx.js";
import { globalsMdxTemplate } from "./templates/mdx/globals.mdx.js";
import { headersAndTextMdxTemplate } from "./templates/mdx/headers-and-text.mdx.js";
import { iconsMdxTemplate } from "./templates/mdx/icons.mdx.js";
import { imageAndEmbedsMdxTemplate } from "./templates/mdx/image-and-embeds.mdx.js";
import { indexMdxTemplate } from "./templates/mdx/index.mdx.js";
import { footerLinksMdxTemplate } from "./templates/mdx/footer-links.mdx.js";
import { listAndTablesMdxTemplate } from "./templates/mdx/list-and-tables.mdx.js";
import { mediaAndAssetsMdxTemplate } from "./templates/mdx/media-and-assets.mdx.js";
import { mcpMdxTemplate } from "./templates/mdx/model-context-protocol.mdx.js";
import { navigationMdxTemplate } from "./templates/mdx/navigation.mdx.js";
import { sectionsMdxTemplate } from "./templates/mdx/sections.mdx.js";
import { stepsMdxTemplate } from "./templates/mdx/steps.mdx.js";
import { tabsMdxTemplate } from "./templates/mdx/tabs.mdx.js";
import { themeMdxTemplate } from "./templates/mdx/theme.mdx.js";
import { updateMdxTemplate } from "./templates/mdx/update.mdx.js";

import { platformIndexMdxTemplate } from "./templates/mdx/platform/index.mdx.js";
import { platformFileEditorMdxTemplate } from "./templates/mdx/platform/file-editor.mdx.js";
import { platformPublishingMdxTemplate } from "./templates/mdx/platform/publishing.mdx.js";
import { platformCreatingAProjectMdxTemplate } from "./templates/mdx/platform/creating-a-project.mdx.js";
import { platformSiteSettingsMdxTemplate } from "./templates/mdx/platform/site-settings.mdx.js";
import { platformThemeSettingsMdxTemplate } from "./templates/mdx/platform/theme-settings.mdx.js";
import { platformNavigationSettingsMdxTemplate } from "./templates/mdx/platform/navigation-settings.mdx.js";
import { platformSectionsSettingsMdxTemplate } from "./templates/mdx/platform/sections-settings.mdx.js";
import { platformFontsSettingsMdxTemplate } from "./templates/mdx/platform/fonts-settings.mdx.js";
import { platformExternalLinksMdxTemplate } from "./templates/mdx/platform/external-links.mdx.js";
import { platformAiAssistantMdxTemplate } from "./templates/mdx/platform/ai-assistant.mdx.js";
import { platformCustomDomainsMdxTemplate } from "./templates/mdx/platform/custom-domains.mdx.js";
import { platformDeploymentsMdxTemplate } from "./templates/mdx/platform/deployments.mdx.js";
import { platformTeamMembersMdxTemplate } from "./templates/mdx/platform/team-members.mdx.js";
import { platformBillingMdxTemplate } from "./templates/mdx/platform/billing.mdx.js";
import { platformProjectSettingsMdxTemplate } from "./templates/mdx/platform/project-settings.mdx.js";

async function findAvailablePort(startPort: number): Promise<number> {
  const net = await import("net");

  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      server.close(() => resolve(startPort));
    });
    server.on("error", () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

export function generateSlug(filePath: string): string {
  if (filePath === "index.mdx" || filePath === "./index.mdx") {
    return "";
  }

  const normalized = filePath
    .replace(/\.mdx$/, "")
    .replace(/\\/g, "/")
    .replace(/[^a-zA-Z0-9\/\-_]/g, "-")
    .toLowerCase();

  // Strip trailing /index for subdirectory index files
  if (normalized.endsWith("/index")) {
    return normalized.slice(0, -"/index".length);
  }

  return normalized;
}

export function getFullSlug(pageSlug: string, sectionSlug: string): string {
  if (!sectionSlug) return pageSlug;
  if (pageSlug === "") return sectionSlug;
  return `${sectionSlug}/${pageSlug}`;
}

export function escapeTemplateContent(content: string): string {
  return content
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"),
);
const version = packageJson.version;

interface MDXFile {
  path: string;
  content: string;
  frontmatter: Record<string, any>;
  slug: string;
}

interface PageMeta {
  slug: string;
  title: string;
  description: string;
  date: string | null;
  category: string;
  path: string;
  categoryOrder: number;
  order: number;
  section: string;
}

interface SectionConfig {
  label: string;
  slug: string;
  directory?: string;
}

interface DoccupineConfig {
  watchDir: string;
  outputDir: string;
  port: string;
}

interface FontConfig {
  [key: string]: any;
}

class ConfigManager {
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

class MDXToNextJSGenerator {
  private watchDir: string;
  private outputDir: string;
  private rootDir: string;
  private watcher: FSWatcher | null = null;
  private configWatcher: FSWatcher | null = null;
  private fontWatcher: FSWatcher | null = null;
  private publicWatcher: FSWatcher | null = null;
  private configFiles = [
    "theme.json",
    "navigation.json",
    "config.json",
    "links.json",
    "sections.json",
  ];
  private fontConfigFile = "fonts.json";
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

    if (this.sectionsConfig) {
      console.log(
        chalk.blue(
          `📑 Found ${this.sectionsConfig.length} section(s): ${this.sectionsConfig.map((s) => s.label).join(", ")}`,
        ),
      );
    }

    await this.createNextJSStructure();
    await this.createStartingDocs();
    await this.copyCustomConfigFiles();
    await this.copyFontConfig();
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
      ".env.example": envExampleTemplate,
      ".gitignore": gitignoreTemplate,
      ".prettierrc": prettierrcTemplate,
      ".prettierignore": prettierignoreTemplate,
      "config.json": `{}\n`,
      "eslint.config.mjs": eslintConfigTemplate,
      "links.json": `[]\n`,
      "navigation.json": `[]\n`,
      "sections.json": `[]\n`,
      "next.config.ts": nextConfigTemplate,
      "package.json": packageJsonTemplate,
      "proxy.ts": proxyTemplate,
      "theme.json": `{}\n`,
      "tsconfig.json": tsconfigTemplate,

      "app/layout.tsx": this.generateRootLayout(),
      "app/not-found.tsx": notFoundTemplate,
      "app/theme.ts": themeTemplate,
      "app/api/mcp/route.ts": mcpRoutesTemplate,
      "app/api/rag/route.ts": ragRoutesTemplate,
      "app/api/theme/route.ts": routesTemplate,

      "services/mcp/index.ts": mcpIndexTemplate,
      "services/mcp/server.ts": mcpServerTemplate,
      "services/mcp/tools.ts": mcpToolsTemplate,
      "services/mcp/types.ts": mcpTypesTemplate,
      "services/llm/config.ts": llmConfigTemplate,
      "services/llm/factory.ts": llmFactoryTemplate,
      "services/llm/index.ts": llmIndexTemplate,
      "services/llm/types.ts": llmTypesTemplate,

      "types/styled.d.ts": styledDTemplate,

      "utils/branding.ts": brandingTemplate,
      "utils/orderNavItems.ts": orderNavItemsTemplate,
      "utils/rateLimit.ts": rateLimitTemplate,
      "utils/config.ts": configTemplate,

      "components/Chat.tsx": chatTemplate,
      "components/ClickOutside.ts": clickOutsideTemplate,
      "components/Docs.tsx": docsTemplate,
      "components/DocsSideBar.tsx": docsSideBarTemplate,
      "components/MDXComponents.tsx": mdxComponentsTemplate,
      "components/SectionNavProvider.tsx": sectionNavProviderTemplate,
      "components/SideBar.tsx": sideBarTemplate,

      "components/layout/Accordion.tsx": accordionTemplate,
      "components/layout/ActionBar.tsx": actionBarTemplate,
      "components/layout/Button.tsx": buttonTemplate,
      "components/layout/Callout.tsx": calloutTemplate,
      "components/layout/Card.tsx": cardTemplate,
      "components/layout/CherryThemeProvider.tsx": cherryThemeProviderTemplate,
      "components/layout/ClientThemeProvider.tsx": clientThemeProviderTemplate,
      "components/layout/Code.tsx": codeTemplate,
      "components/layout/Columns.tsx": columnsTemplate,
      "components/layout/DemoTheme.tsx": demoThemeTemplate,
      "components/layout/DocsComponents.tsx": docsComponentsTemplate,
      "components/layout/DocsNavigation.tsx": docsNavigationTemplate,
      "components/layout/SectionBar.tsx": sectionBarTemplate,
      "components/layout/Field.tsx": fieldTemplate,
      "components/layout/Footer.tsx": footerTemplate,
      "components/layout/GlobalStyles.ts": globalStylesTemplate,
      "components/layout/Header.tsx": headerTemplate,
      "components/layout/Icon.tsx": iconTemplate,
      "components/layout/Pictograms.tsx": pictogramsTemplate,
      "components/layout/SharedStyled.ts": sharedStyledTemplate,
      "components/layout/StaticLinks.tsx": staticLinksTemplate,
      "components/layout/Steps.tsx": stepsTemplate,
      "components/layout/Tabs.tsx": tabsTemplate,
      "components/layout/ThemeToggle.tsx": themeToggleTemplate,
      "components/layout/Typography.ts": typographyTemplate,
      "components/layout/Update.tsx": updateTemplate,
    };

    for (const [filePath, content] of Object.entries(structure)) {
      const fullPath = path.join(this.outputDir, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, String(await content), "utf8");
    }
  }

  async createStartingDocs() {
    const structure: Record<string, string> = {
      "accordion.mdx": accordionMdxTemplate,
      "ai-assistant.mdx": aiAssistantMdxTemplate,
      "buttons.mdx": buttonsMdxTemplate,
      "callouts.mdx": calloutsMdxTemplate,
      "cards.mdx": cardsMdxTemplate,
      "code.mdx": codeMdxTemplate,
      "columns.mdx": columnsMdxTemplate,
      "commands.mdx": commandsMdxTemplate,
      "deployment.mdx": deploymentMdxTemplate,
      "fields.mdx": fieldsMdxTemplate,
      "fonts.mdx": fontsMdxTemplate,
      "globals.mdx": globalsMdxTemplate,
      "headers-and-text.mdx": headersAndTextMdxTemplate,
      "icons.mdx": iconsMdxTemplate,
      "image-and-embeds.mdx": imageAndEmbedsMdxTemplate,
      "index.mdx": indexMdxTemplate,
      "footer-links.mdx": footerLinksMdxTemplate,
      "lists-and-tables.mdx": listAndTablesMdxTemplate,
      "media-and-assets.mdx": mediaAndAssetsMdxTemplate,
      "model-context-protocol.mdx": mcpMdxTemplate,
      "navigation.mdx": navigationMdxTemplate,
      "sections.mdx": sectionsMdxTemplate,
      "steps.mdx": stepsMdxTemplate,
      "tabs.mdx": tabsMdxTemplate,
      "theme.mdx": themeMdxTemplate,
      "update.mdx": updateMdxTemplate,
      "platform/index.mdx": platformIndexMdxTemplate,
      "platform/file-editor.mdx": platformFileEditorMdxTemplate,
      "platform/publishing.mdx": platformPublishingMdxTemplate,
      "platform/creating-a-project.mdx": platformCreatingAProjectMdxTemplate,
      "platform/site-settings.mdx": platformSiteSettingsMdxTemplate,
      "platform/theme-settings.mdx": platformThemeSettingsMdxTemplate,
      "platform/navigation-settings.mdx": platformNavigationSettingsMdxTemplate,
      "platform/sections-settings.mdx": platformSectionsSettingsMdxTemplate,
      "platform/fonts-settings.mdx": platformFontsSettingsMdxTemplate,
      "platform/external-links.mdx": platformExternalLinksMdxTemplate,
      "platform/ai-assistant.mdx": platformAiAssistantMdxTemplate,
      "platform/custom-domains.mdx": platformCustomDomainsMdxTemplate,
      "platform/deployments.mdx": platformDeploymentsMdxTemplate,
      "platform/team-members.mdx": platformTeamMembersMdxTemplate,
      "platform/billing.mdx": platformBillingMdxTemplate,
      "platform/project-settings.mdx": platformProjectSettingsMdxTemplate,
    };

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

    const publicDir = path.join(this.rootDir, "public");

    if (await fs.pathExists(publicDir)) {
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
    return layoutTemplate(pages, fontConfig, this.sectionsConfig);
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
    const pageContent = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";
import { config } from "@/utils/config";

const content = \`${escapeTemplateContent(mdxFile.content)}\`;

export const metadata: Metadata = {
  title: \`${mdxFile.frontmatter.title || "Generated with Doccupine"} \${config.name ? "- " + config.name : "- Doccupine"}\`,
  description: \`${mdxFile.frontmatter.description ? mdxFile.frontmatter.description : '${config.description ? config.description : "Generated with Doccupine"}'}\`,
  icons: \`${mdxFile.frontmatter.icon ? mdxFile.frontmatter.icon : '\${config.icon || "https://docs.doccupine.com/favicon.ico"}'}\`,
  openGraph: {
    title: \`${mdxFile.frontmatter.title || "Generated with Doccupine"} \${config.name ? "- " + config.name : "- Doccupine"}\`,
    description: \`${mdxFile.frontmatter.description ? mdxFile.frontmatter.description : '${config.description ? config.description : "Generated with Doccupine"}'}\`,
    images: \`${mdxFile.frontmatter.image ? mdxFile.frontmatter.image : '\${config.preview || "https://docs.doccupine.com/preview.png"}'}\`,
  },
};

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
        };
        break;
      }
    }

    const indexContent = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";
import { config } from "@/utils/config";

${indexMDX ? `const content = \`${escapeTemplateContent(indexMDX.content)}\`;` : `const content = null;`}

${
  indexMDX
    ? `export const metadata: Metadata = {
  title: \`\${config.name ? config.name + " -" : "Doccupine -"} ${indexMDX.title}\`,
  description: \`${indexMDX.description ? indexMDX.description : '${config.description ? config.description : "Generated with Doccupine"}'}\`,
  icons: \`${indexMDX.icon ? indexMDX.icon : '\${config.icon || "https://docs.doccupine.com/favicon.ico"}'}\`,
  openGraph: {
    title: \`\${config.name ? config.name + " -" : "Doccupine -"} ${indexMDX.title}\`,
    description: \`${indexMDX.description ? indexMDX.description : '${config.description ? config.description : "Generated with Doccupine"}'}\`,
    images: \`${indexMDX.image ? indexMDX.image : '\${config.preview || "https://docs.doccupine.com/preview.png"}'}\`,
  },
};`
    : `export const metadata: Metadata = {
  title: \`\${config.name || "Doccupine"}\`,
  description: \`\${config.description || "Generated with Doccupine"}\`,
  icons: \`\${config.icon || "https://docs.doccupine.com/favicon.ico"}\`,
  openGraph: {
    title: \`\${config.name || "Doccupine"}\`,
    description: \`\${config.description || "Generated with Doccupine"}\`,
    images: \`\${config.preview || "https://docs.doccupine.com/preview.png"}\`,
  },
};`
}

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
    const indexContent = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";
import { config } from "@/utils/config";

const content = \`${escapeTemplateContent(mdxContent)}\`;

export const metadata: Metadata = {
  title: \`\${config.name ? config.name + " -" : "Doccupine -"} ${frontmatter.title || "Section"}\`,
  description: \`${frontmatter.description ? frontmatter.description : '${config.description ? config.description : "Generated with Doccupine"}'}\`,
  icons: \`${frontmatter.icon ? frontmatter.icon : '\${config.icon || "https://docs.doccupine.com/favicon.ico"}'}\`,
  openGraph: {
    title: \`\${config.name ? config.name + " -" : "Doccupine -"} ${frontmatter.title || "Section"}\`,
    description: \`${frontmatter.description ? frontmatter.description : '${config.description ? config.description : "Generated with Doccupine"}'}\`,
    images: \`${frontmatter.image ? frontmatter.image : '\${config.preview || "https://docs.doccupine.com/preview.png"}'}\`,
  },
};

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
    if (this.publicWatcher) {
      await this.publicWatcher.close();
      console.log(
        chalk.yellow("👋 Stopped watching for public directory changes"),
      );
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
      if (
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
