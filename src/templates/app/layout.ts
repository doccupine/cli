interface SectionConfig {
  label: string;
  slug: string;
  directory?: string;
}

function formatPagesArray(pages: PageData[]): string {
  const MAX_WIDTH = 80;
  const items = pages.map((page) => {
    const lines: string[] = ["  {"];
    const entries = Object.entries(page) as [string, unknown][];
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
  return "[\n" + items.join("\n") + "\n]";
}

function formatSectionsArray(sections: SectionConfig[]): string {
  return JSON.stringify(sections, null, 2);
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
): string => {
  const hasSections = sectionsConfig !== null && sectionsConfig.length > 0;

  return `import type { Metadata } from "next";
${isGoogleFont(fontConfig) ? `import { ${fontConfig.googleFont.fontName} } from "next/font/google";` : isLocalFont(fontConfig) ? 'import localFont from "next/font/local";' : 'import { Inter } from "next/font/google";'}
import dynamic from "next/dynamic";
import { StyledComponentsRegistry } from "cherry-styled-components";
import { theme, themeDark } from "@/app/theme";
import { CherryThemeProvider } from "@/components/layout/CherryThemeProvider";
import { ChtProvider } from "@/components/Chat";
${
  hasSections
    ? ""
    : `import { Footer } from "@/components/layout/Footer";
`
}import { Header } from "@/components/layout/Header";
import { DocsWrapper, SectionBarProvider } from "@/components/layout/DocsComponents";
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
}const Chat = dynamic(() => import("@/components/Chat").then((mod) => mod.Chat));

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
  title: config.name || "Doccupine",
  description:
    config.description ||
    "Doccupine is a free and open-source document management system that allows you to store, organize, and share your documentation with ease. AI-ready.",
  icons: config.icon || "https://doccupine.com/favicon.ico",
  openGraph: {
    title: config.name || "Doccupine",
    description:
      config.description ||
      "Doccupine is a free and open-source document management system that allows you to store, organize, and share your documentation with ease. AI-ready.",
    images: config.preview || "https://doccupine.com/preview.png",
  },
};

const doccupinePages = ${formatPagesArray(pages)};
${hasSections ? `\nconst doccupineSections = ${formatSectionsArray(sectionsConfig!)};` : ""}

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
      <body className={font.className}>
        <StyledComponentsRegistry>
          <CherryThemeProvider theme={theme} themeDark={themeDark}>
            <ChtProvider isChatActive={process.env.LLM_PROVIDER ? true : false}>
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
            </ChtProvider>
          </CherryThemeProvider>
        </StyledComponentsRegistry>
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
        "Doccupine is a free and open-source document management system that allows you to store, organize, and share your documentation with ease. AI-ready.",
      date: "2025-01-15",
      category: "Introduction",
      categoryOrder: 0,
      order: 0,
    },
  ];

  const pages: PagesProps[] = doccupinePages;
  const result = navigation.length
    ? navigation
    : transformPagesToGroupedStructure(pages);
  const defaultResults = transformPagesToGroupedStructure(defaultPages);

  return (
    <html lang="en">
      <body className={font.className}>
        <StyledComponentsRegistry>
          <CherryThemeProvider theme={theme} themeDark={themeDark}>
            <ChtProvider isChatActive={process.env.LLM_PROVIDER ? true : false}>
              <Header />
              {process.env.LLM_PROVIDER && <Chat />}
              <SectionBarProvider hasSectionBar={false}>
                <DocsWrapper>
                  <SideBar result={result.length ? result : defaultResults} />
                  {children}
                  <DocsNavigation
                    result={result.length ? result : defaultResults}
                  />
                  <StaticLinks />
                  <Footer hideBranding={hideBranding} />
                </DocsWrapper>
              </SectionBarProvider>
            </ChtProvider>
          </CherryThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}`
}
`;
};
