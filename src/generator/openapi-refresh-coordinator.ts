import chalk from "chalk";
import path from "node:path";

import {
  normalizeOpenApiConfig,
  validateConfig,
} from "../lib/config-manager.js";
import type { RouteArtifact } from "../lib/generated-artifacts.js";
import { OpenApiRegistry } from "../lib/openapi.js";
import type {
  DoccupineConfig,
  NormalizedOpenApiSpec,
  PageMeta,
  SectionConfig,
} from "../lib/types.js";
import { SecureSourceFs } from "./secure-source-fs.js";

export interface ApiPageWriteOptions {
  writtenRoutes?: Map<string, string>;
  additionalPreviousRoutes?: Iterable<RouteArtifact>;
}

interface OpenApiRefreshCoordinatorOptions {
  rootDir: string;
  watchDir: string;
  outputDir: string;
  configFile: string;
  apiBaseSlug: string;
  sourceFs: SecureSourceFs;
  getRegistry(): OpenApiRegistry;
  setRegistry(registry: OpenApiRegistry): void;
  getSpecs(): NormalizedOpenApiSpec[];
  setSpecs(specs: NormalizedOpenApiSpec[]): void;
  getSections(): SectionConfig[] | null;
  setSections(sections: SectionConfig[] | null): void;
  getOpenApiRoutes(): RouteArtifact[];
  getSuccessfulMdxPages(): PageMeta[];
  resolveSections(): Promise<SectionConfig[] | null>;
  writeApiPages(
    realPages?: PageMeta[],
    options?: ApiPageWriteOptions,
  ): Promise<Map<string, string>>;
  refreshSiteAggregates(): Promise<void>;
  syncWatcher(): Promise<void>;
  removeOwnedRoute(slug: string): Promise<void>;
}

export class OpenApiRefreshCoordinator {
  constructor(private readonly options: OpenApiRefreshCoordinatorOptions) {}

  async loadInitialRegistry(): Promise<void> {
    const specs = this.options.getSpecs();
    if (specs.length === 0) return;
    const { registry } = await this.loadStableRegistry(specs);
    this.options.setRegistry(registry);
    if (!registry.isEmpty) {
      console.log(
        chalk.blue(
          `📘 Loaded ${registry.all.length} API endpoint(s) from ${specs.length} spec(s)`,
        ),
      );
    }
  }

  private async sourceState(registry: OpenApiRegistry): Promise<string> {
    return (
      await Promise.all(
        registry.sourceFiles.map(async (sourcePath) => {
          return `${sourcePath}:${await this.options.sourceFs.pathState(sourcePath, true)}`;
        }),
      )
    ).join("\n");
  }

  private async loadStableRegistry(
    specs: NormalizedOpenApiSpec[],
  ): Promise<{ registry: OpenApiRegistry; sourceState: string }> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const registry = new OpenApiRegistry();
      await registry.load(
        specs,
        this.options.rootDir,
        this.options.apiBaseSlug,
      );
      const current = await this.sourceState(registry);
      if (registry.sourceFingerprint === current) {
        return { registry, sourceState: current };
      }
    }
    throw new Error("OpenAPI sources changed repeatedly while being loaded");
  }

  private async applyStableRefresh(
    specs: NormalizedOpenApiSpec[],
  ): Promise<void> {
    let candidate = await this.loadStableRegistry(specs);
    await this.applyRefresh(candidate.registry, specs);

    // Recheck after watcher readiness so changes in the retargeting window are
    // replayed explicitly instead of being missed by ignoreInitial watchers.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (
        (await this.sourceState(candidate.registry)) === candidate.sourceState
      ) {
        return;
      }
      candidate = await this.loadStableRegistry(specs);
      await this.applyRefresh(candidate.registry, specs);
    }
    throw new Error("OpenAPI sources changed repeatedly while being generated");
  }

  private async applyRefresh(
    nextRegistry: OpenApiRegistry,
    nextSpecs: NormalizedOpenApiSpec[],
  ): Promise<void> {
    const previousRegistry = this.options.getRegistry();
    const previousSpecs = this.options.getSpecs();
    const previousSections = this.options.getSections();
    const previousRoutes = this.options.getOpenApiRoutes();
    const candidateRoutes = new Map<string, string>();
    let watcherSyncAttempted = false;

    try {
      this.options.setRegistry(nextRegistry);
      this.options.setSpecs(nextSpecs);
      this.options.setSections(await this.options.resolveSections());
      await this.options.writeApiPages(undefined, {
        writtenRoutes: candidateRoutes,
      });
      await this.options.refreshSiteAggregates();
      watcherSyncAttempted = true;
      await this.options.syncWatcher();
    } catch (error) {
      this.options.setRegistry(previousRegistry);
      this.options.setSpecs(previousSpecs);
      this.options.setSections(previousSections);
      const rollbackErrors: unknown[] = [];

      if (watcherSyncAttempted) {
        try {
          await this.options.syncWatcher();
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      }
      const previousSlugs = new Set(previousRoutes.map((route) => route.slug));
      const occupiedMdxSlugs = new Set(
        this.options.getSuccessfulMdxPages().map((page) => page.slug),
      );
      for (const slug of new Set(candidateRoutes.values())) {
        if (previousSlugs.has(slug) || occupiedMdxSlugs.has(slug)) continue;
        try {
          await this.options.removeOwnedRoute(slug);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      }
      try {
        await this.options.writeApiPages(undefined, {
          additionalPreviousRoutes: [...candidateRoutes].map(
            ([source, slug]) => ({ kind: "openapi", source, slug }),
          ),
        });
        await this.options.refreshSiteAggregates();
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }

      if (rollbackErrors.length > 0) {
        throw new AggregateError(
          [error, ...rollbackErrors],
          "Unable to apply or restore the OpenAPI reference",
        );
      }
      throw error;
    }
  }

  async handleOpenApiChange(): Promise<void> {
    console.log(
      chalk.cyan("📘 OpenAPI spec changed - regenerating API reference"),
    );
    try {
      await this.applyStableRefresh(this.options.getSpecs());
      console.log(chalk.green("✅ API reference updated"));
    } catch (error) {
      console.error(chalk.red("❌ Error updating API reference:"), error);
    }
  }

  async handleConfigChange(): Promise<void> {
    const configPath = path.join(this.options.rootDir, this.options.configFile);
    let config: DoccupineConfig;
    try {
      const { data } = await this.options.sourceFs.readProjectSourceFile(
        configPath,
        "Doccupine configuration source",
      );
      config = validateConfig(
        JSON.parse(data.toString("utf8")),
        this.options.rootDir,
      );
    } catch (error) {
      console.warn(
        chalk.yellow(
          "⚠️ doccupine.json is missing or invalid - keeping the current configuration",
        ),
        error instanceof Error ? error.message : error,
      );
      return;
    }

    if (
      (config.watchDir &&
        path.resolve(this.options.rootDir, config.watchDir) !==
          this.options.watchDir) ||
      (config.outputDir &&
        path.resolve(this.options.rootDir, config.outputDir) !==
          this.options.outputDir)
    ) {
      console.log(
        chalk.yellow(
          "⚠️ watchDir/outputDir changes in doccupine.json need a restart to apply",
        ),
      );
    }

    const nextSpecs = normalizeOpenApiConfig(config.openapi);
    if (JSON.stringify(nextSpecs) === JSON.stringify(this.options.getSpecs())) {
      return;
    }

    console.log(
      chalk.cyan("📘 OpenAPI configuration changed - updating API reference"),
    );
    try {
      await this.applyStableRefresh(nextSpecs);
      console.log(chalk.green("✅ API reference updated"));
    } catch (error) {
      console.error(chalk.red("❌ Error updating API reference:"), error);
    }
  }
}
