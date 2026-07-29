import {
  DEFAULT_FAVICON,
  DEFAULT_META_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_SITE_NAME,
} from "./constants.js";

export type JsonLdKind = "article" | "homepage";

export interface JsonLdOptions {
  kind: JsonLdKind;
  /** Page slug ("" for homepage). Used to build the absolute URL with config.url. */
  canonicalPath: string;
  title?: string;
  description?: string;
  date?: string;
  /** Optional last-modified date; defaults to date when present. */
  updated?: string;
  image?: string;
}

/**
 * Returns a code snippet that:
 *  - declares a `jsonLd` object at runtime using the site's config,
 *  - and renders a single `<script type="application/ld+json">` element.
 *
 * The snippet is meant to be inlined inside a generated page component.
 * It emits a TechArticle on every doc page; the homepage additionally
 * emits a graph that includes an Organization entity for entity recognition.
 */
export function generateJsonLdScript(opts: JsonLdOptions): {
  declarations: string;
  element: string;
} {
  const safePath = opts.canonicalPath.replace(/^\/+/, "");
  const titleLiteral = JSON.stringify(opts.title ?? DEFAULT_SITE_NAME);
  const descLiteral = JSON.stringify(
    opts.description ?? DEFAULT_META_DESCRIPTION,
  );
  const dateLiteral = opts.date ? JSON.stringify(opts.date) : "undefined";
  const updatedLiteral = opts.updated
    ? JSON.stringify(opts.updated)
    : opts.date
      ? JSON.stringify(opts.date)
      : "undefined";
  const defaultFaviconLiteral = JSON.stringify(DEFAULT_FAVICON);
  // When the page declares an image, it always wins - emitting a `||` chain
  // after a string literal makes TypeScript fail the build with
  // "This kind of expression is always truthy".
  const faviconLine = opts.image
    ? `const faviconUrl = ${JSON.stringify(opts.image)};`
    : `const faviconUrl = config.icon || ${defaultFaviconLiteral};`;
  // Indent 10 + "description: ".length(13) + ",".length(1) = 24. Prettier
  // wraps the value to the next line (indent 12) once total exceeds 80.
  const descriptionLine =
    descLiteral.length > 56
      ? `description:
            ${descLiteral},`
      : `description: ${descLiteral},`;
  const pathLiteral = JSON.stringify(safePath);

  const homepageGraph =
    opts.kind === "homepage"
      ? `,
        {
          "@type": "Organization",
          name: siteName,
          url: baseUrl ?? undefined,
          logo: faviconUrl,
        }`
      : "";

  const declarations = `const __jsonLdBaseUrl = (() => {
    const raw =
      typeof process !== "undefined"
        ? process.env.NEXT_PUBLIC_SITE_URL
        : undefined;
    const fromEnv = typeof raw === "string" && raw.trim() !== "" ? raw : null;
    const fromConfig =
      typeof config.url === "string" && config.url.trim() !== ""
        ? config.url
        : null;
    return (fromEnv ?? fromConfig)?.replace(/\\/$/, "") ?? null;
  })();
  const __jsonLd = (() => {
    const baseUrl = __jsonLdBaseUrl;
    const path = ${pathLiteral};
    const url = baseUrl ? (path ? \`\${baseUrl}/\${path}\` : baseUrl) : undefined;
    const siteName = config.name || ${JSON.stringify(DEFAULT_SITE_NAME)};
    ${faviconLine}
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "TechArticle",
          headline: ${titleLiteral},
          ${descriptionLine}
          url,
          mainEntityOfPage: url,
          datePublished: ${dateLiteral},
          dateModified: ${updatedLiteral},
          author: { "@type": "Organization", name: siteName },
          publisher: {
            "@type": "Organization",
            name: siteName,
            logo: { "@type": "ImageObject", url: faviconUrl },
          },
        }${homepageGraph},
      ],
    };
  })();`;

  const element = `<script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(__jsonLd) }}
      />`;

  return { declarations, element };
}

export interface MetadataOptions {
  title?: string;
  titleFallback: string;
  name?: string;
  titleOrder: "page-first" | "name-first";
  description?: string;
  icon?: string;
  image?: string;
  /**
   * Canonical path for this page, e.g. "" for the homepage or "components".
   * Resolves against `metadataBase` defined in the root layout.
   */
  canonicalPath?: string;
  /**
   * Path of this page's RSS feed, e.g. "/update/rss.xml". Emitted as an
   * `alternates.types` entry so feed readers can autodiscover the feed.
   */
  rssPath?: string;
}

function buildFieldExpression(
  staticValue: string | undefined,
  configKey: string,
  defaultValue: string,
): string {
  if (staticValue) return JSON.stringify(String(staticValue));
  return `config.${configKey} || ${JSON.stringify(defaultValue)}`;
}

function buildTitleExpression(opts: MetadataOptions): string {
  const title = String(opts.title || opts.titleFallback);

  if (opts.titleOrder === "page-first") {
    if (opts.name) {
      return JSON.stringify(`${title} - ${String(opts.name)}`);
    }
    return `[
  ${JSON.stringify(title)},
  config.name ? "- " + config.name : ${JSON.stringify(`- ${DEFAULT_SITE_NAME}`)},
].join(" ")`;
  }

  if (opts.name) {
    return JSON.stringify(`${String(opts.name)} - ${title}`);
  }
  return `[
  config.name ? config.name + " -" : ${JSON.stringify(`${DEFAULT_SITE_NAME} -`)},
  ${JSON.stringify(title)},
].join(" ")`;
}

function formatProperty(
  indent: number,
  name: string,
  expression: string,
): string {
  const prefix = " ".repeat(indent);
  const inline = `${prefix}${name}: ${expression},`;
  return inline.length <= 80
    ? inline
    : `${prefix}${name}:\n${prefix}  ${expression},`;
}

function buildAlternatesBlock(
  canonicalPath: string | undefined,
  rssPath: string | undefined,
): string {
  if (canonicalPath === undefined) return "";
  const safePath = canonicalPath.replace(/^\/+/, "");
  // Relative paths resolve against `metadataBase` set in the root layout.
  // Empty string means the homepage canonical equals the base URL itself.
  const canonical = JSON.stringify("/" + safePath);
  if (!rssPath) return `\n  alternates: { canonical: ${canonical} },`;
  const rss = JSON.stringify(rssPath);
  // Prettier preserves an object literal that already breaks after "{", so
  // the expanded form is stable; only the inner `types` line can overflow
  // the 80-col print width (long slugs) and needs the pre-wrap check.
  const typesInline = `    types: { "application/rss+xml": ${rss} },`;
  const typesLines =
    typesInline.length <= 80
      ? typesInline
      : `    types: {\n      "application/rss+xml": ${rss},\n    },`;
  return `\n  alternates: {\n    canonical: ${canonical},\n${typesLines}\n  },`;
}

export function generateMetadataBlock(opts: MetadataOptions): string {
  const title = buildTitleExpression(opts);
  const desc = buildFieldExpression(
    opts.description,
    "description",
    DEFAULT_META_DESCRIPTION,
  );
  const icon = buildFieldExpression(opts.icon, "icon", DEFAULT_FAVICON);
  const image = buildFieldExpression(opts.image, "image", DEFAULT_OG_IMAGE);
  const canonical = buildAlternatesBlock(opts.canonicalPath, opts.rssPath);
  const inlineTitleDeclaration = `const pageTitle = ${title};`;
  const titleDeclaration =
    title.includes("\n") || inlineTitleDeclaration.length <= 80
      ? inlineTitleDeclaration
      : `const pageTitle =\n  ${title};`;
  const descriptionLine = formatProperty(2, "description", desc);
  const iconLine = formatProperty(2, "icons", icon);
  const openGraphDescriptionLine = formatProperty(4, "description", desc);
  const imageLine = formatProperty(4, "images", image);

  return `${titleDeclaration}

export const metadata: Metadata = {
  title: pageTitle,
${descriptionLine}
${iconLine}${canonical}
  openGraph: {
    title: pageTitle,
${openGraphDescriptionLine}
${imageLine}
  },
};`;
}

export function generateRuntimeOnlyMetadataBlock(): string {
  const title = `config.name || ${JSON.stringify(DEFAULT_SITE_NAME)}`;
  const desc = `config.description || ${JSON.stringify(DEFAULT_META_DESCRIPTION)}`;
  const icon = `config.icon || ${JSON.stringify(DEFAULT_FAVICON)}`;
  const image = `config.image || ${JSON.stringify(DEFAULT_OG_IMAGE)}`;
  const descriptionLine = formatProperty(2, "description", desc);
  const iconLine = formatProperty(2, "icons", icon);
  const openGraphDescriptionLine = formatProperty(4, "description", desc);
  const imageLine = formatProperty(4, "images", image);

  return `const pageTitle = ${title};

export const metadata: Metadata = {
  title: pageTitle,
${descriptionLine}
${iconLine}
  alternates: { canonical: "/" },
  openGraph: {
    title: pageTitle,
${openGraphDescriptionLine}
${imageLine}
  },
};`;
}
