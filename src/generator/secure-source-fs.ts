import fs from "fs-extra";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { open, type FileHandle } from "node:fs/promises";
import path from "node:path";

import { isPathInside, resolveWithin } from "../lib/output-safety.js";
import { isMdxPath } from "../lib/utils.js";

function errorCode(error: unknown): string | undefined {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : undefined;
}

function sameFileIdentity(left: fs.Stats, right: fs.Stats): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

interface PinnedDocumentationRoot {
  resolvedRoot: string;
  rootStat: fs.Stats;
  realRoot: string;
  realRootStat: fs.Stats;
}

export class SecureSourceFs {
  private documentationRoot: string;
  private projectRoot: string;

  constructor(documentationRoot: string, projectRoot: string) {
    this.documentationRoot = path.resolve(documentationRoot);
    this.projectRoot = path.resolve(projectRoot);
  }

  private sourcePathError(label: string, sourcePath: string, detail: string) {
    return new Error(
      `Refusing to use ${label} at ${sourcePath}: ${detail}. Replace it with a real file or directory inside the source root.`,
    );
  }

  private async realSourceRoot(
    root: string,
    label: string,
    rejectRootSymlink: boolean,
  ): Promise<string> {
    let rootStat: fs.Stats;
    try {
      rootStat = await fs.lstat(root);
    } catch (error) {
      if (errorCode(error) === "ENOENT") {
        throw this.sourcePathError(
          label,
          root,
          "the source root does not exist",
        );
      }
      throw error;
    }
    if (rootStat.isSymbolicLink() && rejectRootSymlink) {
      throw this.sourcePathError(
        label,
        root,
        "the source root is a symbolic link",
      );
    }

    const realRoot = await fs.realpath(root);
    if (!(await fs.stat(realRoot)).isDirectory()) {
      throw this.sourcePathError(
        label,
        root,
        "the source root is not a directory",
      );
    }
    return realRoot;
  }

  private async readSafeSourceFile(
    root: string,
    sourcePath: string,
    label: string,
    rejectRootSymlink: boolean,
  ): Promise<{ data: Buffer; stat: fs.Stats }> {
    const resolvedRoot = path.resolve(root);
    const resolvedSource = path.resolve(sourcePath);
    if (!isPathInside(resolvedRoot, resolvedSource)) {
      throw this.sourcePathError(
        label,
        resolvedSource,
        `the path is outside ${resolvedRoot}`,
      );
    }

    const realRoot = await this.realSourceRoot(
      resolvedRoot,
      label,
      rejectRootSymlink,
    );
    const relativePath = path.relative(resolvedRoot, resolvedSource);
    const components = relativePath.split(path.sep).filter(Boolean);
    let currentPath = resolvedRoot;
    for (const [index, component] of components.entries()) {
      currentPath = path.join(currentPath, component);
      let stat: fs.Stats;
      try {
        stat = await fs.lstat(currentPath);
      } catch (error) {
        if (errorCode(error) === "ENOENT") {
          throw this.sourcePathError(
            label,
            currentPath,
            "the path does not exist",
          );
        }
        throw error;
      }
      if (stat.isSymbolicLink()) {
        throw this.sourcePathError(
          label,
          currentPath,
          "the path is a symbolic link",
        );
      }
      if (index < components.length - 1 && !stat.isDirectory()) {
        throw this.sourcePathError(
          label,
          currentPath,
          "a path component is not a directory",
        );
      }
    }

    const sourceStat = await fs.lstat(resolvedSource);
    if (!sourceStat.isFile()) {
      throw this.sourcePathError(
        label,
        resolvedSource,
        "expected a regular file",
      );
    }
    const realSource = await fs.realpath(resolvedSource);
    if (!isPathInside(realRoot, realSource)) {
      throw this.sourcePathError(
        label,
        resolvedSource,
        `the real path ${realSource} is outside ${realRoot}`,
      );
    }

    const noFollow =
      typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0;
    let handle: FileHandle;
    try {
      handle = await open(resolvedSource, constants.O_RDONLY | noFollow);
    } catch (error) {
      if (errorCode(error) === "ELOOP") {
        throw this.sourcePathError(
          label,
          resolvedSource,
          "the final path became a symbolic link while it was being opened",
        );
      }
      throw error;
    }

    try {
      const openedStat = await handle.stat();
      if (!openedStat.isFile()) {
        throw this.sourcePathError(
          label,
          resolvedSource,
          "the opened source is not a regular file",
        );
      }

      let currentStat: fs.Stats;
      let currentRealSource: string;
      let currentRealStat: fs.Stats;
      try {
        currentStat = await fs.lstat(resolvedSource);
        currentRealSource = await fs.realpath(resolvedSource);
        currentRealStat = await fs.lstat(currentRealSource);
      } catch {
        throw this.sourcePathError(
          label,
          resolvedSource,
          "the path changed while it was being opened",
        );
      }

      if (!isPathInside(realRoot, currentRealSource)) {
        throw this.sourcePathError(
          label,
          resolvedSource,
          `the real path ${currentRealSource} is outside ${realRoot}`,
        );
      }
      if (
        currentStat.isSymbolicLink() ||
        !currentStat.isFile() ||
        !currentRealStat.isFile() ||
        !sameFileIdentity(sourceStat, openedStat) ||
        !sameFileIdentity(openedStat, currentStat) ||
        !sameFileIdentity(openedStat, currentRealStat)
      ) {
        throw this.sourcePathError(
          label,
          resolvedSource,
          "the source identity changed while it was being opened",
        );
      }

      return { data: await handle.readFile(), stat: openedStat };
    } finally {
      await handle.close();
    }
  }

  async readMdxSourceFile(
    filePath: string,
  ): Promise<{ content: string; stat: fs.Stats }> {
    if (!isMdxPath(filePath)) {
      throw this.sourcePathError(
        "documentation source",
        filePath,
        "expected an .mdx file",
      );
    }
    const { data, stat } = await this.readSafeSourceFile(
      this.documentationRoot,
      path.resolve(this.documentationRoot, filePath),
      "documentation source",
      false,
    );
    return { content: data.toString("utf8"), stat };
  }

  async readProjectSourceFile(
    sourcePath: string,
    label: string,
  ): Promise<{ data: Buffer; stat: fs.Stats }> {
    return this.readSafeSourceFile(this.projectRoot, sourcePath, label, false);
  }

  async readPublicSourceFile(
    sourcePath: string,
  ): Promise<{ data: Buffer; stat: fs.Stats }> {
    return this.readSafeSourceFile(
      path.join(this.projectRoot, "public"),
      sourcePath,
      "public source",
      true,
    );
  }

  private async assertPinnedDocumentationRoot(
    pinned: PinnedDocumentationRoot,
  ): Promise<void> {
    try {
      const currentRootStat = await fs.lstat(pinned.resolvedRoot);
      const currentRealRoot = await fs.realpath(pinned.resolvedRoot);
      const currentRealRootStat = await fs.stat(currentRealRoot);
      if (
        currentRealRoot !== pinned.realRoot ||
        !currentRealRootStat.isDirectory() ||
        !sameFileIdentity(pinned.rootStat, currentRootStat) ||
        !sameFileIdentity(pinned.realRootStat, currentRealRootStat)
      ) {
        throw new Error("changed");
      }
    } catch {
      throw this.sourcePathError(
        "documentation source",
        pinned.resolvedRoot,
        "the source root changed while starter documents were being created",
      );
    }
  }

  private async pinDocumentationRoot(): Promise<PinnedDocumentationRoot> {
    const resolvedRoot = path.resolve(this.documentationRoot);
    const rootStat = await fs.lstat(resolvedRoot);
    const realRoot = await this.realSourceRoot(
      resolvedRoot,
      "documentation source",
      false,
    );
    const realRootStat = await fs.stat(realRoot);
    const pinned = { resolvedRoot, rootStat, realRoot, realRootStat };
    await this.assertPinnedDocumentationRoot(pinned);
    return pinned;
  }

  private async removeCreatedStarterFile(
    targetPath: string,
    openedStat: fs.Stats,
  ): Promise<void> {
    try {
      const currentStat = await fs.lstat(targetPath);
      if (
        !currentStat.isSymbolicLink() &&
        currentStat.isFile() &&
        sameFileIdentity(openedStat, currentStat)
      ) {
        await fs.unlink(targetPath);
      }
    } catch (error) {
      if (errorCode(error) !== "ENOENT") throw error;
    }
  }

  private async writeStarterFile(
    relativePath: string,
    content: string | Uint8Array,
    pinned: PinnedDocumentationRoot,
  ): Promise<void> {
    await this.assertPinnedDocumentationRoot(pinned);
    const { resolvedRoot, realRoot } = pinned;
    const targetPath = path.resolve(resolvedRoot, relativePath);
    if (!isPathInside(resolvedRoot, targetPath)) {
      throw this.sourcePathError(
        "documentation source",
        targetPath,
        `the starter path is outside ${resolvedRoot}`,
      );
    }

    const parentRelativePath = path.relative(
      resolvedRoot,
      path.dirname(targetPath),
    );
    let currentPath = resolvedRoot;
    for (const component of parentRelativePath
      .split(path.sep)
      .filter(Boolean)) {
      currentPath = path.join(currentPath, component);
      try {
        await fs.mkdir(currentPath);
      } catch (error) {
        if (errorCode(error) !== "EEXIST") throw error;
      }
      const stat = await fs.lstat(currentPath);
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        throw this.sourcePathError(
          "documentation source",
          currentPath,
          "a starter directory component is not a real directory",
        );
      }
      const realPath = await fs.realpath(currentPath);
      if (!isPathInside(realRoot, realPath)) {
        throw this.sourcePathError(
          "documentation source",
          currentPath,
          `the real path ${realPath} is outside ${realRoot}`,
        );
      }
    }

    const parentPath = path.dirname(targetPath);
    const parentStat = await fs.lstat(parentPath);
    const realParent = await fs.realpath(parentPath);

    try {
      const stat = await fs.lstat(targetPath);
      const detail = stat.isSymbolicLink()
        ? "the starter file is a symbolic link"
        : "the starter file appeared after the empty-source check";
      throw this.sourcePathError("documentation source", targetPath, detail);
    } catch (error) {
      if (errorCode(error) !== "ENOENT") throw error;
    }

    const noFollow =
      typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0;
    let handle: FileHandle;
    try {
      handle = await open(
        targetPath,
        constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow,
        0o666,
      );
    } catch (error) {
      if (errorCode(error) === "EEXIST" || errorCode(error) === "ELOOP") {
        throw this.sourcePathError(
          "documentation source",
          targetPath,
          "the starter path changed before it could be created",
        );
      }
      throw error;
    }

    let openedStat: fs.Stats | undefined;
    try {
      openedStat = await handle.stat();
      let currentParentStat: fs.Stats;
      let currentRealParent: string;
      let currentTargetStat: fs.Stats;
      try {
        currentParentStat = await fs.lstat(parentPath);
        currentRealParent = await fs.realpath(parentPath);
        currentTargetStat = await fs.lstat(targetPath);
      } catch {
        throw this.sourcePathError(
          "documentation source",
          targetPath,
          "the starter path changed while it was being created",
        );
      }

      const stableRootSymlink =
        parentPath === resolvedRoot &&
        parentStat.isSymbolicLink() &&
        currentParentStat.isSymbolicLink() &&
        sameFileIdentity(parentStat, currentParentStat);

      if (
        (!currentParentStat.isDirectory() && !stableRootSymlink) ||
        currentRealParent !== realParent ||
        !isPathInside(realRoot, currentRealParent) ||
        !sameFileIdentity(parentStat, currentParentStat) ||
        currentTargetStat.isSymbolicLink() ||
        !currentTargetStat.isFile() ||
        !sameFileIdentity(openedStat, currentTargetStat)
      ) {
        throw this.sourcePathError(
          "documentation source",
          targetPath,
          "the starter path changed while it was being created",
        );
      }

      await handle.writeFile(content);
    } catch (error) {
      try {
        await handle.close();
      } catch {
        // Preserve the creation failure; cleanup below still verifies identity.
      }
      if (openedStat) {
        try {
          await this.removeCreatedStarterFile(targetPath, openedStat);
        } catch {
          // Preserve the original failure rather than masking its cause.
        }
      }
      throw error;
    }
    await handle.close();
  }

  async writeStarterFilesIfEmpty(
    files:
      | Iterable<readonly [string, string | Uint8Array]>
      | AsyncIterable<readonly [string, string | Uint8Array]>,
  ): Promise<void> {
    const pinned = await this.pinDocumentationRoot();
    const existingFiles = await this.getAllMdxFiles();
    await this.assertPinnedDocumentationRoot(pinned);
    if (existingFiles.length > 0) return;

    for await (const [relativePath, content] of files) {
      await this.writeStarterFile(relativePath, content, pinned);
    }
  }

  async pathState(filePath: string, hashContents = false): Promise<string> {
    try {
      const stat = await fs.lstat(filePath);
      const kind = stat.isDirectory()
        ? "directory"
        : stat.isFile()
          ? "file"
          : stat.isSymbolicLink()
            ? "symlink"
            : "other";
      const hash =
        hashContents && stat.isFile()
          ? createHash("sha256")
              .update(await fs.readFile(filePath))
              .digest("hex")
          : "";
      return `${kind}:${stat.size}:${stat.mtimeMs}:${stat.dev}:${stat.ino}:${hash}`;
    } catch (error) {
      if (errorCode(error) === "ENOENT") return "missing";
      throw error;
    }
  }

  async treeState(
    root: string,
    includeFile: (relativePath: string) => boolean,
    hashContents = false,
  ): Promise<string> {
    if (!(await fs.pathExists(root))) return "missing";
    const entries: string[] = [];
    const scan = async (directory: string, relativePath = "") => {
      const children = await fs.readdir(directory, { withFileTypes: true });
      children.sort((left, right) => left.name.localeCompare(right.name));
      for (const child of children) {
        const childRelativePath = path.join(relativePath, child.name);
        const childPath = path.join(directory, child.name);
        const state = await this.pathState(childPath, hashContents);
        if (state === "missing") continue;
        if (child.isDirectory()) {
          entries.push(`${childRelativePath.replace(/\\/g, "/")}:${state}`);
          await scan(childPath, childRelativePath);
        } else if (includeFile(childRelativePath)) {
          entries.push(`${childRelativePath.replace(/\\/g, "/")}:${state}`);
        }
      }
    };
    await scan(root);
    return entries.join("\n");
  }

  async scanPublicFiles(): Promise<string[] | null> {
    const publicDir = path.join(this.projectRoot, "public");
    let publicStat: fs.Stats;
    try {
      publicStat = await fs.lstat(publicDir);
    } catch (error) {
      if (errorCode(error) === "ENOENT") return null;
      throw error;
    }
    if (publicStat.isSymbolicLink() || !publicStat.isDirectory()) {
      throw this.sourcePathError(
        "public source",
        publicDir,
        "the public source root must be a real directory",
      );
    }

    const realPublicDir = await this.realSourceRoot(
      publicDir,
      "public source",
      true,
    );
    const files: string[] = [];
    const scanDir = async (directory: string, relativePath = "") => {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      for (const entry of entries) {
        const sourcePath = path.join(directory, entry.name);
        const entryRelativePath = path.join(relativePath, entry.name);
        const stat = await fs.lstat(sourcePath);
        if (stat.isSymbolicLink()) {
          throw this.sourcePathError(
            "public source",
            sourcePath,
            "the path is a symbolic link",
          );
        }
        const realPath = await fs.realpath(sourcePath);
        if (!isPathInside(realPublicDir, realPath)) {
          throw this.sourcePathError(
            "public source",
            sourcePath,
            `the real path ${realPath} is outside ${realPublicDir}`,
          );
        }
        if (stat.isDirectory()) {
          await scanDir(sourcePath, entryRelativePath);
        } else if (stat.isFile()) {
          files.push(entryRelativePath);
        } else {
          throw this.sourcePathError(
            "public source",
            sourcePath,
            "expected a regular file or directory",
          );
        }
      }
    };

    await scanDir(publicDir);
    return files;
  }

  async getAllMdxFiles(): Promise<string[]> {
    const files: string[] = [];
    const realWatchDir = await this.realSourceRoot(
      this.documentationRoot,
      "documentation source",
      false,
    );

    const scanDir = async (dir: string, relativePath = "") => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);
        const stat = await fs.lstat(fullPath);

        if (stat.isSymbolicLink()) {
          let linksToDirectory = false;
          try {
            linksToDirectory = (await fs.stat(fullPath)).isDirectory();
          } catch (error) {
            if (errorCode(error) !== "ENOENT") throw error;
          }
          if (isMdxPath(entry.name) || linksToDirectory) {
            throw this.sourcePathError(
              "documentation source",
              fullPath,
              "the path is a symbolic link",
            );
          }
          continue;
        }
        const realPath = await fs.realpath(fullPath);
        if (!isPathInside(realWatchDir, realPath)) {
          throw this.sourcePathError(
            "documentation source",
            fullPath,
            `the real path ${realPath} is outside ${realWatchDir}`,
          );
        }

        if (stat.isDirectory()) {
          await scanDir(fullPath, relPath);
        } else if (stat.isFile() && isMdxPath(entry.name)) {
          files.push(relPath);
        } else if (!stat.isFile() && isMdxPath(entry.name)) {
          throw this.sourcePathError(
            "documentation source",
            fullPath,
            "expected a regular .mdx file",
          );
        }
      }
    };

    await scanDir(this.documentationRoot);
    return files;
  }

  async findPublicAsset(relativePath: string): Promise<string | null> {
    const sourcePublicDir = path.join(this.projectRoot, "public");
    const normalized = relativePath.replace(/\\/g, "/");
    resolveWithin(sourcePublicDir, normalized);

    let rootStat: fs.Stats;
    try {
      rootStat = await fs.lstat(sourcePublicDir);
    } catch (error) {
      if (errorCode(error) === "ENOENT") return null;
      throw error;
    }
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
      throw this.sourcePathError(
        "public source",
        sourcePublicDir,
        "the public source root must be a real directory",
      );
    }
    const realPublicDir = await this.realSourceRoot(
      sourcePublicDir,
      "public source",
      true,
    );

    let currentPath = sourcePublicDir;
    const parts = normalized.split("/").filter(Boolean);
    for (const [index, part] of parts.entries()) {
      let entries: string[];
      try {
        entries = await fs.readdir(currentPath);
      } catch {
        return null;
      }
      const actualName =
        entries.find((entry) => entry === part) ??
        entries.find((entry) => entry.toLowerCase() === part.toLowerCase());
      if (!actualName) return null;
      currentPath = path.join(currentPath, actualName);
      const stat = await fs.lstat(currentPath);
      if (stat.isSymbolicLink()) {
        throw this.sourcePathError(
          "public source",
          currentPath,
          "the path is a symbolic link",
        );
      }
      if (index < parts.length - 1 && !stat.isDirectory()) return null;
    }

    const stat = await fs.lstat(currentPath);
    if (!stat.isFile()) return null;
    const realPath = await fs.realpath(currentPath);
    if (!isPathInside(realPublicDir, realPath)) {
      throw this.sourcePathError(
        "public source",
        currentPath,
        `the real path ${realPath} is outside ${realPublicDir}`,
      );
    }
    return currentPath;
  }
}
