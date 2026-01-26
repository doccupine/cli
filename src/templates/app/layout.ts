export const layoutTemplate = (
  pages: any[],
  fontConfig: any,
): string => `import type { Metadata } from "next";
${fontConfig?.googleFont?.fontName?.length ? `import { ${fontConfig.googleFont.fontName} } from "next/font/google";` : fontConfig?.localFonts?.length || fontConfig?.localFonts?.src?.length ? 'import localFont from "next/font/local";' : 'import { Inter } from "next/font/google";'}
import { StyledComponentsRegistry } from "cherry-styled-components/src/lib";
import { theme, themeDark } from "@/app/theme";
import { CherryThemeProvider } from "@/components/layout/CherryThemeProvider";
import { Chat, ChtProvider } from "@/components/Chat";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { DocsWrapper } from "@/components/layout/DocsComponents";
import { SideBar } from "@/components/SideBar";
import { DocsNavigation } from "@/components/layout/DocsNavigation";
import { transformPagesToGroupedStructure } from "@/utils/orderNavItems";
import navigation from "@/navigation.json";

${
  fontConfig?.googleFont?.fontName?.length
    ? `const font = ${fontConfig.googleFont.fontName}({ subsets: ${fontConfig?.googleFont?.subsets?.length ? JSON.stringify(fontConfig?.googleFont?.subsets, null, 2) : '["latin"]'}, ${fontConfig.googleFont?.weight.length ? `weight: "${fontConfig.googleFont.weight}"` : ""} });`
    : fontConfig?.localFonts?.length || fontConfig?.localFonts?.src?.length
      ? `const font = localFont({
  src: ${fontConfig.localFonts?.src?.length ? JSON.stringify(fontConfig?.localFonts.src, null, 2).replace(/"([^"]+)":/g, "$1:") : `"${fontConfig?.localFonts}"`},
});`
      : 'const font = Inter({ subsets: ["latin"] });'
}

export const metadata: Metadata = {
  title: "Doccupine",
  description:
    "Doccupine is a free and open-source document management system that allows you to store, organize, and share your documentation with ease.",
  openGraph: {
    title: "Doccupine",
    description:
      "Doccupine is a free and open-source document management system that allows you to store, organize, and share your documentation with ease.",
  },
};

const doccupinePages = ${JSON.stringify(pages, null, 2).replace(/"([^"]+)":/g, "$1:")};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const defaultPages = [
    {
      slug: "",
      title: "Getting Started",
      description:
        "Doccupine is a free and open-source document management system that allows you to store, organize, and share your documentation with ease.",
      date: "2025-01-15",
      category: "Introduction",
      categoryOrder: 0,
      order: 0,
    },
  ];

  const pages: any = doccupinePages;
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
              <DocsWrapper>
                <SideBar result={result.length ? result : defaultResults} />
                {children}
                <DocsNavigation
                  result={result.length ? result : defaultResults}
                />
                <Footer />
              </DocsWrapper>
            </ChtProvider>
          </CherryThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
`;
