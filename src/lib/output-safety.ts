import fs from "fs-extra";
import type { Stats } from "node:fs";
import { open } from "node:fs/promises";
import path from "node:path";

const MARKER_FILE = ".doccupine-generated.json";
const SAFE_UNOWNED_FILES = new Set([".DS_Store", ".gitkeep", ".env"]);
const GENERATED_SUBTREES = new Set([
  "app",
  "components",
  "lib",
  "public",
  "scripts",
  "services",
  "types",
  "utils",
]);
const GENERATED_TOP_LEVEL_FILES = new Set([
  ".env.example",
  ".gitignore",
  ".npmrc",
  ".prettierignore",
  ".prettierrc",
  "analytics.json",
  "config.json",
  "eslint.config.mjs",
  "fonts.json",
  "links.json",
  "navigation.json",
  "next.config.ts",
  "package.json",
  "pnpm-workspace.yaml",
  "proxy.ts",
  "sections.json",
  "theme.json",
  "tsconfig.json",
]);

interface ClaimedOutputIdentity {
  lexicalRoot: string;
  realRoot: string;
  dev: number;
  ino: number;
}

const claimedOutputRoots = new Map<string, ClaimedOutputIdentity>();

const LEGACY_FILE_FINGERPRINTS = [
  {
    path: "components/Docs.tsx",
    fragments: [
      "@/components/layout/DocsComponents",
      "StyledMarkdownContainer",
      "remarkGfm",
    ],
  },
  {
    path: "components/SideBar.tsx",
    fragments: [
      "@/components/layout/DocsComponents",
      "StyledSidebar",
      "function SideBar(",
    ],
  },
  {
    path: "components/layout/DocsComponents.tsx",
    fragments: [
      "StyledMarkdownContainer",
      "function DocsContainer(",
      "DocsSidebar",
    ],
  },
] as const;

function isSafeUnownedEntry(name: string): boolean {
  return SAFE_UNOWNED_FILES.has(name) || name.startsWith(".env.");
}

export function isPathInside(parent: string, candidate: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

export function resolveWithin(root: string, ...segments: string[]): string {
  const resolvedRoot = path.resolve(root);
  const candidate = path.resolve(resolvedRoot, ...segments);
  if (!isPathInside(resolvedRoot, candidate)) {
    throw new Error(
      `Refusing to write outside generated output: ${candidate} is not within ${resolvedRoot}`,
    );
  }
  return candidate;
}

function identityFrom(
  lexicalRoot: string,
  realRoot: string,
  stat: Stats,
): ClaimedOutputIdentity {
  return {
    lexicalRoot,
    realRoot,
    dev: stat.dev,
    ino: stat.ino,
  };
}

function assertClaimedIdentity(identity: ClaimedOutputIdentity): void {
  let lexicalStat: Stats;
  let realRoot: string;
  let realStat: Stats;
  try {
    lexicalStat = fs.lstatSync(identity.lexicalRoot);
    realRoot = fs.realpathSync(identity.lexicalRoot);
    realStat = fs.lstatSync(realRoot);
  } catch {
    throw new Error(
      `Refusing generated operation in ${identity.lexicalRoot}: the claimed outputDir no longer exists or cannot be resolved.`,
    );
  }

  if (
    lexicalStat.isSymbolicLink() ||
    !lexicalStat.isDirectory() ||
    realRoot !== identity.realRoot ||
    lexicalStat.dev !== identity.dev ||
    lexicalStat.ino !== identity.ino ||
    !sameFile(lexicalStat, realStat)
  ) {
    throw new Error(
      `Refusing generated operation in ${identity.lexicalRoot}: the claimed outputDir was replaced or its physical identity changed.`,
    );
  }
}

function enclosingClaims(filePath: string): ClaimedOutputIdentity[] {
  const resolvedPath = path.resolve(filePath);
  return [...claimedOutputRoots.values()].filter(
    (identity) =>
      isPathInside(identity.lexicalRoot, resolvedPath) ||
      isPathInside(identity.realRoot, resolvedPath),
  );
}

function assertNoClaimedChildSymlinks(
  identity: ClaimedOutputIdentity,
  filePath: string,
): void {
  const resolvedPath = path.resolve(filePath);
  const root = isPathInside(identity.realRoot, resolvedPath)
    ? identity.realRoot
    : identity.lexicalRoot;
  const relativeParent = path.relative(root, path.dirname(resolvedPath));
  if (
    relativeParent === "" ||
    relativeParent === ".." ||
    relativeParent.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeParent)
  ) {
    return;
  }

  let current = root;
  for (const component of relativeParent.split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) {
        throw new Error(
          `Refusing generated operation at ${resolvedPath}: ${current} is a symbolic link. Replace it with a real path inside outputDir.`,
        );
      }
    } catch (error) {
      if (errorCode(error) === "ENOENT") return;
      throw error;
    }
  }
}

/** Revalidates the claimed output root containing a previously resolved path. */
export function assertClaimedOutputPath(filePath: string): void {
  for (const identity of enclosingClaims(filePath)) {
    assertClaimedIdentity(identity);
    assertNoClaimedChildSymlinks(identity, filePath);
  }
}

/**
 * Resolves a generated destination and rejects any existing symlink component.
 * This is synchronous so callers can validate immediately before an fs call.
 */
export function resolveOutputPath(root: string, ...segments: string[]): string {
  const resolvedRoot = path.resolve(root);
  assertClaimedOutputPath(resolvedRoot);
  const lexicalCandidate = resolveWithin(resolvedRoot, ...segments);
  const rootStat = fs.lstatSync(resolvedRoot);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error(
      `Refusing generated operation in ${resolvedRoot}: outputDir is not a real directory.`,
    );
  }

  const realRoot = fs.realpathSync(resolvedRoot);
  const currentRootStat = fs.lstatSync(resolvedRoot);
  const realRootStat = fs.lstatSync(realRoot);
  if (
    currentRootStat.isSymbolicLink() ||
    !currentRootStat.isDirectory() ||
    !sameFile(rootStat, currentRootStat) ||
    !sameFile(currentRootStat, realRootStat)
  ) {
    throw new Error(
      `Refusing generated operation in ${resolvedRoot}: outputDir changed while its physical path was being resolved.`,
    );
  }

  const relative = path.relative(resolvedRoot, lexicalCandidate);
  const candidate = path.resolve(realRoot, relative);
  let current = realRoot;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) {
        throw new Error(
          `Refusing generated operation at ${candidate}: ${current} is a symbolic link. Replace it with a real path inside outputDir.`,
        );
      }
    } catch (error) {
      if (errorCode(error) === "ENOENT") break;
      throw error;
    }
  }

  return candidate;
}

function errorCode(error: unknown): string | undefined {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : undefined;
}

async function lstatIfPresent(filePath: string) {
  try {
    return await fs.lstat(filePath);
  } catch (error) {
    if (errorCode(error) === "ENOENT") return null;
    throw error;
  }
}

function sameFile(left: Stats, right: Stats): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

async function readStableRegularFile(
  outputDir: string,
  filePath: string,
  expectedStat: Stats,
): Promise<string> {
  const handle = await open(filePath, "r");
  try {
    const beforeRead = await handle.stat();
    if (!beforeRead.isFile() || !sameFile(expectedStat, beforeRead)) {
      throw new Error(
        `Refusing to use ${outputDir}: ${filePath} changed while it was being opened. Run the command again after checking the directory.`,
      );
    }

    const content = await handle.readFile("utf8");
    const afterRead = await handle.stat();
    if (
      !sameFile(beforeRead, afterRead) ||
      beforeRead.size !== afterRead.size ||
      beforeRead.mtimeMs !== afterRead.mtimeMs ||
      beforeRead.ctimeMs !== afterRead.ctimeMs
    ) {
      throw new Error(
        `Refusing to use ${outputDir}: ${filePath} changed while it was being read. Run the command again after checking the directory.`,
      );
    }
    return content;
  } finally {
    await handle.close();
  }
}

export async function readOutputFileIfPresent(
  root: string,
  ...segments: string[]
): Promise<string | null> {
  const filePath = resolveOutputPath(root, ...segments);
  const stat = await lstatIfPresent(filePath);
  if (!stat) return null;
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(
      `Refusing generated read at ${filePath}: expected a regular file, not a symbolic link or directory.`,
    );
  }
  return readStableRegularFile(root, filePath, stat);
}

function symlinkError(
  outputDir: string,
  linkPath: string,
  detail: string,
): Error {
  return new Error(
    `Refusing to use ${outputDir}: symbolic link ${linkPath} ${detail}. Replace it with a real file or directory inside outputDir.`,
  );
}

async function rejectGeneratedSymlink(
  outputDir: string,
  realOutputDir: string,
  linkPath: string,
): Promise<void> {
  let target: string;
  try {
    target = await fs.realpath(linkPath);
  } catch {
    throw symlinkError(
      outputDir,
      linkPath,
      "is dangling or cannot be resolved",
    );
  }

  if (!isPathInside(realOutputDir, target)) {
    throw symlinkError(
      outputDir,
      linkPath,
      `resolves outside outputDir to ${target}`,
    );
  }

  throw symlinkError(
    outputDir,
    linkPath,
    `is inside a generated path and resolves to ${target}`,
  );
}

async function inspectGeneratedSubtree(
  outputDir: string,
  realOutputDir: string,
  directory: string,
): Promise<void> {
  const entries = await fs.readdir(directory);
  for (const name of entries) {
    const entryPath = path.join(directory, name);
    const stat = await fs.lstat(entryPath);
    if (stat.isSymbolicLink()) {
      await rejectGeneratedSymlink(outputDir, realOutputDir, entryPath);
    } else if (stat.isDirectory()) {
      await inspectGeneratedSubtree(outputDir, realOutputDir, entryPath);
    }
  }
}

function isGeneratedName(name: string): boolean {
  return (
    GENERATED_SUBTREES.has(name) ||
    GENERATED_TOP_LEVEL_FILES.has(name) ||
    name.startsWith(".doccupine-")
  );
}

async function isGeneratedPathName(
  outputDir: string,
  name: string,
  stat: Stats,
): Promise<boolean> {
  if (isGeneratedName(name)) return true;

  const lowercaseName = name.toLowerCase();
  if (lowercaseName === name || !isGeneratedName(lowercaseName)) return false;

  const lowercaseStat = await lstatIfPresent(
    path.join(outputDir, lowercaseName),
  );
  return lowercaseStat !== null && sameFile(stat, lowercaseStat);
}

async function assertSafeOutputLinks(
  outputDir: string,
  realOutputDir: string,
): Promise<void> {
  const entries = await fs.readdir(realOutputDir);

  for (const name of entries) {
    const entryPath = path.join(realOutputDir, name);
    const stat = await fs.lstat(entryPath);
    const isGeneratedPath = await isGeneratedPathName(
      realOutputDir,
      name,
      stat,
    );
    if (stat.isSymbolicLink() && isGeneratedPath) {
      await rejectGeneratedSymlink(outputDir, realOutputDir, entryPath);
    } else if (
      stat.isDirectory() &&
      isGeneratedPath &&
      GENERATED_SUBTREES.has(name.toLowerCase())
    ) {
      await inspectGeneratedSubtree(outputDir, realOutputDir, entryPath);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasStringProperty(value: unknown, property: string): boolean {
  return isRecord(value) && typeof value[property] === "string";
}

async function isRealDirectory(directory: string): Promise<boolean> {
  try {
    return (await fs.lstat(directory)).isDirectory();
  } catch {
    return false;
  }
}

async function matchesLegacyFileFingerprints(
  outputDir: string,
): Promise<boolean> {
  for (const fingerprint of LEGACY_FILE_FINGERPRINTS) {
    const filePath = resolveOutputPath(outputDir, fingerprint.path);
    let content: string;
    try {
      content = await fs.readFile(filePath, "utf8");
    } catch {
      return false;
    }
    if (
      !fingerprint.fragments.every((fragment) => content.includes(fragment))
    ) {
      return false;
    }
  }
  return true;
}

async function looksLikeLegacyGeneratedApp(
  outputDir: string,
): Promise<boolean> {
  try {
    const packagePath = resolveOutputPath(outputDir, "package.json");
    if (!(await fs.pathExists(packagePath))) return false;
    const packageJson: unknown = await fs.readJson(packagePath);
    if (!isRecord(packageJson)) return false;

    const scripts = packageJson.scripts;
    const dependencies = packageJson.dependencies;
    const devDependencies = packageJson.devDependencies;
    return (
      packageJson.name === "doccupine" &&
      packageJson.version === "0.1.0" &&
      packageJson.private === true &&
      isRecord(scripts) &&
      scripts.dev === "next dev" &&
      scripts.start === "next start" &&
      hasStringProperty(dependencies, "next") &&
      hasStringProperty(dependencies, "react") &&
      hasStringProperty(dependencies, "react-dom") &&
      (hasStringProperty(dependencies, "next-mdx-remote") ||
        hasStringProperty(devDependencies, "next-mdx-remote") ||
        hasStringProperty(dependencies, "react-markdown") ||
        hasStringProperty(devDependencies, "react-markdown")) &&
      (await isRealDirectory(resolveOutputPath(outputDir, "app"))) &&
      (await matchesLegacyFileFingerprints(outputDir))
    );
  } catch {
    return false;
  }
}

/**
 * Claims an empty output directory, recognizes directories generated by older
 * Doccupine versions, and refuses to overwrite arbitrary existing projects.
 */
export async function claimOutputDirectory(outputDir: string): Promise<void> {
  const lexicalOutputDir = path.resolve(outputDir);
  assertClaimedOutputPath(lexicalOutputDir);

  const existingRoot = await lstatIfPresent(outputDir);
  if (existingRoot?.isSymbolicLink()) {
    throw symlinkError(
      outputDir,
      outputDir,
      "is the outputDir itself and may redirect generated operations",
    );
  }
  if (existingRoot && !existingRoot.isDirectory()) {
    throw new Error(
      `Refusing to use ${outputDir}: outputDir exists and is not a directory.`,
    );
  }

  await fs.ensureDir(outputDir);
  const createdRoot = await fs.lstat(outputDir);
  if (createdRoot.isSymbolicLink() || !createdRoot.isDirectory()) {
    throw new Error(
      `Refusing to use ${outputDir}: outputDir changed while it was being claimed.`,
    );
  }

  const realOutputDir = await fs.realpath(outputDir);
  const verifiedRoot = await fs.lstat(outputDir);
  const realRoot = await fs.lstat(realOutputDir);
  if (
    verifiedRoot.isSymbolicLink() ||
    !verifiedRoot.isDirectory() ||
    !sameFile(createdRoot, verifiedRoot) ||
    !sameFile(verifiedRoot, realRoot)
  ) {
    throw new Error(
      `Refusing to use ${outputDir}: outputDir changed while its physical path was being resolved.`,
    );
  }
  const claimedIdentity = identityFrom(
    lexicalOutputDir,
    realOutputDir,
    verifiedRoot,
  );

  // Validate links before reading ownership or allowing callers to remove app/.
  // Installed dependencies are outside the generated subtrees and are not
  // traversed; generated direct output entries are still checked before use.
  await assertSafeOutputLinks(outputDir, realOutputDir);
  const markerPath = path.join(realOutputDir, MARKER_FILE);
  const markerStat = await lstatIfPresent(markerPath);

  if (markerStat) {
    if (markerStat.isSymbolicLink() || !markerStat.isFile()) {
      throw new Error(
        `Refusing to use ${outputDir}: ${MARKER_FILE} must be a regular file, not a symbolic link or directory. Replace it with a valid Doccupine marker or remove the directory manually.`,
      );
    }

    const markerContent = await readStableRegularFile(
      outputDir,
      markerPath,
      markerStat,
    );
    let marker: { generator?: unknown };
    try {
      marker = JSON.parse(markerContent) as { generator?: unknown };
    } catch {
      throw new Error(
        `Refusing to use ${outputDir}: ${MARKER_FILE} is invalid. Restore or remove the directory manually.`,
      );
    }
    if (marker.generator !== "doccupine") {
      throw new Error(
        `Refusing to use ${outputDir}: ${MARKER_FILE} is invalid. Restore or remove the directory manually.`,
      );
    }
    assertClaimedIdentity(claimedIdentity);
    claimedOutputRoots.set(lexicalOutputDir, claimedIdentity);
    return;
  }

  const entries = await fs.readdir(realOutputDir);
  const canClaim =
    entries.every(isSafeUnownedEntry) ||
    (await looksLikeLegacyGeneratedApp(realOutputDir));
  if (!canClaim) {
    throw new Error(
      `Refusing to overwrite non-empty directory ${outputDir}. Choose an empty outputDir or a Doccupine-generated directory.`,
    );
  }

  try {
    await fs.writeFile(
      markerPath,
      `${JSON.stringify({ generator: "doccupine", schemaVersion: 1 }, null, 2)}\n`,
      { flag: "wx" },
    );
  } catch (error) {
    if (errorCode(error) === "EEXIST") {
      throw new Error(
        `Refusing to use ${outputDir}: ${MARKER_FILE} changed while the directory was being claimed. Run the command again after checking the directory.`,
      );
    }
    throw error;
  }

  assertClaimedIdentity(claimedIdentity);
  claimedOutputRoots.set(lexicalOutputDir, claimedIdentity);
}
