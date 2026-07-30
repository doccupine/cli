import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { MDXToNextJSGenerator } from "../mdx-to-nextjs-generator.js";
import {
  claimOutputDirectory,
  isPathInside,
  resolveOutputPath,
  resolveWithin,
} from "./output-safety.js";
import { writeFileAtomic } from "./utils.js";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "doccupine-output-"),
  );
  tempDirs.push(directory);
  return directory;
}

async function makeDirectoryLink(target: string, linkPath: string) {
  await fs.symlink(
    target,
    linkPath,
    process.platform === "win32" ? "junction" : "dir",
  );
}

async function writeValidMarker(output: string) {
  await fs.writeJson(path.join(output, ".doccupine-generated.json"), {
    generator: "doccupine",
    schemaVersion: 1,
  });
}

async function writeLegacyPackage(output: string) {
  await fs.writeJson(path.join(output, "package.json"), {
    name: "doccupine",
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
    },
    dependencies: {
      next: "16.1.0",
      react: "19.2.0",
      "react-dom": "19.2.0",
    },
    devDependencies: {
      "react-markdown": "10.1.0",
    },
  });
}

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
    const output = await makeTempDir();
    await claimOutputDirectory(output);
    await expect(
      fs.readJson(path.join(output, ".doccupine-generated.json")),
    ).resolves.toMatchObject({ generator: "doccupine" });
    await expect(claimOutputDirectory(output)).resolves.toBeUndefined();
  });

  it("claims a directory containing only harmless local metadata", async () => {
    const output = await makeTempDir();
    await fs.writeFile(path.join(output, ".DS_Store"), "finder");
    await fs.writeFile(path.join(output, ".env.local"), "SECRET=preserved");

    await expect(claimOutputDirectory(output)).resolves.toBeUndefined();
    await expect(
      fs.readFile(path.join(output, ".env.local"), "utf8"),
    ).resolves.toBe("SECRET=preserved");
  });

  it("refuses an unrelated non-empty directory", async () => {
    const output = await makeTempDir();
    await fs.writeFile(path.join(output, "important.txt"), "keep");
    await expect(claimOutputDirectory(output)).rejects.toThrow(
      "Refusing to overwrite non-empty directory",
    );
  });

  it("refuses a symlink used as outputDir", async () => {
    const parent = await makeTempDir();
    const target = path.join(parent, "target");
    const output = path.join(parent, "output-link");
    await fs.ensureDir(target);
    await fs.writeFile(path.join(target, "important.txt"), "keep");
    await makeDirectoryLink(target, output);

    await expect(claimOutputDirectory(output)).rejects.toThrow(
      "is the outputDir itself",
    );
    await expect(
      fs.readFile(path.join(target, "important.txt"), "utf8"),
    ).resolves.toBe("keep");
  });

  it("supports a real output directory below a symlinked parent", async () => {
    const parent = await makeTempDir();
    const physicalParent = path.join(parent, "physical-parent");
    const linkedParent = path.join(parent, "linked-parent");
    await fs.ensureDir(physicalParent);
    await makeDirectoryLink(physicalParent, linkedParent);
    const output = path.join(linkedParent, "output");

    await claimOutputDirectory(output);

    const realOutput = await fs.realpath(output);
    expect(resolveOutputPath(output, "app", "page.tsx")).toBe(
      path.join(realOutput, "app", "page.tsx"),
    );
  });

  it("refuses a symlink at the exact marker path", async () => {
    const parent = await makeTempDir();
    const output = path.join(parent, "output");
    const externalMarker = path.join(parent, "external-marker");
    await fs.ensureDir(output);
    await fs.ensureDir(externalMarker);
    await makeDirectoryLink(
      externalMarker,
      path.join(output, ".doccupine-generated.json"),
    );

    await expect(claimOutputDirectory(output)).rejects.toThrow("symbolic link");
  });

  it("refuses a non-file marker", async () => {
    const output = await makeTempDir();
    await fs.ensureDir(path.join(output, ".doccupine-generated.json"));

    await expect(claimOutputDirectory(output)).rejects.toThrow(
      "must be a regular file",
    );
  });

  it("rejects case-aliased marker symlinks on case-insensitive filesystems", async () => {
    const parent = await makeTempDir();
    const output = path.join(parent, "output");
    const externalMarker = path.join(parent, "external-marker");
    const lowercaseMarker = path.join(output, ".doccupine-generated.json");
    const uppercaseMarker = path.join(output, ".DOCCUPINE-GENERATED.JSON");
    await fs.ensureDir(output);
    await fs.ensureDir(externalMarker);
    await makeDirectoryLink(externalMarker, uppercaseMarker);

    try {
      await fs.lstat(lowercaseMarker);
    } catch {
      // The alias is distinct on case-sensitive filesystems, so it cannot be
      // followed through the lowercase marker path.
      return;
    }

    await expect(claimOutputDirectory(output)).rejects.toThrow("symbolic link");
  });

  it("refuses generated descendants that link outside outputDir", async () => {
    const parent = await makeTempDir();
    const output = path.join(parent, "output");
    const external = path.join(parent, "external");
    await fs.ensureDir(path.join(output, "app", "nested"));
    await fs.ensureDir(external);
    await writeValidMarker(output);
    await fs.writeFile(path.join(external, "important.txt"), "keep");
    await makeDirectoryLink(
      external,
      path.join(output, "app", "nested", "escape"),
    );

    await expect(claimOutputDirectory(output)).rejects.toThrow(
      "resolves outside outputDir",
    );
    await expect(
      fs.readFile(path.join(external, "important.txt"), "utf8"),
    ).resolves.toBe("keep");
  });

  it("claims output before the generator removes app", async () => {
    const parent = await makeTempDir();
    const watchDir = path.join(parent, "docs");
    const output = path.join(parent, "output");
    const external = path.join(parent, "external-app");
    await fs.ensureDir(watchDir);
    await fs.ensureDir(output);
    await fs.ensureDir(external);
    await writeValidMarker(output);
    await fs.writeFile(path.join(external, "important.txt"), "keep");
    await makeDirectoryLink(external, path.join(output, "app"));

    const generator = new MDXToNextJSGenerator(watchDir, output, [], parent);
    await expect(generator.init()).rejects.toThrow(
      "resolves outside outputDir",
    );
    await expect(
      fs.readFile(path.join(external, "important.txt"), "utf8"),
    ).resolves.toBe("keep");
  });

  it("rejects a symlink introduced before a later generator write", async () => {
    const parent = await makeTempDir();
    const watchDir = path.join(parent, "docs");
    const output = path.join(parent, "output");
    const external = path.join(parent, "external-route");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.ensureDir(external);
    await fs.writeFile(path.join(external, "important.txt"), "keep");

    const generator = new MDXToNextJSGenerator(watchDir, output, [], parent);
    await generator.init();
    await makeDirectoryLink(
      external,
      path.join(output, "app", "(site)", "escape"),
    );

    await expect(
      generator.generatePageFromMDX({
        path: "guide.mdx",
        content: "# Guide\n",
        frontmatter: { title: "Guide" },
        slug: "escape/guide",
      }),
    ).rejects.toThrow("is a symbolic link");
    await expect(
      fs.readFile(path.join(external, "important.txt"), "utf8"),
    ).resolves.toBe("keep");
  });

  it("rejects generated removal after the claimed output root is replaced", async () => {
    const parent = await makeTempDir();
    const watchDir = path.join(parent, "docs");
    const output = path.join(parent, "output");
    const originalOutput = path.join(parent, "original-output");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");

    const generator = new MDXToNextJSGenerator(watchDir, output, [], parent);
    await generator.init();
    await fs.rename(output, originalOutput);
    await fs.outputFile(path.join(output, "app", "important.txt"), "keep");

    await expect(generator.createNextJSStructure()).rejects.toThrow(
      "claimed outputDir was replaced",
    );
    await expect(
      fs.readFile(path.join(output, "app", "important.txt"), "utf8"),
    ).resolves.toBe("keep");
  });

  it("rejects an atomic write through a path resolved before root replacement", async () => {
    const parent = await makeTempDir();
    const output = path.join(parent, "output");
    const originalOutput = path.join(parent, "original-output");
    await claimOutputDirectory(output);
    const target = resolveOutputPath(output, "config.json");

    await fs.rename(output, originalOutput);
    await fs.outputFile(target, "victim");

    await expect(writeFileAtomic(target, "generated")).rejects.toThrow(
      "claimed outputDir was replaced",
    );
    await expect(fs.readFile(target, "utf8")).resolves.toBe("victim");
  });

  it("rejects an intermediate symlink added after destination resolution", async () => {
    const parent = await makeTempDir();
    const output = path.join(parent, "output");
    const external = path.join(parent, "external");
    const displaced = path.join(parent, "displaced");
    await claimOutputDirectory(output);
    await fs.ensureDir(path.join(output, "app", "nested"));
    await fs.ensureDir(external);
    const target = resolveOutputPath(output, "app", "nested", "page.tsx");

    await fs.rename(path.join(output, "app", "nested"), displaced);
    await makeDirectoryLink(external, path.join(output, "app", "nested"));

    await expect(writeFileAtomic(target, "generated")).rejects.toThrow(
      "is a symbolic link",
    );
    await expect(fs.pathExists(path.join(external, "page.tsx"))).resolves.toBe(
      false,
    );
    expect(
      (await fs.readdir(external)).filter((name) => name.endsWith(".tmp")),
    ).toEqual([]);
  });

  it("refuses links inside generated paths even when their target is internal", async () => {
    const output = await makeTempDir();
    await fs.ensureDir(path.join(output, "app"));
    await fs.ensureDir(path.join(output, "components", "shared"));
    await writeValidMarker(output);
    await makeDirectoryLink(
      path.join(output, "components", "shared"),
      path.join(output, "app", "shared"),
    );

    await expect(claimOutputDirectory(output)).rejects.toThrow(
      "is inside a generated path",
    );
  });

  it("rejects a symlink added on a future generated path", async () => {
    const parent = await makeTempDir();
    const output = path.join(parent, "output");
    const external = path.join(parent, "external");
    await fs.ensureDir(output);
    await fs.ensureDir(external);
    await claimOutputDirectory(output);
    await fs.ensureDir(path.join(output, "app"));
    await makeDirectoryLink(external, path.join(output, "app", "later"));

    expect(() => resolveOutputPath(output, "app", "later", "page.tsx")).toThrow(
      "is a symbolic link",
    );
  });

  it("does not reject unrelated symlinks elsewhere in the project", async () => {
    const parent = await makeTempDir();
    const output = path.join(parent, "output");
    const external = path.join(parent, "external");
    await fs.ensureDir(output);
    await fs.ensureDir(external);
    await writeValidMarker(output);
    await makeDirectoryLink(external, path.join(output, "unmanaged-cache"));

    await expect(claimOutputDirectory(output)).resolves.toBeUndefined();
  });

  it("claims legitimate legacy Doccupine output with strong fingerprints", async () => {
    const output = await makeTempDir();
    await writeLegacyPackage(output);
    await fs.ensureDir(path.join(output, "app"));
    await fs.outputFile(
      path.join(output, "components", "Docs.tsx"),
      `import remarkGfm from "remark-gfm";\nimport { DocsContainer, StyledMarkdownContainer } from "@/components/layout/DocsComponents";\n`,
    );
    await fs.outputFile(
      path.join(output, "components", "SideBar.tsx"),
      `import { StyledSidebar } from "@/components/layout/DocsComponents";\nfunction SideBar() {}\n`,
    );
    await fs.outputFile(
      path.join(output, "components", "layout", "DocsComponents.tsx"),
      `export const StyledMarkdownContainer = {};\nfunction DocsContainer() {}\nfunction DocsSidebar() {}\n`,
    );

    await expect(claimOutputDirectory(output)).resolves.toBeUndefined();
    await expect(
      fs.readJson(path.join(output, ".doccupine-generated.json")),
    ).resolves.toMatchObject({ generator: "doccupine" });
  });

  it("refuses a private Next app that only nearly matches legacy output", async () => {
    const output = await makeTempDir();
    await writeLegacyPackage(output);
    await fs.ensureDir(path.join(output, "app"));
    await fs.outputFile(
      path.join(output, "components", "Docs.tsx"),
      `import remarkGfm from "remark-gfm";\nimport { DocsContainer, StyledMarkdownContainer } from "@/components/layout/DocsComponents";\n`,
    );
    await fs.outputFile(
      path.join(output, "components", "SideBar.tsx"),
      `import { StyledSidebar } from "@/components/layout/DocsComponents";\nfunction SideBar() {}\n`,
    );
    await fs.outputFile(
      path.join(output, "components", "layout", "DocsComponents.tsx"),
      `export const StyledMarkdownContainer = {};\nfunction DocsContainer() {}\n`,
    );
    await fs.writeFile(path.join(output, "important.txt"), "keep");

    await expect(claimOutputDirectory(output)).rejects.toThrow(
      "Refusing to overwrite non-empty directory",
    );
    await expect(
      fs.readFile(path.join(output, "important.txt"), "utf8"),
    ).resolves.toBe("keep");
    await expect(
      fs.pathExists(path.join(output, ".doccupine-generated.json")),
    ).resolves.toBe(false);
  });
});
