import chalk from "chalk";

import {
  ICON_REGISTRY_FILE,
  INDIRECT_TEMPLATE_ICON_NAMES,
  collectMdxIconNames,
  collectNavigationIconNames,
  collectTemplateIconNames,
  renderIconRegistry,
  resolveLucideIconName,
  type IconReference,
} from "../lib/icon-registry.js";
import {
  readOutputFileIfPresent,
  resolveOutputPath,
} from "../lib/output-safety.js";
import { appStructure } from "../lib/structures.js";
import type { PageMeta } from "../lib/types.js";
import { writeFileAtomic } from "../lib/utils.js";

/** Icon names the generated components use on their own, whatever the docs say. */
export function builtinIconNames(): string[] {
  return [
    ...collectTemplateIconNames(appStructure),
    ...INDIRECT_TEMPLATE_ICON_NAMES,
  ];
}

/**
 * Keeps `components/layout/IconRegistry.ts` in step with the icon names the
 * site uses: sidebar icons from frontmatter, `icon` entries in navigation.json,
 * `<Icon>` and `icon` props in MDX, and the glyphs the generated components
 * draw themselves. Unknown names are reported once and left out, so a typo
 * renders nothing rather than failing the build.
 */
export class IconRegistryGenerator {
  private pages: readonly PageMeta[] = [];
  private mdxSources: ReadonlyMap<string, string> = new Map();
  private lastWritten: string | null = null;
  private lastWarning = "";

  constructor(
    private readonly outputDir: string,
    private readonly builtinNames: readonly string[] = builtinIconNames(),
  ) {}

  /** Called after every MDX pass with the published pages and their sources. */
  async updateFromPages(
    pages: readonly PageMeta[],
    mdxSources: ReadonlyMap<string, string>,
  ): Promise<void> {
    this.pages = pages;
    this.mdxSources = mdxSources;
    await this.write();
  }

  /** Re-reads navigation.json (already copied to the output) and rewrites. */
  async refresh(): Promise<void> {
    await this.write();
  }

  /**
   * Scaffold-time guarantee that the file the Icon template imports exists.
   * An existing registry is left alone: the MDX pass that follows rewrites it
   * only if its content changed, so a rerun over an unchanged site touches
   * nothing.
   */
  async ensurePresent(): Promise<void> {
    const existing = await readOutputFileIfPresent(
      this.outputDir,
      ICON_REGISTRY_FILE,
    );
    if (existing !== null) return;
    await this.write();
  }

  private collectReferences(navigationJson: string | null): IconReference[] {
    const references: IconReference[] = this.builtinNames.map((name) => ({
      name,
      source: "",
    }));
    for (const page of this.pages) {
      if (page.navIcon) {
        references.push({
          name: page.navIcon,
          source: `${page.path} (navIcon)`,
        });
      }
      if (page.categoryIcon) {
        references.push({
          name: page.categoryIcon,
          source: `${page.path} (categoryIcon)`,
        });
      }
    }
    for (const [source, content] of this.mdxSources) {
      for (const name of collectMdxIconNames(content)) {
        references.push({ name, source });
      }
    }
    for (const name of collectNavigationIconNames(navigationJson)) {
      references.push({ name, source: "navigation.json" });
    }
    return references;
  }

  private async write(): Promise<void> {
    const navigationJson = await readOutputFileIfPresent(
      this.outputDir,
      "navigation.json",
    );
    const ids = new Set<string>();
    const unknown = new Map<string, Set<string>>();
    for (const { name, source } of this.collectReferences(navigationJson)) {
      const id = resolveLucideIconName(name);
      if (id) {
        ids.add(id);
        continue;
      }
      const sources = unknown.get(name) ?? new Set<string>();
      if (source) sources.add(source);
      unknown.set(name, sources);
    }
    this.warnUnknown(unknown);

    const content = renderIconRegistry(ids);
    if (content === this.lastWritten) return;
    if (this.lastWritten === null) {
      // First pass of this run: an unchanged file from the previous run is
      // left alone so the dev server sees no spurious rebuild.
      const existing = await readOutputFileIfPresent(
        this.outputDir,
        ICON_REGISTRY_FILE,
      );
      if (existing === content) {
        this.lastWritten = content;
        return;
      }
    }
    await writeFileAtomic(
      resolveOutputPath(this.outputDir, ICON_REGISTRY_FILE),
      content,
    );
    this.lastWritten = content;
  }

  private warnUnknown(unknown: Map<string, Set<string>>): void {
    const lines = [...unknown]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, sources]) => {
        const where = [...sources].sort().join(", ");
        return `"${name}"${where ? ` in ${where}` : ""}`;
      });
    const message = lines.join("\n");
    if (message === this.lastWarning) return;
    this.lastWarning = message;
    if (!message) return;
    console.warn(
      chalk.yellow(
        `⚠️ Unknown Lucide icon name${lines.length === 1 ? "" : "s"}, rendering nothing (see https://lucide.dev/icons):`,
      ),
    );
    for (const line of lines) console.warn(chalk.yellow(`   ${line}`));
  }
}
