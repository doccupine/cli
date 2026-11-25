import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_SITE_NAME,
} from "./constants.js";
import { DEFAULT_TEMPLATE, type SiteTemplate } from "./templates.js";
import type { FontConfig, LanguageConfig, SectionConfig } from "./types.js";
import {
  defaultLanguage,
  listVariantPrefixes,
  sectionsForVariant,
  type VariantSet,
} from "./variants.js";

function formatObjectArray<T extends object>(items: T[]): string {
  const MAX_WIDTH = 80;
  const formatted = items.map((item) => {
    const lines: string[] = ["  {"];
    const entries = Object.entries(item) as [string, unknown][];
    for (const [key, value] of entries) {
      const valueStr = JSON.stringify(value);
      const line = `    ${key}: ${valueStr},`;
      if (line.length > MAX_WIDTH) {
        lines.push(`    ${key}:`);
        lines.push(`      ${valueStr},`);
      } else {
        lines.push(line);
      }
    }
    lines.push("  },");
    return lines.join("\n");
  });
  return "[\n" + formatted.join("\n") + "\n]";
}

interface PageData {
  slug: string;
  title: string;
  description: string;
  date: string | null;
  category: string;
  path: string;
  categoryOrder: number;
  order: number;
  section: string;
  locale?: string;
  version?: string;
}

/**
 * `{ "": ["", "api"], de: [""] }` as Prettier prints it: keys quoted only when
 * they are not identifiers, one entry per line, arrays inline unless the line
 * would overflow.
 */
function formatSectionScopes(scopes: Record<string, string[]>): string {
  const lines = Object.entries(scopes).map(([prefix, slugs]) => {
    const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(prefix)
      ? prefix
      : JSON.stringify(prefix);
    const items = slugs.map((slug) => JSON.stringify(slug));
    const inline = `  ${key}: [${items.join(", ")}],`;
    if (inline.length <= 80) return inline;
    return `  ${key}: [\n${items.map((item) => `    ${item},`).join("\n")}\n  ],`;
  });
  return `{\n${lines.join("\n")}\n}`;
}

function isGoogleFont(
  fc: FontConfig | null,
): fc is FontConfig & { googleFont: NonNullable<FontConfig["googleFont"]> } {
  return (
    !!fc?.googleFont?.fontName &&
    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(fc.googleFont.fontName)
  );
}

function isLocalFont(fc: FontConfig | null): boolean {
  if (!fc?.localFonts) return false;
  if (typeof fc.localFonts === "string") return true;
  return !!fc.localFonts.src?.length;
}

function getLocalFontSrc(fc: FontConfig): string {
  if (typeof fc.localFonts === "string") return JSON.stringify(fc.localFonts);
  return JSON.stringify(fc.localFonts?.src, null, 2);
}

function fontImportLine(fontConfig: FontConfig | null): string {
  return isGoogleFont(fontConfig)
    ? `import { ${fontConfig.googleFont.fontName} } from "next/font/google";`
    : isLocalFont(fontConfig)
      ? 'import localFont from "next/font/local";'
      : 'import { Inter } from "next/font/google";';
}

function fontDeclLine(fontConfig: FontConfig | null): string {
  if (isGoogleFont(fontConfig)) {
    const options = [
      fontConfig.googleFont.subsets?.length
        ? `subsets: [${fontConfig.googleFont.subsets
            .map((subset) => JSON.stringify(subset))
            .join(", ")}]`
        : "",
      fontConfig.googleFont.weight?.length
        ? `weight: ${
            Array.isArray(fontConfig.googleFont.weight)
              ? `[${fontConfig.googleFont.weight
                  .map((weight) => JSON.stringify(weight))
                  .join(", ")}]`
              : JSON.stringify(fontConfig.googleFont.weight)
          }`
        : "",
    ].filter(Boolean);

    return options.length
      ? `const font = ${fontConfig.googleFont.fontName}({
  ${options.join(",\n  ")},
});`
      : `const font = ${fontConfig.googleFont.fontName}({});`;
  }

  return isLocalFont(fontConfig)
    ? `const font = localFont({
  src: ${getLocalFontSrc(fontConfig!)},
});`
    : 'const font = Inter({ subsets: ["latin"] });';
}

// The inline blocking script that resolves dark mode before the first paint.
// It only has to decide the mode and record it on <html>: every painted color
// in the app resolves through the CSS custom properties app/styles/tokens.css
// declares under :root and :root.dark, so the "dark" class is enough to make a
// statically rendered page arrive dark. Nothing is hidden and nothing waits for
// hydration: the markup streams and paints in the right theme exactly like a
// light visit does.
//
// The mode is decided the same way the color-mode store (utils/colorMode.ts)
// decides it after hydration, so mounting never flips it: an explicit "themePreference" in
// localStorage (light, dark or system); else a "theme" entry in localStorage,
// which older releases wrote only when the visitor toggled; else the OS
// preference. Where storage is blocked, the "theme" cookie is the only thing
// that persists a choice, so it decides. The cookie is kept in step with the
// resolved mode either way.
//
// The script also emits the theme-color meta for the resolved mode through
// document.write, which hands the tag to the HTML parser itself: Safari only
// tints its chrome reliably from a parser-inserted tag - one created through
// the DOM APIs is honored inconsistently or not at all - though it does track
// content updates to such a tag, which is how ColorModeSync keeps it current
// on toggles. The meta cannot be rendered from the
// layout instead: pages are static, so the server would emit one mode's color
// and this script would have to correct it before paint, and React 19
// hydration treats a head meta whose attributes differ from its props as
// missing and inserts a duplicate with the stale light color beside it -
// suppressHydrationWarning does not cover hoisted metas, and a meta emitted
// through Next's viewport export hydrates the same way (both verified against
// Next 16.3; the duplicate is what broke the chrome tint on iPad Safari).
// OS-scheme-scoped SSR metas are no answer either: the site's mode is
// decided per visitor (a stored choice can differ from the OS), so a dark
// site on a light-OS device would show the wrong
// browser chrome until hydration - a visible flash on every load. Keeping the
// tag out of React leaves exactly one meta that nothing ever re-inserts. The
// \${...} palette interpolations below are escaped so they resolve in the
// generated layout, at app build time, from the imported theme palettes. The
// token must match the one ColorModeSync syncs (primary), so the chrome color
// does not change at hydration.
const THEME_INIT_SCRIPT = `(function(){try{var r=document.documentElement,o=window.matchMedia&&window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light",k=document.cookie.split(";").map(function(s){return s.trim();}).find(function(s){return s.indexOf("theme=")===0;}),c=k?k.split("=")[1]:null,m;try{var p=localStorage.getItem("themePreference"),t=localStorage.getItem("theme");m=p==="light"||p==="dark"?p:p!=="system"&&(t==="light"||t==="dark")?t:o;}catch(e){m=c==="light"||c==="dark"?c:o;}if(c!==m){document.cookie="theme="+m+";path=/;max-age=31536000;SameSite=Lax";}r.classList.toggle("dark",m==="dark");document.write('<meta name="theme-color" content="'+(m==="dark"?"\${colorsDark.primary}":"\${colorsLight.primary}")+'">');}catch(e){}})();`;

/**
 * Root layout ("app/layout.tsx"). Minimal shell: html/body, fonts, the site
 * stylesheets (app/styles, see src/templates/styles), the color-mode sync, and
 * (optionally) PostHog. It renders `children` directly so
 * both the docs (via the "(site)" layout) and the password gate ("app/gate")
 * share the same providers and theme without the docs chrome. Deliberately has
 * NO request-time data (cookies/headers) so pages stay statically renderable —
 * the SITE_PASSWORD gate is enforced in the middleware (proxy.ts), which
 * rewrites locked page requests to "/gate".
 *
 * `template` is the site design (config.json); the shell is the same for
 * every design today, and a design that needs different markup branches on it.
 */
export const rootLayoutTemplate = (
  fontConfig: FontConfig | null,
  analyticsEnabled: boolean = false,
  languages: LanguageConfig[] | null = null,
  template: SiteTemplate = DEFAULT_TEMPLATE,
): string => {
  // A single root layout serves every language, so the server-rendered
  // <html lang> is the default language's. The pre-paint script corrects it
  // from the URL's language prefix before anything renders, and the docs
  // content container carries its own lang attribute server-side.
  const defaultCode = defaultLanguage(languages)?.code ?? "en";
  const languageCodes = (languages ?? [])
    .filter((language) => !language.default)
    .map((language) => language.code);
  const themeInitScript = languages
    ? THEME_INIT_SCRIPT.replace(
        "document.write(",
        `var p=location.pathname.split("/")[1];r.lang=${JSON.stringify(languageCodes)}.indexOf(p)>=0?p:${JSON.stringify(defaultCode)};document.write(`,
      )
    : THEME_INIT_SCRIPT;
  return `import type { Metadata } from "next";
${fontImportLine(fontConfig)}
import "./styles/reset.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/design.css";
import { colorsDark, colorsLight } from "@/app/theme";
import { ColorModeSync } from "@/components/ColorModeSync";
import { config } from "@/utils/config";
import { siteIcons } from "@/utils/icons";
${analyticsEnabled ? `import { PostHogProvider } from "@/components/PostHogProvider";\n` : ""}
${fontDeclLine(fontConfig)}

function resolveSiteUrl(): URL | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? config.url;
  if (!raw || typeof raw !== "string") return undefined;
  try {
    return new URL(raw);
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: config.name || "${DEFAULT_SITE_NAME}",
  description:
    config.description ||
    "${DEFAULT_DESCRIPTION}",
  icons: siteIcons,
  openGraph: {
    title: config.name || "${DEFAULT_SITE_NAME}",
    description:
      config.description ||
      "${DEFAULT_DESCRIPTION}",
    images: config.image || "${DEFAULT_OG_IMAGE}",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="${defaultCode}" suppressHydrationWarning>
      <head>
        {/* Resolves dark mode before the first paint by setting the "dark"
            class on <html>, which flips the theme's CSS variables.
            Inlined as a plain <script> (not next/script) so it ships in the
            SSR HTML and runs synchronously before paint — next/script with
            beforeInteractive is async in App Router and would flash.
            suppressHydrationWarning on <html> tells React the class is
            intentionally different between server (none) and client. */}
        <script
          dangerouslySetInnerHTML={{
            __html: \`${themeInitScript}\`,
          }}
        />
      </head>
      <body className={font.className}>
        <ColorModeSync />
${
  analyticsEnabled
    ? `        <PostHogProvider>{children}</PostHogProvider>`
    : `        {children}`
}
      </body>
    </html>
  );
}
`;
};

/**
 * Docs chrome layout ("app/(site)/layout.tsx"). Wraps every documentation page
 * with the header, sidebar/section navigation, chat, and footer. Lives in the
 * URL-transparent "(site)" route group so it wraps the docs but NOT the gate
 * screen at "/gate", which renders under the root shell alone. Renders inside
 * the root layout's providers, so it needs no html/body or theme provider.
 *
 * `template` is the site design (config.json), passed through so a design
 * can change the chrome's markup. The modern design hands DocsWrapper the
 * page list, which its page header reads for the current page's category.
 */
export const siteLayoutTemplate = (
  pages: PageData[],
  sectionsConfig: SectionConfig[] | null = null,
  variants: VariantSet | null = null,
  template: SiteTemplate = DEFAULT_TEMPLATE,
): string => {
  const hasSections = sectionsConfig !== null && sectionsConfig.length > 0;
  const docsWrapperOpen = docsWrapperTag(template);
  const chtOpen = `<ChtProvider isChatActive={process.env.LLM_PROVIDER ? true : false}>`;

  if (variants) {
    return variantSiteLayout(
      pages,
      sectionsConfig,
      variants,
      chtOpen,
      docsWrapperOpen,
    );
  }

  return `import dynamic from "next/dynamic";
import { ChtProvider } from "@/components/Chat";
import { SearchProvider } from "@/components/SearchDocs";
${
  hasSections
    ? ""
    : `import { Footer } from "@/components/layout/Footer";
`
}import { Header } from "@/components/layout/Header";
import {
  DocsWrapper,
  LlmsDirective,
  SkipLink,
} from "@/components/layout/DocsComponents";
${
  hasSections
    ? ""
    : `import { SectionBarProvider } from "@/components/layout/DocsComponents";
import { SideBar } from "@/components/SideBar";
import { DocsNavigation } from "@/components/layout/DocsNavigation";
`
}import { type PagesProps } from "@/utils/orderNavItems";
${
  hasSections
    ? ""
    : `import { transformPagesToGroupedStructure } from "@/utils/orderNavItems";
`
}${
    hasSections
      ? ""
      : `import { StaticLinks } from "@/components/layout/StaticLinks";
`
  }import { verifyBrandingKey } from "@/utils/branding";
${
  hasSections
    ? ""
    : `import navigation from "@/navigation.json";
`
}
${
  hasSections
    ? `import { SectionBar } from "@/components/layout/SectionBar";
import { SectionNavProvider } from "@/components/SectionNavProvider";
`
    : ""
}const Chat = dynamic(() => import("@/components/Chat").then((mod) => mod.Chat));

const doccupinePages = ${formatObjectArray(pages)};${hasSections ? `\nconst doccupineSections = ${formatObjectArray(sectionsConfig!)};` : ""}

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hideBranding = verifyBrandingKey();
${
  hasSections
    ? `
  const pages: PagesProps[] = doccupinePages;

  return (
    ${chtOpen}
      <SearchProvider pages={pages} sections={doccupineSections}>
        <SkipLink />
        <LlmsDirective />
        <Header>
          <SectionBar sections={doccupineSections} />
        </Header>
        {process.env.LLM_PROVIDER && <Chat />}
        ${docsWrapperOpen}
          <SectionNavProvider
            sections={doccupineSections}
            allPages={pages}
            hideBranding={hideBranding}
          >
            {children}
          </SectionNavProvider>
        </DocsWrapper>
      </SearchProvider>
    </ChtProvider>
  );
}`
    : `
  const defaultPages = [
    {
      slug: "",
      title: "Getting Started",
      description:
        "${DEFAULT_DESCRIPTION}",
      date: "2025-01-15",
      category: "Introduction",
      categoryOrder: 0,
      categoryIcon: "rocket",
      order: 0,
    },
  ];

  const pages: PagesProps[] = doccupinePages;
  const result =
    Array.isArray(navigation) && navigation.length
      ? navigation
      : transformPagesToGroupedStructure(pages);
  const defaultResults = transformPagesToGroupedStructure(defaultPages);

  return (
    ${chtOpen}
      <SearchProvider pages={pages}>
        <SkipLink />
        <LlmsDirective />
        <Header />
        {process.env.LLM_PROVIDER && <Chat />}
        <SectionBarProvider hasSectionBar={false}>
          ${docsWrapperOpen}
            <SideBar result={result.length ? result : defaultResults} />
            {children}
            <DocsNavigation result={result.length ? result : defaultResults} />
            <StaticLinks />
            <Footer hideBranding={hideBranding} />
          </DocsWrapper>
        </SectionBarProvider>
      </SearchProvider>
    </ChtProvider>
  );
}`
}
`;
};

/**
 * Opening tag of the docs chrome wrapper. The modern design passes the page
 * list so the page header can show the current page's category; classic
 * renders the bare wrapper.
 */
function docsWrapperTag(template: SiteTemplate): string {
  return template === "modern"
    ? "<DocsWrapper pages={pages}>"
    : "<DocsWrapper>";
}

/**
 * The docs chrome layout of a site with languages or versions. Always routes
 * the sidebar through SectionNavProvider, which scopes sections and pages to
 * the current language/version prefix and hands the sidebar the full page list
 * its language and version switchers navigate through. The section bar shows
 * only the sections that have pages in the current prefix.
 */
function variantSiteLayout(
  pages: PageData[],
  sectionsConfig: SectionConfig[] | null,
  variants: VariantSet,
  chtOpen: string,
  docsWrapperOpen: string,
): string {
  const hasSections = sectionsConfig !== null && sectionsConfig.length > 0;
  const { languages, versions } = variants;
  const sectionScopes: Record<string, string[]> = {};
  if (hasSections) {
    for (const prefix of listVariantPrefixes(languages, versions)) {
      sectionScopes[prefix] = sectionsForVariant(
        pages as PageMetaLike[],
        sectionsConfig,
        prefix,
        languages,
        versions,
      );
    }
  }

  const sectionBar = hasSections
    ? `
          <SectionBar
            sections={doccupineSections}
            variantSections={doccupineVariantSections}
          />
        `
    : "";

  return `import dynamic from "next/dynamic";
import { ChtProvider } from "@/components/Chat";
import { SearchProvider } from "@/components/SearchDocs";
import { Header } from "@/components/layout/Header";
import {
  DocsWrapper,
  LlmsDirective,
  SkipLink,
} from "@/components/layout/DocsComponents";
import { type PagesProps } from "@/utils/orderNavItems";
import { verifyBrandingKey } from "@/utils/branding";
${hasSections ? `import { SectionBar } from "@/components/layout/SectionBar";\n` : ""}import { SectionNavProvider } from "@/components/SectionNavProvider";

const Chat = dynamic(() => import("@/components/Chat").then((mod) => mod.Chat));

const doccupinePages = ${formatObjectArray(pages)};${
    hasSections
      ? `\nconst doccupineSections = ${formatObjectArray(sectionsConfig!)};
const doccupineVariantSections: Record<string, string[]> = ${formatSectionScopes(sectionScopes)};`
      : ""
  }

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hideBranding = verifyBrandingKey();

  const pages: PagesProps[] = doccupinePages;

  return (
    ${chtOpen}
      <SearchProvider pages={pages}${hasSections ? " sections={doccupineSections}" : ""}>
        <SkipLink />
        <LlmsDirective />
        <Header${hasSections ? `>${sectionBar}</Header>` : " />"}
        {process.env.LLM_PROVIDER && <Chat />}
        ${docsWrapperOpen}
          <SectionNavProvider
            sections={${hasSections ? "doccupineSections" : "[]"}}
            allPages={pages}
            hideBranding={hideBranding}${hasSections ? "" : "\n            hasSectionBar={false}"}
          >
            {children}
          </SectionNavProvider>
        </DocsWrapper>
      </SearchProvider>
    </ChtProvider>
  );
}
`;
}

type PageMetaLike = Parameters<typeof sectionsForVariant>[0][number];
