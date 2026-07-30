import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { safeMatter, writeFileAtomic } from "./utils.js";

const tempDirs: string[] = [];
const executionProbe = "DOCCUPINE_SAFE_MATTER_EXECUTED";

afterEach(async () => {
  vi.restoreAllMocks();
  delete process.env[executionProbe];
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("safeMatter", () => {
  it("rejects language-tagged frontmatter without executing it", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});

    for (const prefix of ["", "\uFEFF"]) {
      const { data, content } = safeMatter(
        `${prefix}---javascript\nprocess.env.${executionProbe} = "yes"\n---\n\nBody.\n`,
        "unsafe.mdx",
      );

      expect(process.env[executionProbe]).toBeUndefined();
      expect(data).toEqual({});
      expect(content.trim()).toBe("Body.");
    }
    expect(warning).toHaveBeenCalledTimes(2);
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining("only YAML frontmatter is allowed"),
    );
  });
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
