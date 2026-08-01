import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import net from "node:net";

import {
  findAvailablePort,
  isMdxPath,
  safeMatter,
  writeFileAtomic,
} from "./utils.js";

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

describe("isMdxPath", () => {
  it("accepts every casing of the extension", () => {
    for (const name of ["a.mdx", "a.MDX", "a.Mdx", "docs/Guide.mDx"]) {
      expect(isMdxPath(name)).toBe(true);
    }
  });

  it("rejects non-MDX paths", () => {
    for (const name of ["a.md", "a.mdxx", "mdx", "a.mdx.bak"]) {
      expect(isMdxPath(name)).toBe(false);
    }
  });
});

describe("findAvailablePort", () => {
  it("skips a port that is already in use", async () => {
    const blocker = net.createServer();
    await new Promise<void>((resolve) => blocker.listen(0, resolve));
    const taken = (blocker.address() as net.AddressInfo).port;

    try {
      expect(await findAvailablePort(taken)).toBeGreaterThan(taken);
    } finally {
      await new Promise<void>((resolve) => blocker.close(() => resolve()));
    }
  });

  it("explains the failure instead of scanning past the last valid port", async () => {
    const blocker = net.createServer();
    await new Promise<void>((resolve) => blocker.listen(65535, resolve));

    try {
      await expect(findAvailablePort(65535)).rejects.toThrow(
        /No free port available from 65535 to 65535/,
      );
    } finally {
      await new Promise<void>((resolve) => blocker.close(() => resolve()));
    }
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

  it.skipIf(process.platform === "win32")(
    "replaces a destination symlink without modifying its target",
    async () => {
      const directory = await fs.mkdtemp(
        path.join(os.tmpdir(), "doccupine-atomic-link-"),
      );
      tempDirs.push(directory);
      const target = path.join(directory, "page.tsx");
      const victim = path.join(directory, "victim.txt");
      await fs.writeFile(victim, "keep");
      await fs.symlink(victim, target, "file");

      await writeFileAtomic(target, Buffer.from("new"));

      await expect(fs.readFile(target, "utf8")).resolves.toBe("new");
      await expect(fs.readFile(victim, "utf8")).resolves.toBe("keep");
      expect((await fs.lstat(target)).isSymbolicLink()).toBe(false);
      expect(
        (await fs.readdir(directory)).filter((name) => name.endsWith(".tmp")),
      ).toEqual([]);
    },
  );

  it("replaces a destination hard link without modifying its peer", async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), "doccupine-atomic-hardlink-"),
    );
    tempDirs.push(directory);
    const target = path.join(directory, "page.tsx");
    const peer = path.join(directory, "peer.txt");
    await fs.writeFile(peer, "keep");
    await fs.link(peer, target);

    await writeFileAtomic(target, "new");

    await expect(fs.readFile(target, "utf8")).resolves.toBe("new");
    await expect(fs.readFile(peer, "utf8")).resolves.toBe("keep");
    expect(
      (await fs.readdir(directory)).filter((name) => name.endsWith(".tmp")),
    ).toEqual([]);
  });
});
