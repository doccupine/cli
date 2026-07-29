import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import chalk from "chalk";
import matter from "gray-matter";

export type PackageManagerName = "pnpm" | "npm";

export interface ResolvedPackageManager {
  name: PackageManagerName;
  /** Absolute path when we can resolve one, otherwise the bare command name.
   *  Spawning the resolved path (not the bare name) is what lets pnpm work
   *  even when its install dir is missing from the process PATH. */
  bin: string;
}

let atomicWriteCounter = 0;

/**
 * Writes a generated file without exposing a partially-written version to the
 * Next.js dev server or another watcher pass.
 */
export async function writeFileAtomic(
  filePath: string,
  content: string,
): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  const tempPath = `${filePath}.${process.pid}.${atomicWriteCounter++}.tmp`;
  try {
    await fs.writeFile(tempPath, content, "utf8");
    try {
      // Atomic replacement on POSIX: the destination is never absent or
      // partially written, so dev-server watchers see one coherent change.
      await fs.rename(tempPath, filePath);
      return;
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "";
      const windowsReplaceFailure =
        process.platform === "win32" && (code === "EPERM" || code === "EEXIST");
      if (!windowsReplaceFailure) throw error;
      // Windows cannot always rename over an existing destination. fs-extra's
      // overwrite move is the compatibility fallback for that platform only.
      await fs.move(tempPath, filePath, { overwrite: true });
      return;
    }
  } catch (error) {
    await fs.remove(tempPath);
    throw error;
  }
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

/**
 * gray-matter that never throws: malformed YAML frontmatter is reported as a
 * warning and the file is treated as having no frontmatter, so one typo in a
 * `---` block can't abort a whole build or site-wide aggregation pass. The
 * broken block is stripped from the body best-effort; an unterminated block
 * passes through as-is and the generated app's MDX error panel absorbs it.
 */
export function safeMatter(
  raw: string,
  label?: string,
): { data: { [key: string]: any }; content: string } {
  try {
    const { data, content } = matter(raw);
    return { data, content };
  } catch (error) {
    const where = label ? ` in ${label}` : "";
    console.warn(
      chalk.yellow(`⚠️  Invalid frontmatter${where}; ignoring it.`),
      error instanceof Error ? error.message : error,
    );
    return {
      data: {},
      content: raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, ""),
    };
  }
}

/**
 * Renders `value` as a JS string literal using the same quote Prettier would
 * choose: double by default, switching to single when that needs fewer escapes
 * (JSON text, for instance, is full of `"`). Backslashes and the chosen quote
 * are escaped. Lets generated code embed a string in a form Prettier leaves
 * untouched, so emitted files stay format-stable without running a formatter.
 */
export function toJsStringLiteral(value: string): string {
  const doubleQuotes = (value.match(/"/g) || []).length;
  const singleQuotes = (value.match(/'/g) || []).length;
  const quote = singleQuotes < doubleQuotes ? "'" : '"';
  const escaped = value.replace(/\\/g, "\\\\").split(quote).join(`\\${quote}`);
  return `${quote}${escaped}${quote}`;
}
