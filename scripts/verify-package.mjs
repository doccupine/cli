import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const packageJson = JSON.parse(
  await fs.readFile(path.join(root, "package.json"), "utf8"),
);

if (packageJson.scripts?.prepare !== "node scripts/clean.mjs && tsc") {
  throw new Error(
    'prepare must remain package-manager-neutral: expected "node scripts/clean.mjs && tsc"',
  );
}

async function filesBelow(directory) {
  const result = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await filesBelow(fullPath)));
    else result.push(fullPath);
  }
  return result;
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (data) => {
      stdout += data;
    });
    child.stderr.on("data", (data) => {
      stderr += data;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          [
            `${command} ${args.join(" ")} exited with ${code}`,
            stdout.trim(),
            stderr.trim(),
          ]
            .filter(Boolean)
            .join("\n"),
        ),
      );
    });
  });
}

function normalizePackagePath(filePath, label) {
  if (typeof filePath !== "string" || filePath.length === 0) {
    throw new Error(`${label} must be a non-empty package-relative path`);
  }

  const normalized = filePath.replaceAll("\\", "/").replace(/^\.\//, "");
  if (path.posix.isAbsolute(normalized) || normalized.startsWith("../")) {
    throw new Error(`${label} must stay within the package: ${filePath}`);
  }
  return normalized;
}

const main = normalizePackagePath(packageJson.main, "main");
const bin = packageJson.bin;
const doccupineBin = normalizePackagePath(
  typeof bin === "string" ? bin : bin?.doccupine,
  "bin.doccupine",
);

const sourceFiles = new Set(
  (await filesBelow(path.join(root, "src")))
    .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
    .map((file) => path.relative(path.join(root, "src"), file)),
);

const stale = [
  ...new Set(
    (await filesBelow(path.join(root, "dist")))
      .filter((file) => file.endsWith(".js") || file.endsWith(".d.ts"))
      .map((file) =>
        path
          .relative(path.join(root, "dist"), file)
          .replace(/\.d\.ts$/, ".ts")
          .replace(/\.js$/, ".ts"),
      ),
  ),
].filter((file) => !sourceFiles.has(file));

if (stale.length > 0) {
  throw new Error(`Stale compiled files found:\n${stale.join("\n")}`);
}

const distFiles = (await filesBelow(path.join(root, "dist"))).map((file) =>
  path.relative(root, file).split(path.sep).join("/"),
);
if (distFiles.length === 0) {
  throw new Error("dist is empty; build the package before verifying it");
}

const autoIncludedRootFiles = (await fs.readdir(root, { withFileTypes: true }))
  .filter(
    (entry) =>
      entry.isFile() && /^(?:readme|licen[cs]e)(?:\..+)?$/i.test(entry.name),
  )
  .map((entry) => entry.name);
const allowedFiles = new Set([
  "package.json",
  ...autoIncludedRootFiles,
  ...distFiles,
]);

const temporaryRoot = await fs.mkdtemp(
  path.join(os.tmpdir(), "doccupine-package-"),
);

try {
  const packDir = path.join(temporaryRoot, "pack");
  const projectDir = path.join(temporaryRoot, "project");
  await Promise.all([fs.mkdir(packDir), fs.mkdir(projectDir)]);

  const packed = await run(
    npm,
    ["pack", root, "--ignore-scripts", "--json", "--pack-destination", packDir],
    temporaryRoot,
  );

  let packOutput;
  try {
    packOutput = JSON.parse(packed.stdout);
  } catch (error) {
    throw new Error(`Could not parse npm pack output:\n${packed.stdout}`, {
      cause: error,
    });
  }

  // npm 11 and earlier report an array of packed tarballs; npm 12 reports an
  // object keyed by package name. The entries themselves are identical.
  const [packResult] = Array.isArray(packOutput)
    ? packOutput
    : Object.values(packOutput ?? {});

  if (!packResult?.filename || !Array.isArray(packResult.files)) {
    throw new Error(
      `npm pack did not report a tarball and its contents:\n${packed.stdout}`,
    );
  }

  const packedFiles = new Set(
    packResult.files.map(({ path: filePath }) =>
      filePath.replaceAll("\\", "/").replace(/^package\//, ""),
    ),
  );
  const requiredFiles = new Set([...allowedFiles, main, doccupineBin]);
  const missingFiles = [...requiredFiles].filter(
    (file) => !packedFiles.has(file),
  );
  if (missingFiles.length > 0) {
    throw new Error(
      `Required files missing from npm tarball:\n${missingFiles.join("\n")}`,
    );
  }
  const unexpectedFiles = [...packedFiles].filter(
    (file) => !allowedFiles.has(file),
  );
  if (unexpectedFiles.length > 0) {
    throw new Error(
      `Unexpected files found in npm tarball:\n${unexpectedFiles.join("\n")}`,
    );
  }

  const tarball = path.join(packDir, packResult.filename);
  await fs.access(tarball);
  await fs.writeFile(
    path.join(projectDir, "package.json"),
    `${JSON.stringify({ name: "doccupine-package-test", private: true }, null, 2)}\n`,
  );

  await run(
    npm,
    [
      "install",
      "--ignore-scripts",
      "--omit=dev",
      "--no-audit",
      "--no-fund",
      "--no-package-lock",
      tarball,
    ],
    projectDir,
  );

  const installedPackageDir = path.join(
    projectDir,
    "node_modules",
    packageJson.name,
  );
  const installedPackageJson = JSON.parse(
    await fs.readFile(path.join(installedPackageDir, "package.json"), "utf8"),
  );
  if (
    installedPackageJson.main !== packageJson.main ||
    JSON.stringify(installedPackageJson.bin) !== JSON.stringify(packageJson.bin)
  ) {
    throw new Error(
      "Installed package main or bin metadata differs from source",
    );
  }

  const binShim = path.join(
    projectDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "doccupine.cmd" : "doccupine",
  );
  await fs.access(binShim);

  await run(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `const packageModule = await import(${JSON.stringify(packageJson.name)}); if (typeof packageModule.MDXToNextJSGenerator !== "function") throw new Error("Missing MDXToNextJSGenerator export")`,
    ],
    projectDir,
  );
  let version;
  if (process.platform === "win32") {
    version = await run(
      npm,
      [
        "exec",
        "--offline",
        "--yes=false",
        "--ignore-scripts",
        "--cache",
        path.join(temporaryRoot, "exec-cache"),
        `--package=${packageJson.name}@${packageJson.version}`,
        "--",
        "doccupine",
        "--version",
      ],
      projectDir,
    );
  } else {
    version = await run(binShim, ["--version"], projectDir);
  }
  if (version.stdout.trim() !== packageJson.version) {
    throw new Error(
      `Installed binary reported ${JSON.stringify(version.stdout.trim())}; expected ${packageJson.version}`,
    );
  }

  console.log(
    `verified ${packResult.filename}: ${packedFiles.size} files, installed binary ${packageJson.version}`,
  );
} finally {
  await fs.rm(temporaryRoot, { recursive: true, force: true });
}
