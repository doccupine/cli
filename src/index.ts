#!/usr/bin/env node

import { program } from "commander";
import chokidar, { FSWatcher } from "chokidar";
import fs from "fs-extra";
import path from "path";
import matter from "gray-matter";
import chalk from "chalk";
import prompts from "prompts";
import { gitignoreTemplate } from "./templates/gitignore.js";
import { homeTemplate } from "./templates/home.js";
import { notFoundTemplate } from "./templates/not-found.js";
import { layoutTemplate } from "./templates/layout.js";
import { themeTemplate } from "./templates/theme.js";
import { iconTemplate } from "./templates/components/layout/Icon.js";
import { pictogramsTemplate } from "./templates/components/layout/Pictograms.js";
import { typographyTemplate } from "./templates/components/layout/Typography.js";
import { headerTemplate } from "./templates/components/layout/Header.js";
import { footerTemplate } from "./templates/components/layout/Footer.js";
import { themeToggleTemplate } from "./templates/components/layout/ThemeToggle.js";
import { sharedStyledTemplate } from "./templates/components/layout/SharedStyles.js";
import { codeTemplate } from "./templates/components/layout/Code.js";
import { docsComponentsTemplate } from "./templates/components/layout/DocsComponents.js";
import { clickOutsideTemplate } from "./templates/components/ClickOutside.js";
import { docsTemplate } from "./templates/components/Docs.js";
import { orderNavItemsTemplate } from "./templates/utils/orderNavItems.js";
import { sideBarTemplate } from "./templates/components/SideBar.js";

interface MDXFile {
  path: string;
  content: string;
  frontmatter: Record<string, any>;
  slug: string;
}

class MDXToNextJSGenerator {
  private watchDir: string;
  private outputDir: string;
  private watcher: FSWatcher | null = null;

  constructor(watchDir: string, outputDir: string) {
    this.watchDir = path.resolve(watchDir);
    this.outputDir = path.resolve(outputDir);
  }

  async init() {
    console.log(chalk.blue("🚀 Initializing MDX to Next.js generator..."));

    // Ensure directories exist
    await fs.ensureDir(this.watchDir);
    await fs.ensureDir(this.outputDir);

    // Create initial Next.js structure
    await this.createNextJSStructure();

    // Process existing files
    await this.processAllMDXFiles();

    console.log(chalk.green("✅ Initial setup complete!"));
    console.log(chalk.cyan("💡 To start the Next.js dev server:"));
    console.log(
      chalk.white(`   cd ${path.relative(process.cwd(), this.outputDir)}`),
    );
    console.log(chalk.white("   npm install && npm run dev"));
  }

  async createNextJSStructure() {
    const structure = {
      ".gitignore": this.generateGitIgnore(),
      "package.json": this.generatePackageJson(),
      "next.config.ts": this.generateNextConfig(),
      "tsconfig.json": this.generateTSConfig(),
      "app/layout.tsx": await this.generateRootLayout(),
      "app/page.tsx": this.generateHomePage(),
      "app/not-found.tsx": this.generateNotFoundPage(),
      "app/theme.ts": this.generateTheme(),
      "components/layout/Icon.tsx": this.generateIcon(),
      "components/layout/Pictograms.tsx": this.generatePictograms(),
      "components/layout/Typography.ts": this.generateTypography(),
      "components/layout/Header.tsx": this.generateHeader(),
      "components/layout/Footer.tsx": this.generateFooter(),
      "components/layout/ThemeToggle.tsx": this.generateThemeToggle(),
      "components/layout/SharedStyled.ts": this.generateSharedStyled(),
      "components/layout/Code.tsx": this.generateCode(),
      "components/layout/DocsComponents.tsx": this.generateDocsComponents(),
      "components/ClickOutside.ts": this.generateClickOutside(),
      "components/Docs.tsx": this.generateDocs(),
      "components/SideBar.tsx": this.generateSideBar(),
      "utils/orderNavItems.ts": this.generateOrderNavItems(),
    };

    for (const [filePath, content] of Object.entries(structure)) {
      const fullPath = path.join(this.outputDir, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, String(content), "utf8");
    }
  }

  async startWatching() {
    console.log(chalk.yellow(`👀 Watching for changes in: ${this.watchDir}`));

    this.watcher = chokidar.watch("**/*.mdx", {
      cwd: this.watchDir,
      persistent: true,
      ignoreInitial: false,
    });

    this.watcher
      .on("add", (filePath: string) => this.handleFileChange("added", filePath))
      .on("change", (filePath: string) =>
        this.handleFileChange("changed", filePath),
      )
      .on("unlink", (filePath: string) => this.handleFileDelete(filePath));
  }

  async handleFileChange(action: string, filePath: string) {
    console.log(chalk.cyan(`📝 File ${action}: ${filePath}`));

    const fullPath = path.join(this.watchDir, filePath);

    try {
      const content = await fs.readFile(fullPath, "utf8");
      const { data: frontmatter, content: mdxContent } = matter(content);

      if (filePath === "index.mdx" || filePath === "./index.mdx") {
        console.log(chalk.blue("🏠 Updating homepage with index.mdx content"));
        await this.updatePagesIndex();
        await this.updateRootLayout();
      } else {
        const mdxFile: MDXFile = {
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
    } catch (error) {
      console.error(chalk.red(`❌ Error processing ${filePath}:`), error);
    }
  }

  async handleFileDelete(filePath: string) {
    console.log(chalk.red(`🗑️ File deleted: ${filePath}`));

    try {
      if (filePath === "index.mdx" || filePath === "./index.mdx") {
        console.log(chalk.blue("🏠 Updating homepage - index.mdx deleted"));
        await this.updatePagesIndex();
        await this.updateRootLayout();
      } else {
        const slug = this.generateSlug(filePath);
        const pagePath = path.join(this.outputDir, "app", slug);
        await fs.remove(pagePath);
        await this.updatePagesIndex();
        await this.updateRootLayout();
      }

      console.log(chalk.green(`✅ Removed page for: ${filePath}`));
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

  generateSlug(filePath: string): string {
    if (filePath === "index.mdx" || filePath === "./index.mdx") {
      return "";
    }

    return filePath
      .replace(/\.mdx$/, "")
      .replace(/\\/g, "/")
      .replace(/[^a-zA-Z0-9\/\-_]/g, "-")
      .toLowerCase();
  }

  async generatePageFromMDX(mdxFile: MDXFile) {
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

const content = \`${mdxFile.content.replace(/`/g, "\\`")}\`;

export const metadata: Metadata = {
  title: '${mdxFile.frontmatter.title || "Generated with Doccupine"}',
  description: '${mdxFile.frontmatter.description || "Automatically generated from MDX files using Doccupine"}',
};

export default function Page() {
  return (
    <Docs content={content} />
  );
}`;

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
        };
      }
    }

    const indexContent = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";

${indexMDX ? `const indexContent = \`${indexMDX.content.replace(/`/g, "\\`")}\`;` : `const indexContent = null;`}

${
  indexMDX
    ? `export const metadata: Metadata = {
  title: '${indexMDX.title}',
  description: '${indexMDX.description}',
};`
    : `export const metadata: Metadata = {
  title: 'Generated with Doccupine',
  description: 'Automatically generated from MDX files using Doccupine',
};`
} 

export default function Home() {
  return (
    <Docs content={indexContent} />
  );
}`;

    await fs.writeFile(
      path.join(this.outputDir, "app", "page.tsx"),
      indexContent,
      "utf8",
    );
  }

  generateGitIgnore(): string {
    return gitignoreTemplate;
  }

  // Configuration file generators
  generatePackageJson(): string {
    return JSON.stringify(
      {
        name: "doccupine",
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint",
        },
        dependencies: {
          next: "15.5.2",
          react: "19.1.1",
          "react-dom": "19.1.1",
        },
        devDependencies: {
          "@types/node": "^24",
          "@types/react": "^19",
          "@types/react-dom": "^19",
          "cherry-styled-components": "^0.1.0-43",
          eslint: "^9",
          "eslint-config-next": "15.5.2",
          "lucide-react": "^0.542.0",
          polished: "^4.3.1",
          prettier: "^3.6.2",
          "react-markdown": "^10.1.0",
          "rehype-highlight": "^7.0.2",
          "rehype-parse": "^9.0.1",
          "rehype-stringify": "^10.0.1",
          "remark-gfm": "^4.0.1",
          "styled-components": "^6.1.19",
          typescript: "^5",
        },
      },
      null,
      2,
    );
  }

  generateNextConfig(): string {
    return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ["lucide-react"],
};

export default nextConfig;
`;
  }

  generateTSConfig(): string {
    return JSON.stringify(
      {
        compilerOptions: {
          target: "es5",
          lib: ["dom", "dom.iterable", "es6"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
          baseUrl: ".",
          paths: {
            "@/*": ["./*"],
          },
        },
        include: [
          "next-env.d.ts",
          "**/*.ts",
          "**/*.tsx",
          ".next/types/**/*.ts",
        ],
        exclude: ["node_modules"],
      },
      null,
      2,
    );
  }

  async generateRootLayout(): Promise<string> {
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

  async updateRootLayout() {
    const layoutContent = await this.generateRootLayout();
    await fs.writeFile(
      path.join(this.outputDir, "app", "layout.tsx"),
      layoutContent,
      "utf8",
    );
  }

  generateHomePage(): string {
    return homeTemplate;
  }

  generateNotFoundPage(): string {
    return notFoundTemplate;
  }

  generateTheme(): string {
    return themeTemplate;
  }

  generateIcon(): string {
    return iconTemplate;
  }

  generatePictograms(): string {
    return pictogramsTemplate;
  }

  generateClickOutside(): string {
    return clickOutsideTemplate;
  }

  generateTypography(): string {
    return typographyTemplate;
  }

  generateHeader(): string {
    return headerTemplate;
  }

  generateFooter(): string {
    return footerTemplate;
  }

  generateThemeToggle(): string {
    return themeToggleTemplate;
  }

  generateSharedStyled(): string {
    return sharedStyledTemplate;
  }

  generateCode(): string {
    return codeTemplate;
  }

  generateDocsComponents(): string {
    return docsComponentsTemplate;
  }

  generateDocs(): string {
    return docsTemplate;
  }

  generateSideBar(): string {
    return sideBarTemplate;
  }

  generateOrderNavItems(): string {
    return orderNavItemsTemplate;
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      console.log(chalk.yellow("👋 Stopped watching for changes"));
    }
  }
}

// CLI Commands
program
  .name("doccupine")
  .description(
    "Watch MDX files and generate Next.js documentation pages automatically",
  )
  .version("0.0.1");

program
  .command("watch", { isDefault: true })
  .description("Watch a directory for MDX changes and generate Next.js app")
  .option("--port <port>", "Port for Next.js dev server", "3000")
  .option("--verbose", "Show verbose output")
  .action(async (options) => {
    type PromptResult = { watchDir: string; outputDir: string };

    const questions: prompts.PromptObject[] = [
      {
        type: "text",
        name: "watchDir",
        message: "Enter directory to watch for MDX files:",
        initial: "docs",
      },
      {
        type: "text",
        name: "outputDir",
        message: "Enter output directory for Next.js app:",
        initial: "nextjs-app",
      },
    ];

    const { watchDir: watchDirInput, outputDir: outputDirInput } =
      (await prompts(questions)) as PromptResult;
    const watchDir = path.resolve(process.cwd(), watchDirInput);
    const outputDir = path.resolve(process.cwd(), outputDirInput);

    const generator = new MDXToNextJSGenerator(watchDir, outputDir);

    await generator.init();

    let devServer: any = null;

    console.log(chalk.blue("📦 Installing dependencies..."));
    const { spawn } = await import("child_process");

    // Install dependencies first
    const install = spawn("npm", ["install"], {
      cwd: outputDir,
      stdio: "pipe",
    });

    await new Promise((resolve, reject) => {
      install.on("close", (code) => {
        if (code === 0) {
          console.log(chalk.green("✅ Dependencies installed"));
          resolve(void 0);
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
      install.on("error", reject);
    });

    // Start dev server
    console.log(
      chalk.blue(`🚀 Starting Next.js dev server on port ${options.port}...`),
    );
    devServer = spawn("npm", ["run", "dev", "--", "--port", options.port], {
      cwd: outputDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    devServer.stdout.on("data", (data: Buffer) => {
      const output = data.toString();
      if (output.includes("Ready") || output.includes("started")) {
        console.log(
          chalk.green(`🌐 Next.js ready at http://localhost:${options.port}`),
        );
      }
      // Filter out noisy Next.js logs, show important ones
      if (
        output.includes("compiled") ||
        output.includes("error") ||
        output.includes("Ready")
      ) {
        process.stdout.write(chalk.gray("[Next.js] ") + output);
      }
    });

    if (options.verbose) {
      devServer.stderr.on("data", (data: Buffer) => {
        process.stderr.write(chalk.red("[Next.js Error] ") + data.toString());
      });
    }

    devServer.on("error", (error: any) => {
      console.error(chalk.red("❌ Error starting dev server:"), error);
    });

    await generator.startWatching();

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log(chalk.yellow("\n🛑 Shutting down..."));
      generator.stop();
      if (devServer) {
        devServer.kill();
      }
      process.exit(0);
    });

    console.log(chalk.green("🎉 Generator is running! Press Ctrl+C to stop."));
    if (options.dev) {
      console.log(chalk.cyan(`📝 Edit your MDX files in: ${watchDir}`));
      console.log(
        chalk.cyan(`🌐 View changes at: http://localhost:${options.port}`),
      );
    }
  });

program
  .command("build")
  .description("One-time build of Next.js app from MDX files")
  .action(async () => {
    type PromptResult = { watchDir: string; outputDir: string };

    const questions: prompts.PromptObject[] = [
      {
        type: "text",
        name: "watchDir",
        message: "Enter directory to watch for MDX files:",
        initial: "docs",
      },
      {
        type: "text",
        name: "outputDir",
        message: "Enter output directory for Next.js app:",
        initial: "nextjs-app",
      },
    ];

    const { watchDir: watchDirInput, outputDir: outputDirInput } =
      (await prompts(questions)) as PromptResult;
    const watchDir = path.resolve(process.cwd(), watchDirInput);
    const outputDir = path.resolve(process.cwd(), outputDirInput);

    const generator = new MDXToNextJSGenerator(watchDir, outputDir);
    await generator.init();
    console.log(chalk.green("🎉 Build complete!"));
  });

program.parse();
