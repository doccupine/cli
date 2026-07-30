import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectDir = await fs.mkdtemp(path.join(os.tmpdir(), "doccupine-smoke-"));
const packageManager = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

try {
  await fs.mkdir(path.join(projectDir, "docs"), { recursive: true });
  await fs.writeFile(
    path.join(projectDir, "doccupine.json"),
    JSON.stringify(
      {
        watchDir: "docs",
        outputDir: "site",
        port: "3000",
        openapi: "openapi.json",
      },
      null,
      2,
    ),
  );
  await fs.writeFile(
    path.join(projectDir, "config.json"),
    JSON.stringify({ name: "Smoke Docs", url: "https://docs.example.test" }),
  );
  await fs.writeFile(
    path.join(projectDir, "docs", "index.mdx"),
    [
      "---",
      'title: "Using `widgets` and ${safeText}"',
      'description: "Quotes, `code`, and ${expressions} stay data."',
      "---",
      "",
      "# Smoke test",
      "",
      "The generated site must compile.",
      "",
    ].join("\n"),
  );
  await fs.writeFile(
    path.join(projectDir, "docs", "guide.mdx"),
    [
      "---",
      'title: "Guide"',
      'section: "Guides"',
      "---",
      "",
      "# Guide",
      "",
      "A sectioned page.",
      "",
      // Doc pages are prerendered, so an authoring component that throws
      // fails the build. Space carries both prop forms here: the documented
      // unprefixed names and the $-prefixed ones pages were written with
      // before the wrapper existed.
      "<Space size={40} md={80} />",
      "",
      "<Space $size={24} />",
      "",
    ].join("\n"),
  );
  await fs.writeFile(
    path.join(projectDir, "openapi.json"),
    JSON.stringify({
      openapi: "3.1.0",
      info: { title: "Smoke API", version: "1.0.0" },
      servers: [{ url: "https://api.example.test/v1" }],
      paths: {
        "/widgets/{quoted}": {
          get: {
            operationId: "getWidget",
            summary: "Get a widget",
            parameters: [
              {
                name: 'quoted"name',
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            responses: { 200: { description: "OK" } },
          },
        },
      },
    }),
  );

  await run(
    process.execPath,
    [path.join(root, "dist", "index.js"), "build"],
    projectDir,
  );

  const siteDir = path.join(projectDir, "site");
  await run(packageManager, ["install", "--frozen-lockfile=false"], siteDir);
  await run(packageManager, ["run", "type-check"], siteDir);
  await run(packageManager, ["run", "lint", "--max-warnings=0"], siteDir);
  await run(packageManager, ["run", "build"], siteDir);

  // A prop-mapping wrapper fails silently: a name that never reaches Cherry
  // renders an empty span rather than an error, so the gap has to be read back
  // out of the prerendered page. Each size is distinct so it can only come
  // from one prop: 40px from size, 80px from its md override, 24px from the
  // $-prefixed form pages were written with before the wrapper existed.
  const guideHtml = await fs.readFile(
    path.join(siteDir, ".next", "server", "app", "guides", "guide.html"),
    "utf8",
  );
  for (const gap of [40, 80, 24]) {
    if (!new RegExp(`min-height:\\s*${gap}px`).test(guideHtml)) {
      throw new Error(`Space did not render a ${gap}px gap into the page`);
    }
  }

  for (const route of ["mcp", "rag"]) {
    const tracePath = path.join(
      siteDir,
      ".next",
      "server",
      "app",
      "api",
      route,
      "route.js.nft.json",
    );
    const trace = JSON.parse(await fs.readFile(tracePath, "utf8"));
    if (
      !Array.isArray(trace.files) ||
      !trace.files.some((file) =>
        file.endsWith("services/mcp/docs-content.json"),
      )
    ) {
      throw new Error(`${route} route did not trace docs-content.json`);
    }
  }
} finally {
  await fs.rm(projectDir, { recursive: true, force: true });
}
