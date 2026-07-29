import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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

console.log("package lifecycle and dist contents are clean");
