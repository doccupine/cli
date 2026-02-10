#!/usr/bin/env node
import { program } from "commander";
import chokidar from "chokidar";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import chalk from "chalk";
import prompts from "prompts";
import { envExampleTemplate } from "./templates/env.example.js";
import { gitignoreTemplate } from "./templates/gitignore.js";
import { eslintConfigTeamplate } from "./templates/eslint.config.js";
import { nextConfigTemplate } from "./templates/next.config.js";
import { packageJsonTemplate } from "./templates/package.js";
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
import { sideBarTemplate } from "./templates/components/SideBar.js";
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
import { stepsTemplate } from "./templates/components/layout/Stepts.js";
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
import { linksMdxTemplate } from "./templates/mdx/links.mdx.js";
import { listAndTablesMdxTemplate } from "./templates/mdx/list-and-tables.mdx.js";
import { mediaAndAssetsMdxTemplate } from "./templates/mdx/media-and-assets.mdx.js";
import { mcpMdxTemplate } from "./templates/mdx/model-context-protocol.mdx.js";
import { navigationMdxTemplate } from "./templates/mdx/navigation.mdx.js";
import { stepsMdxTemplate } from "./templates/mdx/steps.mdx.js";
import { tabsMdxTemplate } from "./templates/mdx/tabs.mdx.js";
import { themeMdxTemplate } from "./templates/mdx/theme.mdx.js";
import { updateMdxTemplate } from "./templates/mdx/update.mdx.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
const version = packageJson.version;
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
    fontWatcher = null;
    publicWatcher = null;
    configFiles = [
        "theme.json",
        "navigation.json",
        "config.json",
        "links.json",
    ];
    fontConfigFile = "fonts.json";
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
        await this.copyFontConfig();
        await this.copyPublicFiles();
        await this.processAllMDXFiles();
        console.log(chalk.green("✅ Initial setup complete!"));
        console.log(chalk.cyan("💡 To start the Next.js dev server:"));
        console.log(chalk.white(`   cd ${path.relative(process.cwd(), this.outputDir)}`));
        console.log(chalk.white("   npm install && npm run dev"));
    }
    async createNextJSStructure() {
        const structure = {
            ".env.example": this.generateEnvExample(),
            ".gitignore": this.generateGitIgnore(),
            "config.json": this.generateConfig(),
            "eslint.config.mjs": this.generateESLintConfig(),
            "links.json": this.generateLinksConfig(),
            "navigation.json": this.generateNavigationConfig(),
            "next.config.ts": this.generateNextConfig(),
            "package.json": this.generatePackageJson(),
            "proxy.ts": this.generateProxy(),
            "theme.json": this.generateThemeConfig(),
            "tsconfig.json": this.generateTSConfig(),
            "app/layout.tsx": await this.generateRootLayout(),
            "app/not-found.tsx": this.generateNotFoundPage(),
            "app/theme.ts": this.generateTheme(),
            "app/api/mcp/route.ts": this.generateMCPRoutes(),
            "app/api/rag/route.ts": this.generateRagRoutes(),
            "app/api/theme/route.ts": this.generateRoutes(),
            "services/mcp/index.ts": this.generateMCPIndex(),
            "services/mcp/server.ts": this.generateMCPServer(),
            "services/mcp/tools.ts": this.generateMCPTools(),
            "services/mcp/types.ts": this.generateMCPTypes(),
            "services/llm/config.ts": this.generateLLMConfig(),
            "services/llm/factory.ts": this.generateLLMFactory(),
            "services/llm/index.ts": this.generateLLMIndex(),
            "services/llm/types.ts": this.generateLLMTypes(),
            "types/styled.d.ts": this.generateStyledDTypes(),
            "utils/orderNavItems.ts": this.generateOrderNavItems(),
            "components/Chat.tsx": this.generateChat(),
            "components/ClickOutside.ts": this.generateClickOutside(),
            "components/Docs.tsx": this.generateDocs(),
            "components/DocsSideBar.tsx": this.generateDocsSideBar(),
            "components/MDXComponents.tsx": this.generateMDXComponents(),
            "components/SideBar.tsx": this.generateSideBar(),
            "components/layout/Accordion.tsx": this.generateAccordion(),
            "components/layout/ActionBar.tsx": this.generateActionBar(),
            "components/layout/Button.tsx": this.generateButton(),
            "components/layout/Callout.tsx": this.generateCallout(),
            "components/layout/Card.tsx": this.generateCard(),
            "components/layout/CherryThemeProvider.tsx": this.generateCherryThemeProvider(),
            "components/layout/ClientThemeProvider.tsx": this.generateClientThemeProvider(),
            "components/layout/Code.tsx": this.generateCode(),
            "components/layout/Columns.tsx": this.generateColumns(),
            "components/layout/DemoTheme.tsx": this.generateDemoTheme(),
            "components/layout/DocsComponents.tsx": this.generateDocsComponents(),
            "components/layout/DocsNavigation.tsx": this.generateDocsNavigation(),
            "components/layout/Field.tsx": this.generateField(),
            "components/layout/Footer.tsx": this.generateFooter(),
            "components/layout/GlobalStyles.ts": this.generateGlobalStyles(),
            "components/layout/Header.tsx": this.generateHeader(),
            "components/layout/Icon.tsx": this.generateIcon(),
            "components/layout/Pictograms.tsx": this.generatePictograms(),
            "components/layout/SharedStyled.ts": this.generateSharedStyled(),
            "components/layout/StaticLinks.tsx": this.generateStaticLinks(),
            "components/layout/Steps.tsx": this.generateSteps(),
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
            "ai-assistant.mdx": this.generateAiAssistantMdx(),
            "buttons.mdx": this.generateButtonsMdx(),
            "callouts.mdx": this.generateCalloutsMdx(),
            "cards.mdx": this.generateCardsMdx(),
            "code.mdx": this.generateCodeMdx(),
            "columns.mdx": this.generateColumnsMdx(),
            "commands.mdx": this.generateCommandsMdx(),
            "deployment.mdx": this.generateDeploymentMdx(),
            "fields.mdx": this.generateFieldsMdx(),
            "fonts.mdx": this.generateFontsMdx(),
            "globals.mdx": this.generateGlobalsMdx(),
            "headers-and-text.mdx": this.generateHeadersAndTextMdx(),
            "icons.mdx": this.generateIconsMdx(),
            "image-and-embeds.mdx": this.generateImagesAndEmbedsMdx(),
            "index.mdx": this.generateIndexMdx(),
            "links.mdx": this.generateLinksMdx(),
            "lists-and-tables.mdx": this.generateListsAndTablesMdx(),
            "media-and-assets.mdx": this.generateMediaAndAssetsMdx(),
            "model-context-protocol.mdx": this.generateMCPMdx(),
            "navigation.mdx": this.generateNavigationMdx(),
            "steps.mdx": this.generateStepsMdx(),
            "tabs.mdx": this.generateTabsMdx(),
            "theme.mdx": this.generateThemeMdx(),
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
    async copyFontConfig() {
        console.log(chalk.blue(`🔍 Checking for font configuration...`));
        const sourcePath = path.join(this.rootDir, this.fontConfigFile);
        const destPath = path.join(this.outputDir, this.fontConfigFile);
        if (await fs.pathExists(sourcePath)) {
            await fs.copy(sourcePath, destPath);
            console.log(chalk.green(`  ✓ Copied ${this.fontConfigFile} to Next.js app`));
        }
        else {
            console.log(chalk.gray(`  ✗ ${this.fontConfigFile} not found, skipping`));
        }
    }
    async loadFontConfig() {
        const fontPath = path.join(this.rootDir, this.fontConfigFile);
        try {
            if (await fs.pathExists(fontPath)) {
                const fontContent = await fs.readFile(fontPath, "utf8");
                return JSON.parse(fontContent);
            }
        }
        catch (error) {
            console.warn(chalk.yellow(`⚠️ Error reading ${this.fontConfigFile}`), error);
        }
        return null;
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
    async handleFontConfigChange() {
        console.log(chalk.cyan(`🔤 Font configuration changed`));
        const sourcePath = path.join(this.rootDir, this.fontConfigFile);
        const destPath = path.join(this.outputDir, this.fontConfigFile);
        try {
            await fs.copy(sourcePath, destPath);
            console.log(chalk.green(`📋 Updated ${this.fontConfigFile} in Next.js app`));
            // Update the layout template with new font config
            await this.updateRootLayout();
            console.log(chalk.green(`✅ Layout updated with new font configuration`));
        }
        catch (error) {
            console.error(chalk.red(`❌ Error updating font configuration:`), error);
        }
    }
    async handleFontConfigDelete() {
        console.log(chalk.red(`🗑️ Font configuration deleted`));
        const destPath = path.join(this.outputDir, this.fontConfigFile);
        try {
            if (await fs.pathExists(destPath)) {
                await fs.remove(destPath);
                console.log(chalk.yellow(`🗑️ Removed ${this.fontConfigFile} from Next.js app`));
                // Update the layout template without font config
                await this.updateRootLayout();
                console.log(chalk.green(`✅ Layout updated without font configuration`));
            }
        }
        catch (error) {
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
        }
        else {
            console.log(chalk.gray(`  ✗ public directory not found, skipping`));
        }
    }
    async handlePublicFileChange(filePath) {
        const publicDir = path.join(this.rootDir, "public");
        const relativePath = path.relative(publicDir, filePath);
        const destPath = path.join(this.outputDir, "public", relativePath);
        try {
            await fs.ensureDir(path.dirname(destPath));
            await fs.copy(filePath, destPath);
            console.log(chalk.green(`📋 Updated public/${relativePath} in Next.js app`));
        }
        catch (error) {
            console.error(chalk.red(`❌ Error copying public/${relativePath}:`), error);
        }
    }
    async handlePublicFileDelete(filePath) {
        const publicDir = path.join(this.rootDir, "public");
        const relativePath = path.relative(publicDir, filePath);
        const destPath = path.join(this.outputDir, "public", relativePath);
        try {
            if (await fs.pathExists(destPath)) {
                await fs.remove(destPath);
                console.log(chalk.yellow(`🗑️ Removed public/${relativePath} from Next.js app`));
            }
        }
        catch (error) {
            console.error(chalk.red(`❌ Error removing public/${relativePath}:`), error);
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
            .on("error", (error) => {
            console.error(chalk.red("❌ Font watcher error:"), error);
        });
        const publicDir = path.join(this.rootDir, "public");
        if (await fs.pathExists(publicDir)) {
            this.publicWatcher = chokidar.watch(publicDir, {
                persistent: true,
                ignoreInitial: true,
            });
            this.publicWatcher
                .on("add", (filePath) => {
                console.log(chalk.cyan(`📁 Public file added: ${path.relative(publicDir, filePath)}`));
                this.handlePublicFileChange(filePath);
            })
                .on("change", (filePath) => {
                console.log(chalk.cyan(`📁 Public file changed: ${path.relative(publicDir, filePath)}`));
                this.handlePublicFileChange(filePath);
            })
                .on("unlink", (filePath) => {
                console.log(chalk.red(`🗑️ Public file deleted: ${path.relative(publicDir, filePath)}`));
                this.handlePublicFileDelete(filePath);
            })
                .on("error", (error) => {
                console.error(chalk.red("❌ Public watcher error:"), error);
            });
        }
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
    generateEnvExample() {
        return envExampleTemplate;
    }
    generateGitIgnore() {
        return gitignoreTemplate;
    }
    generateConfig() {
        return `{}`;
    }
    generateESLintConfig() {
        return eslintConfigTeamplate;
    }
    generateLinksConfig() {
        return `[]`;
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
    generateProxy() {
        return proxyTemplate;
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
        const fontConfig = await this.loadFontConfig();
        return layoutTemplate(pages, fontConfig);
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
import configData from "@/config.json";

interface Config {
  name?: string;
  description?: string;
  icon?: string;
  preview?: string;
}

const config = configData as Config;

const content = \`${mdxFile.content.replace(/`/g, "\\`")}\`;

export const metadata: Metadata = {
  title: \`${mdxFile.frontmatter.title || "Generated with Doccupine"} \${config.name ? "- " + config.name : "- Doccupine"}\`,
  description: \`${mdxFile.frontmatter.description ? mdxFile.frontmatter.description : '${config.description ? config.description : "Generated with Doccupine"}'}\`,
  icons: \`${mdxFile.frontmatter.icon ? mdxFile.frontmatter.icon : '\${config.icon || "https://doccupine.com/favicon.ico"}'}\`,
  openGraph: {
    title: \`${mdxFile.frontmatter.title || "Generated with Doccupine"} \${config.name ? "- " + config.name : "- Doccupine"}\`,
    description: \`${mdxFile.frontmatter.description ? mdxFile.frontmatter.description : '${config.description ? config.description : "Generated with Doccupine"}'}\`,
    images: \`${mdxFile.frontmatter.image ? mdxFile.frontmatter.image : '\${config.preview || "https://doccupine.com/preview.png"}'}\`,
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
                    icon: frontmatter.icon,
                    image: frontmatter.image,
                };
            }
        }
        const indexContent = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";
import configData from "@/config.json";

interface Config {
  name?: string;
  description?: string;
  icon?: string;
  preview?: string;
}

const config = configData as Config;

${indexMDX ? `const content = \`${indexMDX.content.replace(/`/g, "\\`")}\`;` : `const content = null;`}

${indexMDX
            ? `export const metadata: Metadata = {
  title: \`\${config.name ? config.name + " -" : "Doccupine -"} ${indexMDX.title}\`,
  description: \`${indexMDX.description ? indexMDX.description : '${config.description ? config.description : "Generated with Doccupine"}'}\`,
  icons: \`${indexMDX.icon ? indexMDX.icon : '\${config.icon || "https://doccupine.com/favicon.ico"}'}\`,
  openGraph: {
    title: \`\${config.name ? config.name + " -" : "Doccupine -"} ${indexMDX.title}\`,
    description: \`${indexMDX.description ? indexMDX.description : '${config.description ? config.description : "Generated with Doccupine"}'}\`,
    images: \`${indexMDX.image ? indexMDX.image : '\${config.preview || "https://doccupine.com/preview.png"}'}\`,
  },
};`
            : `export const metadata: Metadata = {
  title: \`\${config.name || "Doccupine"}\`,
  description: \`\${config.description || "Generated with Doccupine"}\`,
  icons: \`\${config.icon || "https://doccupine.com/favicon.ico"}\`,
  openGraph: {
    title: \`\${config.name || "Doccupine"}\`,
    description: \`\${config.description || "Generated with Doccupine"}\`,
    images: \`\${config.preview || "https://doccupine.com/preview.png"}\`,
  },
};`}

export default function Home() {
  return <Docs content={content} />;
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
    generateMCPRoutes() {
        return mcpRoutesTemplate;
    }
    generateRagRoutes() {
        return ragRoutesTemplate;
    }
    generateRoutes() {
        return routesTemplate;
    }
    generateMCPIndex() {
        return mcpIndexTemplate;
    }
    generateMCPServer() {
        return mcpServerTemplate;
    }
    generateMCPTools() {
        return mcpToolsTemplate;
    }
    generateMCPTypes() {
        return mcpTypesTemplate;
    }
    generateLLMConfig() {
        return llmConfigTemplate;
    }
    generateLLMFactory() {
        return llmFactoryTemplate;
    }
    generateLLMIndex() {
        return llmIndexTemplate;
    }
    generateLLMTypes() {
        return llmTypesTemplate;
    }
    generateStyledDTypes() {
        return styledDTemplate;
    }
    generateOrderNavItems() {
        return orderNavItemsTemplate;
    }
    generateChat() {
        return chatTemplate;
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
    generateActionBar() {
        return actionBarTemplate;
    }
    generateButton() {
        return buttonTemplate;
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
    generateDemoTheme() {
        return demoThemeTemplate;
    }
    generateDocsComponents() {
        return docsComponentsTemplate;
    }
    generateDocsNavigation() {
        return docsNavigationTemplate;
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
    generateStaticLinks() {
        return staticLinksTemplate;
    }
    generateSteps() {
        return stepsTemplate;
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
    generateAiAssistantMdx() {
        return aiAssistantMdxTemplate;
    }
    generateButtonsMdx() {
        return buttonsMdxTemplate;
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
    generateDeploymentMdx() {
        return deploymentMdxTemplate;
    }
    generateFieldsMdx() {
        return fieldsMdxTemplate;
    }
    generateFontsMdx() {
        return fontsMdxTemplate;
    }
    generateGlobalsMdx() {
        return globalsMdxTemplate;
    }
    generateHeadersAndTextMdx() {
        return headersAndTextMdxTemplate;
    }
    generateIconsMdx() {
        return iconsMdxTemplate;
    }
    generateImagesAndEmbedsMdx() {
        return imageAndEmbedsMdxTemplate;
    }
    generateIndexMdx() {
        return indexMdxTemplate;
    }
    generateLinksMdx() {
        return linksMdxTemplate;
    }
    generateListsAndTablesMdx() {
        return listAndTablesMdxTemplate;
    }
    generateMediaAndAssetsMdx() {
        return mediaAndAssetsMdxTemplate;
    }
    generateMCPMdx() {
        return mcpMdxTemplate;
    }
    generateNavigationMdx() {
        return navigationMdxTemplate;
    }
    generateStepsMdx() {
        return stepsMdxTemplate;
    }
    generateTabsMdx() {
        return tabsMdxTemplate;
    }
    generateThemeMdx() {
        return themeMdxTemplate;
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
        if (this.fontWatcher) {
            await this.fontWatcher.close();
            console.log(chalk.yellow("👋 Stopped watching for font config changes"));
        }
        if (this.publicWatcher) {
            await this.publicWatcher.close();
            console.log(chalk.yellow("👋 Stopped watching for public directory changes"));
        }
    }
}
program
    .name("doccupine")
    .description("Watch MDX files and generate Next.js documentation pages automatically")
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
    const generator = new MDXToNextJSGenerator(config.watchDir, config.outputDir);
    await generator.init();
    let devServer = null;
    console.log(chalk.blue("📦 Installing dependencies..."));
    const { spawn, execSync } = await import("child_process");
    // Check if pnpm is available, fallback to npm
    let packageManager = "npm";
    try {
        execSync("pnpm --version", { stdio: "ignore" });
        packageManager = "pnpm";
    }
    catch {
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
