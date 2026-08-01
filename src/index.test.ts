import { describe, it, expect } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { createRequire } from "module";

import {
  generateSlug,
  escapeTemplateContent,
  toJsStringLiteral,
  getFullSlug,
  isProcessEntrypoint,
} from "./index.js";
import { safeMatter } from "./lib/utils.js";
import { docsTemplate } from "./templates/components/Docs.js";

const execFileAsync = promisify(execFile);
const selfPath = fileURLToPath(import.meta.url);
const distEntry = path.resolve(selfPath, "..", "..", "dist", "index.js");
if (!fs.pathExistsSync(distEntry)) {
  throw new Error("Compiled CLI is missing; run `pnpm build` before Vitest");
}

// A generated app formats with `prettier --write .` and pins prettier ^3.9.6.
// Tests can't `npm install` the generated app, so we reuse this repo's matching
// prettier binary as a stand-in to assert the emitted files are format-stable.
const requireFromHere = createRequire(import.meta.url);
const prettierCli = path.join(
  path.dirname(requireFromHere.resolve("prettier")),
  "bin",
  "prettier.cjs",
);

describe("generateSlug", () => {
  it("returns empty string for index.mdx", () => {
    expect(generateSlug("index.mdx")).toBe("");
    expect(generateSlug("./index.mdx")).toBe("");
  });

  it("strips .mdx extension", () => {
    expect(generateSlug("getting-started.mdx")).toBe("getting-started");
  });

  it("strips the extension whatever its casing", () => {
    expect(generateSlug("getting-started.MDX")).toBe("getting-started");
    expect(generateSlug("guides/Setup.Mdx")).toBe("guides/setup");
  });

  it("lowercases the slug", () => {
    expect(generateSlug("MyPage.mdx")).toBe("mypage");
  });

  it("replaces special characters with hyphens", () => {
    expect(generateSlug("hello world.mdx")).toBe("hello-world");
  });

  it("preserves forward slashes for nested paths", () => {
    expect(generateSlug("guides/setup.mdx")).toBe("guides/setup");
  });

  it("converts backslashes to forward slashes", () => {
    expect(generateSlug("guides\\setup.mdx")).toBe("guides/setup");
  });

  it("preserves underscores and hyphens", () => {
    expect(generateSlug("my_page-name.mdx")).toBe("my_page-name");
  });

  it("strips trailing /index for subdirectory index files", () => {
    expect(generateSlug("platform/index.mdx")).toBe("platform");
  });

  it("strips trailing /index for deeply nested index files", () => {
    expect(generateSlug("guides/getting-started/index.mdx")).toBe(
      "guides/getting-started",
    );
  });
});

describe("getFullSlug", () => {
  it("returns page slug when section slug is empty", () => {
    expect(getFullSlug("getting-started", "")).toBe("getting-started");
  });

  it("returns page slug when section slug is falsy", () => {
    expect(getFullSlug("getting-started", "")).toBe("getting-started");
  });

  it("combines section and page slugs", () => {
    expect(getFullSlug("authentication", "api")).toBe("api/authentication");
  });

  it("returns section slug when page slug is empty (section index)", () => {
    expect(getFullSlug("", "api")).toBe("api");
  });

  it("returns empty string when both slugs are empty", () => {
    expect(getFullSlug("", "")).toBe("");
  });
});

describe("escapeTemplateContent", () => {
  it("escapes backticks", () => {
    expect(escapeTemplateContent("hello `world`")).toBe("hello \\`world\\`");
  });

  it("escapes template literal expressions", () => {
    expect(escapeTemplateContent("${variable}")).toBe("\\${variable}");
  });

  it("escapes backslashes", () => {
    expect(escapeTemplateContent("path\\to\\file")).toBe("path\\\\to\\\\file");
  });

  it("escapes all dangerous characters together", () => {
    const input = "Use `${process.env.SECRET}` here";
    const result = escapeTemplateContent(input);
    expect(result).toBe("Use \\`\\${process.env.SECRET}\\` here");
  });

  it("handles content with no special characters", () => {
    expect(escapeTemplateContent("plain text")).toBe("plain text");
  });

  it("handles empty string", () => {
    expect(escapeTemplateContent("")).toBe("");
  });
});

describe("toJsStringLiteral", () => {
  it("uses double quotes for plain strings", () => {
    expect(toJsStringLiteral("plain text")).toBe('"plain text"');
  });

  it("switches to single quotes for JSON so inner double quotes need no escaping", () => {
    expect(toJsStringLiteral('{"a":"b"}')).toBe(`'{"a":"b"}'`);
  });

  it("escapes backslashes", () => {
    expect(toJsStringLiteral("a\\b")).toBe('"a\\\\b"');
  });

  it("escapes the chosen quote when it appears in single-quote mode", () => {
    // 4 double quotes vs 1 single -> single-quoted; the inner ' is escaped
    expect(toJsStringLiteral(`{"x":"y'z"}`)).toBe(`'{"x":"y\\'z"}'`);
  });

  it("keeps double quotes (leaving single quotes unescaped) when singles are not fewer", () => {
    expect(toJsStringLiteral("it's a 'test'")).toBe(`"it's a 'test'"`);
  });
});

describe("isProcessEntrypoint", () => {
  it("is false while this module is merely imported", () => {
    // Guards the reason it exists: importing index.js for its helpers must not
    // parse argv and fall through to the default `watch` command.
    expect(isProcessEntrypoint()).toBe(false);
  });

  it("is true when the entry names this file directly", () => {
    expect(isProcessEntrypoint(selfPath, selfPath)).toBe(true);
  });

  it("is true when the entry is a symlink to this file", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "doccupine-bin-"));
    const link = path.join(tempDir, "doccupine");

    try {
      // Mirrors how npm installs the bin: node_modules/.bin/doccupine is a
      // symlink, so argv[1] and import.meta.url name the same file differently.
      await fs.symlink(selfPath, link);
      expect(isProcessEntrypoint(link, selfPath)).toBe(true);
    } finally {
      await fs.remove(tempDir);
    }
  });

  it("is false for a different file", () => {
    expect(
      isProcessEntrypoint(
        path.join(path.dirname(selfPath), "index.ts"),
        selfPath,
      ),
    ).toBe(false);
  });

  it("is false when the entry is missing or does not exist", () => {
    expect(isProcessEntrypoint(undefined, selfPath)).toBe(false);
    expect(isProcessEntrypoint("", selfPath)).toBe(false);
    expect(isProcessEntrypoint("/nonexistent/doccupine-bin", selfPath)).toBe(
      false,
    );
  });
});

// Runs against compiled output. The test script builds first so these checks
// can never silently exercise stale output or disappear on a clean checkout.
describe.skipIf(!fs.pathExistsSync(distEntry))(
  "compiled CLI entrypoint",
  () => {
    it("still parses argv when run directly", async () => {
      const { stdout } = await execFileAsync(process.execPath, [
        distEntry,
        "--version",
      ]);

      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it("does nothing when imported by another process", async () => {
      const { stdout, stderr } = await execFileAsync(process.execPath, [
        "--input-type=module",
        "-e",
        `await import(${JSON.stringify(distEntry)});`,
      ]);

      // A config prompt or watcher startup here means the guard regressed.
      expect(stdout).toBe("");
      expect(stderr).toBe("");
    });
  },
);

// A generated Doccupine app ships a `format` script (`prettier --write .`).
// This builds a real app from the templates and asserts it is already
// Prettier-clean - i.e. running that script is a no-op - so every template
// emits format-stable output. The test script builds dist before Vitest runs.
describe.skipIf(!fs.pathExistsSync(distEntry))(
  "generated site is prettier-clean",
  () => {
    // Two operations exercise the synthetic API-reference page generator,
    // including the long templated path that once tripped Prettier's rewrap.
    const openApiFixture = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      servers: [{ url: "https://api.example.com" }],
      paths: {
        "/works/{id}.json": {
          get: {
            operationId: "getWorkById",
            summary: "Get a work by id",
            tags: ["admin", "books"],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            responses: {
              "200": {
                description: "OK",
                content: {
                  "application/json": { example: { id: "OL123W" } },
                },
              },
            },
          },
        },
        "/notes": {
          post: {
            operationId: "createNote",
            summary: "Create a note",
            tags: ["notes"],
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { text: { type: "string" } },
                  },
                },
              },
            },
            responses: { "201": { description: "Created" } },
          },
        },
      },
    };

    it("generates an app that `npm run format` leaves unchanged", async () => {
      const projectDir = await fs.mkdtemp(
        path.join(os.tmpdir(), "doccupine-fmt-"),
      );
      try {
        // A complete doccupine.json makes `build` run non-interactively; the
        // openapi spec drives the synthetic API-reference page generator.
        await fs.writeJson(path.join(projectDir, "doccupine.json"), {
          watchDir: "docs",
          outputDir: "out",
          port: "3000",
          openapi: "openapi.json",
        });
        await fs.writeJson(
          path.join(projectDir, "openapi.json"),
          openApiFixture,
        );
        await fs.writeFile(
          path.join(projectDir, "fonts.json"),
          `{
  "googleFont": {
    "fontName": "Geist",
    "subsets": ["latin"],
    "weight": ["400", "500", "600", "700", "800", "900"]
  }
}
`,
        );

        await execFileAsync(process.execPath, [distEntry, "build"], {
          cwd: projectDir,
          maxBuffer: 20 * 1024 * 1024,
        });

        const outDir = path.join(projectDir, "out");
        // The app and its prettier config must exist...
        expect(await fs.pathExists(path.join(outDir, ".prettierrc"))).toBe(
          true,
        );
        // ...and the spec must have produced an endpoint page, so the format
        // check actually covers the synthetic API-page output.
        const endpointPagePath = path.join(
          outDir,
          "app",
          "(site)",
          "api-reference",
          "admin",
          "getworkbyid",
          "page.tsx",
        );
        expect(await fs.pathExists(endpointPagePath)).toBe(true);
        expect(await fs.readFile(endpointPagePath, "utf8")).toContain(
          '<Code language="json" code={',
        );
        const apiIndex = await fs.readFile(
          path.join(outDir, "app", "(site)", "api-reference", "page.tsx"),
          "utf8",
        );
        expect(apiIndex).not.toContain("redirect(");
        expect(apiIndex).toContain('href={"/api-reference/admin/getworkbyid"}');
        expect(apiIndex).toContain('href={"/api-reference/notes/createnote"}');
        await expect(
          fs.readFile(path.join(outDir, "app", "layout.tsx"), "utf8"),
        ).resolves.toContain(`const font = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});`);
        // The starting docs ship an <Update> page with `rss: true`, so the
        // format check also covers the generated feed route and the RSS-button
        // page shape.
        expect(
          await fs.pathExists(
            path.join(outDir, "app", "(site)", "update", "rss.xml", "route.ts"),
          ),
        ).toBe(true);

        // Mirror `prettier --write .` with a non-mutating `--check`, honoring
        // the generated .prettierrc + .prettierignore in the app directory.
        let stdout = "";
        try {
          ({ stdout } = await execFileAsync(
            process.execPath,
            [prettierCli, "--check", "."],
            { cwd: outDir, maxBuffer: 20 * 1024 * 1024 },
          ));
        } catch (error) {
          const e = error as { stdout?: string; stderr?: string };
          throw new Error(
            "Generated app is not Prettier-clean; `npm run format` would " +
              `rewrite files:\n${e.stdout ?? ""}${e.stderr ?? ""}`,
          );
        }
        expect(stdout).toContain("All matched files use Prettier code style!");
      } finally {
        await fs.remove(projectDir);
      }
    }, 120_000);

    it("keeps a one-page artifact manifest out of generated formatting", async () => {
      const projectDir = await fs.mkdtemp(
        path.join(os.tmpdir(), "doccupine-fmt-one-page-"),
      );
      try {
        await fs.writeJson(path.join(projectDir, "doccupine.json"), {
          watchDir: "docs",
          outputDir: "out",
          port: "3000",
        });
        await fs.outputFile(
          path.join(projectDir, "docs", "index.mdx"),
          "---\ntitle: Home\n---\n# Home\n",
        );

        await execFileAsync(process.execPath, [distEntry, "build"], {
          cwd: projectDir,
          maxBuffer: 20 * 1024 * 1024,
        });

        const outDir = path.join(projectDir, "out");
        await expect(
          fs.readFile(path.join(outDir, ".doccupine-artifacts.json"), "utf8"),
        ).resolves.toContain('"index.md"');
        await expect(
          fs.readFile(path.join(outDir, ".prettierignore"), "utf8"),
        ).resolves.toContain(".doccupine-*");

        const { stdout } = await execFileAsync(
          process.execPath,
          [prettierCli, "--check", "."],
          { cwd: outDir, maxBuffer: 20 * 1024 * 1024 },
        );
        expect(stdout).toContain("All matched files use Prettier code style!");
      } finally {
        await fs.remove(projectDir);
      }
    }, 120_000);
  },
);

// The homepage is emitted by updatePagesIndex(), not generatePageFromMDX, so
// its RSS support is a separate code path: `rss: true` + <Update> blocks on
// index.mdx must publish the site-root feed and render the RSS button.
describe.skipIf(!fs.pathExistsSync(distEntry))("homepage RSS feed", () => {
  it("emits the root feed route and RSS button for index.mdx", async () => {
    const projectDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "doccupine-rss-"),
    );
    try {
      await fs.writeJson(path.join(projectDir, "doccupine.json"), {
        watchDir: "docs",
        outputDir: "out",
        port: "3000",
      });
      await fs.outputFile(
        path.join(projectDir, "docs", "index.mdx"),
        [
          "---",
          'title: "Home"',
          'description: "Site changelog"',
          "rss: true",
          "---",
          "",
          "# Welcome",
          "",
          '<Update label="v1.0.0" description="First release">',
          "  Initial release.",
          "</Update>",
          "",
        ].join("\n"),
      );

      await execFileAsync(process.execPath, [distEntry, "build"], {
        cwd: projectDir,
        maxBuffer: 20 * 1024 * 1024,
      });

      const outDir = path.join(projectDir, "out");
      const homePage = await fs.readFile(
        path.join(outDir, "app", "(site)", "page.tsx"),
        "utf8",
      );
      // The button prop and the autodiscovery alternate both point at the
      // site-root feed.
      expect(homePage).toContain('rssHref={"/rss.xml"}');
      expect(homePage).toContain('"application/rss+xml": "/rss.xml"');

      const route = await fs.readFile(
        path.join(outDir, "app", "(site)", "rss.xml", "route.ts"),
        "utf8",
      );
      expect(route).toContain('"pagePath":""');
      expect(route).toContain("v1.0.0");
    } finally {
      await fs.remove(projectDir);
    }
  }, 120_000);

  // Section index files (e.g. changelog/index.mdx with `section:` frontmatter)
  // are written twice: generatePageFromMDX first, then updateSectionIndex
  // overwrites the page with name-first metadata. The overwrite must re-apply
  // the RSS button or it silently disappears while the feed route survives.
  it("keeps the RSS button on a section index page", async () => {
    const projectDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "doccupine-rss-section-"),
    );
    try {
      await fs.writeJson(path.join(projectDir, "doccupine.json"), {
        watchDir: "docs",
        outputDir: "out",
        port: "3000",
      });
      await fs.outputFile(
        path.join(projectDir, "docs", "index.mdx"),
        '---\ntitle: "Home"\n---\n\n# Welcome\n',
      );
      await fs.outputFile(
        path.join(projectDir, "docs", "changelog", "index.mdx"),
        [
          "---",
          'title: "Product updates"',
          'description: "Release notes"',
          'section: "Changelog"',
          "rss: true",
          "---",
          "",
          "# Product updates",
          "",
          '<Update label="v1.0.0">',
          "  - Added things.",
          "</Update>",
          "",
        ].join("\n"),
      );

      await execFileAsync(process.execPath, [distEntry, "build"], {
        cwd: projectDir,
        maxBuffer: 20 * 1024 * 1024,
      });

      const pagePath = path.join(
        projectDir,
        "out",
        "app",
        "(site)",
        "changelog",
        "page.tsx",
      );
      const sectionPage = await fs.readFile(pagePath, "utf8");
      expect(sectionPage).toContain('rssHref={"/changelog/rss.xml"}');
      expect(sectionPage).toContain(
        '"application/rss+xml": "/changelog/rss.xml"',
      );
      expect(
        await fs.pathExists(
          path.join(
            projectDir,
            "out",
            "app",
            "(site)",
            "changelog",
            "rss.xml",
            "route.ts",
          ),
        ),
      ).toBe(true);

      // The buttoned form overflows the 80-col print width and is emitted
      // pre-wrapped; assert it really is Prettier-stable.
      const { stdout } = await execFileAsync(
        process.execPath,
        [prettierCli, "--check", pagePath],
        { maxBuffer: 20 * 1024 * 1024 },
      );
      expect(stdout).toContain("All matched files use Prettier code style!");
    } finally {
      await fs.remove(projectDir);
    }
  }, 120_000);
});

// The generated Docs component must never let a broken MDX body fail
// `next build`: the body compiles through compileMDX inside a try/catch and
// falls back to a danger Callout panel. These guards pin the template to that
// shape so a refactor can't silently reintroduce the unguarded <MDXRemote>
// path (which throws during static prerender and aborts the whole build).
describe("Docs template MDX error guard", () => {
  it("compiles the MDX body through compileMDX inside a try/catch", () => {
    expect(docsTemplate).toContain(
      'import { compileMDX } from "next-mdx-remote/rsc";',
    );
    expect(docsTemplate).toContain("catch (error)");
    expect(docsTemplate).toContain('<Callout type="danger">');
  });

  it("does not render the unguarded MDXRemote component", () => {
    expect(docsTemplate).not.toContain("<MDXRemote");
  });
});

describe("safeMatter", () => {
  it("parses valid frontmatter like gray-matter", () => {
    const { data, content } = safeMatter('---\ntitle: "Hi"\n---\n\nBody.\n');
    expect(data.title).toBe("Hi");
    expect(content.trim()).toBe("Body.");
  });

  it("passes through files without frontmatter", () => {
    const raw = "# Just a doc\n";
    const { data, content } = safeMatter(raw);
    expect(data).toEqual({});
    expect(content).toBe(raw);
  });

  it("degrades broken YAML to empty frontmatter with the block stripped", () => {
    const { data, content } = safeMatter(
      '---\ntitle: "unclosed\n---\n\nBody.\n',
      "badfm.mdx",
    );
    expect(data).toEqual({});
    expect(content.trim()).toBe("Body.");
  });
});

// A broken MDX body or frontmatter block must degrade per page, never abort
// the CLI build: every page still gets emitted (the app-side guard renders
// the error panel at prerender time) and invalid frontmatter is warned about.
describe.skipIf(!fs.pathExistsSync(distEntry))("MDX error resilience", () => {
  it("builds through broken MDX and broken frontmatter", async () => {
    const projectDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "doccupine-broken-"),
    );
    try {
      await fs.writeJson(path.join(projectDir, "doccupine.json"), {
        watchDir: "docs",
        outputDir: "out",
        port: "3000",
      });
      await fs.outputFile(
        path.join(projectDir, "docs", "index.mdx"),
        '---\ntitle: "Home"\n---\n\n# Welcome\n',
      );
      await fs.outputFile(
        path.join(projectDir, "docs", "broken.mdx"),
        '---\ntitle: "Broken"\n---\n\nAn orphaned closing tag:\n\n</Card>\n',
      );
      await fs.outputFile(
        path.join(projectDir, "docs", "badfm.mdx"),
        '---\ntitle: "unclosed\n---\n\nStill readable body.\n',
      );

      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        [distEntry, "build"],
        { cwd: projectDir, maxBuffer: 20 * 1024 * 1024 },
      );

      const outDir = path.join(projectDir, "out");
      const brokenPage = await fs.readFile(
        path.join(outDir, "app", "(site)", "broken", "page.tsx"),
        "utf8",
      );
      expect(brokenPage).toContain("</Card>");

      const badfmPage = await fs.readFile(
        path.join(outDir, "app", "(site)", "badfm", "page.tsx"),
        "utf8",
      );
      expect(badfmPage).toContain("Still readable body.");
      expect(`${stdout}${stderr}`).toContain("Invalid frontmatter");

      const docsComponent = await fs.readFile(
        path.join(outDir, "components", "Docs.tsx"),
        "utf8",
      );
      expect(docsComponent).toContain("compileMDX");
      expect(docsComponent).toContain('<Callout type="danger">');
    } finally {
      await fs.remove(projectDir);
    }
  }, 120_000);
});

describe.skipIf(!fs.pathExistsSync(distEntry))(
  "generation safety invariants",
  () => {
    it("fails with both source paths when MDX routes collide", async () => {
      const projectDir = await fs.mkdtemp(
        path.join(os.tmpdir(), "doccupine-collision-"),
      );
      try {
        await fs.writeJson(path.join(projectDir, "doccupine.json"), {
          watchDir: "docs",
          outputDir: "out",
          port: "3000",
        });
        await fs.outputFile(
          path.join(projectDir, "docs", "index.mdx"),
          "---\ntitle: Home\n---\n# Home\n",
        );
        await fs.outputFile(
          path.join(projectDir, "docs", "guide.mdx"),
          "---\ntitle: Guide\n---\n# Guide\n",
        );
        await fs.outputFile(
          path.join(projectDir, "docs", "guide", "index.mdx"),
          "---\ntitle: Other guide\n---\n# Other\n",
        );

        let stderr = "";
        try {
          await execFileAsync(process.execPath, [distEntry, "build"], {
            cwd: projectDir,
          });
          throw new Error("Expected route collision to fail generation");
        } catch (error) {
          stderr = (error as { stderr?: string }).stderr ?? "";
        }
        expect(stderr).toContain("Route collision");
        expect(stderr).toContain('"guide.mdx"');
        expect(stderr).toContain('"guide/index.mdx"');
      } finally {
        await fs.remove(projectDir);
      }
    });

    it("refuses to overwrite an unrelated non-empty output directory", async () => {
      const projectDir = await fs.mkdtemp(
        path.join(os.tmpdir(), "doccupine-output-refusal-"),
      );
      try {
        await fs.writeJson(path.join(projectDir, "doccupine.json"), {
          watchDir: "docs",
          outputDir: "existing",
          port: "3000",
        });
        await fs.outputFile(
          path.join(projectDir, "docs", "index.mdx"),
          "# Home\n",
        );
        await fs.outputFile(
          path.join(projectDir, "existing", "important.txt"),
          "keep me",
        );

        await expect(
          execFileAsync(process.execPath, [distEntry, "build"], {
            cwd: projectDir,
          }),
        ).rejects.toMatchObject({
          stderr: expect.stringContaining(
            "Refusing to overwrite non-empty directory",
          ),
        });
        expect(
          await fs.readFile(
            path.join(projectDir, "existing", "important.txt"),
            "utf8",
          ),
        ).toBe("keep me");
      } finally {
        await fs.remove(projectDir);
      }
    });
  },
);
