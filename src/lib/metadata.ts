import {
  DEFAULT_FAVICON,
  DEFAULT_META_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_SITE_NAME,
} from "./constants.js";

export interface MetadataOptions {
  title?: string;
  titleFallback: string;
  name?: string;
  titleOrder: "page-first" | "name-first";
  description?: string;
  icon?: string;
  image?: string;
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

export function generateMetadataBlock(opts: MetadataOptions): string {
  const title = buildTitleExpression(opts);
  const desc = buildFieldExpression(
    opts.description,
    "description",
    DEFAULT_META_DESCRIPTION,
  );
  const icon = buildFieldExpression(opts.icon, "icon", DEFAULT_FAVICON);
  const image = buildFieldExpression(opts.image, "image", DEFAULT_OG_IMAGE);

  return `export const metadata: Metadata = {
  title: \`${title}\`,
  description: \`${desc}\`,
  icons: \`${icon}\`,
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
  openGraph: {
    title: \`${title}\`,
    description: \`${desc}\`,
    images: \`${image}\`,
  },
};`;
}
