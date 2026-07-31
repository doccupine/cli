import fs from "fs-extra";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { MDXToNextJSGenerator } from "./mdx-to-nextjs-generator.js";

import { fixture, waitUntil } from "./test-utils/generator-fixture.js";

describe.sequential("MDXToNextJSGenerator assets and config", () => {
  it("preserves project-owned public aggregate artifacts on every refresh", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const artifacts = [
      ["LLMS.TXT", "llms.txt", "USER_LLMS_INDEX\n"],
      ["Llms-Full.TxT", "llms-full.txt", "USER_LLMS_FULL\n"],
      ["SKILL.MD", "skill.md", "USER_SKILL\n"],
      [
        path.join(".WELL-KNOWN", "MCP.JSON"),
        path.join(".well-known", "mcp.json"),
        '{"user":true}\n',
      ],
    ] as const;
    for (const [sourceRelativePath, , content] of artifacts) {
      await fs.outputFile(
        path.join(root, "public", sourceRelativePath),
        content,
      );
    }

    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await generator.updateLlmsFiles();

    for (const [, outputRelativePath, content] of artifacts) {
      expect(
        await fs.readFile(
          path.join(outputDir, "public", outputRelativePath),
          "utf8",
        ),
      ).toBe(content);
    }
  });

  it("rejects public symlinks during the initial public copy", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sensitivePath = path.join(root, "sensitive.txt");
    const publicPath = path.join(root, "public", "leaked.txt");
    await fs.writeFile(sensitivePath, "SENSITIVE_PUBLIC_CONTENT\n");
    await fs.ensureDir(path.dirname(publicPath));
    await fs.symlink(sensitivePath, publicPath, "file");
    await fs.ensureDir(outputDir);
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

    await expect(generator.copyPublicFiles()).rejects.toThrow(
      /public source.*leaked\.txt.*symbolic link/i,
    );
    expect(
      await fs.pathExists(path.join(outputDir, "public", "leaked.txt")),
    ).toBe(false);
  });

  it("rejects public symlinks during watch-style copies", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sensitivePath = path.join(root, "sensitive.txt");
    const publicPath = path.join(root, "public", "leaked.txt");
    await fs.writeFile(sensitivePath, "SENSITIVE_PUBLIC_CONTENT\n");
    await fs.ensureDir(path.dirname(publicPath));
    await fs.symlink(sensitivePath, publicPath, "file");
    await fs.ensureDir(outputDir);
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(generator.handlePublicFileChange(publicPath)).rejects.toThrow(
      /public source.*leaked\.txt.*symbolic link/i,
    );
    expect(
      await fs.pathExists(path.join(outputDir, "public", "leaked.txt")),
    ).toBe(false);
  });

  it("atomically replaces a hard-linked public destination", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(root, "public", "asset.bin");
    const destPath = path.join(outputDir, "public", "asset.bin");
    const externalPeer = path.join(root, "external-peer.bin");
    await fs.outputFile(sourcePath, Buffer.from([0, 1, 2, 255]));
    await fs.outputFile(externalPeer, "keep");
    await fs.ensureDir(path.dirname(destPath));
    await fs.link(externalPeer, destPath);
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

    await generator.handlePublicFileChange(sourcePath);

    await expect(fs.readFile(destPath)).resolves.toEqual(
      Buffer.from([0, 1, 2, 255]),
    );
    await expect(fs.readFile(externalPeer, "utf8")).resolves.toBe("keep");
  });

  it("prunes public files deleted while the generator was stopped", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const sourcePath = path.join(root, "public", "obsolete.txt");
    const outputPath = path.join(outputDir, "public", "obsolete.txt");
    await fs.outputFile(sourcePath, "obsolete\n");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");

    const first = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await first.init();
    expect(await fs.readFile(outputPath, "utf8")).toBe("obsolete\n");

    await fs.remove(sourcePath);
    const second = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await second.init();

    expect(await fs.pathExists(outputPath)).toBe(false);
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.publicFiles).toEqual([]);
  });

  it("writes normalized analytics configuration to the generated runtime", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.writeJson(path.join(root, "analytics.json"), {
      provider: "posthog",
      posthog: {
        key: "phc_test-key",
        host: "  https://posthog.example/  ",
      },
    });

    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    expect(await fs.readJson(path.join(outputDir, "analytics.json"))).toEqual({
      provider: "posthog",
      posthog: {
        key: "phc_test-key",
        host: "https://posthog.example",
      },
    });
    expect(
      await fs.readFile(path.join(outputDir, "next.config.ts"), "utf8"),
    ).toContain('destination: "https://posthog.example/:path*"');
  });

  it("recreates public watching after the source directory is replaced", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const publicDir = path.join(root, "public");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.outputFile(path.join(publicDir, "old.txt"), "old\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await generator.startWatching();

    await fs.remove(publicDir);
    await waitUntil(() =>
      fs
        .pathExists(path.join(outputDir, "public", "old.txt"))
        .then((exists) => !exists),
    );
    await fs.outputFile(path.join(publicDir, "new.txt"), "new\n");
    await waitUntil(() =>
      fs.pathExists(path.join(outputDir, "public", "new.txt")),
    );
    await fs.writeFile(path.join(publicDir, "new.txt"), "updated\n");
    await waitUntil(async () => {
      try {
        return (
          (await fs.readFile(
            path.join(outputDir, "public", "new.txt"),
            "utf8",
          )) === "updated\n"
        );
      } catch {
        return false;
      }
    });

    await generator.stop();
  });

  it.skipIf(process.platform !== "darwin" && process.platform !== "win32")(
    "preserves case-only public renames on case-insensitive filesystems",
    async () => {
      const { root, watchDir, outputDir } = await fixture();
      const lowerSource = path.join(root, "public", "asset.txt");
      const upperSource = path.join(root, "public", "ASSET.txt");
      await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
      await fs.outputFile(lowerSource, "asset\n");

      const first = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
      await first.init();
      await fs.rename(lowerSource, upperSource);

      const second = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
      await second.init();

      await expect(
        fs.readFile(path.join(outputDir, "public", "ASSET.txt"), "utf8"),
      ).resolves.toBe("asset\n");
      const manifest = await fs.readJson(
        path.join(outputDir, ".doccupine-artifacts.json"),
      );
      expect(manifest.publicFiles).toContain("ASSET.txt");
      expect(manifest.publicFiles).not.toContain("asset.txt");
    },
  );

  it.skipIf(process.platform === "win32")(
    "atomically replaces a symlinked public destination",
    async () => {
      const { root, watchDir, outputDir } = await fixture();
      const sourcePath = path.join(root, "public", "asset.txt");
      const destPath = path.join(outputDir, "public", "asset.txt");
      const externalTarget = path.join(root, "external-target.txt");
      await fs.outputFile(sourcePath, "new");
      await fs.outputFile(externalTarget, "keep");
      await fs.ensureDir(path.dirname(destPath));
      await fs.symlink(externalTarget, destPath, "file");
      const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);

      await generator.handlePublicFileChange(sourcePath);

      await expect(fs.readFile(destPath, "utf8")).resolves.toBe("new");
      await expect(fs.readFile(externalTarget, "utf8")).resolves.toBe("keep");
      expect((await fs.lstat(destPath)).isSymbolicLink()).toBe(false);
    },
  );

  it.skipIf(process.platform === "win32")(
    "rejects a source parent swapped before the source is opened",
    async () => {
      const { root, watchDir, outputDir } = await fixture();
      const publicDir = path.join(root, "public");
      const sourceParent = path.join(publicDir, "assets");
      const displacedParent = path.join(publicDir, "assets-original");
      const externalParent = path.join(root, "external-assets");
      const sourcePath = path.join(sourceParent, "asset.txt");
      await fs.outputFile(sourcePath, "safe");
      await fs.outputFile(path.join(externalParent, "asset.txt"), "secret");
      await fs.ensureDir(outputDir);
      const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
      const realpath = fs.realpath.bind(fs);
      let sourceResolutions = 0;
      vi.spyOn(fs, "realpath").mockImplementation(async (candidate: string) => {
        const resolved = await realpath(candidate);
        if (
          path.resolve(candidate) === sourcePath &&
          sourceResolutions++ === 0
        ) {
          await fs.rename(sourceParent, displacedParent);
          await fs.symlink(externalParent, sourceParent, "dir");
        }
        return resolved;
      });
      vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        generator.handlePublicFileChange(sourcePath),
      ).rejects.toThrow(/real path.*outside/i);
      await expect(
        fs.pathExists(path.join(outputDir, "public", "assets", "asset.txt")),
      ).resolves.toBe(false);
    },
  );

  it.skipIf(process.platform === "win32")(
    "keeps reading the opened source if its parent is swapped afterward",
    async () => {
      const { root, watchDir, outputDir } = await fixture();
      const publicDir = path.join(root, "public");
      const sourceParent = path.join(publicDir, "assets");
      const displacedParent = path.join(publicDir, "assets-original");
      const externalParent = path.join(root, "external-assets");
      const sourcePath = path.join(sourceParent, "asset.txt");
      const destPath = path.join(outputDir, "public", "assets", "asset.txt");
      await fs.outputFile(sourcePath, "safe");
      await fs.outputFile(path.join(externalParent, "asset.txt"), "secret");
      await fs.ensureDir(outputDir);
      const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
      const lstat = fs.lstat.bind(fs);
      let sourceStats = 0;
      vi.spyOn(fs, "lstat").mockImplementation(async (candidate: string) => {
        const stat = await lstat(candidate);
        if (path.resolve(candidate) === sourcePath && ++sourceStats === 4) {
          await fs.rename(sourceParent, displacedParent);
          await fs.symlink(externalParent, sourceParent, "dir");
        }
        return stat;
      });

      await generator.handlePublicFileChange(sourcePath);

      await expect(fs.readFile(destPath, "utf8")).resolves.toBe("safe");
      await expect(
        fs.readFile(path.join(externalParent, "asset.txt"), "utf8"),
      ).resolves.toBe("secret");
    },
  );

  it("restores mixed-case managed public overrides after watch deletion", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(
      path.join(watchDir, "guide.mdx"),
      "---\ntitle: Guide\n---\nGUIDE_BODY\n",
    );
    await fs.writeJson(path.join(root, "config.json"), {
      name: "Test Docs",
      url: "https://docs.example.com",
    });
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    const artifacts = [
      ["LLMS.TXT", "llms.txt"],
      ["LLMS-FULL.TXT", "llms-full.txt"],
      ["SKILL.MD", "skill.md"],
      ["GUIDE.MD", "guide.md"],
      [
        path.join(".WELL-KNOWN", "MCP.JSON"),
        path.join(".well-known", "mcp.json"),
      ],
    ] as const;
    const generated = new Map<string, string>();
    for (const [, outputRelativePath] of artifacts) {
      generated.set(
        outputRelativePath,
        await fs.readFile(
          path.join(outputDir, "public", outputRelativePath),
          "utf8",
        ),
      );
    }

    for (const [sourceRelativePath, outputRelativePath] of artifacts) {
      const sourcePath = path.join(root, "public", sourceRelativePath);
      await fs.outputFile(sourcePath, `USER:${sourceRelativePath}\n`);
      await generator.handlePublicFileChange(sourcePath);
      expect(
        await fs.readFile(
          path.join(outputDir, "public", outputRelativePath),
          "utf8",
        ),
      ).toBe(`USER:${sourceRelativePath}\n`);
    }
    let manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.llmsPageFiles).not.toContain("guide.md");

    for (const [sourceRelativePath, outputRelativePath] of artifacts) {
      const sourcePath = path.join(root, "public", sourceRelativePath);
      await fs.remove(sourcePath);
      await generator.handlePublicFileDelete(sourcePath);
      expect(
        await fs.readFile(
          path.join(outputDir, "public", outputRelativePath),
          "utf8",
        ),
      ).toBe(generated.get(outputRelativePath));
    }
    manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.llmsPageFiles).toContain("guide.md");
  });

  it("restores generated public artifacts after watch-style overrides are deleted", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(
      path.join(watchDir, "skill.mdx"),
      "---\ntitle: Skill Page\n---\nPAGE_SKILL_BODY\n",
    );
    await fs.outputFile(
      path.join(watchDir, "guide.mdx"),
      "---\ntitle: Guide\n---\nGUIDE_BODY\n",
    );
    const configPath = path.join(root, "config.json");
    await fs.writeJson(configPath, {
      name: "Test Docs",
      url: "https://docs.example.com",
    });
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    const relativePaths = [
      "llms.txt",
      "llms-full.txt",
      "skill.md",
      "guide.md",
      path.join(".well-known", "mcp.json"),
    ];
    const generated = new Map<string, string>();
    for (const relativePath of relativePaths) {
      generated.set(
        relativePath,
        await fs.readFile(path.join(outputDir, "public", relativePath), "utf8"),
      );
    }
    expect(generated.get("skill.md")).toContain("## Reading these docs");
    expect(generated.get("skill.md")).not.toContain("PAGE_SKILL_BODY");

    for (const relativePath of relativePaths) {
      const sourcePath = path.join(root, "public", relativePath);
      await fs.outputFile(sourcePath, `USER_OVERRIDE:${relativePath}\n`);
      await generator.handlePublicFileChange(sourcePath);
      expect(
        await fs.readFile(path.join(outputDir, "public", relativePath), "utf8"),
      ).toBe(`USER_OVERRIDE:${relativePath}\n`);
    }
    let manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.llmsPageFiles).not.toContain("skill.md");
    expect(manifest.llmsPageFiles).not.toContain("guide.md");

    for (const relativePath of relativePaths) {
      const sourcePath = path.join(root, "public", relativePath);
      await fs.remove(sourcePath);
      await generator.handlePublicFileDelete(sourcePath);
      expect(
        await fs.readFile(path.join(outputDir, "public", relativePath), "utf8"),
      ).toBe(generated.get(relativePath));
    }

    manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.llmsPageFiles).not.toContain("skill.md");
    expect(manifest.llmsPageFiles).toContain("guide.md");

    await fs.writeJson(configPath, { name: "Test Docs" });
    await generator.handleConfigFileChange(configPath);
    expect(
      await fs.pathExists(
        path.join(outputDir, "public", ".well-known", "mcp.json"),
      ),
    ).toBe(false);
  });

  it("does not overwrite or delete a colliding project public asset", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(
      path.join(watchDir, "guide.mdx"),
      "---\ntitle: Guide\n---\nGenerated body\n",
    );
    await fs.outputFile(
      path.join(root, "public", "guide.md"),
      "USER_OWNED_PUBLIC_ASSET\n",
    );

    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    const publicAsset = path.join(outputDir, "public", "guide.md");
    expect(await fs.readFile(publicAsset, "utf8")).toBe(
      "USER_OWNED_PUBLIC_ASSET\n",
    );

    await fs.remove(path.join(watchDir, "guide.mdx"));
    await generator.handleFileDelete("guide.mdx");
    expect(await fs.readFile(publicAsset, "utf8")).toBe(
      "USER_OWNED_PUBLIC_ASSET\n",
    );
  });
});
