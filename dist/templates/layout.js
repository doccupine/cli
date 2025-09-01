export const layoutTemplate = (pages) => `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { 
  Container,
  StyledComponentsRegistry,
  CherryThemeProvider 
} from "cherry-styled-components/src/lib";
import { theme, themeDark } from "@/app/theme";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { DocsWrapper } from "@/components/layout/DocsComponents";
import { SideBar } from "@/components/SideBar";
import { transformPagesToGroupedStructure } from "@/utils/orderNavItems";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Doccupine',
  description: 'Doccupine is a free and open-source document management system that allows you to store, organize, and share your documentation with ease.',
  openGraph: {
    title: 'Doccupine',
    description: 'Doccupine is a free and open-source document management system that allows you to store, organize, and share your documentation with ease.',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const defaultPages = [
  {
    "slug": "",
    "title": "Getting Started",
    "description": "Doccupine is a free and open-source document management system that allows you to store, organize, and share your documentation with ease.",
    "date": "2025-01-15",
    "category": "Introduction",
    "categoryOrder": 0,
    "order": 0
  },
];

  const pages = ${JSON.stringify(pages, null, 2)};
  const result = transformPagesToGroupedStructure(pages);
  const defaultResults = transformPagesToGroupedStructure(defaultPages);

  return (
    <html lang="en">
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <CherryThemeProvider theme={theme} themeDark={themeDark}>
            <Header />
            <Container $padding={20}>
              <DocsWrapper>
                <SideBar result={result.length ? result : defaultResults} />
                {children}
              </DocsWrapper>
            </Container>
            <Footer />
          </CherryThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
`;
