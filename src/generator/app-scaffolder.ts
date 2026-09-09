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
  updateIconRegistry(): Promise<void>;
}

interface StarterDocumentCallbacks {
  writeStarterFilesIfEmpty(
    files: Iterable<readonly [string, string | Uint8Array]>,
  ): Promise<void>;
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
    // Render the layouts before touching the output: both read the docs
    // sources and abort on a broken project (route collision, misplaced
    // language folder), and a promise created eagerly here would reject as
    // unhandled while the loop below is still writing earlier files.
    const rootLayout = await callbacks.generateRootLayout();
    const siteLayout = await callbacks.generateSiteLayout();

    // Everything under app/ is generated, so clear stale routes before writing
    // the current structure. Other generated directories remain untouched.
    await fs.remove(this.outputPath("app"));

    await Promise.all(
      obsoleteFiles.map((file) => fs.remove(this.outputPath(file))),
    );

    const structure: Record<string, string> = {
      ...appStructure,
      "next.config.ts": nextConfigTemplate(analyticsConfig),
      "pnpm-workspace.yaml": pnpmWorkspaceTemplate,
      "proxy.ts": proxyTemplate(analyticsConfig),
      "analytics.json": `{}\n`,
      "config.json": `{}\n`,
      "icons.json": `{}\n`,
      "languages.json": `[]\n`,
      "links.json": `[]\n`,
      "navigation.json": `[]\n`,
      "sections.json": `[]\n`,
      "theme.json": `{}\n`,
      "versions.json": `[]\n`,
      "app/robots.ts": robotsTemplate,
      "app/layout.tsx": rootLayout,
      "app/(site)/layout.tsx": siteLayout,
    };

    for (const [filePath, content] of Object.entries(structure)) {
      const fullPath = this.outputPath(filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await writeFileAtomic(fullPath, content);
    }

    await callbacks.updateSitemap();
    await callbacks.updateLlmsFiles();
    await callbacks.updateIconRegistry();
  }

  async createStartingDocs(callbacks: StarterDocumentCallbacks): Promise<void> {
    await callbacks.writeStarterFilesIfEmpty(
      Object.entries(startingDocsStructure),
    );
  }
}
