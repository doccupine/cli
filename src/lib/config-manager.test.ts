import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";

import {
  ConfigManager,
  normalizeConfigPaths,
  toProjectRelativePath,
} from "./config-manager.js";

const ROOT = "/home/dev/project";

describe("toProjectRelativePath", () => {
  it("rewrites an absolute path inside the root as relative", () => {
    expect(toProjectRelativePath(`${ROOT}/docs`, ROOT)).toBe("docs");
    expect(toProjectRelativePath(`${ROOT}/apps/site/docs`, ROOT)).toBe(
      "apps/site/docs",
    );
  });

  it("returns '.' when the path is the root itself", () => {
    expect(toProjectRelativePath(ROOT, ROOT)).toBe(".");
  });

  it("keeps absolute paths that escape the root", () => {
    expect(toProjectRelativePath("/home/dev/other/docs", ROOT)).toBe(
      "/home/dev/other/docs",
    );
    expect(toProjectRelativePath("/home/dev", ROOT)).toBe("/home/dev");
  });

  it("leaves already-relative paths untouched", () => {
    expect(toProjectRelativePath("docs", ROOT)).toBe("docs");
    expect(toProjectRelativePath("./docs", ROOT)).toBe("./docs");
    expect(toProjectRelativePath("../shared/docs", ROOT)).toBe(
      "../shared/docs",
    );
  });

  it("leaves empty or non-string values untouched", () => {
    expect(toProjectRelativePath("", ROOT)).toBe("");
    expect(
      toProjectRelativePath(undefined as unknown as string, ROOT),
    ).toBeUndefined();
  });

  it("produces a value that resolves back to the original path", () => {
    const original = path.join(ROOT, "content", "docs");
    const relative = toProjectRelativePath(original, ROOT);
    expect(path.resolve(ROOT, relative)).toBe(original);
  });
});

describe("normalizeConfigPaths", () => {
  it("flags a config that used absolute paths and rewrites both dirs", () => {
    const { config, changed } = normalizeConfigPaths(
      {
        watchDir: `${ROOT}/docs`,
        outputDir: `${ROOT}/nextjs-app`,
        port: "3000",
        packageManager: "pnpm",
      },
      ROOT,
    );

    expect(changed).toBe(true);
    expect(config.watchDir).toBe("docs");
    expect(config.outputDir).toBe("nextjs-app");
    expect(config.port).toBe("3000");
    expect(config.packageManager).toBe("pnpm");
  });

  it("reports no change for an already-relative config", () => {
    const { config, changed } = normalizeConfigPaths(
      { watchDir: "docs", outputDir: "nextjs-app", port: "3000" },
      ROOT,
    );

    expect(changed).toBe(false);
    expect(config.watchDir).toBe("docs");
  });

  it("flags a change when only one of the two dirs is absolute", () => {
    const { config, changed } = normalizeConfigPaths(
      { watchDir: "docs", outputDir: `${ROOT}/nextjs-app`, port: "3000" },
      ROOT,
    );

    expect(changed).toBe(true);
    expect(config.outputDir).toBe("nextjs-app");
  });

  it("does not rewrite an out-of-tree watch directory", () => {
    const { config, changed } = normalizeConfigPaths(
      { watchDir: "/var/shared/docs", outputDir: "nextjs-app", port: "3000" },
      ROOT,
    );

    expect(changed).toBe(false);
    expect(config.watchDir).toBe("/var/shared/docs");
  });
});

describe("ConfigManager migration", () => {
  let tempDir: string;
  let previousCwd: string;

  beforeEach(async () => {
    previousCwd = process.cwd();
    // realpath: macOS resolves /var -> /private/var, and process.cwd() reports
    // the resolved path, so path.relative would otherwise never match.
    tempDir = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "doccupine-config-")),
    );
    process.chdir(tempDir);
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    vi.restoreAllMocks();
    await fs.remove(tempDir);
  });

  const readConfigFile = async () =>
    fs.readFile(path.join(tempDir, "doccupine.json"), "utf8");

  it("rewrites a legacy absolute-path config on disk", async () => {
    await fs.writeJSON(path.join(tempDir, "doccupine.json"), {
      watchDir: path.join(tempDir, "docs"),
      outputDir: path.join(tempDir, "nextjs-app"),
      port: "3000",
    });

    const config = await new ConfigManager().getConfig();

    expect(config.watchDir).toBe("docs");
    expect(config.outputDir).toBe("nextjs-app");

    const onDisk = JSON.parse(await readConfigFile());
    expect(onDisk.watchDir).toBe("docs");
    expect(onDisk.outputDir).toBe("nextjs-app");
    expect(onDisk.port).toBe("3000");
  });

  it("migrated paths still resolve to the original directories", async () => {
    const watchDir = path.join(tempDir, "content", "docs");
    await fs.writeJSON(path.join(tempDir, "doccupine.json"), {
      watchDir,
      outputDir: path.join(tempDir, "nextjs-app"),
      port: "3000",
    });

    const config = await new ConfigManager().getConfig();

    expect(path.resolve(process.cwd(), config.watchDir)).toBe(watchDir);
  });

  it("leaves an already-relative config file untouched", async () => {
    const original = `{"watchDir":"docs","outputDir":"nextjs-app","port":"3000"}`;
    await fs.writeFile(path.join(tempDir, "doccupine.json"), original, "utf8");

    const config = await new ConfigManager().getConfig();

    expect(config.watchDir).toBe("docs");
    // Byte-identical: no rewrite happened, so committed configs stay stable.
    expect(await readConfigFile()).toBe(original);
  });

  it("preserves an out-of-tree absolute watch directory", async () => {
    await fs.writeJSON(path.join(tempDir, "doccupine.json"), {
      watchDir: "/var/shared/docs",
      outputDir: path.join(tempDir, "nextjs-app"),
      port: "3000",
    });

    const config = await new ConfigManager().getConfig();

    expect(config.watchDir).toBe("/var/shared/docs");
    expect(config.outputDir).toBe("nextjs-app");
  });

  it("keeps other config fields through a migration", async () => {
    await fs.writeJSON(path.join(tempDir, "doccupine.json"), {
      watchDir: path.join(tempDir, "docs"),
      outputDir: path.join(tempDir, "nextjs-app"),
      port: "4000",
      packageManager: "npm",
    });

    const config = await new ConfigManager().getConfig();

    expect(config.port).toBe("4000");
    expect(config.packageManager).toBe("npm");
  });
});
