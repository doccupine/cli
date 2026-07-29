import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  claimOutputDirectory,
  isPathInside,
  resolveWithin,
} from "./output-safety.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("output safety", () => {
  it("uses path-segment boundaries, not string prefixes", () => {
    expect(isPathInside("/project/app", "/project/app/page.tsx")).toBe(true);
    expect(isPathInside("/project/app", "/project/app-secret/page.tsx")).toBe(
      false,
    );
    expect(() =>
      resolveWithin("/project/generated", "../../../../tmp/pwn"),
    ).toThrow("outside generated output");
  });

  it("claims an empty directory and recognizes its marker", async () => {
    const output = await fs.mkdtemp(
      path.join(os.tmpdir(), "doccupine-output-"),
    );
    tempDirs.push(output);
    await claimOutputDirectory(output);
    await expect(
      fs.readJson(path.join(output, ".doccupine-generated.json")),
    ).resolves.toMatchObject({ generator: "doccupine" });
    await expect(claimOutputDirectory(output)).resolves.toBeUndefined();
  });

  it("claims a directory containing only harmless local metadata", async () => {
    const output = await fs.mkdtemp(
      path.join(os.tmpdir(), "doccupine-output-"),
    );
    tempDirs.push(output);
    await fs.writeFile(path.join(output, ".DS_Store"), "finder");
    await fs.writeFile(path.join(output, ".env.local"), "SECRET=preserved");

    await expect(claimOutputDirectory(output)).resolves.toBeUndefined();
    await expect(
      fs.readFile(path.join(output, ".env.local"), "utf8"),
    ).resolves.toBe("SECRET=preserved");
  });

  it("refuses an unrelated non-empty directory", async () => {
    const output = await fs.mkdtemp(
      path.join(os.tmpdir(), "doccupine-output-"),
    );
    tempDirs.push(output);
    await fs.writeFile(path.join(output, "important.txt"), "keep");
    await expect(claimOutputDirectory(output)).rejects.toThrow(
      "Refusing to overwrite non-empty directory",
    );
  });
});
