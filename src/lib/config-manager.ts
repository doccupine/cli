import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import prompts from "prompts";

import type { DoccupineConfig, NormalizedOpenApiSpec } from "./types.js";

/** Strips a `.json`/`.yaml`/`.yml` extension to derive a spec's default name. */
function basenameWithoutExt(file: string): string {
  return path.basename(file).replace(/\.(json|ya?ml)$/i, "");
}

/**
 * Collapses every accepted `openapi` config shape (a single path, a list of
 * paths, or named-spec objects) into a uniform `NormalizedOpenApiSpec[]`. Names
 * default to the file basename and are de-duplicated with a numeric suffix so
 * two specs never share a route namespace.
 */
export function normalizeOpenApiConfig(
  openapi: DoccupineConfig["openapi"],
): NormalizedOpenApiSpec[] {
  if (!openapi) return [];
  const entries = Array.isArray(openapi) ? openapi : [openapi];
  const used = new Set<string>();
  const specs: NormalizedOpenApiSpec[] = [];

  for (const entry of entries) {
    let file: string | undefined;
    let name: string | undefined;
    if (typeof entry === "string") {
      file = entry;
    } else if (
      entry &&
      typeof entry === "object" &&
      typeof entry.file === "string"
    ) {
      file = entry.file;
      name = entry.name;
    }
    if (!file) continue;

    const desired = name?.trim() || basenameWithoutExt(file) || "api";
    let unique = desired;
    let n = 2;
    while (used.has(unique)) unique = `${desired}-${n++}`;
    used.add(unique);
    specs.push({ name: unique, file });
  }
  return specs;
}

/** Rewrites the spec file path(s) inside an `openapi` config to be portable. */
function rewriteOpenApiPaths(
  openapi: NonNullable<DoccupineConfig["openapi"]>,
  rootDir: string,
): { openapi: DoccupineConfig["openapi"]; changed: boolean } {
  if (typeof openapi === "string") {
    const next = toProjectRelativePath(openapi, rootDir);
    return { openapi: next, changed: next !== openapi };
  }
  let changed = false;
  const next = openapi.map((entry) => {
    if (typeof entry === "string") {
      const rel = toProjectRelativePath(entry, rootDir);
      if (rel !== entry) changed = true;
      return rel;
    }
    if (entry && typeof entry === "object" && typeof entry.file === "string") {
      const rel = toProjectRelativePath(entry.file, rootDir);
      if (rel !== entry.file) changed = true;
      return { ...entry, file: rel };
    }
    return entry;
  });
  return { openapi: next as DoccupineConfig["openapi"], changed };
}

/**
 * Rewrites a path as project-relative so `doccupine.json` stays portable
 * across machines, CI and containers (an absolute `/Users/you/...` breaks for
 * every other contributor and leaks the local directory layout).
 *
 * Paths outside the project root have no portable form, so they are kept
 * absolute - reads go through `path.resolve()`, which accepts both.
 */
export function toProjectRelativePath(
  targetPath: string,
  rootDir: string = process.cwd(),
): string {
  // A hand-edited config can hold anything; leave junk untouched rather than
  // throwing inside path.*.
  if (typeof targetPath !== "string" || !targetPath) return targetPath;
  if (!path.isAbsolute(targetPath)) return targetPath;

  const relativePath = path.relative(rootDir, targetPath);

  // Empty means the path *is* the root; ".." or an absolute result (Windows
  // cross-drive) means it escapes the root - neither is portable.
  if (!relativePath) return ".";
  if (relativePath === ".." || relativePath.startsWith(`..${path.sep}`)) {
    return targetPath;
  }
  if (path.isAbsolute(relativePath)) return targetPath;

  // Always store POSIX separators so a config written on Windows still
  // resolves on macOS/Linux.
  return relativePath.split(path.sep).join("/");
}

/**
 * Migrates configs written by older versions, which stored absolute paths.
 * Returns the normalized config plus whether anything actually changed, so
 * callers only rewrite the file when needed.
 */
export function normalizeConfigPaths(
  config: DoccupineConfig,
  rootDir: string = process.cwd(),
): { config: DoccupineConfig; changed: boolean } {
  const watchDir = toProjectRelativePath(config.watchDir, rootDir);
  const outputDir = toProjectRelativePath(config.outputDir, rootDir);

  let openapi = config.openapi;
  let openapiChanged = false;
  if (openapi !== undefined) {
    const rewritten = rewriteOpenApiPaths(openapi, rootDir);
    openapi = rewritten.openapi;
    openapiChanged = rewritten.changed;
  }

  const changed =
    watchDir !== config.watchDir ||
    outputDir !== config.outputDir ||
    openapiChanged;

  const next: DoccupineConfig = { ...config, watchDir, outputDir };
  if (openapi !== undefined) next.openapi = openapi;

  return { config: next, changed };
}

export class ConfigManager {
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
        `${JSON.stringify(config, null, 2)}\n`,
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
    type PromptResult = {
      watchDir: string;
      outputDir: string;
      openapi: string;
    };

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
      {
        type: "text",
        name: "openapi",
        message:
          "Path to an OpenAPI spec for an API reference (optional, blank to skip):",
        initial:
          typeof existingConfig?.openapi === "string"
            ? existingConfig.openapi
            : "",
      },
    ];

    const { watchDir, outputDir, openapi } = (await prompts(
      questions,
    )) as PromptResult;

    if (!watchDir || !outputDir) {
      console.log(chalk.yellow("\n⚠️ Setup cancelled."));
      process.exit(0);
    }

    // Resolve first so "./docs" and "docs/" collapse to the same value, then
    // store project-relative for portability.
    const config: DoccupineConfig = {
      watchDir: toProjectRelativePath(path.resolve(process.cwd(), watchDir)),
      outputDir: toProjectRelativePath(path.resolve(process.cwd(), outputDir)),
      port: existingConfig?.port || "3000",
    };

    // Only attach `openapi` when a path was entered; otherwise preserve any
    // existing value (including non-string, multi-spec forms) untouched.
    const openapiValue = openapi?.trim();
    if (openapiValue) {
      config.openapi = openapiValue;
    } else if (existingConfig?.openapi !== undefined) {
      config.openapi = existingConfig.openapi;
    }

    return config;
  }

  async getConfig(
    options: { reset?: boolean; port?: string } = {},
  ): Promise<DoccupineConfig> {
    let config: DoccupineConfig | null = null;
    let dirty = false;

    if (!options.reset) {
      config = await this.loadConfig();
    }

    if (!config || options.reset) {
      console.log(chalk.blue("🔧 Setting up Doccupine configuration..."));
      config = await this.promptForConfig(config || {});
      dirty = true;
    } else {
      // Configs written before 0.0.129 stored absolute paths; rewrite them in
      // place so the file can be committed and shared.
      const normalized = normalizeConfigPaths(config);
      if (normalized.changed) {
        config = normalized.config;
        dirty = true;
        console.log(
          chalk.blue("🔁 Rewriting doccupine.json paths as project-relative"),
        );
      }
    }

    if (options.port) {
      config.port = options.port;
      dirty = true;
    }

    if (dirty) {
      await this.saveConfig(config);
    }

    return config;
  }
}
