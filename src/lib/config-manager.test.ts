import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";

import {
  ConfigManager,
  normalizeConfigPaths,
  toProjectRelativePath,
  validateConfig,
} from "./config-manager.js";

const ROOT = "/home/dev/project";

describe("validateConfig", () => {
  it("accepts distinct project directories and defaults the port", () => {
    expect(
      validateConfig({ watchDir: "docs", outputDir: "site" }, ROOT),
    ).toMatchObject({ watchDir: "docs", outputDir: "site", port: "3000" });
  });

  it("rejects the project root and overlapping directories", () => {
    expect(() =>
      validateConfig({ watchDir: "docs", outputDir: "." }, ROOT),
    ).toThrow("project root");
    expect(() =>
      validateConfig(
        { watchDir: ".", outputDir: "generated", port: "3000" },
        ROOT,
      ),
    ).toThrow("must not overlap");
  });

  it("rejects invalid ports and OpenAPI shapes", () => {
    expect(() =>
      validateConfig(
        { watchDir: "docs", outputDir: "site", port: "70000" },
        ROOT,
      ),
    ).toThrow("1 to 65535");
    expect(() =>
      validateConfig(
        {
          watchDir: "docs",
          outputDir: "site",
          port: "3000",
          openapi: [{ name: "Missing file" }] as never,
        },
        ROOT,
      ),
    ).toThrow("openapi");
  });
});

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

  it("points invalid existing configurations to the reset command", async () => {
    await fs.writeJSON(path.join(tempDir, "doccupine.json"), {
      watchDir: ".",
      outputDir: "nextjs-app",
      port: "3000",
    });

    await expect(new ConfigManager().loadConfig()).rejects.toThrow(
      'Run "doccupine config --reset" to repair the configuration.',
    );
  });
});

describe("ConfigManager symlink safety", () => {
  let projectDir: string;
  let externalDir: string;
  let previousCwd: string;

  const config = {
    watchDir: "docs",
    outputDir: "nextjs-app",
    port: "3000",
  };

  const createTestSymlink = async (
    target: string,
    link: string,
    type: "file" | "dir" = "file",
  ): Promise<boolean> => {
    try {
      await fs.symlink(
        target,
        link,
        process.platform === "win32" && type === "dir" ? "junction" : type,
      );
      return true;
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error.code === "EPERM" || error.code === "ENOSYS")
      ) {
        return false;
      }
      throw error;
    }
  };

  beforeEach(async () => {
    previousCwd = process.cwd();
    projectDir = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "doccupine-config-project-")),
    );
    externalDir = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "doccupine-config-external-")),
    );
    process.chdir(projectDir);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    vi.restoreAllMocks();
    await fs.remove(projectDir);
    await fs.remove(externalDir);
  });

  it("rejects a config file symlink without reading its target", async () => {
    const externalConfig = path.join(externalDir, "external.json");
    await fs.writeJSON(externalConfig, config);
    if (
      !(await createTestSymlink(
        externalConfig,
        path.join(projectDir, "doccupine.json"),
      ))
    ) {
      return;
    }

    await expect(new ConfigManager().loadConfig()).rejects.toThrow(
      /is a symbolic link.*Remove or replace the symbolic link first/,
    );
  });

  it("rejects a symlinked config ancestor", async () => {
    await fs.writeJSON(path.join(externalDir, "doccupine.json"), config);
    if (
      !(await createTestSymlink(
        externalDir,
        path.join(projectDir, "settings"),
        "dir",
      ))
    ) {
      return;
    }

    await expect(
      new ConfigManager("settings/doccupine.json").loadConfig(),
    ).rejects.toThrow("is a symbolic link");
  });

  it("rejects a dangling config symlink", async () => {
    const missingTarget = path.join(externalDir, "missing.json");
    if (
      !(await createTestSymlink(
        missingTarget,
        path.join(projectDir, "doccupine.json"),
      ))
    ) {
      return;
    }

    await expect(new ConfigManager().loadConfig()).rejects.toThrow(
      "is a symbolic link",
    );
  });

  it("does not overwrite an external target when saving through a symlink", async () => {
    const externalConfig = path.join(externalDir, "external.json");
    const original = '{"outside":true}\n';
    await fs.writeFile(externalConfig, original, "utf8");
    const configPath = path.join(projectDir, "doccupine.json");
    if (!(await createTestSymlink(externalConfig, configPath))) return;

    await expect(new ConfigManager().saveConfig(config)).rejects.toThrow(
      "symbolic link",
    );

    expect(await fs.readFile(externalConfig, "utf8")).toBe(original);
    expect((await fs.lstat(configPath)).isSymbolicLink()).toBe(true);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Error saving config file"),
      expect.objectContaining({ message: expect.stringContaining("symbolic") }),
    );
  });

  it("does not create an external target through a dangling symlink", async () => {
    const missingTarget = path.join(externalDir, "missing.json");
    const configPath = path.join(projectDir, "doccupine.json");
    if (!(await createTestSymlink(missingTarget, configPath))) return;

    await expect(new ConfigManager().saveConfig(config)).rejects.toThrow(
      "symbolic link",
    );

    expect(await fs.pathExists(missingTarget)).toBe(false);
    expect((await fs.lstat(configPath)).isSymbolicLink()).toBe(true);
  });

  it("does not create a config through a symlinked ancestor", async () => {
    if (
      !(await createTestSymlink(
        externalDir,
        path.join(projectDir, "settings"),
        "dir",
      ))
    ) {
      return;
    }
    const externalConfig = path.join(externalDir, "doccupine.json");

    await expect(
      new ConfigManager("settings/doccupine.json").saveConfig(config),
    ).rejects.toThrow("symbolic link");

    expect(await fs.pathExists(externalConfig)).toBe(false);
  });

  it("atomically replaces a safe regular config path", async () => {
    const configPath = path.join(projectDir, "doccupine.json");
    await fs.writeFile(configPath, '{"old":true}\n', "utf8");

    await new ConfigManager().saveConfig(config);

    expect(await fs.readJSON(configPath)).toEqual(config);
    expect(
      (await fs.readdir(projectDir)).filter((name) => name.endsWith(".tmp")),
    ).toEqual([]);
  });

  it.skipIf(process.platform === "win32")(
    "preserves existing config permissions across replacement",
    async () => {
      const configPath = path.join(projectDir, "doccupine.json");
      await fs.writeFile(configPath, '{"old":true}\n');
      await fs.chmod(configPath, 0o640);

      await new ConfigManager().saveConfig(config);

      expect((await fs.stat(configPath)).mode & 0o777).toBe(0o640);
    },
  );
});
