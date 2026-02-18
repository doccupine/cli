function formatPagesArray(pages: Record<string, unknown>[]): string {
  const MAX_WIDTH = 80;
  const items = pages.map((page) => {
    const lines: string[] = ["  {"];
    const entries = Object.entries(page);
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

export const layoutTemplate = (
  pages: any[],
  fontConfig: any,
): string => `import type { Metadata } from "next";
${fontConfig?.googleFont?.fontName?.length ? `import { ${fontConfig.googleFont.fontName} } from "next/font/google";` : fontConfig?.localFonts?.length || fontConfig?.localFonts?.src?.length ? 'import localFont from "next/font/local";' : 'import { Inter } from "next/font/google";'}
import dynamic from "next/dynamic";
import { StyledComponentsRegistry } from "cherry-styled-components";
import { theme, themeDark } from "@/app/theme";
import { CherryThemeProvider } from "@/components/layout/CherryThemeProvider";
import { ChtProvider } from "@/components/Chat";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { DocsWrapper } from "@/components/layout/DocsComponents";
import { SideBar } from "@/components/SideBar";
import { DocsNavigation } from "@/components/layout/DocsNavigation";
import {
  transformPagesToGroupedStructure,
  type PagesProps,
} from "@/utils/orderNavItems";
import { StaticLinks } from "@/components/layout/StaticLinks";
import { config } from "@/utils/config";
import { verifyBrandingKey } from "@/utils/branding";
import navigation from "@/navigation.json";
const Chat = dynamic(() => import("@/components/Chat").then((mod) => mod.Chat));

${
  fontConfig?.googleFont?.fontName?.length
    ? `const font = ${fontConfig.googleFont.fontName}({ subsets: ${fontConfig?.googleFont?.subsets?.length ? JSON.stringify(fontConfig?.googleFont?.subsets, null, 2) : '["latin"]'}, ${fontConfig.googleFont?.weight?.length ? `weight: ${Array.isArray(fontConfig.googleFont.weight) ? JSON.stringify(fontConfig.googleFont.weight) : `"${fontConfig.googleFont.weight}"`}` : ""} });`
    : fontConfig?.localFonts?.length || fontConfig?.localFonts?.src?.length
      ? `const font = localFont({
  src: ${fontConfig.localFonts?.src?.length ? JSON.stringify(fontConfig?.localFonts.src, null, 2).replace(/"([^"]+)":/g, "$1:") : `"${fontConfig?.localFonts}"`},
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hideBranding = verifyBrandingKey();

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
              <StaticLinks />
              {process.env.LLM_PROVIDER && <Chat />}
              <DocsWrapper>
                <SideBar result={result.length ? result : defaultResults} />
                {children}
                <DocsNavigation
                  result={result.length ? result : defaultResults}
                />
                <Footer hideBranding={hideBranding} />
              </DocsWrapper>
            </ChtProvider>
          </CherryThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
`;
