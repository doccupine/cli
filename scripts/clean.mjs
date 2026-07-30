import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
await fs.rm(path.resolve(scriptDir, "..", "dist"), {
  recursive: true,
  force: true,
});
