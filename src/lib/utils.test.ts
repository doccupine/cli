import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { writeFileAtomic } from "./utils.js";

const tempDirs: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("writeFileAtomic", () => {
  it("atomically replaces an existing file without the move fallback", async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "doccupine-atomic-"),
    );
    tempDirs.push(directory);
    const target = path.join(directory, "page.tsx");
    await fs.writeFile(target, "old");
    const move = vi.spyOn(fs, "move");

    await writeFileAtomic(target, "new");

    await expect(fs.readFile(target, "utf8")).resolves.toBe("new");
    if (process.platform !== "win32") expect(move).not.toHaveBeenCalled();
    expect(
      (await fs.readdir(directory)).filter((name) => name.endsWith(".tmp")),
    ).toEqual([]);
  });
});
