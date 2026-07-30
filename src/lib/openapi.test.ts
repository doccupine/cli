import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildEndpointDoc, OpenApiRegistry } from "./openapi.js";
import type { OperationDescriptor } from "./openapi-types.js";

const tempDirs: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("OpenAPI safety", () => {
  it("serializes Field attributes as JSX expressions", () => {
    const operation: OperationDescriptor = {
      specName: "test",
      method: "get",
      path: "/items/{id}",
      tags: [],
      parameters: [
        {
          name: 'quoted"name',
          in: "path",
          required: true,
          anchorId: "param-path-name",
          schema: { type: 'string"value' },
        },
      ],
      responses: [],
      servers: [],
      security: [],
      slug: "api/items/get",
      endpointAnchor: "endpoint-get-items",
    };

    expect(buildEndpointDoc(operation)).toContain(
      '<Field value={"quoted\\"name"} type={"string\\"value"} required>',
    );
  });

  it("builds an API-reference index linking every generated endpoint", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "doccupine-openapi-"));
    tempDirs.push(root);
    await fs.writeJson(path.join(root, "openapi.json"), {
      openapi: "3.1.0",
      info: { title: "Directory API", version: "1" },
      tags: [{ name: "Users" }, { name: "Teams" }],
      paths: {
        "/users": {
          get: {
            operationId: "listUsers",
            summary: "List users",
            tags: ["Users"],
            responses: { 200: { description: "OK" } },
          },
        },
        "/teams": {
          post: {
            operationId: "createTeam",
            summary: "Create a team",
            tags: ["Teams"],
            responses: { 201: { description: "Created" } },
          },
        },
      },
    });

    const registry = new OpenApiRegistry();
    await registry.load([{ name: "directory", file: "openapi.json" }], root);

    expect(registry.syntheticPages()[0]).toMatchObject({
      slug: "api-reference",
      title: "API Reference",
      category: "Overview",
      section: "api-reference",
    });
    const index = registry.bodyForSlug("api-reference");
    expect(index).toContain('href={"/api-reference/users/listusers"}');
    expect(index).toContain('href={"/api-reference/teams/createteam"}');
    expect(index).toContain('<Badge color="info" size="sm">{"GET"}</Badge>');
    expect(index).toContain(
      '<Badge color="success" size="sm">{"POST"}</Badge>',
    );
  });

  it("preserves the last-known-good state after a malformed reload", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "doccupine-openapi-"));
    tempDirs.push(root);
    const specPath = path.join(root, "openapi.json");
    await fs.writeJson(specPath, {
      openapi: "3.1.0",
      info: { title: "Stable API", version: "1" },
      servers: [{ url: "https://api.example.com/v1" }],
      paths: {
        "/stable": {
          get: {
            operationId: "getStable",
            summary: "Stable endpoint",
            responses: { 200: { description: "OK" } },
          },
        },
      },
    });

    const registry = new OpenApiRegistry();
    const specs = [{ name: "stable", file: "openapi.json" }];
    await registry.load(specs, root);
    const pages = registry.syntheticPages();
    const indexBody = registry.bodyForSlug("api-reference");
    const allowlist = registry.allowlist();

    await fs.writeJson(path.join(root, "replacement.json"), {
      openapi: "3.1.0",
      info: { title: "Replacement API", version: "2" },
      servers: [{ url: "https://replacement.example.com/v2" }],
      paths: {
        "/replacement": {
          post: {
            operationId: "createReplacement",
            responses: { 201: { description: "Created" } },
          },
        },
      },
    });
    await fs.writeFile(specPath, "{ malformed");

    await expect(
      registry.load(
        [{ name: "replacement", file: "replacement.json" }, ...specs],
        root,
      ),
    ).rejects.toThrow('Failed to parse OpenAPI spec "openapi.json"');
    expect(registry.all).toHaveLength(1);
    expect(registry.lookup("getStable")?.path).toBe("/stable");
    expect(registry.lookup("createReplacement")).toBeUndefined();
    expect(registry.syntheticPages()).toEqual(pages);
    expect(registry.bodyForSlug("api-reference")).toBe(indexBody);
    expect(registry.allowlist()).toEqual(allowlist);
  });

  it("clears the registry after successfully loading an empty config", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "doccupine-openapi-"));
    tempDirs.push(root);
    await fs.writeJson(path.join(root, "openapi.json"), {
      openapi: "3.1.0",
      info: { title: "Temporary API", version: "1" },
      servers: [{ url: "https://api.example.com" }],
      paths: {
        "/temporary": {
          get: {
            operationId: "getTemporary",
            responses: { 200: { description: "OK" } },
          },
        },
      },
    });

    const registry = new OpenApiRegistry();
    await registry.load([{ name: "temporary", file: "openapi.json" }], root);
    await registry.load([], root);

    expect(registry.isEmpty).toBe(true);
    expect(registry.all).toEqual([]);
    expect(registry.syntheticPages()).toEqual([]);
    expect(registry.bodyForSlug("api-reference")).toBeUndefined();
    expect(registry.allowlist()).toEqual([]);
    expect(registry.lookup("getTemporary")).toBeUndefined();
  });

  it("never auto-enables cloud metadata or private network servers", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "doccupine-openapi-"));
    tempDirs.push(root);
    await fs.writeJson(path.join(root, "openapi.json"), {
      openapi: "3.1.0",
      info: { title: "Unsafe targets", version: "1" },
      servers: [
        { url: "http://169.254.169.254/latest" },
        { url: "http://10.0.0.1/v1" },
        { url: "http://127.0.0.1:4000/v1" },
        { url: "http://[::1]:4000/v1" },
      ],
      paths: {},
    });

    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const registry = new OpenApiRegistry();
    await registry.load([{ name: "test", file: "openapi.json" }], root);

    const byHost = new Map(
      registry.allowlist().map((entry) => [entry.host, entry]),
    );
    expect(byHost.get("169.254.169.254")?.allowPrivate).not.toBe(true);
    expect(byHost.get("10.0.0.1")?.allowPrivate).not.toBe(true);
    expect(byHost.get("127.0.0.1")?.allowPrivate).toBe(true);
    expect(byHost.get("::1")?.allowPrivate).toBe(true);
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining(
        'OpenAPI server "http://10.0.0.1/v1" is a private or reserved IP',
      ),
    );
  });
});
