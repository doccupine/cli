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
});
