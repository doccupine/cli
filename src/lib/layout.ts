import {
  DEFAULT_DESCRIPTION,
  DEFAULT_FAVICON,
  DEFAULT_OG_IMAGE,
  DEFAULT_SITE_NAME,
} from "./constants.js";
import type { SectionConfig } from "./types.js";

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
}

interface GoogleFontConfig {
  fontName?: string;
  subsets?: string[];
  weight?: string | string[];
}

interface LocalFontSrc {
  path: string;
  weight: string;
  style: string;
}

interface FontConfig {
  googleFont?: GoogleFontConfig;
  localFonts?: string | { src?: LocalFontSrc[] };
}

function isGoogleFont(
  fc: FontConfig | null,
): fc is FontConfig & { googleFont: GoogleFontConfig } {
  return !!fc?.googleFont?.fontName;
}

function isLocalFont(fc: FontConfig | null): boolean {
  if (!fc?.localFonts) return false;
  if (typeof fc.localFonts === "string") return true;
  return !!fc.localFonts.src?.length;
}

function getLocalFontSrc(fc: FontConfig): string {
  if (typeof fc.localFonts === "string") return `"${fc.localFonts}"`;
  return JSON.stringify(fc.localFonts?.src, null, 2).replace(
    /"([^"]+)":/g,
    "$1:",
  );
}

function fontImportLine(fontConfig: FontConfig | null): string {
  return isGoogleFont(fontConfig)
    ? `import { ${fontConfig.googleFont.fontName} } from "next/font/google";`
    : isLocalFont(fontConfig)
      ? 'import localFont from "next/font/local";'
      : 'import { Inter } from "next/font/google";';
}

function fontDeclLine(fontConfig: FontConfig | null): string {
  return isGoogleFont(fontConfig)
    ? `const font = ${fontConfig.googleFont.fontName}({ ${[
        fontConfig.googleFont.subsets?.length
          ? `subsets: ${JSON.stringify(fontConfig.googleFont.subsets)}`
          : "",
        fontConfig.googleFont.weight?.length
          ? `weight: ${
              Array.isArray(fontConfig.googleFont.weight)
                ? JSON.stringify(fontConfig.googleFont.weight)
                : `"${fontConfig.googleFont.weight}"`
            }`
          : "",
      ]
        .filter(Boolean)
        .join(", ")} });`
    : isLocalFont(fontConfig)
      ? `const font = localFont({
  src: ${getLocalFontSrc(fontConfig!)},
});`
      : 'const font = Inter({ subsets: ["latin"] });';
}

// The inline blocking script that resolves dark mode before first paint by
// adding the "dark" class to <html>. Shared by the root layout's <head>.
const THEME_INIT_SCRIPT = `(function(){try{var c=document.cookie.split(";").map(function(s){return s.trim();}).find(function(s){return s.indexOf("theme=")===0;});var v=c?c.split("=")[1]:null;var d=v?v==="dark":(window.matchMedia&&window.matchMedia("(prefers-color-scheme:dark)").matches);if(!v){document.cookie="theme="+(d?"dark":"light")+";path=/;max-age=31536000;SameSite=Lax";}if(d){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}else{document.documentElement.style.colorScheme="light";}}catch(e){}})();`;

/**
 * Root layout ("app/layout.tsx"). Minimal shell: html/body, fonts, the theme
 * provider stack, and (optionally) PostHog. It renders `children` directly so
 * both the docs (via the "(site)" layout) and the password gate ("app/gate")
 * share the same providers and theme without the docs chrome. Deliberately has
 * NO request-time data (cookies/headers) so pages stay statically renderable —
 * the SITE_PASSWORD gate is enforced in the middleware (proxy.ts), which
 * rewrites locked page requests to "/gate".
 */
export const rootLayoutTemplate = (
  fontConfig: FontConfig | null,
  analyticsEnabled: boolean = false,
): string => {
  return `import type { Metadata } from "next";
${fontImportLine(fontConfig)}
import { StyledComponentsRegistry } from "cherry-styled-components";
import { theme } from "@/app/theme";
import { CherryThemeProvider } from "@/components/layout/CherryThemeProvider";
import { config } from "@/utils/config";
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
  icons: config.icon || "${DEFAULT_FAVICON}",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Resolves dark mode before first paint by adding the "dark" class
            to <html> when needed. CSS variables in GlobalStyles flip values
            on :root vs :root.dark, so the right palette renders without a
            React roundtrip. Inlined as a plain <script> (not next/script) so
            it ships in the SSR HTML and runs synchronously before paint —
            next/script with beforeInteractive is async in App Router and
            would still show a flash. suppressHydrationWarning on <html>
            tells React the class/colorScheme attributes are intentionally
            different between server (no class) and client (after script). */}
        <script
          dangerouslySetInnerHTML={{
            __html: \`${THEME_INIT_SCRIPT}\`,
          }}
        />
      </head>
      <body className={font.className}>
        <StyledComponentsRegistry>
${
  analyticsEnabled
    ? `          <PostHogProvider>
            <CherryThemeProvider theme={theme}>{children}</CherryThemeProvider>
          </PostHogProvider>`
    : `          <CherryThemeProvider theme={theme}>{children}</CherryThemeProvider>`
}
        </StyledComponentsRegistry>
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
 */
export const siteLayoutTemplate = (
  pages: PageData[],
  sectionsConfig: SectionConfig[] | null = null,
): string => {
  const hasSections = sectionsConfig !== null && sectionsConfig.length > 0;
  const chtOpen = `<ChtProvider isChatActive={process.env.LLM_PROVIDER ? true : false}>`;

  return `import dynamic from "next/dynamic";
import { ChtProvider } from "@/components/Chat";
import { SearchProvider } from "@/components/SearchDocs";
${
  hasSections
    ? ""
    : `import { Footer } from "@/components/layout/Footer";
`
}import { Header } from "@/components/layout/Header";
import { DocsWrapper } from "@/components/layout/DocsComponents";
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import navigation from "@/navigation.json";
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
        <Header>
          <SectionBar sections={doccupineSections} />
        </Header>
        {process.env.LLM_PROVIDER && <Chat />}
        <DocsWrapper>
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
        <Header />
        {process.env.LLM_PROVIDER && <Chat />}
        <SectionBarProvider hasSectionBar={false}>
          <DocsWrapper>
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
