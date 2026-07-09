import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import chalk from "chalk";

export type PackageManagerName = "pnpm" | "npm";

export interface ResolvedPackageManager {
  name: PackageManagerName;
  /** Absolute path when we can resolve one, otherwise the bare command name.
   *  Spawning the resolved path (not the bare name) is what lets pnpm work
   *  even when its install dir is missing from the process PATH. */
  bin: string;
}

/**
 * Locates a usable pnpm binary without relying solely on the caller's PATH.
 * Standalone pnpm installs (e.g. ~/Library/pnpm) expose PNPM_HOME but only add
 * their bin dir to PATH via an interactive shell rc, so a CLI launched from an
 * IDE terminal or GUI often can't see `pnpm` on PATH. Returns null if pnpm
 * genuinely isn't available.
 */
function findPnpmBin(): string | null {
  const exe = process.platform === "win32" ? "pnpm.exe" : "pnpm";

  const home = process.env.PNPM_HOME;
  if (home) {
    const candidate = path.join(home, exe);
    if (fs.existsSync(candidate)) return candidate;
  }

  try {
    execSync("pnpm --version", { stdio: "ignore" });
    return "pnpm";
  } catch {
    return null;
  }
}

/**
 * Chooses the package manager for the generated app. The app ships a pnpm
 * workspace, so pnpm is preferred whenever it can be found; npm is the fallback.
 * An explicit `override` (from `--package-manager` or doccupine.json) always
 * wins. Auto-detection also trusts `npm_config_user_agent` when pnpm launched
 * the CLI.
 */
export function resolvePackageManager(
  override?: string,
): ResolvedPackageManager {
  const requested = override?.trim().toLowerCase();

  if (requested === "npm") return { name: "npm", bin: "npm" };
  if (requested === "pnpm") {
    const bin = findPnpmBin();
    if (bin) return { name: "pnpm", bin };
    console.warn(
      chalk.yellow(
        "⚠️ packageManager is set to pnpm but pnpm could not be found; using npm.",
      ),
    );
    return { name: "npm", bin: "npm" };
  }
  if (requested) {
    console.warn(
      chalk.yellow(
        `⚠️ Unknown packageManager "${override}" (expected "pnpm" or "npm"); auto-detecting instead.`,
      ),
    );
  }

  const launchedByPnpm = (process.env.npm_config_user_agent || "").startsWith(
    "pnpm",
  );
  if (launchedByPnpm) return { name: "pnpm", bin: "pnpm" };

  const bin = findPnpmBin();
  if (bin) return { name: "pnpm", bin };
  return { name: "npm", bin: "npm" };
}

export async function findAvailablePort(startPort: number): Promise<number> {
  const net = await import("net");

  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      server.close(() => resolve(startPort));
    });
    server.on("error", () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

export function generateSlug(filePath: string): string {
  if (filePath === "index.mdx" || filePath === "./index.mdx") {
    return "";
  }

  const normalized = filePath
    .replace(/\.mdx$/, "")
    .replace(/\\/g, "/")
    .replace(/[^a-zA-Z0-9\/\-_]/g, "-")
    .toLowerCase();

  // Strip trailing /index for subdirectory index files
  if (normalized.endsWith("/index")) {
    return normalized.slice(0, -"/index".length);
  }

  return normalized;
}

export function getFullSlug(pageSlug: string, sectionSlug: string): string {
  if (!sectionSlug) return pageSlug;
  if (pageSlug === "") return sectionSlug;
  return `${sectionSlug}/${pageSlug}`;
}

export function escapeTemplateContent(content: string): string {
  return content
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}
