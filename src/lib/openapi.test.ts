import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildEndpointDoc,
  isLocalOpenApiPath,
  OpenApiRegistry,
} from "./openapi.js";
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

  it("serializes all OpenAPI prose as JSX text instead of executable MDX", () => {
    const operationText =
      'Operation {brace} <Widget value="quoted" /> {process.env.SECRET}';
    const parameterText =
      'Parameter {brace} <Param /> "quoted" {process.env.PARAM_SECRET}';
    const schemaText =
      'Schema {brace} <Schema /> "quoted" {process.env.SCHEMA_SECRET}';
    const responseText =
      'Response {brace} <Response /> "quoted" {process.env.RESPONSE_SECRET}';
    const summaryText =
      'Summary {brace} <Summary /> "quoted" {process.env.SUMMARY_SECRET}';
    const operation: OperationDescriptor = {
      specName: "test",
      method: "post",
      path: "/items",
      tags: [],
      description: operationText,
      parameters: [
        {
          name: "filter",
          in: "query",
          required: false,
          anchorId: "param-query-filter",
          description: parameterText,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: [
          {
            contentType: "application/json",
            schema: {
              type: "object",
              properties: {
                value: { type: "string", description: schemaText },
              },
            },
          },
        ],
      },
      responses: [
        { status: "200", description: responseText, content: [], headers: [] },
      ],
      servers: [],
      security: [],
      slug: "api/items/create",
      endpointAnchor: "endpoint-post-items",
    };

    const doc = buildEndpointDoc(operation);
    for (const text of [
      operationText,
      parameterText,
      schemaText,
      responseText,
    ]) {
      expect(doc).toContain(`{${JSON.stringify(text)}}`);
      expect(doc.split("\n")).not.toContain(text);
    }

    expect(
      buildEndpointDoc({
        ...operation,
        description: undefined,
        summary: summaryText,
      }),
    ).toContain(`{${JSON.stringify(summaryText)}}`);
  });

  it("renders response examples as JSON code without executing untrusted content", () => {
    const status = '200\n{process.env.RESPONSE_KEY}\n<Response status="bad" />';
    const payload = "```\n{process.env.RESPONSE_BODY}\n<ResponseBody />";
    const operation: OperationDescriptor = {
      specName: "test",
      method: "get",
      path: "/items",
      tags: [],
      parameters: [],
      responses: [
        {
          status,
          content: [{ contentType: "application/json", example: payload }],
          headers: [],
        },
      ],
      servers: [],
      security: [],
      slug: "api/items/get",
      endpointAnchor: "endpoint-get-items",
    };

    const doc = buildEndpointDoc(operation);
    expect(doc).toContain(`<h3>{${JSON.stringify(status)}}</h3>`);
    expect(doc).toContain(
      `<Code language="json" code={${JSON.stringify(JSON.stringify(payload, null, 2))}} />`,
    );
    expect(doc).not.toContain(`### ${status}`);
    expect(doc).not.toContain("<pre><code>");
    expect(doc).not.toContain("```json");
    expect(doc.split("\n")).not.toContain("{process.env.RESPONSE_KEY}");
    expect(doc.split("\n")).not.toContain("{process.env.RESPONSE_BODY}");
  });

  it("classifies Windows absolute paths as local without allowing URLs", () => {
    for (const localPath of [
      "C:\\docs\\openapi.yaml",
      "C:/docs/openapi.yaml",
      "\\\\server\\share\\openapi.yaml",
      "../openapi.yaml",
      "/var/docs/openapi.yaml",
    ]) {
      expect(isLocalOpenApiPath(localPath), localPath).toBe(true);
    }
    for (const url of [
      "https://example.com/openapi.yaml",
      "http://example.com/openapi.yaml",
      "file:///C:/docs/openapi.yaml",
      "data:application/json,{}",
      "C:drive-relative.yaml",
    ]) {
      expect(isLocalOpenApiPath(url), url).toBe(false);
    }
  });

  it("allows recursive same-directory local JSON and YAML references", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "doccupine-openapi-"));
    tempDirs.push(root);
    await fs.writeJson(path.join(root, "common.json"), {
      Identifier: { type: "string" },
    });
    await fs.writeFile(
      path.join(root, "schemas.yaml"),
      "schemas:\n  Item:\n    type: object\n    properties:\n      id:\n        $ref: './common.json#/Identifier'\n",
    );
    await fs.writeJson(path.join(root, "openapi.json"), {
      openapi: "3.1.0",
      info: { title: "Local refs", version: "1" },
      paths: {
        "/items": {
          get: {
            operationId: "listItems",
            parameters: [
              {
                name: "item",
                in: "query",
                schema: { $ref: "./schemas.yaml#/schemas/Item" },
              },
            ],
            responses: { 200: { description: "OK" } },
          },
        },
      },
    });

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("Network access disabled in test"));
    const registry = new OpenApiRegistry();
    await registry.load([{ name: "local", file: "openapi.json" }], root);

    expect(registry.lookup("listItems")?.parameters[0].schema).toMatchObject({
      type: "object",
      properties: { id: { type: "string" } },
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects root specs and references that escape rootDir", async () => {
    const parent = await fs.mkdtemp(
      path.join(os.tmpdir(), "doccupine-openapi-parent-"),
    );
    tempDirs.push(parent);
    const root = path.join(parent, "docs");
    await fs.ensureDir(root);
    await fs.writeJson(path.join(parent, "outside.json"), {
      openapi: "3.1.0",
      info: { title: "Outside", version: "1" },
      paths: {},
    });
    await fs.writeJson(path.join(root, "openapi.json"), {
      openapi: "3.1.0",
      info: { title: "Escaping ref", version: "1" },
      components: { schemas: { Outside: { $ref: "../outside.json" } } },
      paths: {},
    });

    const registry = new OpenApiRegistry();
    await expect(
      registry.load([{ name: "escape", file: "openapi.json" }], root),
    ).rejects.toThrow("resolves outside rootDir");
    await expect(
      registry.load([{ name: "escape", file: "../outside.json" }], root),
    ).rejects.toThrow("resolves outside rootDir");
  });

  it("rejects external-reference symlink escapes where supported", async () => {
    const parent = await fs.mkdtemp(
      path.join(os.tmpdir(), "doccupine-openapi-parent-"),
    );
    tempDirs.push(parent);
    const root = path.join(parent, "docs");
    await fs.ensureDir(root);
    await fs.writeJson(path.join(parent, "outside.json"), { type: "string" });
    try {
      await fs.symlink(
        path.join(parent, "outside.json"),
        path.join(root, "linked.json"),
      );
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error.code === "EPERM" || error.code === "ENOSYS")
      ) {
        return;
      }
      throw error;
    }
    await fs.writeJson(path.join(root, "openapi.json"), {
      openapi: "3.1.0",
      info: { title: "Symlink ref", version: "1" },
      components: { schemas: { Outside: { $ref: "./linked.json" } } },
      paths: {},
    });

    await expect(
      new OpenApiRegistry().load(
        [{ name: "symlink", file: "openapi.json" }],
        root,
      ),
    ).rejects.toThrow("resolves outside rootDir");
  });

  it.each(["file:///tmp/secret.yaml", "https://example.com/schema.yaml"])(
    "rejects URL reference %s without network access",
    async (reference) => {
      const root = await fs.mkdtemp(
        path.join(os.tmpdir(), "doccupine-openapi-"),
      );
      tempDirs.push(root);
      await fs.writeJson(path.join(root, "openapi.json"), {
        openapi: "3.1.0",
        info: { title: "Remote ref", version: "1" },
        components: { schemas: { Remote: { $ref: reference } } },
        paths: {},
      });
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockRejectedValue(new Error("Network access disabled in test"));

      await expect(
        new OpenApiRegistry().load(
          [{ name: "remote", file: "openapi.json" }],
          root,
        ),
      ).rejects.toThrow("must be a local file");
      await expect(
        new OpenApiRegistry().load(
          [{ name: "remote-root", file: reference }],
          root,
        ),
      ).rejects.toThrow("must be a local file");
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

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
