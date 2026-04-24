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
  const imageOverridePrefix = opts.image ? `${JSON.stringify(opts.image)} ||\n      ` : "";
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
    const faviconUrl =
      ${imageOverridePrefix}config.icon ||
      ${JSON.stringify(DEFAULT_FAVICON)};
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "TechArticle",
          headline: ${titleLiteral},
          description: ${descLiteral},
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
}

function buildFieldExpression(
  staticValue: string | undefined,
  configKey: string,
  defaultValue: string,
): string {
  if (staticValue) return staticValue;
  return `\${config.${configKey} || "${defaultValue}"}`;
}

function buildTitleExpression(opts: MetadataOptions): string {
  const title = opts.title || opts.titleFallback;

  if (opts.titleOrder === "page-first") {
    const suffix = opts.name
      ? `- ${opts.name}`
      : `\${config.name ? "- " + config.name : "- ${DEFAULT_SITE_NAME}"}`;
    return `${title} ${suffix}`;
  }

  // name-first
  const prefix = opts.name
    ? `${opts.name} -`
    : `\${config.name ? config.name + " -" : "${DEFAULT_SITE_NAME} -"}`;
  return `${prefix} ${title}`;
}

function buildCanonicalLine(canonicalPath: string | undefined): string {
  if (canonicalPath === undefined) return "";
  const safePath = canonicalPath.replace(/^\/+/, "");
  // Relative path resolves against `metadataBase` set in the root layout.
  // Empty string means the homepage canonical equals the base URL itself.
  return `\n  alternates: { canonical: ${JSON.stringify("/" + safePath)} },`;
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
  const canonical = buildCanonicalLine(opts.canonicalPath);

  return `export const metadata: Metadata = {
  title: \`${title}\`,
  description: \`${desc}\`,
  icons: \`${icon}\`,${canonical}
  openGraph: {
    title: \`${title}\`,
    description: \`${desc}\`,
    images: \`${image}\`,
  },
};`;
}

export function generateRuntimeOnlyMetadataBlock(): string {
  const title = `\${config.name || "${DEFAULT_SITE_NAME}"}`;
  const desc = `\${config.description || "${DEFAULT_META_DESCRIPTION}"}`;
  const icon = `\${config.icon || "${DEFAULT_FAVICON}"}`;
  const image = `\${config.image || "${DEFAULT_OG_IMAGE}"}`;

  return `export const metadata: Metadata = {
  title: \`${title}\`,
  description: \`${desc}\`,
  icons: \`${icon}\`,
  alternates: { canonical: "/" },
  openGraph: {
    title: \`${title}\`,
    description: \`${desc}\`,
    images: \`${image}\`,
  },
};`;
}
