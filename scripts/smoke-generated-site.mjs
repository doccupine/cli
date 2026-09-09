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
      // Icons resolve through the generated IconRegistry; an unregistered name
      // renders nothing, so the glyph has to be read back out of the page too.
      '<Icon name="flag" size={16} />',
      "",
    ].join("\n"),
  );
  // A translated and a versioned copy of the sectioned page: the build has to
  // prefix their routes, tag the translation with its language and hreflang
  // set, and write the per-variant llms files.
  await fs.writeFile(
    path.join(projectDir, "languages.json"),
    JSON.stringify([
      { code: "en", label: "English", default: true },
      { code: "de", label: "Deutsch" },
    ]),
  );
  await fs.writeFile(
    path.join(projectDir, "versions.json"),
    JSON.stringify([
      { label: "v2.0", default: true },
      { slug: "v1", label: "v1.0" },
    ]),
  );
  await fs.mkdir(path.join(projectDir, "docs", "de"), { recursive: true });
  await fs.mkdir(path.join(projectDir, "docs", "v1"), { recursive: true });
  await fs.writeFile(
    path.join(projectDir, "docs", "de", "index.mdx"),
    ["---", 'title: "Start"', "---", "", "# Start", ""].join("\n"),
  );
  await fs.writeFile(
    path.join(projectDir, "docs", "de", "guide.mdx"),
    [
      "---",
      'title: "Anleitung"',
      'section: "Guides"',
      "---",
      "",
      "# Anleitung",
      "",
      "Eine Seite mit Abschnitt.",
      "",
    ].join("\n"),
  );
  await fs.writeFile(
    path.join(projectDir, "docs", "v1", "guide.mdx"),
    [
      "---",
      'title: "Guide (v1)"',
      'section: "Guides"',
      "---",
      "",
      "# Guide v1",
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
  await run(packageManager, ["install", "--no-frozen-lockfile"], siteDir);
  await run(packageManager, ["run", "type-check"], siteDir);
  await run(packageManager, ["run", "lint", "--max-warnings=0"], siteDir);
  // The generator emits Prettier-canonical output rather than shelling out to
  // a formatter, so this is what keeps that invariant honest.
  await run(packageManager, ["run", "format:check"], siteDir);
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
  if (!guideHtml.includes("lucide-flag")) {
    throw new Error(
      "Icon did not render the registered flag glyph into the page",
    );
  }
  // Next renders the metadata links with the React attribute name.
  if (!/hreflang="de"/i.test(guideHtml)) {
    throw new Error("The English guide did not link its German translation");
  }

  const deGuideHtml = await fs.readFile(
    path.join(siteDir, ".next", "server", "app", "de", "guides", "guide.html"),
    "utf8",
  );
  if (!deGuideHtml.includes('lang="de"')) {
    throw new Error("The German guide did not carry its lang attribute");
  }
  if (!/hreflang="en"/i.test(deGuideHtml)) {
    throw new Error("The German guide did not link its English original");
  }
  if (!deGuideHtml.includes("Eine Seite mit Abschnitt")) {
    throw new Error("The German guide did not render its content");
  }
  await fs.access(
    path.join(siteDir, ".next", "server", "app", "v1", "guides", "guide.html"),
  );
  for (const aggregate of ["de/llms.txt", "v1/llms.txt", "de/v1/llms.txt"]) {
    await fs.access(path.join(siteDir, "public", aggregate));
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
