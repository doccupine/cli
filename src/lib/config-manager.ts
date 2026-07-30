import fs from "fs-extra";
import { randomBytes } from "node:crypto";
import { constants, type Stats } from "node:fs";
import { open, unlink, type FileHandle } from "node:fs/promises";
import path from "path";
import chalk from "chalk";
import prompts from "prompts";

import type { DoccupineConfig, NormalizedOpenApiSpec } from "./types.js";
import { isPathInside } from "./output-safety.js";

function pathsOverlap(a: string, b: string): boolean {
  return isPathInside(a, b) || isPathInside(b, a);
}

function errorCode(error: unknown): string | undefined {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : undefined;
}

function sameFile(left: Stats, right: Stats): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

interface ConfigPathEntry {
  filePath: string;
  stat: Stats;
}

interface InspectedConfigPath {
  entries: ConfigPathEntry[];
  finalStat?: Stats;
}

function configPathError(configPath: string, detail: string): Error {
  return new Error(`Refusing to use ${configPath}: ${detail}`);
}

async function inspectConfigPath(
  projectRoot: string,
  configPath: string,
  allowMissingAncestor: boolean,
): Promise<InspectedConfigPath | null> {
  if (!isPathInside(projectRoot, configPath)) {
    throw configPathError(
      configPath,
      `the configuration path is outside the project root ${projectRoot}.`,
    );
  }

  const relativePath = path.relative(projectRoot, configPath);
  const paths = [
    projectRoot,
    ...relativePath
      .split(path.sep)
      .filter(Boolean)
      .map((_, index, components) =>
        path.join(projectRoot, ...components.slice(0, index + 1)),
      ),
  ];
  const entries: ConfigPathEntry[] = [];

  for (const [index, currentPath] of paths.entries()) {
    const isFinal = index === paths.length - 1;
    let stat: Stats;
    try {
      stat = await fs.lstat(currentPath);
    } catch (error) {
      if (errorCode(error) === "ENOENT") {
        if (allowMissingAncestor) return null;
        if (isFinal) return { entries };
      }
      throw error;
    }

    if (stat.isSymbolicLink()) {
      throw configPathError(
        configPath,
        `${currentPath} is a symbolic link. Replace it with a real file or directory inside the project root.`,
      );
    }
    if (!isFinal && !stat.isDirectory()) {
      throw configPathError(configPath, `${currentPath} is not a directory.`);
    }

    entries.push({ filePath: currentPath, stat });
  }

  return {
    entries,
    finalStat: entries.at(-1)?.stat,
  };
}

async function assertPathEntriesUnchanged(
  configPath: string,
  entries: ConfigPathEntry[],
): Promise<void> {
  for (const entry of entries) {
    let currentStat: Stats;
    try {
      currentStat = await fs.lstat(entry.filePath);
    } catch {
      throw configPathError(
        configPath,
        `${entry.filePath} changed during the configuration operation.`,
      );
    }
    if (currentStat.isSymbolicLink() || !sameFile(entry.stat, currentStat)) {
      throw configPathError(
        configPath,
        `${entry.filePath} changed during the configuration operation.`,
      );
    }
  }
}

async function readConfigFile(
  projectRoot: string,
  configPath: string,
): Promise<string | null> {
  const inspected = await inspectConfigPath(projectRoot, configPath, true);
  if (!inspected) return null;
  if (!inspected.finalStat?.isFile()) {
    throw configPathError(configPath, "expected a regular configuration file.");
  }

  const noFollow =
    typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0;
  let handle: FileHandle;
  try {
    handle = await open(configPath, constants.O_RDONLY | noFollow);
  } catch (error) {
    if (errorCode(error) === "ELOOP") {
      throw configPathError(
        configPath,
        "the configuration file became a symbolic link while it was being opened.",
      );
    }
    throw error;
  }

  try {
    const beforeRead = await handle.stat();
    if (!beforeRead.isFile() || !sameFile(inspected.finalStat, beforeRead)) {
      throw configPathError(
        configPath,
        "the configuration file changed while it was being opened.",
      );
    }
    await assertPathEntriesUnchanged(configPath, inspected.entries);

    const content = await handle.readFile("utf8");
    const afterRead = await handle.stat();
    if (
      !sameFile(beforeRead, afterRead) ||
      beforeRead.size !== afterRead.size ||
      beforeRead.mtimeMs !== afterRead.mtimeMs ||
      beforeRead.ctimeMs !== afterRead.ctimeMs
    ) {
      throw configPathError(
        configPath,
        "the configuration file changed while it was being read.",
      );
    }
    await assertPathEntriesUnchanged(configPath, inspected.entries);
    return content;
  } finally {
    await handle.close();
  }
}

async function createConfigTempFile(
  configPath: string,
  mode: number,
): Promise<{ handle: FileHandle; tempPath: string }> {
  const noFollow =
    typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0;
  const flags =
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const tempPath = path.join(
      path.dirname(configPath),
      `.doccupine-config-${process.pid}-${randomBytes(16).toString("hex")}.tmp`,
    );
    try {
      return { handle: await open(tempPath, flags, mode), tempPath };
    } catch (error) {
      if (errorCode(error) !== "EEXIST") throw error;
    }
  }

  throw new Error(`Unable to create a unique temporary file for ${configPath}`);
}

async function removeConfigTempFile(tempPath: string): Promise<void> {
  try {
    await unlink(tempPath);
  } catch (error) {
    if (errorCode(error) !== "ENOENT") throw error;
  }
}

async function writeConfigFileAtomic(
  projectRoot: string,
  configPath: string,
  content: string,
): Promise<void> {
  const inspected = await inspectConfigPath(projectRoot, configPath, false);
  if (inspected?.finalStat && !inspected.finalStat.isFile()) {
    throw configPathError(configPath, "expected a regular configuration file.");
  }
  const parentEntries =
    inspected?.entries.filter((entry) => entry.filePath !== configPath) ?? [];
  const mode = inspected?.finalStat?.isFile()
    ? inspected.finalStat.mode & 0o777
    : 0o666;

  let handle: FileHandle | undefined;
  let tempPath: string | undefined;
  try {
    ({ handle, tempPath } = await createConfigTempFile(configPath, mode));
    if (inspected?.finalStat?.isFile()) await handle.chmod(mode);
    await assertPathEntriesUnchanged(configPath, parentEntries);
    await inspectConfigPath(projectRoot, configPath, false);

    await handle.writeFile(content, "utf8");
    await handle.sync();
    await handle.close();
    handle = undefined;

    await assertPathEntriesUnchanged(configPath, parentEntries);
    await inspectConfigPath(projectRoot, configPath, false);
    await fs.rename(tempPath, configPath);
    tempPath = undefined;
  } catch (error) {
    if (handle) {
      try {
        await handle.close();
      } catch {
        // Preserve the original write error.
      }
    }
    if (tempPath) {
      try {
        await removeConfigTempFile(tempPath);
      } catch {
        // Cleanup is best effort and must not hide the original error.
      }
    }
    throw error;
  }
}

function isValidOpenApiConfig(value: unknown): boolean {
  if (value === undefined || typeof value === "string") return true;
  if (!Array.isArray(value)) return false;
  return value.every(
    (entry) =>
      typeof entry === "string" ||
      (entry !== null &&
        typeof entry === "object" &&
        typeof (entry as { file?: unknown }).file === "string" &&
        ((entry as { name?: unknown }).name === undefined ||
          typeof (entry as { name?: unknown }).name === "string")),
  );
}

export function validateConfig(
  value: unknown,
  rootDir: string = process.cwd(),
): DoccupineConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("doccupine.json must contain a JSON object.");
  }

  const config = value as Partial<DoccupineConfig>;
  if (typeof config.watchDir !== "string" || !config.watchDir.trim()) {
    throw new Error("doccupine.json watchDir must be a non-empty string.");
  }
  if (typeof config.outputDir !== "string" || !config.outputDir.trim()) {
    throw new Error("doccupine.json outputDir must be a non-empty string.");
  }

  const watchDir = path.resolve(rootDir, config.watchDir);
  const outputDir = path.resolve(rootDir, config.outputDir);
  if (outputDir === path.resolve(rootDir)) {
    throw new Error("outputDir cannot be the project root.");
  }
  if (pathsOverlap(watchDir, outputDir)) {
    throw new Error("watchDir and outputDir must not overlap.");
  }

  const port = config.port ?? "3000";
  if (
    typeof port !== "string" ||
    !/^\d+$/.test(port) ||
    Number(port) < 1 ||
    Number(port) > 65535
  ) {
    throw new Error("doccupine.json port must be an integer from 1 to 65535.");
  }
  if (
    config.packageManager !== undefined &&
    config.packageManager !== "npm" &&
    config.packageManager !== "pnpm"
  ) {
    throw new Error('packageManager must be either "npm" or "pnpm".');
  }
  if (!isValidOpenApiConfig(config.openapi)) {
    throw new Error(
      "openapi must be a path or an array of paths/{ name, file } objects.",
    );
  }

  return {
    ...config,
    watchDir: config.watchDir,
    outputDir: config.outputDir,
    port,
  };
}

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
  private projectRoot: string;

  constructor(configPath = "doccupine.json") {
    this.projectRoot = path.resolve(process.cwd());
    this.configPath = path.resolve(this.projectRoot, configPath);
  }

  async loadConfig(): Promise<DoccupineConfig | null> {
    try {
      const configContent = await readConfigFile(
        this.projectRoot,
        this.configPath,
      );
      if (configContent === null) return null;

      const config = validateConfig(
        JSON.parse(configContent),
        this.projectRoot,
      );
      console.log(
        chalk.blue("📄 Using existing configuration from doccupine.json"),
      );
      return config;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const symlinkRepair = message.includes("symbolic link")
        ? " Remove or replace the symbolic link first."
        : "";
      throw new Error(
        `Unable to use ${this.configPath}: ${message}.${symlinkRepair} Run "doccupine config --reset" to repair the configuration.`,
      );
    }
  }

  async saveConfig(config: DoccupineConfig): Promise<void> {
    try {
      await writeConfigFileAtomic(
        this.projectRoot,
        this.configPath,
        `${JSON.stringify(config, null, 2)}\n`,
      );
      console.log(chalk.green("💾 Configuration saved to doccupine.json"));
    } catch (error) {
      console.error(chalk.red("❌ Error saving config file:"), error);
      throw error;
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
      config = validateConfig(await this.promptForConfig(config || {}));
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

    config = validateConfig(config);

    if (dirty) {
      await this.saveConfig(config);
    }

    return config;
  }
}
