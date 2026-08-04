import chalk from "chalk";
import fs from "fs-extra";
import path from "node:path";

import { GeneratedArtifacts } from "../lib/generated-artifacts.js";
import { resolveOutputPath, resolveWithin } from "../lib/output-safety.js";
import { writeFileAtomic } from "../lib/utils.js";
import type { PageWithBody } from "../templates/llms/llmsFull.js";
import { llmsPageTemplate } from "../templates/llms/llmsPage.js";
import { siteDocsSlug } from "../templates/llms/skillMd.js";
import { SecureSourceFs } from "./secure-source-fs.js";

const PUBLIC_AGGREGATE_PATHS = new Set([
  "llms.txt",
  "llms-full.txt",
  "skill.md",
  ".well-known/mcp.json",
]);

function normalizePublicArtifactPath(relativePath: string): string {
  return relativePath.replace(/\\/g, "/").toLowerCase();
}

function isPublicAggregate(relativePath: string): boolean {
  return PUBLIC_AGGREGATE_PATHS.has(normalizePublicArtifactPath(relativePath));
}

function isManagedPublicArtifact(relativePath: string): boolean {
  const normalized = normalizePublicArtifactPath(relativePath);
  return PUBLIC_AGGREGATE_PATHS.has(normalized) || normalized.endsWith(".md");
}

function publicDestinationRelativePath(relativePath: string): string {
  return isPublicAggregate(relativePath)
    ? normalizePublicArtifactPath(relativePath)
    : relativePath.replace(/\\/g, "/");
}

export class PublicAssetManager {
  constructor(
    private readonly rootDir: string,
    private readonly outputDir: string,
    private readonly artifacts: GeneratedArtifacts,
    private readonly sourceFs: SecureSourceFs,
  ) {}

  private outputPath(...segments: string[]): string {
    return resolveOutputPath(this.outputDir, ...segments);
  }

  publicOutputFilePath(relativePath: string): string {
    const parent = path.dirname(relativePath);
    const outputParent =
      parent === "."
        ? this.outputPath("public")
        : this.outputPath("public", parent);
    return resolveWithin(outputParent, path.basename(relativePath));
  }

  async copyRegularPublicFile(
    sourcePath: string,
    destPath: string,
  ): Promise<void> {
    const { data } = await this.sourceFs.readPublicSourceFile(sourcePath);
    await writeFileAtomic(destPath, data);
  }

  // A tracked root icon file already publishes this URL. Refuse the copy so
  // the two sources cannot silently overwrite each other.
  private assertNotTrackedIconFile(
    destRelativePath: string,
    relativePath: string,
  ): void {
    if (this.artifacts.iconFiles().has(destRelativePath)) {
      throw new Error(
        `Conflicting icon sources: ${path.join(this.rootDir, destRelativePath)} ` +
          `and ${path.join(this.rootDir, "public", relativePath)} both ` +
          `publish public/${destRelativePath}. Remove one of them.`,
      );
    }
  }

  async copyPublicFiles(): Promise<void> {
    const publicDir = path.join(this.rootDir, "public");
    const previousFiles = this.artifacts.publicFiles();

    console.log(chalk.blue(`🔍 Checking for public directory...`));

    const files = await this.sourceFs.scanPublicFiles();
    if (files === null) {
      console.log(chalk.gray(`  ✗ public directory not found, skipping`));
      for (const stale of previousFiles) {
        await fs.remove(this.publicOutputFilePath(stale));
      }
      this.artifacts.replacePublicFiles([]);
      await this.artifacts.save();
      return;
    }
    const nextFiles = new Set<string>();
    const nextByFoldedPath = new Map<string, string>();
    for (const relativePath of files) {
      const destRelativePath = publicDestinationRelativePath(relativePath);
      this.assertNotTrackedIconFile(destRelativePath, relativePath);
      nextFiles.add(destRelativePath);
      nextByFoldedPath.set(destRelativePath.toLowerCase(), destRelativePath);
    }
    const removedBeforeCopy = new Set<string>();
    for (const stale of previousFiles) {
      const replacement = nextByFoldedPath.get(stale.toLowerCase());
      if (
        replacement &&
        replacement !== stale &&
        (await fs.pathExists(this.publicOutputFilePath(replacement)))
      ) {
        await fs.remove(this.publicOutputFilePath(stale));
        removedBeforeCopy.add(stale);
      }
    }
    for (const relativePath of files) {
      const destRelativePath = publicDestinationRelativePath(relativePath);
      await this.copyRegularPublicFile(
        path.join(publicDir, relativePath),
        this.publicOutputFilePath(destRelativePath),
      );
    }
    for (const stale of previousFiles) {
      if (!nextFiles.has(stale) && !removedBeforeCopy.has(stale)) {
        await fs.remove(this.publicOutputFilePath(stale));
      }
    }
    this.artifacts.replacePublicFiles(nextFiles);
    await this.artifacts.save();
    console.log(chalk.green(`  ✓ Copied public directory to Next.js app`));
  }

  async handlePublicFileChange(
    filePath: string,
    restoreGeneratedArtifacts: () => Promise<void>,
  ): Promise<void> {
    const publicDir = path.join(this.rootDir, "public");
    const relativePath = path.relative(publicDir, filePath);
    const destRelativePath = publicDestinationRelativePath(relativePath);
    const destPath = this.publicOutputFilePath(destRelativePath);

    try {
      this.assertNotTrackedIconFile(destRelativePath, relativePath);
      await this.copyRegularPublicFile(filePath, destPath);
      const publicFiles = this.artifacts.publicFiles();
      publicFiles.add(destRelativePath);
      this.artifacts.replacePublicFiles(publicFiles);
      await this.artifacts.save();
      console.log(
        chalk.green(`📋 Updated public/${relativePath} in Next.js app`),
      );
      if (isManagedPublicArtifact(relativePath)) {
        await restoreGeneratedArtifacts();
      }
    } catch (error) {
      console.error(
        chalk.red(`❌ Error copying public/${relativePath}:`),
        error,
      );
      throw error;
    }
  }

  async handlePublicFileDelete(
    filePath: string,
    copyCurrentSource: () => Promise<void>,
    restoreGeneratedArtifacts: () => Promise<void>,
  ): Promise<void> {
    const publicDir = path.join(this.rootDir, "public");
    const relativePath = path.relative(publicDir, filePath);
    const destRelativePath = publicDestinationRelativePath(relativePath);
    const destPath = this.outputPath("public", destRelativePath);

    try {
      // A rapid replace can queue an unlink after the replacement already
      // exists. Copy the current source instead of deleting its fresh mirror.
      if (await fs.pathExists(filePath)) {
        await copyCurrentSource();
        return;
      }
      if (await fs.pathExists(destPath)) {
        await fs.remove(destPath);
        console.log(
          chalk.yellow(`🗑️ Removed public/${relativePath} from Next.js app`),
        );
      }
      const publicFiles = this.artifacts.publicFiles();
      publicFiles.delete(destRelativePath);
      this.artifacts.replacePublicFiles(publicFiles);
      await this.artifacts.save();
      if (isManagedPublicArtifact(relativePath)) {
        await restoreGeneratedArtifacts();
      }
    } catch (error) {
      console.error(
        chalk.red(`❌ Error removing public/${relativePath}:`),
        error,
      );
    }
  }

  async findSourcePublicAsset(relativePath: string): Promise<string | null> {
    return this.sourceFs.findPublicAsset(relativePath);
  }

  async writePublicAggregate(
    relativePath: string,
    content: string,
  ): Promise<void> {
    const sourcePath = await this.findSourcePublicAsset(relativePath);
    const targetPath = this.publicOutputFilePath(relativePath);
    if (sourcePath) {
      console.warn(
        chalk.yellow(
          `⚠️ Skipping generated public/${relativePath}; a project public asset owns that path`,
        ),
      );
      await this.copyRegularPublicFile(sourcePath, targetPath);
      return;
    }

    await fs.ensureDir(path.dirname(targetPath));
    await writeFileAtomic(targetPath, content);
  }

  async syncMcpManifest(
    baseUrl: string | null,
    siteName: string,
  ): Promise<void> {
    const relativePath = ".well-known/mcp.json";
    const outputPath = this.publicOutputFilePath(relativePath);
    const sourcePath = await this.findSourcePublicAsset(relativePath);
    if (sourcePath) {
      console.warn(
        chalk.yellow(
          `⚠️ Skipping generated public/${relativePath}; a project public asset owns that path`,
        ),
      );
      await this.copyRegularPublicFile(sourcePath, outputPath);
    } else if (baseUrl) {
      const content =
        JSON.stringify(
          {
            mcpServers: {
              [siteDocsSlug(siteName)]: {
                url: `${baseUrl}/api/mcp`,
                transport: "streamable-http",
              },
            },
          },
          null,
          2,
        ) + "\n";
      await fs.ensureDir(path.dirname(outputPath));
      await writeFileAtomic(outputPath, content);
    } else if (await fs.pathExists(outputPath)) {
      await fs.remove(outputPath);
    }
  }

  async syncLlmsPageFiles(
    pages: PageWithBody[],
    baseUrl: string | null,
  ): Promise<void> {
    const publicDir = this.outputPath("public");
    const nextRelativePaths = new Set<string>();
    await Promise.all(
      pages.map(async (page) => {
        const relativePath = page.slug === "" ? "index.md" : `${page.slug}.md`;
        if (isPublicAggregate(relativePath)) return;
        const sourcePath = await this.findSourcePublicAsset(relativePath);
        if (sourcePath) {
          console.warn(
            chalk.yellow(
              `⚠️ Skipping generated public/${relativePath}; a project public asset owns that path`,
            ),
          );
          const targetPath = this.publicOutputFilePath(relativePath);
          await this.copyRegularPublicFile(sourcePath, targetPath);
          return;
        }
        const targetPath = this.publicOutputFilePath(relativePath);
        await fs.ensureDir(path.dirname(targetPath));
        await writeFileAtomic(targetPath, llmsPageTemplate(page, baseUrl));
        nextRelativePaths.add(relativePath);
      }),
    );

    const previousRelativePaths = this.artifacts.llmsPageFiles();
    for (const stale of previousRelativePaths) {
      if (!nextRelativePaths.has(stale)) {
        try {
          if (isPublicAggregate(stale)) continue;
          if (await this.findSourcePublicAsset(stale)) continue;
          const stalePath = resolveOutputPath(publicDir, stale);
          if (await fs.pathExists(stalePath)) {
            await fs.remove(stalePath);
          }
        } catch {
          // ignore
        }
      }
    }
    this.artifacts.replaceLlmsPageFiles(nextRelativePaths);
    await this.artifacts.save();
  }
}
