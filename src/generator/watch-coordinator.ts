import chalk from "chalk";
import chokidar, { type FSWatcher } from "chokidar";
import fs from "fs-extra";
import path from "node:path";

import { isPathInside } from "../lib/output-safety.js";
import type { NormalizedOpenApiSpec } from "../lib/types.js";
import type { SecureSourceFs } from "./secure-source-fs.js";

interface WatchSourceSnapshot {
  mdx: string;
  configs: Record<string, string>;
  font: string;
  analytics: string;
  doccupine: string;
  public: string;
  openapi: string;
}

interface WatchCoordinatorCallbacks {
  syncOpenApiSpecWatcher(): Promise<void>;
  handleFileChange(action: string, filePath: string): Promise<void>;
  handleFileDelete(filePath: string): Promise<void>;
  handleConfigFileChange(filePath: string): Promise<void>;
  handleConfigFileDelete(filePath: string): Promise<void>;
  handleFontConfigChange(): Promise<void>;
  handleFontConfigDelete(): Promise<void>;
  handleAnalyticsConfigChange(): Promise<void>;
  handleAnalyticsConfigDelete(): Promise<void>;
  handleDoccupineConfigChange(): Promise<void>;
  handleOpenApiChange(): Promise<void>;
  copyPublicFiles(): Promise<void>;
  handlePublicFileChange(filePath: string): Promise<void>;
  handlePublicFileDelete(filePath: string): Promise<void>;
  processAllMDXFiles(): Promise<void>;
}

interface WatchCoordinatorOptions {
  watchDir: string;
  rootDir: string;
  configFiles: readonly string[];
  fontConfigFile: string;
  analyticsConfigFile: string;
  doccupineConfigFile: string;
  sourceFs: SecureSourceFs;
  getOpenApiSpecs(): readonly NormalizedOpenApiSpec[];
  callbacks: WatchCoordinatorCallbacks;
}

export class WatchCoordinator {
  private watcher: FSWatcher | null = null;
  private configWatcher: FSWatcher | null = null;
  private fontWatcher: FSWatcher | null = null;
  private publicWatcher: FSWatcher | null = null;
  private rootDirWatcher: FSWatcher | null = null;
  private analyticsWatcher: FSWatcher | null = null;
  private openApiWatcher: FSWatcher | null = null;
  private doccupineConfigWatcher: FSWatcher | null = null;
  private mutationQueue: Promise<void> = Promise.resolve();
  private stopping = false;
  private readyCancellations = new Set<() => void>();
  private sourceSnapshot: WatchSourceSnapshot | null = null;
  private publicWatcherStarting = false;

  constructor(private readonly options: WatchCoordinatorOptions) {}

  private enqueueMutation(label: string, task: () => Promise<void>): void {
    this.mutationQueue = this.mutationQueue.then(task).catch((error) => {
      console.error(chalk.red(`❌ ${label}:`), error);
    });
  }

  private waitForWatcherReady(watcher: FSWatcher): Promise<void> {
    if (this.stopping) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        watcher.removeListener("ready", onReady);
        watcher.removeListener("error", onError);
        this.readyCancellations.delete(onStop);
      };
      const onReady = () => {
        cleanup();
        resolve();
      };
      const onError = (error: unknown) => {
        cleanup();
        reject(error);
      };
      const onStop = () => {
        cleanup();
        resolve();
      };
      this.readyCancellations.add(onStop);
      watcher.once("ready", onReady);
      watcher.once("error", onError);
    });
  }

  private async captureSourceSnapshot(): Promise<WatchSourceSnapshot> {
    const {
      analyticsConfigFile,
      configFiles,
      doccupineConfigFile,
      fontConfigFile,
      getOpenApiSpecs,
      rootDir,
      sourceFs,
      watchDir,
    } = this.options;
    const configs = Object.fromEntries(
      await Promise.all(
        configFiles.map(async (fileName) => [
          fileName,
          await sourceFs.pathState(path.join(rootDir, fileName), true),
        ]),
      ),
    );
    const openapi = (
      await Promise.all(
        getOpenApiSpecs().map(async (spec) => {
          const specPath = path.resolve(rootDir, spec.file);
          return `${specPath}:${await sourceFs.pathState(specPath, true)}`;
        }),
      )
    ).join("\n");

    return {
      mdx: await sourceFs.treeState(
        watchDir,
        (relativePath) => relativePath.toLowerCase().endsWith(".mdx"),
        true,
      ),
      configs,
      font: await sourceFs.pathState(path.join(rootDir, fontConfigFile), true),
      analytics: await sourceFs.pathState(
        path.join(rootDir, analyticsConfigFile),
        true,
      ),
      doccupine: await sourceFs.pathState(
        path.join(rootDir, doccupineConfigFile),
        true,
      ),
      public: await sourceFs.treeState(
        path.join(rootDir, "public"),
        () => true,
      ),
      openapi,
    };
  }

  async establishSourceSnapshot(): Promise<void> {
    this.sourceSnapshot = await this.captureSourceSnapshot();
  }

  private async reconcileWatchedSources(
    previous: WatchSourceSnapshot | null,
    current: WatchSourceSnapshot,
  ): Promise<void> {
    const {
      analyticsConfigFile,
      callbacks,
      configFiles,
      doccupineConfigFile,
      fontConfigFile,
      getOpenApiSpecs,
      rootDir,
    } = this.options;
    const doccupineConfigPath = path.join(rootDir, doccupineConfigFile);
    const doccupineChanged =
      previous === null || previous.doccupine !== current.doccupine;
    if (doccupineChanged && (await fs.pathExists(doccupineConfigPath))) {
      await callbacks.handleDoccupineConfigChange();
    }

    let sectionsChanged = false;
    for (const configFile of configFiles) {
      if (
        previous !== null &&
        previous.configs[configFile] === current.configs[configFile]
      ) {
        continue;
      }
      const sourcePath = path.join(rootDir, configFile);
      if (await fs.pathExists(sourcePath)) {
        await callbacks.handleConfigFileChange(sourcePath);
      } else {
        await callbacks.handleConfigFileDelete(sourcePath);
      }
      if (configFile === "sections.json") sectionsChanged = true;
    }

    const fontPath = path.join(rootDir, fontConfigFile);
    if (previous === null || previous.font !== current.font) {
      if (await fs.pathExists(fontPath)) {
        await callbacks.handleFontConfigChange();
      } else {
        await callbacks.handleFontConfigDelete();
      }
    }

    const analyticsPath = path.join(rootDir, analyticsConfigFile);
    if (previous === null || previous.analytics !== current.analytics) {
      if (await fs.pathExists(analyticsPath)) {
        await callbacks.handleAnalyticsConfigChange();
      } else {
        await callbacks.handleAnalyticsConfigDelete();
      }
    }

    const publicDir = path.join(rootDir, "public");
    if (previous === null || previous.public !== current.public) {
      if (
        !this.stopping &&
        !this.publicWatcher &&
        (await fs.pathExists(publicDir))
      ) {
        await this.waitForWatcherReady(this.setupPublicWatcher());
        if (this.stopping) return;
      }
      await callbacks.copyPublicFiles();
    }

    if (
      !doccupineChanged &&
      getOpenApiSpecs().length > 0 &&
      (previous === null || previous.openapi !== current.openapi)
    ) {
      await callbacks.handleOpenApiChange();
    }
    if (
      !sectionsChanged &&
      (previous === null || previous.mdx !== current.mdx)
    ) {
      await callbacks.processAllMDXFiles();
    }
  }

  async startWatching(): Promise<void> {
    const {
      analyticsConfigFile,
      callbacks,
      configFiles,
      doccupineConfigFile,
      fontConfigFile,
      rootDir,
      watchDir,
    } = this.options;
    this.stopping = false;
    console.log(chalk.yellow(`👀 Watching for changes in: ${watchDir}`));
    const ready: Promise<void>[] = [];

    this.watcher = chokidar.watch(watchDir, {
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      ignored: (filePath: string, stats?: fs.Stats) => {
        const isFile = stats?.isFile() ?? path.extname(filePath) !== "";
        const fileName = path.basename(filePath);

        if (configFiles.includes(fileName)) {
          return true;
        }

        if (isFile && !filePath.endsWith(".mdx")) {
          return true;
        }
        return false;
      },
    });
    ready.push(this.waitForWatcherReady(this.watcher));

    this.watcher
      .on("add", (filePath: string) => {
        const relativePath = path.relative(watchDir, filePath);
        this.enqueueMutation("Error processing added MDX file", () =>
          callbacks.handleFileChange("added", relativePath),
        );
      })
      .on("change", (filePath: string) => {
        const relativePath = path.relative(watchDir, filePath);
        this.enqueueMutation("Error processing changed MDX file", () =>
          callbacks.handleFileChange("changed", relativePath),
        );
      })
      .on("unlink", (filePath: string) => {
        const relativePath = path.relative(watchDir, filePath);
        this.enqueueMutation("Error processing deleted MDX file", () =>
          callbacks.handleFileDelete(relativePath),
        );
      })
      .on("ready", () => {
        console.log(
          chalk.green("📁 Initial scan complete. Ready for changes..."),
        );
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Watcher error:"), error);
      });

    const configPaths = configFiles.map((file) => path.join(rootDir, file));
    this.configWatcher = chokidar.watch(configPaths, {
      persistent: true,
      ignoreInitial: true,
    });
    ready.push(this.waitForWatcherReady(this.configWatcher));

    this.configWatcher
      .on("add", (filePath: string) => {
        console.log(
          chalk.cyan(`📝 Config file added: ${path.basename(filePath)}`),
        );
        this.enqueueMutation("Error applying config file", () =>
          callbacks.handleConfigFileChange(filePath),
        );
      })
      .on("change", (filePath: string) => {
        console.log(
          chalk.cyan(`📝 Config file changed: ${path.basename(filePath)}`),
        );
        this.enqueueMutation("Error applying config file", () =>
          callbacks.handleConfigFileChange(filePath),
        );
      })
      .on("unlink", (filePath: string) => {
        console.log(
          chalk.red(`🗑️ Config file deleted: ${path.basename(filePath)}`),
        );
        this.enqueueMutation("Error deleting config file", () =>
          callbacks.handleConfigFileDelete(filePath),
        );
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Config watcher error:"), error);
      });

    const fontPath = path.join(rootDir, fontConfigFile);
    this.fontWatcher = chokidar.watch(fontPath, {
      persistent: true,
      ignoreInitial: true,
    });
    ready.push(this.waitForWatcherReady(this.fontWatcher));

    this.fontWatcher
      .on("add", () => {
        console.log(chalk.cyan(`🔤 Font configuration added`));
        this.enqueueMutation("Error applying font configuration", () =>
          callbacks.handleFontConfigChange(),
        );
      })
      .on("change", () => {
        this.enqueueMutation("Error applying font configuration", () =>
          callbacks.handleFontConfigChange(),
        );
      })
      .on("unlink", () => {
        this.enqueueMutation("Error deleting font configuration", () =>
          callbacks.handleFontConfigDelete(),
        );
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Font watcher error:"), error);
      });

    const analyticsPath = path.join(rootDir, analyticsConfigFile);
    this.analyticsWatcher = chokidar.watch(analyticsPath, {
      persistent: true,
      ignoreInitial: true,
    });
    ready.push(this.waitForWatcherReady(this.analyticsWatcher));

    this.analyticsWatcher
      .on("add", () => {
        console.log(chalk.cyan(`📊 Analytics configuration added`));
        this.enqueueMutation("Error applying analytics configuration", () =>
          callbacks.handleAnalyticsConfigChange(),
        );
      })
      .on("change", () => {
        this.enqueueMutation("Error applying analytics configuration", () =>
          callbacks.handleAnalyticsConfigChange(),
        );
      })
      .on("unlink", () => {
        this.enqueueMutation("Error deleting analytics configuration", () =>
          callbacks.handleAnalyticsConfigDelete(),
        );
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Analytics watcher error:"), error);
      });

    await callbacks.syncOpenApiSpecWatcher();
    if (this.stopping) return;

    const doccupineConfigPath = path.join(rootDir, doccupineConfigFile);
    this.doccupineConfigWatcher = chokidar.watch(doccupineConfigPath, {
      persistent: true,
      ignoreInitial: true,
    });
    ready.push(this.waitForWatcherReady(this.doccupineConfigWatcher));

    this.doccupineConfigWatcher
      .on("add", () =>
        this.enqueueMutation("Error applying doccupine.json", () =>
          callbacks.handleDoccupineConfigChange(),
        ),
      )
      .on("change", () =>
        this.enqueueMutation("Error applying doccupine.json", () =>
          callbacks.handleDoccupineConfigChange(),
        ),
      )
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ doccupine.json watcher error:"), error);
      });

    const publicDir = path.join(rootDir, "public");
    if (await fs.pathExists(publicDir)) {
      if (this.stopping) return;
      ready.push(this.waitForWatcherReady(this.setupPublicWatcher()));
    }
    if (this.stopping) return;

    this.rootDirWatcher = chokidar.watch(rootDir, {
      persistent: true,
      ignoreInitial: true,
      depth: 1,
    });
    ready.push(this.waitForWatcherReady(this.rootDirWatcher));

    const queuePublicWatcherStart = () => {
      if (this.stopping || this.publicWatcher || this.publicWatcherStarting) {
        return;
      }
      this.publicWatcherStarting = true;
      this.enqueueMutation("Error initializing public directory", async () => {
        try {
          if (this.stopping) return;
          console.log(chalk.cyan("📁 Public directory created"));
          await this.waitForWatcherReady(this.setupPublicWatcher());
          if (this.stopping) return;
          await callbacks.copyPublicFiles();
        } finally {
          this.publicWatcherStarting = false;
        }
      });
    };

    this.rootDirWatcher
      .on("addDir", (dirPath: string) => {
        if (
          path.basename(dirPath) === "public" &&
          path.dirname(dirPath) === rootDir
        ) {
          queuePublicWatcherStart();
        }
      })
      .on("add", (filePath: string) => {
        if (isPathInside(publicDir, filePath)) queuePublicWatcherStart();
      })
      .on("unlinkDir", (dirPath: string) => {
        if (
          path.basename(dirPath) !== "public" ||
          path.dirname(dirPath) !== rootDir
        ) {
          return;
        }
        const watcher = this.publicWatcher;
        this.publicWatcher = null;
        void watcher?.close();
        this.enqueueMutation("Error removing public directory", () =>
          callbacks.copyPublicFiles(),
        );
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Root dir watcher error:"), error);
      });

    await Promise.all(ready);
    if (this.stopping) return;
    this.enqueueMutation("Error reconciling watched sources", async () => {
      const current = await this.captureSourceSnapshot();
      await this.reconcileWatchedSources(this.sourceSnapshot, current);
      this.sourceSnapshot = await this.captureSourceSnapshot();
    });
    await this.mutationQueue;
  }

  private setupPublicWatcher(): FSWatcher {
    if (this.publicWatcher) {
      return this.publicWatcher;
    }
    if (this.stopping) {
      throw new Error("Cannot start a public watcher while stopping");
    }

    const { callbacks, rootDir } = this.options;
    const publicDir = path.join(rootDir, "public");
    this.publicWatcher = chokidar.watch(publicDir, {
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
    });

    this.publicWatcher
      .on("add", (filePath: string) => {
        console.log(
          chalk.cyan(
            `📁 Public file added: ${path.relative(publicDir, filePath)}`,
          ),
        );
        this.enqueueMutation("Error copying public file", () =>
          callbacks.handlePublicFileChange(filePath),
        );
      })
      .on("change", (filePath: string) => {
        console.log(
          chalk.cyan(
            `📁 Public file changed: ${path.relative(publicDir, filePath)}`,
          ),
        );
        this.enqueueMutation("Error copying public file", () =>
          callbacks.handlePublicFileChange(filePath),
        );
      })
      .on("unlink", (filePath: string) => {
        console.log(
          chalk.red(
            `🗑️ Public file deleted: ${path.relative(publicDir, filePath)}`,
          ),
        );
        this.enqueueMutation("Error deleting public file", () =>
          callbacks.handlePublicFileDelete(filePath),
        );
      })
      .on("unlinkDir", (dirPath: string) => {
        if (path.resolve(dirPath) !== path.resolve(publicDir)) return;
        const watcher = this.publicWatcher;
        this.publicWatcher = null;
        void watcher?.close();
        this.enqueueMutation("Error removing public directory", () =>
          callbacks.copyPublicFiles(),
        );
      })
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ Public watcher error:"), error);
      });
    return this.publicWatcher;
  }

  async syncOpenApiSpecWatcher(
    specs: readonly NormalizedOpenApiSpec[],
  ): Promise<void> {
    const previousWatcher = this.openApiWatcher;
    this.openApiWatcher = null;
    if (previousWatcher) await previousWatcher.close();
    if (this.stopping || specs.length === 0) return;

    const { callbacks, rootDir } = this.options;
    const specPaths = specs.map((spec) => path.resolve(rootDir, spec.file));
    const watcher = chokidar.watch(specPaths, {
      persistent: true,
      ignoreInitial: true,
    });
    this.openApiWatcher = watcher;

    watcher
      .on("add", () =>
        this.enqueueMutation("Error rebuilding API reference", () =>
          callbacks.handleOpenApiChange(),
        ),
      )
      .on("change", () =>
        this.enqueueMutation("Error rebuilding API reference", () =>
          callbacks.handleOpenApiChange(),
        ),
      )
      .on("unlink", () =>
        this.enqueueMutation("Error rebuilding API reference", () =>
          callbacks.handleOpenApiChange(),
        ),
      )
      .on("error", (error: unknown) => {
        console.error(chalk.red("❌ OpenAPI watcher error:"), error);
      });
    await this.waitForWatcherReady(watcher);
    if (this.stopping && this.openApiWatcher === watcher) {
      await watcher.close();
      this.openApiWatcher = null;
    }
  }

  async stop(): Promise<void> {
    this.stopping = true;
    for (const cancel of [...this.readyCancellations]) cancel();
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
    if (this.openApiWatcher) {
      await this.openApiWatcher.close();
      console.log(chalk.yellow("👋 Stopped watching for OpenAPI spec changes"));
    }
    if (this.doccupineConfigWatcher) {
      await this.doccupineConfigWatcher.close();
      console.log(
        chalk.yellow("👋 Stopped watching for doccupine.json changes"),
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
    await this.mutationQueue;
    if (this.openApiWatcher) {
      await this.openApiWatcher.close();
      this.openApiWatcher = null;
    }
    if (this.publicWatcher) {
      await this.publicWatcher.close();
      this.publicWatcher = null;
    }
  }
}
