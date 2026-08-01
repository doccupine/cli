import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const { name, version } = JSON.parse(
  await fs.readFile(path.join(root, "package.json"), "utf8"),
);

if (
  !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(
    version ?? "",
  )
) {
  throw new Error(
    `package.json version ${JSON.stringify(version)} is not a publishable version`,
  );
}

// A prerelease publishes under its own channel so it never becomes "latest".
// npm rejects a dist-tag that parses as a semver range, which rules out the
// bare numeric identifier in a version like 1.0.0-1.
function distTagFor(released) {
  const prerelease = released.split("+")[0].split("-").slice(1).join("-");
  if (prerelease.length === 0) return "latest";

  const [identifier] = prerelease.split(".");
  if (!/^[a-z][a-z0-9-]*$/i.test(identifier)) {
    throw new Error(
      `Prerelease ${released} has no usable dist-tag: npm refuses a tag that is a valid semver range. Name the channel in the version, such as ${released.split("-")[0]}-beta.1.`,
    );
  }
  return identifier.toLowerCase();
}

function runNpm(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(npm, args, { shell: false, windowsHide: true });
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
      resolve({ code, stdout, stderr });
    });
  });
}

const distTag = distTagFor(version);
const lookup = await runNpm(["view", `${name}@${version}`, "version"]);
let publish;

if (lookup.code === 0) {
  publish = false;
} else if (/\bE404\b/.test(lookup.stderr)) {
  // The registry knows the package but not this version: it is unreleased.
  publish = true;
} else {
  // Anything else - an unreachable or erroring registry - must not be read as
  // "unpublished", which would republish an existing version on a network blip.
  throw new Error(
    [
      `Could not ask the registry whether ${name}@${version} exists`,
      `npm view exited with ${lookup.code}`,
      lookup.stderr.trim(),
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

process.stderr.write(
  publish
    ? `${name}@${version} is unpublished; releasing it under the ${distTag} tag\n`
    : `${name}@${version} is already published; nothing to release\n`,
);
process.stdout.write(
  `publish=${publish}\nversion=${version}\ndist_tag=${distTag}\n`,
);
