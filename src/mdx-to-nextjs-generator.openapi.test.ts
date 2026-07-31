import fs from "fs-extra";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { MDXToNextJSGenerator } from "./mdx-to-nextjs-generator.js";

import { fixture, waitUntil } from "./test-utils/generator-fixture.js";

describe.sequential("MDXToNextJSGenerator OpenAPI", () => {
  it("never overwrites or cleans up a hand-written OpenAPI route", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    const operation = {
      operationId: "listUsers",
      summary: "Generated operation",
      tags: ["users"],
      responses: { "200": { description: "OK" } },
    };
    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: { "/users": { get: operation } },
    });
    await fs.outputFile(
      path.join(watchDir, "api-reference", "users", "listusers.mdx"),
      "---\ntitle: Hand Written\n---\nHAND_WRITTEN_SENTINEL\n",
    );

    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );
    await generator.init();
    const pagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );
    expect(await fs.readFile(pagePath, "utf8")).toContain(
      "HAND_WRITTEN_SENTINEL",
    );

    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
    });
    await generator.handleOpenApiChange();

    expect(await fs.readFile(pagePath, "utf8")).toContain(
      "HAND_WRITTEN_SENTINEL",
    );
  });

  it("includes the API Reference section in the initial generated layout", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "listUsers",
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");

    await new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    ).init();

    const layout = await fs.readFile(
      path.join(outputDir, "app", "(site)", "layout.tsx"),
      "utf8",
    );
    expect(layout).toContain("doccupineSections");
    expect(layout).toContain('label: "API Reference"');
    expect(layout).toContain('slug: "api-reference"');
  });

  it("hands a removed MDX route back to OpenAPI across a restart", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "listUsers",
            summary: "Generated operation",
            tags: ["users"],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const handwrittenSource = path.join(
      watchDir,
      "api-reference",
      "users",
      "listusers.mdx",
    );
    await fs.outputFile(
      handwrittenSource,
      "---\ntitle: Hand Written\n---\nHAND_WRITTEN_SENTINEL\n",
    );
    const specs = [{ name: "Test", file: specPath }];
    const pagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );

    await new MDXToNextJSGenerator(watchDir, outputDir, specs, root).init();
    await fs.remove(handwrittenSource);
    await new MDXToNextJSGenerator(watchDir, outputDir, specs, root).init();

    expect(await fs.readFile(pagePath, "utf8")).toContain(
      "Generated operation",
    );
  });

  it("clears persisted OpenAPI ownership after restarting without specs", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "listUsers",
            summary: "Generated operation",
            tags: ["users"],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    ).init();
    let manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).toContainEqual(
      expect.objectContaining({ kind: "openapi" }),
    );

    await new MDXToNextJSGenerator(watchDir, outputDir, [], root).init();

    manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).not.toContainEqual(
      expect.objectContaining({ kind: "openapi" }),
    );
  });

  it("does not publish OpenAPI metadata for a route blocked by broken MDX", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "listUsers",
            summary: "Generated operation",
            tags: ["users"],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    await fs.outputFile(
      path.join(watchDir, "api-reference", "users", "listusers.mdx"),
      "---\ntitle: Broken\nimage: &self [*self]\n---\nBroken\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );

    await generator.init();

    expect(
      await fs.pathExists(
        path.join(
          outputDir,
          "app",
          "(site)",
          "api-reference",
          "users",
          "listusers",
          "page.tsx",
        ),
      ),
    ).toBe(false);
    const layout = await fs.readFile(
      path.join(outputDir, "app", "(site)", "layout.tsx"),
      "utf8",
    );
    expect(layout).not.toContain('slug: "api-reference/users/listusers"');
  });

  it("removes an OpenAPI page claimed by a broken incremental MDX source", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "listUsers",
            summary: "Generated operation",
            tags: ["users"],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );
    await generator.init();
    const pagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );
    expect(await fs.pathExists(pagePath)).toBe(true);
    await fs.outputFile(
      path.join(watchDir, "api-reference", "users", "listusers.mdx"),
      "---\ntitle: Broken\nimage: &self [*self]\n---\nBroken\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generator.handleFileChange(
      "added",
      "api-reference/users/listusers.mdx",
    );

    expect(await fs.pathExists(pagePath)).toBe(false);
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).not.toContainEqual(
      expect.objectContaining({ slug: "api-reference/users/listusers" }),
    );
    const layout = await fs.readFile(
      path.join(outputDir, "app", "(site)", "layout.tsx"),
      "utf8",
    );
    expect(layout).not.toContain('slug: "api-reference/users/listusers"');
  });

  it("does not overwrite retained MDX output with OpenAPI after a failed move", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "listUsers",
            summary: "Generated operation",
            tags: ["users"],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });
    const sourcePath = path.join(
      watchDir,
      "api-reference",
      "users",
      "listusers.mdx",
    );
    await fs.outputFile(
      sourcePath,
      "---\ntitle: Handwritten\n---\nHANDWRITTEN_BODY\n",
    );
    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );
    await generator.init();
    const pagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );
    await fs.writeFile(
      sourcePath,
      "---\ntitle: Broken move\nsection: Tutorials\nimage: &self [*self]\n---\nBROKEN_BODY\n",
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await generator.handleFileChange(
      "changed",
      "api-reference/users/listusers.mdx",
    );

    const page = await fs.readFile(pagePath, "utf8");
    expect(page).toContain("HANDWRITTEN_BODY");
    expect(page).not.toContain("Generated operation");
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).toContainEqual(
      expect.objectContaining({
        kind: "mdx",
        slug: "api-reference/users/listusers",
      }),
    );
    expect(manifest.routes).not.toContainEqual(
      expect.objectContaining({
        kind: "openapi",
        slug: "api-reference/users/listusers",
      }),
    );
  });

  it("keeps the active OpenAPI config and watcher target after an invalid replacement", async () => {
    const { root, watchDir, outputDir } = await fixture();
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
    await writeSpec("Initial summary");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");

    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );
    await generator.init();
    await fs.writeJson(path.join(root, "doccupine.json"), {
      watchDir: "docs",
      outputDir: "site",
      openapi: "missing.json",
    });
    await generator.handleDoccupineConfigChange();

    await writeSpec("Updated active summary");
    await generator.handleOpenApiChange();
    const pagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );
    expect(await fs.readFile(pagePath, "utf8")).toContain(
      "Updated active summary",
    );
  });

  it("rejects a symlinked doccupine.json during hot reload", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    const externalConfig = path.join(root, "external-doccupine.json");
    await fs.writeJson(externalConfig, {
      watchDir: "other-docs",
      outputDir: "other-site",
    });
    await fs.symlink(externalConfig, path.join(root, "doccupine.json"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await generator.handleDoccupineConfigChange();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("keeping the current configuration"),
      expect.stringContaining("symbolic link"),
    );
  });

  it("rolls back a parsed OpenAPI config when regeneration fails", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const oldSpecPath = path.join(root, "old-openapi.json");
    const candidateSpecPath = path.join(root, "candidate-openapi.json");
    const writeSpec = (specPath: string, resource: string, summary: string) =>
      fs.writeJson(specPath, {
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        paths: {
          [`/${resource}`]: {
            get: {
              operationId: `list${resource}`,
              summary,
              tags: [resource],
              responses: { "200": { description: "OK" } },
            },
          },
        },
      });
    await writeSpec(oldSpecPath, "users", "Old users");
    await writeSpec(candidateSpecPath, "pets", "Candidate pets");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");

    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Old", file: oldSpecPath }],
      root,
    );
    await generator.init();
    const oldPagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );
    const candidatePagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "pets",
      "listpets",
      "page.tsx",
    );
    const llmsPath = path.join(outputDir, "public", "llms.txt");
    const oldPage = await fs.readFile(oldPagePath, "utf8");
    const oldLlms = await fs.readFile(llmsPath, "utf8");

    type GeneratorInternals = {
      openApiSpecs: Array<{ name: string; file: string }>;
      syncOpenApiSpecWatcher(): Promise<void>;
    };
    const internals = generator as unknown as GeneratorInternals;
    const syncWatcher = internals.syncOpenApiSpecWatcher.bind(generator);
    const watcherTargets: string[] = [];
    vi.spyOn(internals, "syncOpenApiSpecWatcher").mockImplementation(
      async () => {
        watcherTargets.push(
          internals.openApiSpecs.map((spec) => path.basename(spec.file)).join(),
        );
        await syncWatcher();
      },
    );
    let candidatePageWasWritten = false;
    vi.spyOn(generator, "updateLlmsFiles").mockImplementationOnce(async () => {
      candidatePageWasWritten = await fs.pathExists(candidatePagePath);
      throw new Error("Injected aggregate failure");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    await fs.writeJson(path.join(root, "doccupine.json"), {
      watchDir: "docs",
      outputDir: "site",
      openapi: [{ name: "Candidate", file: "candidate-openapi.json" }],
    });

    await generator.handleDoccupineConfigChange();

    expect(candidatePageWasWritten).toBe(true);
    expect(internals.openApiSpecs).toEqual([
      { name: "Old", file: oldSpecPath },
    ]);
    expect(watcherTargets).toEqual([]);
    expect(await fs.pathExists(candidatePagePath)).toBe(false);
    expect(await fs.readFile(oldPagePath, "utf8")).toBe(oldPage);
    expect(await fs.readFile(llmsPath, "utf8")).toBe(oldLlms);

    await writeSpec(oldSpecPath, "users", "Updated old users");
    await generator.handleOpenApiChange();
    expect(await fs.readFile(oldPagePath, "utf8")).toContain(
      "Updated old users",
    );
    await generator.stop();
  });

  it("replays a newly configured OpenAPI source changed before watcher readiness", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const oldSpecPath = path.join(root, "old-openapi.json");
    const candidateSpecPath = path.join(root, "candidate-openapi.json");
    const schemaPath = path.join(root, "schemas", "pet.json");
    const writeSchema = (property: string) =>
      fs.outputJson(schemaPath, {
        type: "object",
        properties: { [property]: { type: "string" } },
      });
    const writeSpec = (
      specPath: string,
      resource: string,
      schema: Record<string, unknown>,
    ) =>
      fs.writeJson(specPath, {
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        paths: {
          [`/${resource}`]: {
            get: {
              operationId: `list${resource}`,
              tags: [resource],
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
    await writeSpec(oldSpecPath, "users", {
      type: "object",
      properties: { OLD_USER: { type: "string" } },
    });
    await writeSpec(candidateSpecPath, "pets", {
      type: "object",
      properties: { INITIAL_PET: { type: "string" } },
    });
    await writeSchema("REFERENCED_PET");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Old", file: oldSpecPath }],
      root,
    );
    await generator.init();
    type GeneratorInternals = {
      openApiSpecs: Array<{ name: string; file: string }>;
      syncOpenApiSpecWatcher(): Promise<void>;
    };
    const internals = generator as unknown as GeneratorInternals;
    const syncWatcher = internals.syncOpenApiSpecWatcher.bind(generator);
    let changedDuringSync = false;
    vi.spyOn(internals, "syncOpenApiSpecWatcher").mockImplementation(
      async () => {
        if (
          !changedDuringSync &&
          internals.openApiSpecs.some(
            (spec) => path.resolve(root, spec.file) === candidateSpecPath,
          )
        ) {
          changedDuringSync = true;
          await writeSpec(candidateSpecPath, "pets", {
            $ref: "./schemas/pet.json",
          });
        }
        await syncWatcher();
      },
    );
    await fs.writeJson(path.join(root, "doccupine.json"), {
      watchDir: "docs",
      outputDir: "site",
      openapi: [{ name: "Candidate", file: "candidate-openapi.json" }],
    });

    await generator.handleDoccupineConfigChange();

    expect(changedDuringSync).toBe(true);
    const pagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "pets",
      "listpets",
      "page.tsx",
    );
    expect(await fs.readFile(pagePath, "utf8")).toContain("REFERENCED_PET");

    await writeSchema("UPDATED_PET");
    await waitUntil(async () =>
      (await fs.readFile(pagePath, "utf8")).includes("UPDATED_PET"),
    );
    await generator.stop();
  });

  it("keeps the last successful OpenAPI page when one candidate page fails", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    const writeSpec = (summary: string, includePets = false) =>
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
          ...(includePets
            ? {
                "/pets": {
                  get: {
                    operationId: "listPets",
                    summary: "Candidate pets",
                    tags: ["pets"],
                    responses: { "200": { description: "OK" } },
                  },
                },
              }
            : {}),
        },
      });
    await writeSpec("Last good users");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );
    await generator.init();
    const pagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );
    const previousPage = await fs.readFile(pagePath, "utf8");
    const petsPage = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "pets",
      "listpets",
      "page.tsx",
    );
    const generatePage = generator.generatePageFromMDX.bind(generator);
    vi.spyOn(generator, "generatePageFromMDX")
      .mockImplementationOnce(generatePage)
      .mockImplementationOnce(generatePage)
      .mockImplementationOnce(async () => {
        throw new Error("Injected endpoint render failure");
      });
    vi.spyOn(console, "error").mockImplementation(() => {});
    await writeSpec("Candidate users", true);

    await generator.handleOpenApiChange();

    expect(await fs.readFile(pagePath, "utf8")).toBe(previousPage);
    expect(await fs.pathExists(petsPage)).toBe(false);
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).toContainEqual(
      expect.objectContaining({
        kind: "openapi",
        slug: "api-reference/users/listusers",
      }),
    );
  });

  it("removes uncommitted OpenAPI candidates when allowlist writing fails", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    const writeSpec = (resource: string, summary: string) =>
      fs.writeJson(specPath, {
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        paths: {
          [`/${resource}`]: {
            get: {
              operationId: `list${resource}`,
              summary,
              tags: [resource],
              responses: { "200": { description: "OK" } },
            },
          },
        },
      });
    await writeSpec("users", "Last good users");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );
    await generator.init();
    const usersPage = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );
    const petsPage = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "pets",
      "listpets",
      "page.tsx",
    );
    const previousUsers = await fs.readFile(usersPage, "utf8");
    const previousAllowlist = await fs.readFile(
      path.join(outputDir, "services", "openapi", "playground-allowlist.json"),
      "utf8",
    );
    type GeneratorInternals = { writeApiAllowlist(): Promise<void> };
    vi.spyOn(
      generator as unknown as GeneratorInternals,
      "writeApiAllowlist",
    ).mockRejectedValue(new Error("Injected allowlist failure"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await writeSpec("pets", "Candidate pets");

    await generator.handleOpenApiChange();

    expect(await fs.pathExists(petsPage)).toBe(false);
    expect(await fs.readFile(usersPage, "utf8")).toBe(previousUsers);
    expect(
      await fs.readFile(
        path.join(
          outputDir,
          "services",
          "openapi",
          "playground-allowlist.json",
        ),
        "utf8",
      ),
    ).toBe(previousAllowlist);
    const manifest = await fs.readJson(
      path.join(outputDir, ".doccupine-artifacts.json"),
    );
    expect(manifest.routes).toContainEqual(
      expect.objectContaining({
        kind: "openapi",
        slug: "api-reference/users/listusers",
      }),
    );
    expect(manifest.routes).not.toContainEqual(
      expect.objectContaining({ slug: "api-reference/pets/listpets" }),
    );
  });

  it("rolls back direct OpenAPI watcher updates after aggregate failure", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    const writeSpec = (resource: string) =>
      fs.writeJson(specPath, {
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        paths: {
          [`/${resource}`]: {
            get: {
              operationId: `list${resource}`,
              summary: `${resource} summary`,
              tags: [resource],
              responses: { "200": { description: "OK" } },
            },
          },
        },
      });
    await writeSpec("users");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );
    await generator.init();
    const usersPage = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );
    const petsPage = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "pets",
      "listpets",
      "page.tsx",
    );
    const previousUsers = await fs.readFile(usersPage, "utf8");
    const previousLlms = await fs.readFile(
      path.join(outputDir, "public", "llms.txt"),
      "utf8",
    );
    vi.spyOn(generator, "updateLlmsFiles").mockRejectedValueOnce(
      new Error("Injected aggregate failure"),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    await writeSpec("pets");

    await generator.handleOpenApiChange();

    expect(await fs.pathExists(petsPage)).toBe(false);
    expect(await fs.readFile(usersPage, "utf8")).toBe(previousUsers);
    expect(
      await fs.readFile(path.join(outputDir, "public", "llms.txt"), "utf8"),
    ).toBe(previousLlms);
  });

  it("rejects schema-invalid config reloads before changing generated output", async () => {
    const { root, watchDir, outputDir } = await fixture();
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
    await writeSpec("Initial summary");
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");

    const generator = new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    );
    await generator.init();
    const pagePath = path.join(
      outputDir,
      "app",
      "(site)",
      "api-reference",
      "users",
      "listusers",
      "page.tsx",
    );
    const llmsPath = path.join(outputDir, "public", "llms.txt");
    const initialPage = await fs.readFile(pagePath, "utf8");
    const initialLlms = await fs.readFile(llmsPath, "utf8");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const invalidConfigs: unknown[] = [
      {},
      {
        watchDir: "docs",
        outputDir: "site",
        openapi: [{ name: "Missing file" }],
      },
      {
        watchDir: "docs",
        outputDir: "docs/generated",
        openapi: specPath,
      },
      { watchDir: "", outputDir: "site", openapi: specPath },
      {
        watchDir: "docs",
        outputDir: "site",
        port: "70000",
        openapi: specPath,
      },
      {
        watchDir: "docs",
        outputDir: "site",
        packageManager: "yarn",
        openapi: specPath,
      },
    ];

    for (const invalidConfig of invalidConfigs) {
      await fs.writeJson(path.join(root, "doccupine.json"), invalidConfig);
      await generator.handleDoccupineConfigChange();
      expect(await fs.readFile(pagePath, "utf8")).toBe(initialPage);
      expect(await fs.readFile(llmsPath, "utf8")).toBe(initialLlms);
    }
    expect(warn).toHaveBeenCalledTimes(invalidConfigs.length);

    await writeSpec("Updated active summary");
    await generator.handleOpenApiChange();
    expect(await fs.readFile(pagePath, "utf8")).toContain(
      "Updated active summary",
    );
  });

  it("keeps the restart hint for valid watch and output directory changes", async () => {
    const { root, watchDir, outputDir } = await fixture();
    await fs.outputFile(path.join(watchDir, "index.mdx"), "# Home\n");
    const generator = new MDXToNextJSGenerator(watchDir, outputDir, [], root);
    await generator.init();
    await fs.writeJson(path.join(root, "doccupine.json"), {
      watchDir: "other-docs",
      outputDir: "other-site",
    });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await generator.handleDoccupineConfigChange();

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("watchDir/outputDir changes"),
    );
  });
});
