import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, vi } from "vitest";

const temporaryDirectories: string[] = [];

export async function fixture(): Promise<{
  root: string;
  watchDir: string;
  outputDir: string;
}> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "doccupine-generator-"));
  temporaryDirectories.push(root);
  const watchDir = path.join(root, "docs");
  const outputDir = path.join(root, "site");
  await fs.ensureDir(watchDir);
  return { root, watchDir, outputDir };
}

export async function waitUntil(check: () => Promise<boolean>): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error("Timed out waiting for watcher output");
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    temporaryDirectories.splice(0).map((dir) => fs.remove(dir)),
  );
});
