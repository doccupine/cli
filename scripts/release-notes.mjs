import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(
  await fs.readFile(path.join(root, "package.json"), "utf8"),
);

const changelog = await fs.readFile(path.join(root, "CHANGELOG.md"), "utf8");
const lines = changelog.split(/\r?\n/);
const heading = lines.findIndex((line) => line.trim() === `## ${version}`);

if (heading === -1) {
  throw new Error(
    `CHANGELOG.md has no "## ${version}" section. Describe the release there before publishing ${version}.`,
  );
}

const remainder = lines.slice(heading + 1);
const nextHeading = remainder.findIndex((line) => line.startsWith("## "));
const notes = (nextHeading === -1 ? remainder : remainder.slice(0, nextHeading))
  .join("\n")
  .trim();

if (notes.length === 0) {
  throw new Error(`The "## ${version}" section in CHANGELOG.md is empty.`);
}

process.stdout.write(`${notes}\n`);
