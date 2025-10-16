#!/usr/bin/env node
import { program } from "commander";
import chokidar from "chokidar";
import fs from "fs-extra";
import path from "path";
import matter from "gray-matter";
import chalk from "chalk";
import prompts from "prompts";
import { gitignoreTemplate } from "./templates/gitignore.js";
import { middlewareTemplate } from "./templates/middleware.js";
import { nextConfigTemplate } from "./templates/next.config.js";
import { packageJsonTemplate } from "./templates/package.js";
import { tsconfigTemplate } from "./templates/tsconfig.js";
import { routesTemplate } from "./templates/app/api/theme/routes.js";
import { layoutTemplate } from "./templates/app/layout.js";
import { notFoundTemplate } from "./templates/app/not-found.js";
import { themeTemplate } from "./templates/app/theme.js";
import { clickOutsideTemplate } from "./templates/components/ClickOutside.js";
import { docsTemplate } from "./templates/components/Docs.js";
import { docsSideBarTemplate } from "./templates/components/DocsSideBar.js";
import { mdxComponentsTemplate } from "./templates/components/MDXComponents.js";
import { sideBarTemplate } from "./templates/components/SideBar.js";
import { accordionTemplate } from "./templates/components/layout/Accordion.js";
import { calloutTemplate } from "./templates/components/layout/Callout.js";
import { cardTemplate } from "./templates/components/layout/Card.js";
import { cherryThemeProviderTemplate } from "./templates/components/layout/CherryThemeProvider.js";
import { clientThemeProviderTemplate } from "./templates/components/layout/ClientThemeProvider.js";
import { codeTemplate } from "./templates/components/layout/Code.js";
import { columnsTemplate } from "./templates/components/layout/Columns.js";
import { docsComponentsTemplate } from "./templates/components/layout/DocsComponents.js";
import { fieldTemplate } from "./templates/components/layout/Field.js";
import { footerTemplate } from "./templates/components/layout/Footer.js";
import { globalStylesTemplate } from "./templates/components/layout/GlobalStyles.js";
import { headerTemplate } from "./templates/components/layout/Header.js";
import { iconTemplate } from "./templates/components/layout/Icon.js";
import { pictogramsTemplate } from "./templates/components/layout/Pictograms.js";
import { sharedStyledTemplate } from "./templates/components/layout/SharedStyles.js";
import { tabsTemplate } from "./templates/components/layout/Tabs.js";
import { themeToggleTemplate } from "./templates/components/layout/ThemeToggle.js";
import { typographyTemplate } from "./templates/components/layout/Typography.js";
import { updateTemplate } from "./templates/components/layout/Update.js";
import { styledDTemplate } from "./templates/types/styled.js";
import { orderNavItemsTemplate } from "./templates/utils/orderNavItems.js";
import { accordionMdxTemplate } from "./templates/mdx/accordion.mdx.js";
import { calloutsMdxTemplate } from "./templates/mdx/callouts.mdx.js";
import { cardsMdxTemplate } from "./templates/mdx/cards.mdx.js";
import { codeMdxTemplate } from "./templates/mdx/code.mdx.js";
import { columnsMdxTemplate } from "./templates/mdx/columns.mdx.js";
import { commandsMdxTemplate } from "./templates/mdx/commands.mdx.js";
import { configMdxTemplate } from "./templates/mdx/config.mdx.js";
import { fieldsMdxTemplate } from "./templates/mdx/fields.mdx.js";
import { iconsMdxTemplate } from "./templates/mdx/icons.mdx.js";
import { imageEmbedsMdxTemplate } from "./templates/mdx/image-embeds.mdx.js";
import { indexMdxTemplate } from "./templates/mdx/index.mdx.js";
import { listTableMdxTemplate } from "./templates/mdx/list-table.mdx.js";
import { navigationMdxTemplate } from "./templates/mdx/navigation.mdx.js";
import { tabsMdxTemplate } from "./templates/mdx/tabs.mdx.js";
import { textMdxTemplate } from "./templates/mdx/text.mdx.js";
import { updateMdxTemplate } from "./templates/mdx/update.mdx.js";
class ConfigManager {
    configPath;
    constructor(configPath = "doccupine.json") {
        this.configPath = path.resolve(process.cwd(), configPath);
    }
    async loadConfig() {
        try {
            if (await fs.pathExists(this.configPath)) {
                const configContent = await fs.readFile(this.configPath, "utf8");
                const config = JSON.parse(configContent);
                console.log(chalk.blue("📄 Using existing configuration from doccupine.json"));
                return config;
            }
        }
        catch (error) {
            console.warn(chalk.yellow("⚠️ Error reading config file, will create new one"));
        }
        return null;
    }
    async saveConfig(config) {
        try {
            await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), "utf8");
            console.log(chalk.green("💾 Configuration saved to doccupine.json"));
        }
        catch (error) {
            console.error(chalk.red("❌ Error saving config file:"), error);
        }
    }
    async promptForConfig(existingConfig) {
        const questions = [
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
        const { watchDir, outputDir } = (await prompts(questions));
        return {
            watchDir: path.resolve(process.cwd(), watchDir),
            outputDir: path.resolve(process.cwd(), outputDir),
            port: existingConfig?.port || "3000",
        };
    }
    async getConfig(options = {}) {
        let config = null;
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
    watchDir;
    outputDir;
    rootDir;
    watcher = null;
    configWatcher = null;
    configFiles = ["theme.json", "navigation.json", "config.json"];
    constructor(watchDir, outputDir) {
        this.watchDir = path.resolve(watchDir);
        this.outputDir = path.resolve(outputDir);
        this.rootDir = process.cwd();
    }
    async init() {
        console.log(chalk.blue("🚀 Initializing MDX to Next.js generator..."));
        await fs.ensureDir(this.watchDir);
        await fs.ensureDir(this.outputDir);
        await this.createNextJSStructure();
        await this.createStartingDocs();
        await this.copyCustomConfigFiles();
        await this.processAllMDXFiles();
        console.log(chalk.green("✅ Initial setup complete!"));
        console.log(chalk.cyan("💡 To start the Next.js dev server:"));
        console.log(chalk.white(`   cd ${path.relative(process.cwd(), this.outputDir)}`));
        console.log(chalk.white("   npm install && npm run dev"));
    }
    async createNextJSStructure() {
        const structure = {
            ".gitignore": this.generateGitIgnore(),
            "config.json": this.generateConfig(),
            "middleware.ts": this.generateMiddleware(),
            "navigation.json": this.generateNavigationConfig(),
            "next.config.ts": this.generateNextConfig(),
            "package.json": this.generatePackageJson(),
            "theme.json": this.generateThemeConfig(),
            "tsconfig.json": this.generateTSConfig(),
            "app/layout.tsx": await this.generateRootLayout(),
            "app/not-found.tsx": this.generateNotFoundPage(),
            "app/theme.ts": this.generateTheme(),
            "app/api/theme/route.ts": this.generateRoutes(),
            "types/styled.d.ts": this.generateStyledDTypes(),
            "utils/orderNavItems.ts": this.generateOrderNavItems(),
            "components/ClickOutside.ts": this.generateClickOutside(),
            "components/Docs.tsx": this.generateDocs(),
            "components/DocsSideBar.tsx": this.generateDocsSideBar(),
            "components/MDXComponents.tsx": this.generateMDXComponents(),
            "components/SideBar.tsx": this.generateSideBar(),
            "components/layout/Accordion.tsx": this.generateAccordion(),
            "components/layout/Callout.tsx": this.generateCallout(),
            "components/layout/Card.tsx": this.generateCard(),
            "components/layout/CherryThemeProvider.tsx": this.generateCherryThemeProvider(),
            "components/layout/ClientThemeProvider.tsx": this.generateClientThemeProvider(),
            "components/layout/Code.tsx": this.generateCode(),
            "components/layout/Columns.tsx": this.generateColumns(),
            "components/layout/DocsComponents.tsx": this.generateDocsComponents(),
            "components/layout/Field.tsx": this.generateField(),
            "components/layout/Footer.tsx": this.generateFooter(),
            "components/layout/GlobalStyles.ts": this.generateGlobalStyles(),
            "components/layout/Header.tsx": this.generateHeader(),
            "components/layout/Icon.tsx": this.generateIcon(),
            "components/layout/Pictograms.tsx": this.generatePictograms(),
            "components/layout/SharedStyled.ts": this.generateSharedStyled(),
            "components/layout/Tabs.tsx": this.generateTabs(),
            "components/layout/ThemeToggle.tsx": this.generateThemeToggle(),
            "components/layout/Typography.ts": this.generateTypography(),
            "components/layout/Update.tsx": this.generateUpdate(),
        };
        for (const [filePath, content] of Object.entries(structure)) {
            const fullPath = path.join(this.outputDir, filePath);
            await fs.ensureDir(path.dirname(fullPath));
            await fs.writeFile(fullPath, String(content), "utf8");
        }
    }
    async createStartingDocs() {
        const structure = {
            "accordion.mdx": this.generateAccordionMdx(),
            "callouts.mdx": this.generateCalloutsMdx(),
            "cards.mdx": this.generateCardsMdx(),
            "code.mdx": this.generateCodeMdx(),
            "columns.mdx": this.generateColumnsMdx(),
            "commands.mdx": this.generateCommandsMdx(),
            "config.mdx": this.generateConfigMdx(),
            "fields.mdx": this.generateFieldsMdx(),
            "icons.mdx": this.generateIconsMdx(),
            "image-embeds.mdx": this.generateImageEmbedsMdx(),
            "index.mdx": this.generateIndexMdx(),
            "list-table.mdx": this.generateListTableMdx(),
            "navigation.mdx": this.generateNavigationMdx(),
            "tabs.mdx": this.generateTabsMdx(),
            "text.mdx": this.generateTextMdx(),
            "update.mdx": this.generateUpdateMdx(),
        };
        const indexMdxExists = await fs.pathExists(path.join(this.watchDir, "index.mdx"));
        if (!indexMdxExists) {
            for (const [filePath, content] of Object.entries(structure)) {
                const fullPath = path.join(this.watchDir, filePath);
                await fs.ensureDir(path.dirname(fullPath));
                await fs.writeFile(fullPath, String(content), "utf8");
            }
        }
    }
    async copyCustomConfigFiles() {
        console.log(chalk.blue(`🔍 Checking for config files in: ${this.watchDir}`));
        for (const configFile of this.configFiles) {
            const sourcePath = path.join(this.rootDir, configFile);
            const destPath = path.join(this.outputDir, configFile);
            console.log(chalk.gray(`  Checking ${configFile}...`));
            if (await fs.pathExists(sourcePath)) {
                await fs.copy(sourcePath, destPath);
                console.log(chalk.green(`  ✓ Copied ${configFile} to Next.js app`));
            }
            else {
                console.log(chalk.gray(`  ✗ ${configFile} not found, skipping`));
            }
        }
    }
    async handleConfigFileChange(filePath) {
        const fileName = path.basename(filePath);
        if (this.configFiles.includes(fileName)) {
            const sourcePath = path.join(this.rootDir, fileName);
            const destPath = path.join(this.outputDir, fileName);
            try {
                await fs.copy(sourcePath, destPath);
                console.log(chalk.green(`📋 Updated ${fileName} in Next.js app`));
            }
            catch (error) {
                console.error(chalk.red(`❌ Error copying ${fileName}:`), error);
            }
        }
    }
    async handleConfigFileDelete(filePath) {
        const fileName = path.basename(filePath);
        if (this.configFiles.includes(fileName)) {
            const destPath = path.join(this.outputDir, fileName);
            try {
                if (await fs.pathExists(destPath)) {
                    await fs.remove(destPath);
                    console.log(chalk.yellow(`🗑️ Removed ${fileName} from Next.js app`));
                }
            }
            catch (error) {
                console.error(chalk.red(`❌ Error removing ${fileName}:`), error);
            }
        }
    }
    async startWatching() {
        console.log(chalk.yellow(`👀 Watching for changes in: ${this.watchDir}`));
        this.watcher = chokidar.watch(this.watchDir, {
            persistent: true,
            ignoreInitial: true,
            ignored: (filePath, stats) => {
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
            .on("add", (filePath) => {
            const relativePath = path.relative(this.watchDir, filePath);
            this.handleFileChange("added", relativePath);
        })
            .on("change", (filePath) => {
            const relativePath = path.relative(this.watchDir, filePath);
            this.handleFileChange("changed", relativePath);
        })
            .on("unlink", (filePath) => {
            const relativePath = path.relative(this.watchDir, filePath);
            this.handleFileDelete(relativePath);
        })
            .on("ready", () => {
            console.log(chalk.green("📁 Initial scan complete. Ready for changes..."));
        })
            .on("error", (error) => {
            console.error(chalk.red("❌ Watcher error:"), error);
        });
        const configPaths = this.configFiles.map((f) => path.join(this.rootDir, f));
        this.configWatcher = chokidar.watch(configPaths, {
            persistent: true,
            ignoreInitial: true,
        });
        this.configWatcher
            .on("add", (filePath) => {
            console.log(chalk.cyan(`📝 Config file added: ${path.basename(filePath)}`));
            this.handleConfigFileChange(filePath);
        })
            .on("change", (filePath) => {
            console.log(chalk.cyan(`📝 Config file changed: ${path.basename(filePath)}`));
            this.handleConfigFileChange(filePath);
        })
            .on("unlink", (filePath) => {
            console.log(chalk.red(`🗑️ Config file deleted: ${path.basename(filePath)}`));
            this.handleConfigFileDelete(filePath);
        })
            .on("error", (error) => {
            console.error(chalk.red("❌ Config watcher error:"), error);
        });
    }
    async handleFileChange(action, filePath) {
        console.log(chalk.cyan(`📝 File ${action}: ${filePath}`));
        const fullPath = path.join(this.watchDir, filePath);
        try {
            const content = await fs.readFile(fullPath, "utf8");
            const { data: frontmatter, content: mdxContent } = matter(content);
            if (filePath === "index.mdx" || filePath === "./index.mdx") {
                console.log(chalk.blue("🏠 Updating homepage with index.mdx content"));
                await this.updatePagesIndex();
                await this.updateRootLayout();
            }
            else {
                const mdxFile = {
                    path: filePath,
                    content: mdxContent,
                    frontmatter,
                    slug: this.generateSlug(filePath),
                };
                await this.generatePageFromMDX(mdxFile);
                await this.updatePagesIndex();
                await this.updateRootLayout();
            }
            console.log(chalk.green(`✅ Generated page for: ${filePath}`));
        }
        catch (error) {
            console.error(chalk.red(`❌ Error processing ${filePath}:`), error);
        }
    }
    async handleFileDelete(filePath) {
        console.log(chalk.red(`🗑️ File deleted: ${filePath}`));
        try {
            if (filePath === "index.mdx" || filePath === "./index.mdx") {
                console.log(chalk.blue("🏠 Updating homepage - index.mdx deleted"));
                await this.updatePagesIndex();
                await this.updateRootLayout();
            }
            else {
                const slug = this.generateSlug(filePath);
                const pagePath = path.join(this.outputDir, "app", slug);
                await fs.remove(pagePath);
                await this.updatePagesIndex();
                await this.updateRootLayout();
            }
            console.log(chalk.green(`✅ Removed page for: ${filePath}`));
        }
        catch (error) {
            console.error(chalk.red(`❌ Error removing page for ${filePath}:`), error);
        }
    }
    async processAllMDXFiles() {
        const files = await this.getAllMDXFiles();
        for (const file of files) {
            await this.handleFileChange("processed", file);
        }
    }
    async getAllMDXFiles() {
        const files = [];
        async function scanDir(dir, relativePath = "") {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relPath = path.join(relativePath, entry.name);
                if (entry.isDirectory()) {
                    await scanDir(fullPath, relPath);
                }
                else if (entry.name.endsWith(".mdx")) {
                    files.push(relPath);
                }
            }
        }
        await scanDir(this.watchDir);
        return files;
    }
    generateSlug(filePath) {
        if (filePath === "index.mdx" || filePath === "./index.mdx") {
            return "";
        }
        return filePath
            .replace(/\.mdx$/, "")
            .replace(/\\/g, "/")
            .replace(/[^a-zA-Z0-9\/\-_]/g, "-")
            .toLowerCase();
    }
    generateGitIgnore() {
        return gitignoreTemplate;
    }
    generateConfig() {
        return `{}`;
    }
    generateMiddleware() {
        return middlewareTemplate;
    }
    generateNavigationConfig() {
        return `[]`;
    }
    generateNextConfig() {
        return nextConfigTemplate;
    }
    generatePackageJson() {
        return packageJsonTemplate;
    }
    generateThemeConfig() {
        return `{}`;
    }
    generateTSConfig() {
        return tsconfigTemplate;
    }
    async generateRootLayout() {
        const files = await this.getAllMDXFiles();
        const pages = [];
        for (const file of files) {
            const fullPath = path.join(this.watchDir, file);
            const content = await fs.readFile(fullPath, "utf8");
            const { data: frontmatter } = matter(content);
            pages.push({
                slug: this.generateSlug(file),
                title: frontmatter.title || "Untitled",
                description: frontmatter.description || "",
                date: frontmatter.date || null,
                category: frontmatter.category || "",
                path: file,
                categoryOrder: frontmatter.categoryOrder || 0,
                order: frontmatter.order || 0,
            });
        }
        return layoutTemplate(pages);
    }
    generateNotFoundPage() {
        return notFoundTemplate;
    }
    async generatePageFromMDX(mdxFile) {
        const files = await this.getAllMDXFiles();
        const pages = [];
        for (const file of files) {
            const fullPath = path.join(this.watchDir, file);
            const content = await fs.readFile(fullPath, "utf8");
            const { data: frontmatter } = matter(content);
            pages.push({
                slug: this.generateSlug(file),
                title: frontmatter.title || "Untitled",
                description: frontmatter.description || "",
                date: frontmatter.date || null,
                category: frontmatter.category || "",
                path: file,
                categoryOrder: frontmatter.categoryOrder || 0,
                order: frontmatter.order || 0,
            });
        }
        const pageContent = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";
import config from "@/config.json";

const content = \`${mdxFile.content.replace(/`/g, "\\`")}\`;

export const metadata: Metadata = {
  title: \`${mdxFile.frontmatter.title || "Generated with Doccupine"} \${config.name ? "- " + config.name : "- Doccupine"}\`,
  description: \`${mdxFile.frontmatter.description ? mdxFile.frontmatter.description : '${config.description ? config.description : "Generated with Doccupine"}'}\`,
  icons: \`${mdxFile.frontmatter.icon ? mdxFile.frontmatter.icon : "\${config.icon || 'https://doccupine.com/favicon.ico'}"}\`,
  openGraph: {
    title: \`${mdxFile.frontmatter.title || "Generated with Doccupine"} \${config.name ? "- " + config.name : "- Doccupine"}\`,
    description: \`${mdxFile.frontmatter.description ? mdxFile.frontmatter.description : '${config.description ? config.description : "Generated with Doccupine"}'}\`,
    images: \`${mdxFile.frontmatter.image ? mdxFile.frontmatter.image : "\${config.preview || 'https://doccupine.com/preview.png'}"}\`,
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
        let indexMDX = null;
        for (const file of files) {
            const fullPath = path.join(this.watchDir, file);
            const content = await fs.readFile(fullPath, "utf8");
            const { data: frontmatter, content: mdxContent } = matter(content);
            if (file === "index.mdx" || file === "./index.mdx") {
                indexMDX = {
                    content: mdxContent,
                    frontmatter,
                    title: frontmatter.title || "Welcome",
                    category: frontmatter.category || "",
                    description: frontmatter.description || "",
                    categoryOrder: frontmatter.categoryOrder || 0,
                    order: frontmatter.order || 0,
                    icon: frontmatter.icon || "https://doccupine.com/favicon.ico",
                    image: frontmatter.image || "https://doccupine.com/preview.png",
                };
            }
        }
        const indexContent = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";
import config from "@/config.json";

${indexMDX ? `const indexContent = \`${indexMDX.content.replace(/`/g, "\\`")}\`;` : `const indexContent = null;`}

${indexMDX
            ? `export const metadata: Metadata = {
  title: \`\${config.name ? config.name + " -" : "Doccupine -"} ${indexMDX.title}\`,
  description: \`${indexMDX.description ? indexMDX.description : '${config.description ? config.description : "Generated with Doccupine"}'}\`,
  icons: \`${indexMDX.icon ? indexMDX.icon : "\${config.icon || 'https://doccupine.com/favicon.ico'}"}\`,
  openGraph: {
    title: \`\${config.name ? config.name + " -" : "Doccupine -"} ${indexMDX.title}\`,
    description: \`${indexMDX.description ? indexMDX.description : '${config.description ? config.description : "Generated with Doccupine"}'}\`,
    images: \`${indexMDX.image ? indexMDX.image : "\${config.preview || 'https://doccupine.com/preview.png'}"}\`,
  },
};`
            : `export const metadata: Metadata = {
  title: "Doccupine",
  description: "Generated with Doccupine",
  icons: "https://doccupine.com/favicon.ico",
  openGraph: {
    title: "Doccupine",
    description: "Generated with Doccupine",
    images: "https://doccupine.com/preview.png",
  },
};`}

export default function Home() {
  return <Docs content={indexContent} />;
}
`;
        await fs.writeFile(path.join(this.outputDir, "app", "page.tsx"), indexContent, "utf8");
    }
    async updateRootLayout() {
        const layoutContent = await this.generateRootLayout();
        await fs.writeFile(path.join(this.outputDir, "app", "layout.tsx"), layoutContent, "utf8");
    }
    generateTheme() {
        return themeTemplate;
    }
    generateRoutes() {
        return routesTemplate;
    }
    generateStyledDTypes() {
        return styledDTemplate;
    }
    generateOrderNavItems() {
        return orderNavItemsTemplate;
    }
    generateClickOutside() {
        return clickOutsideTemplate;
    }
    generateDocs() {
        return docsTemplate;
    }
    generateDocsSideBar() {
        return docsSideBarTemplate;
    }
    generateMDXComponents() {
        return mdxComponentsTemplate;
    }
    generateSideBar() {
        return sideBarTemplate;
    }
    generateAccordion() {
        return accordionTemplate;
    }
    generateCallout() {
        return calloutTemplate;
    }
    generateCard() {
        return cardTemplate;
    }
    generateCherryThemeProvider() {
        return cherryThemeProviderTemplate;
    }
    generateClientThemeProvider() {
        return clientThemeProviderTemplate;
    }
    generateCode() {
        return codeTemplate;
    }
    generateColumns() {
        return columnsTemplate;
    }
    generateDocsComponents() {
        return docsComponentsTemplate;
    }
    generateField() {
        return fieldTemplate;
    }
    generateFooter() {
        return footerTemplate;
    }
    generateGlobalStyles() {
        return globalStylesTemplate;
    }
    generateHeader() {
        return headerTemplate;
    }
    generateIcon() {
        return iconTemplate;
    }
    generatePictograms() {
        return pictogramsTemplate;
    }
    generateSharedStyled() {
        return sharedStyledTemplate;
    }
    generateTabs() {
        return tabsTemplate;
    }
    generateThemeToggle() {
        return themeToggleTemplate;
    }
    generateTypography() {
        return typographyTemplate;
    }
    generateUpdate() {
        return updateTemplate;
    }
    generateAccordionMdx() {
        return accordionMdxTemplate;
    }
    generateCalloutsMdx() {
        return calloutsMdxTemplate;
    }
    generateCardsMdx() {
        return cardsMdxTemplate;
    }
    generateCodeMdx() {
        return codeMdxTemplate;
    }
    generateColumnsMdx() {
        return columnsMdxTemplate;
    }
    generateCommandsMdx() {
        return commandsMdxTemplate;
    }
    generateConfigMdx() {
        return configMdxTemplate;
    }
    generateFieldsMdx() {
        return fieldsMdxTemplate;
    }
    generateIconsMdx() {
        return iconsMdxTemplate;
    }
    generateImageEmbedsMdx() {
        return imageEmbedsMdxTemplate;
    }
    generateIndexMdx() {
        return indexMdxTemplate;
    }
    generateListTableMdx() {
        return listTableMdxTemplate;
    }
    generateNavigationMdx() {
        return navigationMdxTemplate;
    }
    generateTabsMdx() {
        return tabsMdxTemplate;
    }
    generateTextMdx() {
        return textMdxTemplate;
    }
    generateUpdateMdx() {
        return updateMdxTemplate;
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
    }
}
program
    .name("doccupine")
    .description("Watch MDX files and generate Next.js documentation pages automatically")
    .version("0.0.11");
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
    const generator = new MDXToNextJSGenerator(config.watchDir, config.outputDir);
    await generator.init();
    let devServer = null;
    console.log(chalk.blue("📦 Installing dependencies..."));
    const { spawn } = await import("child_process");
    const install = spawn("npm", ["install"], {
        cwd: config.outputDir,
        stdio: "pipe",
    });
    await new Promise((resolve, reject) => {
        install.on("close", (code) => {
            if (code === 0) {
                console.log(chalk.green("✅ Dependencies installed"));
                resolve(void 0);
            }
            else {
                reject(new Error(`npm install failed with code ${code}`));
            }
        });
        install.on("error", reject);
    });
    console.log(chalk.blue(`🚀 Starting Next.js dev server on port ${config.port}...`));
    devServer = spawn("npm", ["run", "dev", "--", "--port", config.port], {
        cwd: config.outputDir,
        stdio: ["ignore", "pipe", "pipe"],
    });
    devServer.stdout.on("data", (data) => {
        const output = data.toString();
        if (output.includes("Ready") || output.includes("started")) {
            console.log(chalk.green(`🌐 Next.js ready at http://localhost:${config.port}`));
        }
        if (output.includes("compiled") ||
            output.includes("error") ||
            output.includes("Ready")) {
            process.stdout.write(chalk.gray("[Next.js] ") + output);
        }
    });
    if (options.verbose) {
        devServer.stderr.on("data", (data) => {
            process.stderr.write(chalk.red("[Next.js Error] ") + data.toString());
        });
    }
    devServer.on("error", (error) => {
        console.error(chalk.red("❌ Error starting dev server:"), error);
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
    console.log(chalk.cyan(`🌐 View changes at: http://localhost:${config.port}`));
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
    const generator = new MDXToNextJSGenerator(config.watchDir, config.outputDir);
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
            console.log(chalk.white("Watch Directory:"), chalk.cyan(path.relative(process.cwd(), config.watchDir)));
            console.log(chalk.white("Output Directory:"), chalk.cyan(path.relative(process.cwd(), config.outputDir)));
            console.log(chalk.white("Port:"), chalk.cyan(config.port || "3000"));
        }
        else {
            console.log(chalk.yellow("⚠️ No configuration file found"));
        }
    }
    else if (options.reset) {
        await configManager.getConfig({ reset: true });
        console.log(chalk.green("✅ Configuration reset"));
    }
    else {
        console.log(chalk.blue("Use --show to display configuration or --reset to reset it"));
    }
});
program.parse();
