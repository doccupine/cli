import fs from "fs-extra";
import path from "node:path";

import { readOutputFileIfPresent, resolveOutputPath } from "./output-safety.js";
import { writeFileAtomic } from "./utils.js";

export type RouteOwnerKind = "mdx" | "openapi";

export interface RouteArtifact {
  kind: RouteOwnerKind;
  source: string;
  slug: string;
}

interface ArtifactManifest {
  schemaVersion: 2;
  routes: RouteArtifact[];
  llmsPageFiles: string[];
  publicFiles: string[];
  iconFiles: string[];
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

function normalizePublicFile(value: unknown): string | null {
  return typeof value === "string" ? normalizeRelativePath(value) : null;
}

export class GeneratedArtifacts {
  private routes = new Map<string, RouteArtifact>();
  private llmsFiles = new Set<string>();
  private publicFilePaths = new Set<string>();
  private iconFilePaths = new Set<string>();

  constructor(private readonly outputDir: string) {}

  private manifestPath(fileName: string): string {
    return resolveOutputPath(this.outputDir, fileName);
  }

  private routeKey(kind: RouteOwnerKind, source: string): string {
    return `${kind}:${source.replace(/\\/g, "/")}`;
  }

  async load(): Promise<void> {
    this.routes.clear();
    this.llmsFiles.clear();
    this.publicFilePaths.clear();
    this.iconFilePaths.clear();

    const manifestContent = await readOutputFileIfPresent(
      this.outputDir,
      MANIFEST_FILE,
    );
    if (manifestContent !== null) {
      try {
        const parsed = JSON.parse(manifestContent) as {
          routes?: unknown;
          llmsPageFiles?: unknown;
          publicFiles?: unknown;
          iconFiles?: unknown;
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
        if (Array.isArray(parsed.publicFiles)) {
          for (const value of parsed.publicFiles) {
            const file = normalizePublicFile(value);
            if (file) this.publicFilePaths.add(file);
          }
        }
        if (Array.isArray(parsed.iconFiles)) {
          for (const value of parsed.iconFiles) {
            const file = normalizePublicFile(value);
            if (file) this.iconFilePaths.add(file);
          }
        }
      } catch {
        // A corrupt manifest owns nothing. Generated output is rebuilt safely.
      }
    }

    // Import only valid paths from the old llms manifest. This preserves stale
    // mirror cleanup across upgrades without trusting its historical contents.
    const legacyContent = await readOutputFileIfPresent(
      this.outputDir,
      LEGACY_LLMS_MANIFEST,
    );
    if (legacyContent !== null) {
      try {
        const parsed = JSON.parse(legacyContent) as {
          pageFiles?: unknown;
        };
        if (Array.isArray(parsed.pageFiles)) {
          for (const value of parsed.pageFiles) {
            const file = normalizeLlmsPageFile(value);
            if (file) this.llmsFiles.add(file);
          }
        }
      } catch {
        // Ignore corrupt legacy state.
      }
    }

    await Promise.all([
      fs.remove(this.manifestPath(LEGACY_LLMS_MANIFEST)),
      fs.remove(this.manifestPath(LEGACY_API_MANIFEST)),
    ]);
  }

  routeFor(kind: RouteOwnerKind, source: string): string | undefined {
    return this.routes.get(this.routeKey(kind, source))?.slug;
  }

  routesFor(kind: RouteOwnerKind): RouteArtifact[] {
    return [...this.routes.values()].filter((route) => route.kind === kind);
  }

  private routesWithReplacement(
    kind: RouteOwnerKind,
    routes: Iterable<{ source: string; slug: string }>,
  ): Map<string, RouteArtifact> {
    const next = new Map(this.routes);
    for (const [key, route] of next) {
      if (route.kind === kind) next.delete(key);
    }
    for (const value of routes) {
      const route = normalizeRoute({ kind, ...value });
      if (!route) {
        throw new Error(`Refusing to record unsafe ${kind} route ownership`);
      }
      next.set(this.routeKey(kind, route.source), route);
    }
    return next;
  }

  replaceRoutes(
    kind: RouteOwnerKind,
    routes: Iterable<{ source: string; slug: string }>,
  ): void {
    this.routes = this.routesWithReplacement(kind, routes);
  }

  async replaceRoutesAndSave(
    kind: RouteOwnerKind,
    routes: Iterable<{ source: string; slug: string }>,
  ): Promise<void> {
    const next = this.routesWithReplacement(kind, routes);
    await this.writeManifest(next);
    this.routes = next;
  }

  removeRoute(kind: RouteOwnerKind, source: string): void {
    this.routes.delete(this.routeKey(kind, source));
  }

  async removeRouteAndSave(
    kind: RouteOwnerKind,
    source: string,
  ): Promise<void> {
    const next = new Map(this.routes);
    next.delete(this.routeKey(kind, source));
    await this.writeManifest(next);
    this.routes = next;
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

  publicFiles(): Set<string> {
    return new Set(this.publicFilePaths);
  }

  replacePublicFiles(files: Iterable<string>): void {
    const next = new Set<string>();
    for (const value of files) {
      const file = normalizePublicFile(value);
      if (!file) throw new Error("Refusing to record an unsafe public path");
      next.add(file);
    }
    this.publicFilePaths = next;
  }

  iconFiles(): Set<string> {
    return new Set(this.iconFilePaths);
  }

  replaceIconFiles(files: Iterable<string>): void {
    const next = new Set<string>();
    for (const value of files) {
      const file = normalizePublicFile(value);
      if (!file) throw new Error("Refusing to record an unsafe icon path");
      next.add(file);
    }
    this.iconFilePaths = next;
  }

  private async writeManifest(
    routes: ReadonlyMap<string, RouteArtifact>,
  ): Promise<void> {
    const manifest: ArtifactManifest = {
      schemaVersion: 2,
      routes: [...routes.values()].sort((a, b) =>
        `${a.kind}:${a.source}`.localeCompare(`${b.kind}:${b.source}`),
      ),
      llmsPageFiles: [...this.llmsFiles].sort(),
      publicFiles: [...this.publicFilePaths].sort(),
      iconFiles: [...this.iconFilePaths].sort(),
    };
    await writeFileAtomic(
      this.manifestPath(MANIFEST_FILE),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
  }

  async save(): Promise<void> {
    await this.writeManifest(this.routes);
  }
}
