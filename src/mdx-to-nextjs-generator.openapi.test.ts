import fs from "fs-extra";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { MDXToNextJSGenerator } from "./mdx-to-nextjs-generator.js";

import { fixture } from "./test-utils/generator-fixture.js";

describe.sequential("MDXToNextJSGenerator OpenAPI route ownership", () => {
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

  it("emits the homepage playground operation as a Prettier-stable literal", async () => {
    const { root, watchDir, outputDir } = await fixture();
    const specPath = path.join(root, "openapi.json");
    await fs.writeJson(specPath, {
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            operationId: "listUsers",
            summary: "List users",
            tags: ["users"],
            responses: { "200": { description: "OK" } },
          },
        },
      },
    });
    await fs.outputFile(
      path.join(watchDir, "index.mdx"),
      "---\ntitle: Home\nopenapi: listUsers\n---\n# Home\n",
    );

    await new MDXToNextJSGenerator(
      watchDir,
      outputDir,
      [{ name: "Test", file: specPath }],
      root,
    ).init();

    const page = await fs.readFile(
      path.join(outputDir, "app", "(site)", "page.tsx"),
      "utf8",
    );
    // JSON is full of double quotes, so Prettier picks the single-quoted form
    // and breaks after the operator once the declaration exceeds 80 columns.
    expect(page).toContain("const operation = JSON.parse(\n  '");
    expect(page).not.toContain('JSON.parse("{\\"');
    expect(page).toContain("<ApiPlayground operation={operation} />");
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
});
