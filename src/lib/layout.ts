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

export const layoutTemplate = (
  pages: PageData[],
  fontConfig: FontConfig | null,
  sectionsConfig: SectionConfig[] | null = null,
  analyticsEnabled: boolean = false,
): string => {
  const hasSections = sectionsConfig !== null && sectionsConfig.length > 0;
  // Extra indent when PostHogProvider wraps the inner content
  const a = analyticsEnabled ? "  " : "";
  // ChtProvider line wraps at wider indent
  const chtOpen = analyticsEnabled
    ? `<ChtProvider
${a}              isChatActive={process.env.LLM_PROVIDER ? true : false}
${a}            >`
    : `<ChtProvider isChatActive={process.env.LLM_PROVIDER ? true : false}>`;

  return `import type { Metadata } from "next";
${isGoogleFont(fontConfig) ? `import { ${fontConfig.googleFont.fontName} } from "next/font/google";` : isLocalFont(fontConfig) ? 'import localFont from "next/font/local";' : 'import { Inter } from "next/font/google";'}
import dynamic from "next/dynamic";
import { StyledComponentsRegistry } from "cherry-styled-components";
import { theme, themeDark } from "@/app/theme";
import { CherryThemeProvider } from "@/components/layout/CherryThemeProvider";
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
  SectionBarProvider,
} from "@/components/layout/DocsComponents";
${
  hasSections
    ? ""
    : `import { SideBar } from "@/components/SideBar";
import { DocsNavigation } from "@/components/layout/DocsNavigation";
`
}import {
  transformPagesToGroupedStructure,
  type PagesProps,
} from "@/utils/orderNavItems";
${
  hasSections
    ? ""
    : `import { StaticLinks } from "@/components/layout/StaticLinks";
`
}import { config } from "@/utils/config";
import { verifyBrandingKey } from "@/utils/branding";
import navigation from "@/navigation.json";
${
  hasSections
    ? `import { SectionBar } from "@/components/layout/SectionBar";
import { SectionNavProvider } from "@/components/SectionNavProvider";
`
    : ""
}${analyticsEnabled ? `import { PostHogProvider } from "@/components/PostHogProvider";\n` : ""}const Chat = dynamic(() => import("@/components/Chat").then((mod) => mod.Chat));

${
  isGoogleFont(fontConfig)
    ? `const font = ${fontConfig.googleFont.fontName}({ ${[fontConfig.googleFont.subsets?.length ? `subsets: ${JSON.stringify(fontConfig.googleFont.subsets)}` : "", fontConfig.googleFont.weight?.length ? `weight: ${Array.isArray(fontConfig.googleFont.weight) ? JSON.stringify(fontConfig.googleFont.weight) : `"${fontConfig.googleFont.weight}"`}` : ""].filter(Boolean).join(", ")} });`
    : isLocalFont(fontConfig)
      ? `const font = localFont({
  src: ${getLocalFontSrc(fontConfig!)},
});`
      : 'const font = Inter({ subsets: ["latin"] });'
}

export const metadata: Metadata = {
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

const doccupinePages = ${formatObjectArray(pages)};${hasSections ? `\nconst doccupineSections = ${formatObjectArray(sectionsConfig!)};` : ""}

export default async function RootLayout({
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
    <html lang="en">
      <head>
        {/* Prevents dark-mode FOUC on Safari/Firefox. These browsers don't support
            Sec-CH-Prefers-Color-Scheme (handled by middleware for Chrome), so on
            a first visit this blocking script detects prefers-color-scheme, sets
            the theme cookie, and hides the body until router.refresh() re-renders
            with the correct theme (see ClientThemeProvider). */}
        <script
          dangerouslySetInnerHTML={{
            __html: \`(function(){try{var c=document.cookie.split(";").find(function(s){return s.trim().startsWith("theme=")});if(!c){var d=window.matchMedia&&window.matchMedia("(prefers-color-scheme:dark)").matches;document.cookie="theme="+(d?"dark":"light")+";path=/;max-age=31536000;SameSite=Lax";if(d){var s=document.createElement("style");s.id="__theme-init";s.textContent="html{background:#000!important;color-scheme:dark}body{visibility:hidden}";document.head.appendChild(s)}}}catch(e){}})();\`,
          }}
        />
      </head>
      <body className={font.className}>
        <StyledComponentsRegistry>
${analyticsEnabled ? "          <PostHogProvider>\n" : ""}${a}          <CherryThemeProvider theme={theme} themeDark={themeDark}>
${a}            ${chtOpen}
${a}              <SearchProvider pages={pages}>
${a}                <Header>
${a}                  <SectionBar sections={doccupineSections} />
${a}                </Header>
${a}                {process.env.LLM_PROVIDER && <Chat />}
${a}                <DocsWrapper>
${a}                  <SectionNavProvider
${a}                    sections={doccupineSections}
${a}                    allPages={pages}
${a}                    hideBranding={hideBranding}
${a}                  >
${a}                    {children}
${a}                  </SectionNavProvider>
${a}                </DocsWrapper>
${a}              </SearchProvider>
${a}            </ChtProvider>
${a}          </CherryThemeProvider>
${analyticsEnabled ? "          </PostHogProvider>\n" : ""}        </StyledComponentsRegistry>
      </body>
    </html>
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
    <html lang="en">
      <head>
        {/* Prevents dark-mode FOUC on Safari/Firefox. These browsers don't support
            Sec-CH-Prefers-Color-Scheme (handled by middleware for Chrome), so on
            a first visit this blocking script detects prefers-color-scheme, sets
            the theme cookie, and hides the body until router.refresh() re-renders
            with the correct theme (see ClientThemeProvider). */}
        <script
          dangerouslySetInnerHTML={{
            __html: \`(function(){try{var c=document.cookie.split(";").find(function(s){return s.trim().startsWith("theme=")});if(!c){var d=window.matchMedia&&window.matchMedia("(prefers-color-scheme:dark)").matches;document.cookie="theme="+(d?"dark":"light")+";path=/;max-age=31536000;SameSite=Lax";if(d){var s=document.createElement("style");s.id="__theme-init";s.textContent="html{background:#000!important;color-scheme:dark}body{visibility:hidden}";document.head.appendChild(s)}}}catch(e){}})();\`,
          }}
        />
      </head>
      <body className={font.className}>
        <StyledComponentsRegistry>
${analyticsEnabled ? "          <PostHogProvider>\n" : ""}${a}          <CherryThemeProvider theme={theme} themeDark={themeDark}>
${a}            ${chtOpen}
${a}              <SearchProvider pages={pages}>
${a}                <Header />
${a}                {process.env.LLM_PROVIDER && <Chat />}
${a}                <SectionBarProvider hasSectionBar={false}>
${a}                  <DocsWrapper>
${a}                    <SideBar result={result.length ? result : defaultResults} />
${a}                    {children}
${a}                    <DocsNavigation
${a}                      result={result.length ? result : defaultResults}
${a}                    />
${a}                    <StaticLinks />
${a}                    <Footer hideBranding={hideBranding} />
${a}                  </DocsWrapper>
${a}                </SectionBarProvider>
${a}              </SearchProvider>
${a}            </ChtProvider>
${a}          </CherryThemeProvider>
${analyticsEnabled ? "          </PostHogProvider>\n" : ""}        </StyledComponentsRegistry>
      </body>
    </html>
  );
}`
}
`;
};
