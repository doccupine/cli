import fs from "fs-extra";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { MDXToNextJSGenerator } from "./mdx-to-nextjs-generator.js";

import { fixture, waitUntil } from "./test-utils/generator-fixture.js";

describe.sequential("MDXToNextJSGenerator watching", () => {
  it("reconciles MDX, public, and OpenAPI changes made during init", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const mdxPath = path.join(watchDir, "guide.mdx");
    const publicPath = path.join(root, "public", "asset.txt");
    const specPath = path.join(root, "openapi.json");
    const writeSpec = (summary: string) =>
      fs.writeJson(specPath, {
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        paths: {
          "/users": {
            get: {
              operationId: "listUsers",
              summary,
              tags: ["users"],
              responses: { "200": { description: "OK" } },
            },
          },
        },
      });
    await fs.outputFile(
      mdxPath,
      "---\ntitle: Old\nsection: Guides\n---\nOld body\n",
    );
    await fs.outputFile(publicPath, "old asset\n");
    await writeSpec("Old API summary");
    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: "openapi.json" }],
      root,
    );
    const processAll = generator.processAllMDXFiles.bind(generator);
    vi.spyOn(generator, "processAllMDXFiles").mockImplementationOnce(
      async () => {
        await processAll();
        await fs.writeFile(
          mdxPath,
          "---\ntitle: New\nsection: Tutorials\n---\nNew body\n",
        );
        await fs.writeFile(publicPath, "new asset\n");
        await writeSpec("New API summary");
        await fs.writeJson(path.join(root, "doccupine.json"), {
          watchDir: "docs",
          outputDir: "site",
          port: "4000",
          openapi: [{ name: "Test", file: "openapi.json" }],
        });
      },
    );

    await generator.init();
    await generator.startWatching();

    expect(
      await fs.readFile(
        path.join(outputDir, "app", "(site)", "tutorials", "guide", "page.tsx"),
        "utf8",
      ),
    ).toContain("New body");
    expect(
      await fs.readFile(path.join(outputDir, "public", "asset.txt"), "utf8"),
    ).toBe("new asset\n");
    expect(
      await fs.readFile(
        path.join(
          outputDir,
          "app",
          "(site)",
          "api-reference",
          "users",
          "listusers",
          "page.tsx",
        ),
        "utf8",
      ),
    ).toContain("New API summary");
    await generator.stop();
  });

  it("closes every watcher when watcher startup fails", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    type Watcher = { close(): Promise<void> };
    type WatchCoordinatorInternals = {
      waitForWatcherReady(watcher: Watcher): Promise<void>;
      watcher: Watcher | null;
      configWatcher: Watcher | null;
      fontWatcher: Watcher | null;
      analyticsWatcher: Watcher | null;
      openApiWatcher: Watcher | null;
      doccupineConfigWatcher: Watcher | null;
      publicWatcher: Watcher | null;
      rootDirWatcher: Watcher | null;
    };
    type GeneratorInternals = {
      watchCoordinator: WatchCoordinatorInternals;
    };
    const coordinator = (generator as unknown as GeneratorInternals)
      .watchCoordinator;
    const closeSpies: Array<ReturnType<typeof vi.spyOn>> = [];
    let readinessCalls = 0;
    vi.spyOn(coordinator, "waitForWatcherReady").mockImplementation(
      async (watcher) => {
        readinessCalls += 1;
        const close = vi.spyOn(watcher, "close");
        if (readinessCalls === 1) {
          close.mockRejectedValueOnce(new Error("Injected close failure"));
        }
        closeSpies.push(close);
        if (readinessCalls === 6) {
          throw new Error("Injected watcher readiness failure");
        }
      },
    );

    await expect(generator.startWatching()).rejects.toThrow(
      "Injected watcher readiness failure",
    );

    expect(readinessCalls).toBe(6);
    expect(closeSpies[0]).toHaveBeenCalledTimes(2);
    for (const close of closeSpies.slice(1)) {
      expect(close).toHaveBeenCalledOnce();
    }
    expect(coordinator.watcher).toBeNull();
    expect(coordinator.configWatcher).toBeNull();
    expect(coordinator.fontWatcher).toBeNull();
    expect(coordinator.analyticsWatcher).toBeNull();
    expect(coordinator.openApiWatcher).toBeNull();
    expect(coordinator.doccupineConfigWatcher).toBeNull();
    expect(coordinator.publicWatcher).toBeNull();
    expect(coordinator.rootDirWatcher).toBeNull();
  });

  it("handles an early readiness rejection while OpenAPI watching starts", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
    });
    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );
    type Watcher = { close(): Promise<void> };
    type WatchCoordinatorInternals = {
      waitForWatcherReady(watcher: Watcher): Promise<void>;
    };
    type GeneratorInternals = {
      watchCoordinator: WatchCoordinatorInternals;
    };
    const coordinator = (generator as unknown as GeneratorInternals)
      .watchCoordinator;
    let readinessCalls = 0;
    vi.spyOn(coordinator, "waitForWatcherReady").mockImplementation(
      async () => {
        readinessCalls += 1;
        if (readinessCalls === 1) {
          throw new Error("Injected early readiness failure");
        }
        if (readinessCalls === 5) {
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
      },
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(generator.startWatching()).rejects.toThrow(
      "Injected early readiness failure",
    );

    expect(readinessCalls).toBe(7);
  });

  it("retries public watcher startup after a readiness failure", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.writeFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await generator.startWatching();
    type Watcher = { close(): Promise<void> };
    type WatchCoordinatorInternals = {
      publicWatcher: Watcher | null;
      publicWatcherStarting: boolean;
      rootDirWatcher: { emit(event: string, filePath: string): boolean } | null;
      waitForWatcherReady(watcher: Watcher): Promise<void>;
    };
    type GeneratorInternals = {
      watchCoordinator: WatchCoordinatorInternals;
    };
    const coordinator = (generator as unknown as GeneratorInternals)
      .watchCoordinator;
    const waitForReady = coordinator.waitForWatcherReady.bind(coordinator);
    let publicReadinessAttempts = 0;
    vi.spyOn(coordinator, "waitForWatcherReady").mockImplementation(
      async (watcher) => {
        if (coordinator.publicWatcher === watcher) {
          publicReadinessAttempts += 1;
          if (publicReadinessAttempts === 1) {
            vi.spyOn(watcher, "close").mockRejectedValueOnce(
              new Error("Injected public close failure"),
            );
            throw new Error("Injected public readiness failure");
          }
        }
        await waitForReady(watcher);
      },
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const publicDir = path.join(root, "public");
    await fs.ensureDir(publicDir);
    coordinator.rootDirWatcher?.emit("addDir", publicDir);
    await waitUntil(async () => publicReadinessAttempts >= 1);
    await waitUntil(async () => !coordinator.publicWatcherStarting);
    const secondFile = path.join(publicDir, "second.txt");
    await fs.outputFile(secondFile, "second\n");
    coordinator.rootDirWatcher?.emit("add", secondFile);

    await waitUntil(() =>
      fs.pathExists(path.join(outputDir, "public", "second.txt")),
    );
    expect(publicReadinessAttempts).toBeGreaterThanOrEqual(2);
    await generator.stop();
  });

  it("closes remaining watchers when one close throws synchronously", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    type Watcher = { close(): Promise<void> };
    type WatchCoordinatorInternals = {
      watcher: Watcher | null;
      configWatcher: Watcher | null;
    };
    type GeneratorInternals = {
      watchCoordinator: WatchCoordinatorInternals;
    };
    const coordinator = (generator as unknown as GeneratorInternals)
      .watchCoordinator;
    const firstClose = vi
      .fn<() => Promise<void>>()
      .mockImplementationOnce(() => {
        throw new Error("Injected synchronous close failure");
      })
      .mockResolvedValue(undefined);
    const secondClose = vi.fn<() => Promise<void>>().mockResolvedValue();
    coordinator.watcher = { close: firstClose };
    coordinator.configWatcher = { close: secondClose };

    await generator.stop();

    expect(firstClose).toHaveBeenCalledTimes(2);
    expect(secondClose).toHaveBeenCalledOnce();
    expect(coordinator.watcher).toBeNull();
    expect(coordinator.configWatcher).toBeNull();
  });

  it("retries an OpenAPI watcher close that fails during retargeting", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
    });
    await fs.writeFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const specs = [{ name: "Test", file: specPath }];
    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      specs,
      root,
    );
    await generator.init();
    await generator.startWatching();
    type Watcher = { close(): Promise<void> };
    type WatchCoordinatorInternals = {
      openApiWatcher: Watcher | null;
      syncOpenApiSpecWatcher(
        specs: Array<{ name: string; file: string }>,
        sourceFiles: string[],
      ): Promise<void>;
    };
    type GeneratorInternals = {
      watchCoordinator: WatchCoordinatorInternals;
    };
    const coordinator = (generator as unknown as GeneratorInternals)
      .watchCoordinator;
    const watcher = coordinator.openApiWatcher;
    if (!watcher) throw new Error("Expected an OpenAPI watcher");
    const close = vi
      .spyOn(watcher, "close")
      .mockRejectedValueOnce(new Error("Injected retarget close failure"));

    await expect(
      coordinator.syncOpenApiSpecWatcher(specs, [specPath]),
    ).rejects.toThrow("Injected retarget close failure");
    await generator.stop();

    expect(close).toHaveBeenCalledTimes(2);
    expect(coordinator.openApiWatcher).toBeNull();
  });

  it("reconciles source changes that predate watcher readiness", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const mdxPath = path.join(watchDir, "guide.mdx");
    const publicPath = path.join(root, "public", "asset.txt");
    await fs.outputFile(mdxPath, "---\ntitle: Old\n---\nOld body\n");
    await fs.outputFile(publicPath, "old asset\n");

    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();

    await fs.writeFile(mdxPath, "---\ntitle: New\n---\nNew body\n");
    await fs.remove(publicPath);
    await generator.startWatching();

    const page = await fs.readFile(
      path.join(outputDir, "app", "(site)", "guide", "page.tsx"),
      "utf8",
    );
    expect(page).toContain("New body");
    expect(
      await fs.pathExists(path.join(outputDir, "public", "asset.txt")),
    ).toBe(false);
    await generator.stop();
  });

  it("watches local OpenAPI reference files as generation sources", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    const schemaPath = path.join(root, "schemas", "user.json");
    const writeSchema = (property: string) =>
      fs.outputJson(schemaPath, {
        type: "object",
        properties: { [property]: { type: "string" } },
      });
    const writeSpec = (schema: Record<string, unknown>) =>
      fs.writeJson(specPath, {
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        paths: {
          "/users": {
            get: {
              operationId: "listUsers",
              tags: ["users"],
              responses: {
                "200": {
                  description: "OK",
                  content: { "application/json": { schema } },
                },
              },
            },
          },
        },
      });
    await writeSchema("OLD_FIELD");
    await writeSpec({
      type: "object",
      properties: { INITIAL_FIELD: { type: "string" } },
    });
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );
    await generator.init();
    await generator.startWatching();
    const pagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );
    expect(await fs.readFile(pagePath, "utf8")).toContain("INITIAL_FIELD");

    await writeSpec({ $ref: "./schemas/user.json" });

    await waitUntil(async () => {
      try {
        return (await fs.readFile(pagePath, "utf8")).includes("OLD_FIELD");
      } catch {
        return false;
      }
    });

    await writeSchema("NEW_FIELD");

    await waitUntil(async () => {
      try {
        return (await fs.readFile(pagePath, "utf8")).includes("NEW_FIELD");
      } catch {
        return false;
      }
    });
    await generator.stop();
  });

  it("does not replay unchanged sources when watchers become ready", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.writeJson(path.join(root, "config.json"), { name: "Docs" });
    await fs.outputFile(path.join(root, "public", "asset.txt"), "asset\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    const processAll = vi.spyOn(generator, "processAllMDXFiles");
    const configChange = vi.spyOn(generator, "handleConfigFileChange");
    const configDelete = vi.spyOn(generator, "handleConfigFileDelete");
    const publicCopy = vi.spyOn(generator, "copyPublicFiles");

    await generator.startWatching();

    expect(processAll).not.toHaveBeenCalled();
    expect(configChange).not.toHaveBeenCalled();
    expect(configDelete).not.toHaveBeenCalled();
    expect(publicCopy).not.toHaveBeenCalled();
    await generator.stop();
  });
});
