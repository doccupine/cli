import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { GeneratedArtifacts } from "./generated-artifacts.js";

const temporaryDirectories: string[] = [];

async function temporaryDirectory(): Promise<string> {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "doccupine-artifacts-"),
  );
  temporaryDirectories.push(directory);
  return directory;
}

async function makeDirectoryLink(target: string, linkPath: string) {
  await fs.symlink(
    target,
    linkPath,
    process.platform === "win32" ? "junction" : "dir",
  );
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((dir) => fs.remove(dir)),
  );
});

describe("GeneratedArtifacts", () => {
  it("persists source ownership and safe llms paths", async () => {
    const outputDir = await temporaryDirectory();
    const artifacts = new GeneratedArtifacts(outputDir);
    artifacts.replaceRoutes("mdx", [
      { source: "guide.mdx", slug: "api/guide" },
    ]);
    artifacts.replaceLlmsPageFiles(["api/guide.md"]);
    await artifacts.save();

    const reloaded = new GeneratedArtifacts(outputDir);
    await reloaded.load();

    expect(reloaded.routeFor("mdx", "guide.mdx")).toBe("api/guide");
    expect(reloaded.llmsPageFiles()).toEqual(new Set(["api/guide.md"]));
  });

  it("rejects unsafe paths written through its API", async () => {
    const outputDir = await temporaryDirectory();
    const artifacts = new GeneratedArtifacts(outputDir);

    expect(() =>
      artifacts.replaceRoutes("mdx", [
        { source: "guide.mdx", slug: "../../outside" },
      ]),
    ).toThrow("unsafe mdx route ownership");
    expect(() => artifacts.replaceLlmsPageFiles(["../../outside.md"])).toThrow(
      "unsafe llms page path",
    );
  });

  it("ignores traversal entries while safely migrating the legacy manifest", async () => {
    const outputDir = await temporaryDirectory();
    await fs.writeJson(path.join(outputDir, ".doccupine-llms-manifest.json"), {
      pageFiles: ["guide.md", "../../victim.md", "/absolute.md", "guide.txt"],
    });
    await fs.writeJson(path.join(outputDir, ".doccupine-api-manifest.json"), {
      pageSlugs: ["api-reference/users"],
    });

    const artifacts = new GeneratedArtifacts(outputDir);
    await artifacts.load();

    expect(artifacts.llmsPageFiles()).toEqual(new Set(["guide.md"]));
    expect(
      await fs.pathExists(
        path.join(outputDir, ".doccupine-llms-manifest.json"),
      ),
    ).toBe(false);
    expect(
      await fs.pathExists(path.join(outputDir, ".doccupine-api-manifest.json")),
    ).toBe(false);
  });

  it("rejects a symlinked current manifest on load and save", async () => {
    const parent = await temporaryDirectory();
    const outputDir = path.join(parent, "output");
    const external = path.join(parent, "external");
    await fs.ensureDir(outputDir);
    await fs.ensureDir(external);
    await fs.writeFile(path.join(external, "important.txt"), "keep");
    await makeDirectoryLink(
      external,
      path.join(outputDir, ".doccupine-artifacts.json"),
    );

    const artifacts = new GeneratedArtifacts(outputDir);
    await expect(artifacts.load()).rejects.toThrow("is a symbolic link");
    await expect(artifacts.save()).rejects.toThrow("is a symbolic link");
    await expect(
      fs.readFile(path.join(external, "important.txt"), "utf8"),
    ).resolves.toBe("keep");
  });

  it.each([".doccupine-llms-manifest.json", ".doccupine-api-manifest.json"])(
    "refuses to remove a symlinked legacy manifest %s",
    async (fileName) => {
      const parent = await temporaryDirectory();
      const outputDir = path.join(parent, "output");
      const external = path.join(parent, "external");
      await fs.ensureDir(outputDir);
      await fs.ensureDir(external);
      await fs.writeFile(path.join(external, "important.txt"), "keep");
      await makeDirectoryLink(external, path.join(outputDir, fileName));

      const artifacts = new GeneratedArtifacts(outputDir);
      await expect(artifacts.load()).rejects.toThrow("is a symbolic link");
      await expect(
        fs.readFile(path.join(external, "important.txt"), "utf8"),
      ).resolves.toBe("keep");
    },
  );

  it("rejects an output root replaced with a symlink after construction", async () => {
    const parent = await temporaryDirectory();
    const outputDir = path.join(parent, "output");
    const originalOutput = path.join(parent, "original-output");
    const external = path.join(parent, "external");
    await fs.ensureDir(outputDir);
    await fs.ensureDir(external);
    const artifacts = new GeneratedArtifacts(outputDir);
    await fs.rename(outputDir, originalOutput);
    await makeDirectoryLink(external, outputDir);

    await expect(artifacts.save()).rejects.toThrow(
      "outputDir is not a real directory",
    );
    await expect(
      fs.pathExists(path.join(external, ".doccupine-artifacts.json")),
    ).resolves.toBe(false);
  });
});
