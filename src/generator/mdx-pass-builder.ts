import type { Stats } from "node:fs";

import type { PageMeta, SectionConfig } from "../lib/types.js";
import { safeMatter } from "../lib/utils.js";
import { buildRealPagesMeta, parseMdxPageMeta } from "./page-catalog.js";
import { discoverSections } from "./section-resolver.js";
import { SecureSourceFs } from "./secure-source-fs.js";

export interface MdxSourceSnapshot {
  content: string;
  stat: Stats;
}

export interface MdxPassSnapshot {
  files: string[];
  pages: PageMeta[];
  sources: ReadonlyMap<string, MdxSourceSnapshot>;
  sections: SectionConfig[] | null;
}

interface MdxPassBuilderOptions {
  sourceFs: SecureSourceFs;
  getAllMdxFiles(): Promise<string[]>;
  getSections(): SectionConfig[] | null;
  loadSectionsConfig(): Promise<SectionConfig[] | null>;
  withApiReferenceSection(
    sections: SectionConfig[] | null,
  ): SectionConfig[] | null;
  determineSectionForFile(
    filePath: string,
    frontmatter: Record<string, any>,
    sections: SectionConfig[] | null,
  ): { sectionSlug: string; pageSlug: string };
  resolveHttpMethod(reference: string): string | undefined;
}

export class MdxPassBuilder {
  constructor(private readonly options: MdxPassBuilderOptions) {}

  async capture(
    files?: string[],
    seededSources: ReadonlyMap<string, MdxSourceSnapshot> = new Map(),
    refreshSections = false,
  ): Promise<MdxPassSnapshot> {
    const resolvedFiles = files ?? (await this.options.getAllMdxFiles());
    const sources = new Map(seededSources);
    await Promise.all(
      resolvedFiles.map(async (file) => {
        const source = file.replace(/\\/g, "/");
        if (!sources.has(source)) {
          sources.set(
            source,
            await this.options.sourceFs.readMdxSourceFile(file),
          );
        }
      }),
    );

    let sections = this.options.getSections();
    if (refreshSections) {
      const configuredSections = await this.options.loadSectionsConfig();
      if (configuredSections !== null) {
        sections = this.options.withApiReferenceSection(configuredSections);
      } else {
        const documents = resolvedFiles.map((filePath) => {
          const source = sources.get(filePath.replace(/\\/g, "/"));
          if (!source) throw new Error(`Unable to snapshot ${filePath}`);
          return {
            filePath,
            frontmatter: safeMatter(source.content, filePath).data,
          };
        });
        sections = this.options.withApiReferenceSection(
          discoverSections(documents),
        );
      }
    }

    const pages = await buildRealPagesMeta(resolvedFiles, async (file) => {
      const source = sources.get(file.replace(/\\/g, "/"));
      if (!source) throw new Error(`Unable to snapshot ${file}`);
      return parseMdxPageMeta(
        file,
        async () => source,
        (filePath, frontmatter) =>
          this.options.determineSectionForFile(filePath, frontmatter, sections),
        (reference) => this.options.resolveHttpMethod(reference),
      );
    });
    return { files: resolvedFiles, pages, sources, sections };
  }
}
