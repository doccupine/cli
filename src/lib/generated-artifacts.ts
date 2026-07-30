import fs from "fs-extra";
import path from "node:path";

import { writeFileAtomic } from "./utils.js";

export type RouteOwnerKind = "mdx" | "openapi";

interface RouteArtifact {
  kind: RouteOwnerKind;
  source: string;
  slug: string;
}

interface ArtifactManifest {
  schemaVersion: 1;
  routes: RouteArtifact[];
  llmsPageFiles: string[];
}

const MANIFEST_FILE = ".doccupine-artifacts.json";
const LEGACY_LLMS_MANIFEST = ".doccupine-llms-manifest.json";
const LEGACY_API_MANIFEST = ".doccupine-api-manifest.json";

function normalizeRelativePath(
  value: string,
  allowEmpty = false,
): string | null {
  const normalized = value.replace(/\\/g, "/").replace(/^\.\//, "");
  if ((allowEmpty && normalized === "") || normalized === "") {
    return allowEmpty ? "" : null;
  }
  if (path.posix.isAbsolute(normalized)) return null;
  const parts = normalized.split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) {
    return null;
  }
  return normalized;
}

function normalizeRoute(value: unknown): RouteArtifact | null {
  if (!value || typeof value !== "object") return null;
  const route = value as Record<string, unknown>;
  if (route.kind !== "mdx" && route.kind !== "openapi") return null;
  if (typeof route.source !== "string" || typeof route.slug !== "string") {
    return null;
  }
  const source = normalizeRelativePath(route.source);
  const slug = normalizeRelativePath(route.slug, true);
  return source === null || slug === null
    ? null
    : { kind: route.kind, source, slug };
}

function normalizeLlmsPageFile(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = normalizeRelativePath(value);
  return normalized?.endsWith(".md") ? normalized : null;
}

export class GeneratedArtifacts {
  private routes = new Map<string, RouteArtifact>();
  private llmsFiles = new Set<string>();

  constructor(private readonly outputDir: string) {}

  private routeKey(kind: RouteOwnerKind, source: string): string {
    return `${kind}:${source.replace(/\\/g, "/")}`;
  }

  async load(): Promise<void> {
    this.routes.clear();
    this.llmsFiles.clear();

    const manifestPath = path.join(this.outputDir, MANIFEST_FILE);
    try {
      if (await fs.pathExists(manifestPath)) {
        const parsed = JSON.parse(await fs.readFile(manifestPath, "utf8")) as {
          routes?: unknown;
          llmsPageFiles?: unknown;
        };
        if (Array.isArray(parsed.routes)) {
          for (const value of parsed.routes) {
            const route = normalizeRoute(value);
            if (route)
              this.routes.set(this.routeKey(route.kind, route.source), route);
          }
        }
        if (Array.isArray(parsed.llmsPageFiles)) {
          for (const value of parsed.llmsPageFiles) {
            const file = normalizeLlmsPageFile(value);
            if (file) this.llmsFiles.add(file);
          }
        }
      }
    } catch {
      // A corrupt manifest owns nothing. Generated output is rebuilt safely.
    }

    // Import only valid paths from the old llms manifest. This preserves stale
    // mirror cleanup across upgrades without trusting its historical contents.
    const legacyLlmsPath = path.join(this.outputDir, LEGACY_LLMS_MANIFEST);
    try {
      if (await fs.pathExists(legacyLlmsPath)) {
        const parsed = JSON.parse(
          await fs.readFile(legacyLlmsPath, "utf8"),
        ) as {
          pageFiles?: unknown;
        };
        if (Array.isArray(parsed.pageFiles)) {
          for (const value of parsed.pageFiles) {
            const file = normalizeLlmsPageFile(value);
            if (file) this.llmsFiles.add(file);
          }
        }
      }
    } catch {
      // Ignore corrupt legacy state.
    }

    await Promise.all([
      fs.remove(legacyLlmsPath),
      fs.remove(path.join(this.outputDir, LEGACY_API_MANIFEST)),
    ]);
  }

  routeFor(kind: RouteOwnerKind, source: string): string | undefined {
    return this.routes.get(this.routeKey(kind, source))?.slug;
  }

  routesFor(kind: RouteOwnerKind): RouteArtifact[] {
    return [...this.routes.values()].filter((route) => route.kind === kind);
  }

  replaceRoutes(
    kind: RouteOwnerKind,
    routes: Iterable<{ source: string; slug: string }>,
  ): void {
    for (const [key, route] of this.routes) {
      if (route.kind === kind) this.routes.delete(key);
    }
    for (const value of routes) {
      const route = normalizeRoute({ kind, ...value });
      if (!route) {
        throw new Error(`Refusing to record unsafe ${kind} route ownership`);
      }
      this.routes.set(this.routeKey(kind, route.source), route);
    }
  }

  removeRoute(kind: RouteOwnerKind, source: string): void {
    this.routes.delete(this.routeKey(kind, source));
  }

  llmsPageFiles(): Set<string> {
    return new Set(this.llmsFiles);
  }

  replaceLlmsPageFiles(files: Iterable<string>): void {
    const next = new Set<string>();
    for (const value of files) {
      const file = normalizeLlmsPageFile(value);
      if (!file) throw new Error("Refusing to record an unsafe llms page path");
      next.add(file);
    }
    this.llmsFiles = next;
  }

  async save(): Promise<void> {
    const manifest: ArtifactManifest = {
      schemaVersion: 1,
      routes: [...this.routes.values()].sort((a, b) =>
        `${a.kind}:${a.source}`.localeCompare(`${b.kind}:${b.source}`),
      ),
      llmsPageFiles: [...this.llmsFiles].sort(),
    };
    await writeFileAtomic(
      path.join(this.outputDir, MANIFEST_FILE),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
  }
}
