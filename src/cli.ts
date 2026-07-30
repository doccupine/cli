import { spawn, type ChildProcess } from "child_process";
import { createHash } from "crypto";
import type { EventEmitter } from "events";
import { fileURLToPath } from "url";
import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

import { ConfigManager, normalizeOpenApiConfig } from "./lib/config-manager.js";
import {
  findAvailablePort,
  resolvePackageManager,
  writeFileAtomic,
} from "./lib/utils.js";
import { MDXToNextJSGenerator } from "./mdx-to-nextjs-generator.js";

export type WatchSignal = "SIGINT" | "SIGTERM";

type WatchChildProcess = EventEmitter &
  Pick<ChildProcess, "exitCode" | "signalCode" | "kill" | "pid">;

const CHILD_EXIT_TIMEOUT_MS = 5_000;
const CHILD_FORCE_EXIT_TIMEOUT_MS = 1_000;

function signalChildProcessTree(
  child: WatchChildProcess,
  signal: NodeJS.Signals,
): boolean {
  if (process.platform !== "win32" && child.pid !== undefined) {
    try {
      process.kill(-child.pid, signal);
      return true;
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ESRCH"
      ) {
        return false;
      }
      throw error;
    }
  }
  return child.kill(signal);
}

function waitForChildClose(
  child: WatchChildProcess,
  timeoutMs: number,
): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const done = (closed: boolean) => {
      clearTimeout(timer);
      child.removeListener("close", onClose);
      resolve(closed);
    };
    const onClose = () => done(true);
    const timer = setTimeout(() => done(false), timeoutMs);
    timer.unref();
    child.once("close", onClose);
  });
}

async function terminateChildProcess(child: WatchChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;

  const closed = waitForChildClose(child, CHILD_EXIT_TIMEOUT_MS);
  signalChildProcessTree(child, "SIGTERM");
  if (await closed) return;

  const forceClosed = waitForChildClose(child, CHILD_FORCE_EXIT_TIMEOUT_MS);
  signalChildProcessTree(child, "SIGKILL");
  if (!(await forceClosed)) {
    throw new Error("Next.js dev server did not terminate");
  }
}

export function superviseWatchLifecycle(
  devServer: WatchChildProcess,
  stopGenerator: () => Promise<void>,
  signalSource: EventEmitter = process,
): Promise<WatchSignal> {
  return new Promise((resolve, reject) => {
    let finishing = false;

    const removeSignalListeners = () => {
      signalSource.removeListener("SIGINT", onSigint);
      signalSource.removeListener("SIGTERM", onSigterm);
    };

    const finish = (
      outcome: { signal: WatchSignal } | { error: Error },
      terminateChild: boolean,
    ) => {
      if (finishing) return;
      finishing = true;
      removeSignalListeners();

      void (async () => {
        const cleanupErrors: unknown[] = [];
        const cleanup = [stopGenerator()];
        if (terminateChild) cleanup.push(terminateChildProcess(devServer));
        for (const result of await Promise.allSettled(cleanup)) {
          if (result.status === "rejected") cleanupErrors.push(result.reason);
        }

        if ("error" in outcome) {
          if (cleanupErrors.length > 0) {
            reject(
              new AggregateError(
                [outcome.error, ...cleanupErrors],
                outcome.error.message,
              ),
            );
          } else {
            reject(outcome.error);
          }
        } else if (cleanupErrors.length > 0) {
          reject(
            new AggregateError(cleanupErrors, "Failed to shut down cleanly"),
          );
        } else {
          resolve(outcome.signal);
        }
      })();
    };

    const onError = (error: Error) => {
      finish(
        {
          error: new Error(
            `Error starting Next.js dev server: ${error.message}`,
            {
              cause: error,
            },
          ),
        },
        false,
      );
    };
    const onClose = (code: number | null, signal: NodeJS.Signals | null) => {
      devServer.removeListener("error", onError);
      if (finishing) return;

      const detail =
        code !== null
          ? ` with code ${code}`
          : signal
            ? ` from signal ${signal}`
            : "";
      finish(
        {
          error: new Error(`Next.js dev server exited unexpectedly${detail}`),
        },
        false,
      );
    };
    const onSigint = () => finish({ signal: "SIGINT" }, true);
    const onSigterm = () => finish({ signal: "SIGTERM" }, true);

    devServer.once("error", onError);
    devServer.once("close", onClose);
    signalSource.once("SIGINT", onSigint);
    signalSource.once("SIGTERM", onSigterm);
  });
}

async function dependencyFingerprint(
  outputDir: string,
  packageManager: string,
): Promise<string> {
  const packageJson = await fs.readFile(
    path.join(outputDir, "package.json"),
    "utf8",
  );
  return createHash("sha256")
    .update(packageManager)
    .update("\0")
    .update(packageJson)
    .digest("hex");
}

async function needsDependencyInstall(
  outputDir: string,
  packageManager: string,
): Promise<boolean> {
  if (!(await fs.pathExists(path.join(outputDir, "node_modules")))) return true;
  const stampPath = path.join(outputDir, ".doccupine-install");
  try {
    const expected = await dependencyFingerprint(outputDir, packageManager);
    return (await fs.readFile(stampPath, "utf8")).trim() !== expected;
  } catch {
    return true;
  }
}

async function recordDependencyInstall(
  outputDir: string,
  packageManager: string,
): Promise<void> {
  const fingerprint = await dependencyFingerprint(outputDir, packageManager);
  await writeFileAtomic(
    path.join(outputDir, ".doccupine-install"),
    `${fingerprint}\n`,
  );
}

export async function runCli(argv?: string[]): Promise<void> {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const packageJson = JSON.parse(
    await fs.readFile(path.join(__dirname, "..", "package.json"), "utf8"),
  ) as { version: string };
  const program = new Command();

  program
    .name("doccupine")
    .description(
      "Watch MDX files and generate Next.js documentation pages automatically",
    )
    .version(packageJson.version);

  program
    .command("watch", { isDefault: true })
    .description("Watch a directory for MDX changes and generate Next.js app")
    .option("--port <port>", "Port for Next.js dev server")
    .option("--verbose", "Show verbose output")
    .option("--reset", "Reset configuration and prompt for new directories")
    .option("--skip-install", "Skip dependency installation")
    .option(
      "--package-manager <name>",
      "Package manager for the generated app: pnpm or npm (default: auto-detect)",
    )
    .action(async (options) => {
      const configManager = new ConfigManager();
      const config = await configManager.getConfig({
        reset: options.reset,
        port: options.port,
      });

      const generator = new MDXToNextJSGenerator(
        config.watchDir,
        config.outputDir,
        normalizeOpenApiConfig(config.openapi),
      );

      // Config paths are project-relative; child processes get an absolute cwd.
      const outputDir = path.resolve(process.cwd(), config.outputDir);

      await generator.init();

      // Prefer pnpm (the generated app ships a pnpm workspace) and fall back to
      // npm. A --package-manager flag or a "packageManager" field in
      // doccupine.json overrides detection; the flag wins.
      const packageManager = resolvePackageManager(
        options.packageManager ?? config.packageManager,
      );

      console.log(chalk.blue(`📦 Using ${packageManager.name}...`));

      if (options.skipInstall) {
        console.log(chalk.yellow("⏭️ Skipping dependency installation"));
      } else if (await needsDependencyInstall(outputDir, packageManager.name)) {
        console.log(chalk.blue("📦 Installing dependencies..."));
        const install = spawn(packageManager.bin, ["install"], {
          cwd: outputDir,
          stdio: "inherit",
        });

        await new Promise((resolve, reject) => {
          install.on("close", (code) => {
            if (code === 0) {
              resolve(void 0);
            } else {
              reject(
                new Error(
                  `${packageManager.name} install failed with code ${code}`,
                ),
              );
            }
          });
          install.on("error", reject);
        });
        await recordDependencyInstall(outputDir, packageManager.name);
        console.log(chalk.green("✅ Dependencies installed"));
      } else {
        console.log(chalk.green("✅ Dependencies are already up to date"));
      }

      const requestedPort = Number(config.port);
      const port = await findAvailablePort(requestedPort);
      if (port !== requestedPort) {
        console.log(
          chalk.yellow(
            `⚠️ Port ${config.port} is in use, using port ${port} instead`,
          ),
        );
      }
      console.log(
        chalk.blue(`🚀 Starting Next.js dev server on port ${port}...`),
      );
      await generator.startWatching();

      const portStr = String(port);
      const devArgs =
        packageManager.name === "npm"
          ? ["run", "dev", "--", "--port", portStr]
          : ["run", "dev", "--port", portStr];
      let devServer: ReturnType<typeof spawn>;
      try {
        devServer = spawn(packageManager.bin, devArgs, {
          cwd: outputDir,
          stdio: ["ignore", "pipe", "pipe"],
          detached: process.platform !== "win32",
        });
      } catch (error) {
        await generator.stop();
        throw error;
      }

      devServer.stdout?.on("data", (data: Buffer) => {
        const output = data.toString();
        if (output.includes("Ready") || output.includes("started")) {
          console.log(
            chalk.green(`🌐 Next.js ready at http://localhost:${port}`),
          );
        }
        if (options.verbose) {
          process.stdout.write(chalk.gray("[Next.js] ") + output);
        } else if (
          output.includes("compiled") ||
          output.includes("error") ||
          output.includes("Ready")
        ) {
          process.stdout.write(chalk.gray("[Next.js] ") + output);
        }
      });

      devServer.stderr?.on("data", (data: Buffer) => {
        const output = data.toString();
        if (
          options.verbose ||
          output.includes("Error") ||
          output.includes("error")
        ) {
          process.stderr.write(chalk.red("[Next.js] ") + output);
        }
      });

      console.log(
        chalk.green("🎉 Generator is running! Press Ctrl+C to stop."),
      );
      console.log(chalk.cyan(`📝 Edit your MDX files in: ${config.watchDir}`));

      const signal = await superviseWatchLifecycle(devServer, () =>
        generator.stop(),
      );
      console.log(chalk.yellow("\n🛑 Shutting down..."));
      process.exitCode = signal === "SIGINT" ? 130 : 143;
    });

  program
    .command("build")
    .alias("generate")
    .description("Generate the Next.js app once without running its build")
    .option("--reset", "Reset configuration and prompt for new directories")
    .action(async (options) => {
      const configManager = new ConfigManager();
      const config = await configManager.getConfig({
        reset: options.reset,
      });

      const generator = new MDXToNextJSGenerator(
        config.watchDir,
        config.outputDir,
        normalizeOpenApiConfig(config.openapi),
      );
      await generator.init();
      console.log(chalk.green("🎉 Generation complete!"));
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
          console.log(
            chalk.white("Watch Directory:"),
            chalk.cyan(path.relative(process.cwd(), config.watchDir)),
          );
          console.log(
            chalk.white("Output Directory:"),
            chalk.cyan(path.relative(process.cwd(), config.outputDir)),
          );
          console.log(chalk.white("Port:"), chalk.cyan(config.port || "3000"));
        } else {
          console.log(chalk.yellow("⚠️ No configuration file found"));
        }
      } else if (options.reset) {
        await configManager.getConfig({ reset: true });
        console.log(chalk.green("✅ Configuration reset"));
      } else {
        console.log(
          chalk.blue(
            "Use --show to display configuration or --reset to reset it",
          ),
        );
      }
    });

  await program.parseAsync(argv ?? process.argv);
}
