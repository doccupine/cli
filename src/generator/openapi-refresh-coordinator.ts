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

class OpenApiRestoreError extends AggregateError {}

class OpenApiWatcherRestoreNeededError extends Error {
  constructor(readonly originalError: unknown) {
    super("OpenAPI watcher synchronization required verified restoration");
  }
}

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
    const previousRegistry = this.options.getRegistry();
    const previousSpecs = this.options.getSpecs();
    let successfulApplications = 0;

    try {
      let candidate = await this.loadStableRegistry(specs);
      await this.applyRefresh(candidate.registry, specs);
      successfulApplications += 1;

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
        successfulApplications += 1;
      }
      if (
        (await this.sourceState(candidate.registry)) === candidate.sourceState
      ) {
        return;
      }
      throw new Error(
        "OpenAPI sources changed repeatedly while being generated",
      );
    } catch (error) {
      const watcherRestoreNeeded =
        error instanceof OpenApiWatcherRestoreNeededError;
      if (
        successfulApplications === 0 &&
        !(error instanceof OpenApiRestoreError) &&
        !watcherRestoreNeeded
      ) {
        throw error;
      }

      try {
        await this.restorePreviousRefresh(
          previousRegistry,
          previousSpecs,
          previousSpecs !== specs || watcherRestoreNeeded,
        );
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          "Unable to refresh or restore the previous OpenAPI reference",
        );
      }
      throw watcherRestoreNeeded ? error.originalError : error;
    }
  }

  private async restorePreviousRefresh(
    fallbackRegistry: OpenApiRegistry,
    specs: NormalizedOpenApiSpec[],
    verifySources: boolean,
  ): Promise<void> {
    if (!verifySources || specs.length === 0) {
      await this.applyRefresh(fallbackRegistry, specs);
      return;
    }

    let candidate: { registry: OpenApiRegistry; sourceState: string };
    try {
      candidate = await this.loadStableRegistry(specs);
    } catch {
      // Invalid previous sources still retain their last successful output.
      await this.applyRefresh(fallbackRegistry, specs);
      return;
    }

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await this.applyRefresh(candidate.registry, specs);
      if (
        (await this.sourceState(candidate.registry)) === candidate.sourceState
      ) {
        return;
      }
      if (attempt < 3) candidate = await this.loadStableRegistry(specs);
    }
    throw new Error(
      "Previous OpenAPI sources changed repeatedly while being restored",
    );
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
        throw new OpenApiRestoreError(
          [error, ...rollbackErrors],
          "Unable to apply or restore the OpenAPI reference",
        );
      }
      if (watcherSyncAttempted) {
        throw new OpenApiWatcherRestoreNeededError(error);
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
