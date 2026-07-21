import { describe, it, expect } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";

import {
  generateSlug,
  escapeTemplateContent,
  getFullSlug,
  isProcessEntrypoint,
} from "./index.js";

const execFileAsync = promisify(execFile);
const selfPath = fileURLToPath(import.meta.url);
const distEntry = path.resolve(selfPath, "..", "..", "dist", "index.js");

describe("generateSlug", () => {
  it("returns empty string for index.mdx", () => {
    expect(generateSlug("index.mdx")).toBe("");
    expect(generateSlug("./index.mdx")).toBe("");
  });

  it("strips .mdx extension", () => {
    expect(generateSlug("getting-started.mdx")).toBe("getting-started");
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

// Runs against the compiled output, so it needs a build. CI always runs
// `pnpm build` before `pnpm test`, and `pnpm install` builds via `prepare`.
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
