import fs from "fs-extra";
import path from "node:path";

import {
  appStructure,
  obsoleteFiles,
  startingDocsStructure,
} from "../lib/structures.js";
import { resolveOutputPath } from "../lib/output-safety.js";
import type { AnalyticsConfig } from "../lib/types.js";
import { writeFileAtomic } from "../lib/utils.js";
import { robotsTemplate } from "../templates/app/robots.js";
import { nextConfigTemplate } from "../templates/next.config.js";
import { pnpmWorkspaceTemplate } from "../templates/pnpmWorkspace.js";
import { proxyTemplate } from "../templates/proxy.js";

interface AppStructureCallbacks {
  generateRootLayout(): Promise<string>;
  generateSiteLayout(): Promise<string>;
  updateSitemap(): Promise<void>;
  updateLlmsFiles(): Promise<void>;
}

interface StarterDocumentCallbacks {
  getAllMdxFiles(): Promise<string[]>;
  ensureSafeStarterPath(relativePath: string): Promise<string>;
}

export class AppScaffolder {
  constructor(private readonly outputDir: string) {}

  private outputPath(...segments: string[]): string {
    return resolveOutputPath(this.outputDir, ...segments);
  }

  async createNextJsStructure(
    analyticsConfig: AnalyticsConfig | null,
    callbacks: AppStructureCallbacks,
  ): Promise<void> {
    // Everything under app/ is generated, so clear stale routes before writing
    // the current structure. Other generated directories remain untouched.
    await fs.remove(this.outputPath("app"));

    await Promise.all(
      obsoleteFiles.map((file) => fs.remove(this.outputPath(file))),
    );

    const structure: Record<string, string | Promise<string>> = {
      ...appStructure,
      "next.config.ts": nextConfigTemplate(analyticsConfig),
      "pnpm-workspace.yaml": pnpmWorkspaceTemplate,
      "proxy.ts": proxyTemplate(analyticsConfig),
      "analytics.json": `{}\n`,
      "config.json": `{}\n`,
      "links.json": `[]\n`,
      "navigation.json": `[]\n`,
      "sections.json": `[]\n`,
      "theme.json": `{}\n`,
      "app/robots.ts": robotsTemplate,
      "app/layout.tsx": callbacks.generateRootLayout(),
      "app/(site)/layout.tsx": callbacks.generateSiteLayout(),
    };

    for (const [filePath, content] of Object.entries(structure)) {
      const fullPath = this.outputPath(filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await writeFileAtomic(fullPath, String(await content));
    }

    await callbacks.updateSitemap();
    await callbacks.updateLlmsFiles();
  }

  async createStartingDocs(callbacks: StarterDocumentCallbacks): Promise<void> {
    if ((await callbacks.getAllMdxFiles()).length > 0) return;

    for (const [filePath, content] of Object.entries(startingDocsStructure)) {
      const fullPath = await callbacks.ensureSafeStarterPath(filePath);
      await writeFileAtomic(fullPath, String(content));
    }
  }
}
