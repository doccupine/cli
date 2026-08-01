import {
  generateJsonLdScript,
  generateMetadataBlock,
  generateRuntimeOnlyMetadataBlock,
} from "../lib/metadata.js";
import type { OperationDescriptor } from "../lib/openapi-types.js";
import { parseUpdateBlocks } from "../lib/rss.js";
import type { MDXFile } from "../lib/types.js";
import { escapeTemplateContent, toJsStringLiteral } from "../lib/utils.js";
import { rssRouteTemplate } from "../templates/app/rssRoute.js";

export type RssRouteState =
  | { action: "write"; content: string }
  | { action: "remove" }
  | { action: "preserve" };

export interface RenderedPage {
  pageContent: string;
  rssRoute: RssRouteState;
}

export interface HomepageSource {
  content: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
  name?: string;
  date?: string;
  updated?: string;
  openapi?: string;
  rss?: boolean;
}

/**
 * The `const operation = JSON.parse(...)` declaration that carries an endpoint
 * descriptor into a generated page. `toJsStringLiteral` picks the quote
 * Prettier would, and the width check reproduces its break-after-operator
 * choice, so the emitted file is already formatted.
 */
function apiOperationDeclaration(
  apiOperation: OperationDescriptor | undefined,
): string {
  if (!apiOperation) return "";
  const arg = toJsStringLiteral(JSON.stringify(apiOperation));
  const inline = `const operation = JSON.parse(${arg});`;
  const decl =
    inline.length <= 80
      ? inline
      : `const operation = JSON.parse(\n  ${arg},\n);`;
  return `\n${decl}\n`;
}

export function renderMdxPage(
  mdxFile: MDXFile,
  options?: { apiOperation?: OperationDescriptor },
): RenderedPage {
  const fm = mdxFile.frontmatter;
  const apiOperation = options?.apiOperation;
  const isSynthetic = mdxFile.path.startsWith("@openapi/");
  const updates = isSynthetic ? [] : parseUpdateBlocks(mdxFile.content);
  const hasFeed = updates.length > 0;
  const feedPath = `/${mdxFile.slug}/rss.xml`;

  const metadataBlock = generateMetadataBlock({
    title: fm.title,
    titleFallback: "Generated with Doccupine",
    name: fm.name,
    titleOrder: "page-first",
    description: fm.description,
    icon: fm.icon,
    image: fm.image,
    canonicalPath: mdxFile.slug,
    rssPath: hasFeed ? feedPath : undefined,
  });

  const jsonLd = generateJsonLdScript({
    kind: "article",
    canonicalPath: mdxFile.slug,
    title: fm.title,
    description: fm.description,
    date: typeof fm.date === "string" ? fm.date : undefined,
    updated:
      typeof fm.updated === "string"
        ? fm.updated
        : typeof fm.date === "string"
          ? fm.date
          : undefined,
    image: fm.image,
  });

  const apiImport = apiOperation
    ? `\nimport { ApiPlayground } from "@/components/layout/ApiPlayground";`
    : "";
  const apiConst = apiOperationDeclaration(apiOperation);
  const sourcePathLiteral = JSON.stringify(mdxFile.path);
  const showRssButton = hasFeed && fm.rss === true && !apiOperation;
  const docsAttrs = [
    `content={content}`,
    `sourcePath={${sourcePathLiteral}}`,
    ...(showRssButton ? [`rssHref={${JSON.stringify(feedPath)}}`] : []),
  ];
  const inlineDocs = `<Docs ${docsAttrs.join(" ")} />`;
  const docsElement = apiOperation
    ? `<Docs content={content}>
        <ApiPlayground operation={operation} />
      </Docs>`
    : inlineDocs.length + 6 <= 80
      ? inlineDocs
      : `<Docs\n${docsAttrs.map((attr) => `        ${attr}`).join("\n")}\n      />`;

  const pageContent = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";
import { config } from "@/utils/config";${apiImport}

const content = \`${escapeTemplateContent(mdxFile.content)}\`;
${apiConst}
${metadataBlock}

// Doc pages have no per-request data: theme resolves client-side via the
// "dark" class on <html> (set before paint by the theme-init blocking
// script). Static rendering lets every response come from the edge cache.
export const dynamic = "force-static";
export const revalidate = false;

export default function Page() {
  ${jsonLd.declarations}

  return (
    <>
      ${jsonLd.element}
      ${docsElement}
    </>
  );
}
`;

  const rssRoute: RssRouteState = isSynthetic
    ? { action: "preserve" }
    : hasFeed
      ? {
          action: "write",
          content: rssRouteTemplate({
            pagePath: mdxFile.slug,
            title: typeof fm.title === "string" ? fm.title : null,
            description:
              typeof fm.description === "string" ? fm.description : null,
            items: updates.map((update) => ({
              title: update.label,
              anchor: update.anchor,
              description: update.description,
            })),
          }),
        }
      : { action: "remove" };

  return { pageContent, rssRoute };
}

export function renderHomepage(
  indexMDX: HomepageSource | null,
  apiOperation?: OperationDescriptor,
): RenderedPage {
  const updates = indexMDX ? parseUpdateBlocks(indexMDX.content) : [];
  const hasFeed = updates.length > 0;
  const feedPath = "/rss.xml";

  const metadataBlock = indexMDX
    ? generateMetadataBlock({
        title: indexMDX.title,
        titleFallback: "Welcome",
        name: indexMDX.name,
        titleOrder: "name-first",
        description: indexMDX.description || undefined,
        icon: indexMDX.icon,
        image: indexMDX.image,
        canonicalPath: "",
        rssPath: hasFeed ? feedPath : undefined,
      })
    : generateRuntimeOnlyMetadataBlock();

  const homeJsonLd = generateJsonLdScript({
    kind: "homepage",
    canonicalPath: "",
    title: indexMDX?.title,
    description: indexMDX?.description || undefined,
    date: indexMDX?.date,
    updated: indexMDX?.updated ?? indexMDX?.date,
    image: indexMDX?.image,
  });

  const apiImport = apiOperation
    ? `\nimport { ApiPlayground } from "@/components/layout/ApiPlayground";`
    : "";
  const apiConst = apiOperationDeclaration(apiOperation);
  const showRssButton = hasFeed && indexMDX?.rss === true && !apiOperation;
  const docsElement = apiOperation
    ? `<Docs content={content} sourcePath="index.mdx">
        <ApiPlayground operation={operation} />
      </Docs>`
    : showRssButton
      ? `<Docs content={content} sourcePath="index.mdx" rssHref={"/rss.xml"} />`
      : `<Docs content={content} sourcePath="index.mdx" />`;

  const pageContent = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";
import { config } from "@/utils/config";${apiImport}

${indexMDX ? `const content = \`${escapeTemplateContent(indexMDX.content)}\`;` : `const content = null;`}
${apiConst}
${metadataBlock}

export const dynamic = "force-static";
export const revalidate = false;

export default function Home() {
  ${homeJsonLd.declarations}

  return (
    <>
      ${homeJsonLd.element}
      ${docsElement}
    </>
  );
}
`;

  const rssRoute: RssRouteState =
    hasFeed && indexMDX
      ? {
          action: "write",
          content: rssRouteTemplate({
            pagePath: "",
            title: indexMDX.title,
            description: indexMDX.description || null,
            items: updates.map((update) => ({
              title: update.label,
              anchor: update.anchor,
              description: update.description,
            })),
          }),
        }
      : { action: "remove" };

  return { pageContent, rssRoute };
}

export function renderSectionPage(
  sectionSlug: string,
  frontmatter: Record<string, any>,
  mdxContent: string,
  sourcePath?: string,
): RenderedPage {
  const updates = parseUpdateBlocks(mdxContent);
  const hasFeed = updates.length > 0;
  const feedPath = `/${sectionSlug}/rss.xml`;
  const showRssButton = hasFeed && frontmatter.rss === true;

  const metadataBlock = generateMetadataBlock({
    title: frontmatter.title,
    titleFallback: "Section",
    name: frontmatter.name,
    titleOrder: "name-first",
    description: frontmatter.description || undefined,
    icon: frontmatter.icon,
    image: frontmatter.image,
    canonicalPath: sectionSlug,
    rssPath: hasFeed ? feedPath : undefined,
  });

  const sectionJsonLd = generateJsonLdScript({
    kind: "article",
    canonicalPath: sectionSlug,
    title: frontmatter.title,
    description: frontmatter.description,
    date: typeof frontmatter.date === "string" ? frontmatter.date : undefined,
    updated:
      typeof frontmatter.updated === "string"
        ? frontmatter.updated
        : typeof frontmatter.date === "string"
          ? frontmatter.date
          : undefined,
    image: frontmatter.image,
  });

  const docsAttrs = [
    `content={content}`,
    `sourcePath={${JSON.stringify(sourcePath ?? `${sectionSlug}/index.mdx`)}}`,
    ...(showRssButton ? [`rssHref={${JSON.stringify(feedPath)}}`] : []),
  ];
  const inlineDocs = `<Docs ${docsAttrs.join(" ")} />`;
  const docsElement =
    inlineDocs.length + 6 <= 80
      ? inlineDocs
      : `<Docs\n${docsAttrs.map((attr) => `        ${attr}`).join("\n")}\n      />`;

  const pageContent = `import { Metadata } from "next";
import { Docs } from "@/components/Docs";
import { config } from "@/utils/config";

const content = \`${escapeTemplateContent(mdxContent)}\`;

${metadataBlock}

export const dynamic = "force-static";
export const revalidate = false;

export default function Page() {
  ${sectionJsonLd.declarations}

  return (
    <>
      ${sectionJsonLd.element}
      ${docsElement}
    </>
  );
}
`;

  return { pageContent, rssRoute: { action: "preserve" } };
}
